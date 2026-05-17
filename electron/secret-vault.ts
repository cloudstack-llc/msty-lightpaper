import { scrypt, timingSafeEqual, randomBytes, createCipheriv, createDecipheriv, type ScryptOptions } from 'node:crypto'
import { chmod, copyFile, mkdir, open, readFile, rename, unlink } from 'node:fs/promises'
import path from 'node:path'

const VAULT_VERSION = 1
const CIPHER = 'aes-256-gcm'
const VERIFIER_TEXT = 'lightpaper-secret-vault'
export const DEFAULT_KDF_PARAMS = { N: 131072, r: 8, p: 1, keyLength: 32 }

export type VaultKdfParams = typeof DEFAULT_KDF_PARAMS
export type VaultStatus = { exists: boolean; unlocked: boolean; secretCount: number; updatedAt?: number; version?: number; error?: string }
export type EncryptedSecretRecord = { iv: string; ciphertext: string; authTag: string; updatedAt: number }
export type VaultFileData = {
  version: number
  cipher: typeof CIPHER
  kdf: 'scrypt'
  kdfParams: VaultKdfParams
  salt: string
  verifier: { iv: string; ciphertext: string; authTag: string }
  secrets: Record<string, EncryptedSecretRecord>
  updatedAt: number
}

type NodeFileError = Error & { code?: string }

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function toBase64(bytes: Buffer | Uint8Array) {
  return Buffer.from(bytes).toString('base64')
}

function fromBase64(value: string) {
  return Buffer.from(value, 'base64')
}

function emptyStatus(unlocked: boolean): VaultStatus {
  return { exists: false, unlocked, secretCount: 0 }
}

function assertApiKeyRef(apiKeyRef: string) {
  if (!apiKeyRef.startsWith('secret://')) throw new Error('Secret references must use secret:// URLs')
  if (apiKeyRef.length > 512) throw new Error('Secret reference is too long')
}

function isMissingFile(error: unknown) {
  return (error as NodeFileError | undefined)?.code === 'ENOENT'
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown vault error')
}

function assertBase64(value: unknown, field: string) {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Invalid vault field: ${field}`)
  try {
    fromBase64(value)
  } catch {
    throw new Error(`Invalid vault field: ${field}`)
  }
}

function validateKdfParams(params: unknown): asserts params is VaultKdfParams {
  const candidate = params as Partial<VaultKdfParams> | undefined
  if (!candidate) throw new Error('Invalid vault KDF parameters')
  const { N, r, p, keyLength } = candidate
  if (typeof N !== 'number' || typeof r !== 'number' || typeof p !== 'number' || typeof keyLength !== 'number') throw new Error('Invalid vault KDF parameters')
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || !Number.isInteger(keyLength)) throw new Error('Invalid vault KDF parameters')
  if (N < 1024 || N > 1048576 || (N & (N - 1)) !== 0) throw new Error('Invalid vault KDF parameters')
  if (r < 1 || r > 16) throw new Error('Invalid vault KDF parameters')
  if (p < 1 || p > 8) throw new Error('Invalid vault KDF parameters')
  if (keyLength !== 32) throw new Error('Invalid vault KDF parameters')
}

function validateVaultFileData(parsed: unknown): VaultFileData {
  const data = parsed as VaultFileData
  if (!data || data.version !== VAULT_VERSION || data.cipher !== CIPHER || data.kdf !== 'scrypt') throw new Error('Unsupported vault format')
  validateKdfParams(data.kdfParams)
  assertBase64(data.salt, 'salt')
  assertBase64(data.verifier?.iv, 'verifier.iv')
  assertBase64(data.verifier?.ciphertext, 'verifier.ciphertext')
  assertBase64(data.verifier?.authTag, 'verifier.authTag')
  if (!data.secrets || typeof data.secrets !== 'object' || Array.isArray(data.secrets)) throw new Error('Invalid vault secrets')
  for (const [apiKeyRef, record] of Object.entries(data.secrets)) {
    assertApiKeyRef(apiKeyRef)
    assertBase64(record.iv, `${apiKeyRef}.iv`)
    assertBase64(record.ciphertext, `${apiKeyRef}.ciphertext`)
    assertBase64(record.authTag, `${apiKeyRef}.authTag`)
    if (!Number.isFinite(record.updatedAt)) throw new Error(`Invalid vault field: ${apiKeyRef}.updatedAt`)
  }
  if (!Number.isFinite(data.updatedAt)) throw new Error('Invalid vault field: updatedAt')
  return data
}

function cloneVaultData(data: VaultFileData): VaultFileData {
  return JSON.parse(JSON.stringify(data)) as VaultFileData
}

async function deriveKey(masterPassword: string, salt: Buffer, params: VaultKdfParams) {
  if (!masterPassword) throw new Error('Master password is required')
  validateKdfParams(params)
  const options: ScryptOptions = { N: params.N, r: params.r, p: params.p, maxmem: 256 * 1024 * 1024 }
  return await new Promise<Buffer>((resolve, reject) => {
    scrypt(masterPassword, salt, params.keyLength, options, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey as Buffer)
    })
  })
}

function encryptString(plaintext: string, key: Buffer) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(CIPHER, key, iv)
  const ciphertext = Buffer.concat([cipher.update(textEncoder.encode(plaintext)), cipher.final()])
  const authTag = cipher.getAuthTag()
  return { iv: toBase64(iv), ciphertext: toBase64(ciphertext), authTag: toBase64(authTag) }
}

function decryptString(record: { iv: string; ciphertext: string; authTag: string }, key: Buffer) {
  const decipher = createDecipheriv(CIPHER, key, fromBase64(record.iv))
  decipher.setAuthTag(fromBase64(record.authTag))
  const plaintext = Buffer.concat([decipher.update(fromBase64(record.ciphertext)), decipher.final()])
  return textDecoder.decode(plaintext)
}

function verifyPassword(data: VaultFileData, key: Buffer) {
  const verifier = decryptString(data.verifier, key)
  const expected = Buffer.from(VERIFIER_TEXT)
  const actual = Buffer.from(verifier)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid master password')
}

export class SecretVault {
  private key?: Buffer
  private data?: VaultFileData

  constructor(private vaultPath: string, private kdfParams: VaultKdfParams = DEFAULT_KDF_PARAMS) {
    validateKdfParams(kdfParams)
  }

  get path() {
    return this.vaultPath
  }

  async status(): Promise<VaultStatus> {
    if (this.data) return this.statusForData(this.data)
    let data: VaultFileData | undefined
    try {
      data = await this.readVaultFile()
    } catch (error) {
      if (isMissingFile(error)) return emptyStatus(false)
      return { exists: true, unlocked: false, secretCount: 0, error: errorMessage(error) }
    }
    if (!data) return emptyStatus(!!this.key)
    return this.statusForData(data)
  }

  async unlock(masterPassword: string): Promise<VaultStatus> {
    const existing = await this.readExistingVaultFile()
    if (!existing) throw new Error('Vault does not exist')
    const key = await deriveKey(masterPassword, fromBase64(existing.salt), existing.kdfParams)
    try {
      verifyPassword(existing, key)
    } catch {
      key.fill(0)
      throw new Error('Invalid master password')
    }
    this.data = existing
    this.replaceKey(key)
    return this.status()
  }

  async createVault(masterPassword: string): Promise<VaultStatus> {
    if (await this.readExistingVaultFile()) throw new Error('Vault already exists')
    const salt = randomBytes(16)
    const key = await deriveKey(masterPassword, salt, this.kdfParams)
    const now = Date.now()
    const data: VaultFileData = {
      version: VAULT_VERSION,
      cipher: CIPHER,
      kdf: 'scrypt',
      kdfParams: this.kdfParams,
      salt: toBase64(salt),
      verifier: encryptString(VERIFIER_TEXT, key),
      secrets: {},
      updatedAt: now,
    }
    try {
      await this.writeVaultFile(data)
    } catch (error) {
      key.fill(0)
      throw error
    }
    this.data = data
    this.replaceKey(key)
    return this.status()
  }

  lock() {
    this.replaceKey(undefined)
  }

  async setProviderSecret(apiKeyRef: string, secret: string) {
    assertApiKeyRef(apiKeyRef)
    if (!secret) throw new Error('Secret value is required')
    const data = this.requireData()
    const key = this.requireKey()
    const now = Date.now()
    const nextData = cloneVaultData(data)
    nextData.secrets[apiKeyRef] = { ...encryptString(secret, key), updatedAt: now }
    nextData.updatedAt = now
    await this.writeVaultFile(nextData)
    this.data = nextData
    return { apiKeyRef, hasSecret: true, updatedAt: now }
  }

  async deleteProviderSecret(apiKeyRef: string) {
    assertApiKeyRef(apiKeyRef)
    const data = this.requireData()
    const existed = Boolean(data.secrets[apiKeyRef])
    if (existed) {
      const nextData = cloneVaultData(data)
      delete nextData.secrets[apiKeyRef]
      nextData.updatedAt = Date.now()
      await this.writeVaultFile(nextData)
      this.data = nextData
    }
    return { apiKeyRef, hasSecret: false, deleted: existed }
  }

  async hasProviderSecret(apiKeyRef: string) {
    assertApiKeyRef(apiKeyRef)
    const data = this.data ?? await this.readExistingVaultFile()
    return Boolean(data?.secrets[apiKeyRef])
  }

  async listSecretRefs() {
    const data = this.data ?? await this.readExistingVaultFile()
    return Object.keys(data?.secrets ?? {}).sort()
  }

  resolveProviderSecret(apiKeyRef: string) {
    assertApiKeyRef(apiKeyRef)
    const data = this.requireData()
    const key = this.requireKey()
    const record = data.secrets[apiKeyRef]
    if (!record) throw new Error(`Missing provider secret: ${apiKeyRef}`)
    return decryptString(record, key)
  }

  exportEncryptedDataForTest() {
    return this.data
  }

  private async readExistingVaultFile() {
    try {
      return await this.readVaultFile()
    } catch (error) {
      if (isMissingFile(error)) return undefined
      throw error
    }
  }

  private async readVaultFile() {
    const raw = await readFile(this.vaultPath, 'utf8')
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('Vault file is corrupt or unreadable')
    }
    return validateVaultFileData(parsed)
  }

  private async writeVaultFile(data: VaultFileData) {
    validateVaultFileData(data)
    const dir = path.dirname(this.vaultPath)
    await mkdir(dir, { recursive: true })
    const tempPath = path.join(dir, `.${path.basename(this.vaultPath)}.${process.pid}.${Date.now()}.${toBase64(randomBytes(8)).replace(/[/+=]/g, '')}.tmp`)
    const backupPath = `${this.vaultPath}.bak`
    const handle = await open(tempPath, 'wx', 0o600)
    try {
      try {
        await handle.writeFile(`${JSON.stringify(data, null, 2)}\n`, 'utf8')
        await handle.sync()
      } finally {
        await handle.close()
      }
      if (process.platform !== 'win32') await chmod(tempPath, 0o600)
      try {
        await copyFile(this.vaultPath, backupPath)
        if (process.platform !== 'win32') await chmod(backupPath, 0o600)
      } catch (error) {
        if (!isMissingFile(error)) throw error
      }
      await rename(tempPath, this.vaultPath)
      if (process.platform !== 'win32') await chmod(this.vaultPath, 0o600)
      const dirHandle = await open(dir, 'r').catch(() => undefined)
      if (dirHandle) {
        try { await dirHandle.sync() } finally { await dirHandle.close() }
      }
    } catch (error) {
      await unlink(tempPath).catch(() => undefined)
      throw error
    }
  }

  private statusForData(data: VaultFileData): VaultStatus {
    return { exists: true, unlocked: !!this.key, secretCount: Object.keys(data.secrets).length, updatedAt: data.updatedAt, version: data.version }
  }

  private requireKey() {
    if (!this.key) throw new Error('Vault is locked')
    return this.key
  }

  private requireData() {
    if (!this.data) throw new Error('Vault is locked')
    return this.data
  }

  private replaceKey(next: Buffer | undefined) {
    if (this.key) this.key.fill(0)
    this.key = next
  }
}
