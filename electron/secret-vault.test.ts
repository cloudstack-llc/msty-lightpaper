import { chmod, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createResolvedAiExecutionContext } from './ai-service'
import { SecretVault, type VaultKdfParams } from './secret-vault'
import type { AiActionInput } from '../src/shared/types'

const testKdfParams: VaultKdfParams = { N: 1024, r: 8, p: 1, keyLength: 32 }
const apiKeyRef = 'secret://providers/test/api-key'
const secret = 'sk-test-plaintext-never-exported'

let dir: string
let vaultPath: string

function vault(targetPath = vaultPath) {
  return new SecretVault(targetPath, testKdfParams)
}

async function writeUnsafeKdfVault() {
  await writeFile(vaultPath, JSON.stringify({
    version: 1,
    cipher: 'aes-256-gcm',
    kdf: 'scrypt',
    kdfParams: { N: 1073741824, r: 8, p: 1, keyLength: 32 },
    salt: Buffer.from('salt').toString('base64'),
    verifier: {
      iv: Buffer.from('iv').toString('base64'),
      ciphertext: Buffer.from('ct').toString('base64'),
      authTag: Buffer.from('tag').toString('base64'),
    },
    secrets: {},
    updatedAt: Date.now(),
  }), 'utf8')
}

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'lightpaper-vault-test-'))
  vaultPath = path.join(dir, 'vault.json')
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('SecretVault', () => {
  it('requires explicit creation before unlock', async () => {
    const created = vault()

    await expect(created.unlock('password')).rejects.toThrow('Vault does not exist')
    await expect(created.createVault('password')).resolves.toMatchObject({ exists: true, unlocked: true })
    created.lock()
    await expect(created.unlock('password')).resolves.toMatchObject({ exists: true, unlocked: true })
  })

  it('encrypts and decrypts provider secrets with the correct password', async () => {
    const created = vault()
    await created.createVault('correct horse battery staple')
    await created.setProviderSecret(apiKeyRef, secret)
    created.lock()

    const reopened = vault()
    await reopened.unlock('correct horse battery staple')

    expect(reopened.resolveProviderSecret(apiKeyRef)).toBe(secret)
  })

  it('fails to unlock with the wrong password', async () => {
    const created = vault()
    await created.createVault('right password')
    await created.setProviderSecret(apiKeyRef, secret)

    const reopened = vault()
    await expect(reopened.unlock('wrong password')).rejects.toThrow('Invalid master password')
  })

  it('clears the in-memory key when locked', async () => {
    const created = vault()
    await created.createVault('password')
    await created.setProviderSecret(apiKeyRef, secret)
    expect(created.resolveProviderSecret(apiKeyRef)).toBe(secret)

    created.lock()

    await expect(() => created.resolveProviderSecret(apiKeyRef)).toThrow('Vault is locked')
    expect((await created.status()).unlocked).toBe(false)
  })

  it('reports whether a provider secret exists without exposing it', async () => {
    const created = vault()
    await created.createVault('password')
    await created.setProviderSecret(apiKeyRef, secret)
    created.lock()

    const reopened = vault()
    await expect(reopened.hasProviderSecret(apiKeyRef)).resolves.toBe(true)
    await expect(reopened.listSecretRefs()).resolves.toEqual([apiKeyRef])
  })

  it('does not export plaintext API keys in vault data', async () => {
    const created = vault()
    await created.createVault('password')
    await created.setProviderSecret(apiKeyRef, secret)

    const rawFile = await readFile(vaultPath, 'utf8')
    const exported = JSON.stringify(created.exportEncryptedDataForTest())

    expect(rawFile).not.toContain(secret)
    expect(exported).not.toContain(secret)
    expect(rawFile).toContain(apiKeyRef)
    expect(rawFile).toContain('authTag')
  })

  it('keeps raw keys inside Electron-side resolver results only', async () => {
    const created = vault()
    await created.createVault('password')
    await created.setProviderSecret(apiKeyRef, secret)
    const input: AiActionInput = {
      text: 'hello',
      provider: {
        id: 'test.provider',
        name: 'Test Provider',
        baseUrl: 'https://models.example.test',
        auth: { type: 'bearer', apiKeyRef },
        models: [],
      },
    }

    const resolved = createResolvedAiExecutionContext(input, created)
    const rendererFacingResponses = [
      await created.status(),
      await created.hasProviderSecret(apiKeyRef),
      await created.listSecretRefs(),
      await created.setProviderSecret(apiKeyRef, secret),
      await created.deleteProviderSecret(apiKeyRef),
    ]

    expect(resolved.auth).toMatchObject({ apiKeyRef, secret })
    expect(JSON.stringify(rendererFacingResponses)).not.toContain(secret)
  })

  it('does not create or overwrite a corrupt vault during create or unlock', async () => {
    await writeFile(vaultPath, '{not json', 'utf8')

    const reopened = vault()
    await expect(reopened.status()).resolves.toMatchObject({ exists: true, unlocked: false, error: 'Vault file is corrupt or unreadable' })
    await expect(reopened.createVault('password')).rejects.toThrow('Vault file is corrupt or unreadable')
    await expect(reopened.unlock('password')).rejects.toThrow('Vault file is corrupt or unreadable')
    await expect(readFile(vaultPath, 'utf8')).resolves.toBe('{not json')
  })

  it('rejects unsafe KDF params before deriving', async () => {
    await writeUnsafeKdfVault()

    await expect(vault().unlock('password')).rejects.toThrow('Invalid vault KDF parameters')
  })

  it('tightens existing vault file permissions on write', async () => {
    if (process.platform === 'win32') return
    const created = vault()
    await created.createVault('password')
    await chmod(vaultPath, 0o666)

    await created.setProviderSecret(apiKeyRef, secret)

    expect((await stat(vaultPath)).mode & 0o777).toBe(0o600)
  })

  it('writes through a temporary file and keeps a permission-hardened backup', async () => {
    if (process.platform === 'win32') return
    const created = vault()
    await created.createVault('password')
    await created.setProviderSecret(apiKeyRef, secret)

    expect(await readFile(`${vaultPath}.bak`, 'utf8')).toContain('"secrets": {}')
    expect((await stat(`${vaultPath}.bak`)).mode & 0o777).toBe(0o600)
    expect((await readdir(dir)).filter((entry) => entry.endsWith('.tmp'))).toEqual([])
  })

  it('keeps the previous in-memory state if persistence fails during set', async () => {
    const created = vault()
    await created.createVault('password')
    await created.setProviderSecret(apiKeyRef, secret)
    const before = JSON.stringify(created.exportEncryptedDataForTest())
    const blockedParent = path.join(dir, 'not-a-directory')
    await writeFile(blockedParent, 'blocker', 'utf8')
    ;(created as unknown as { vaultPath: string }).vaultPath = path.join(blockedParent, 'vault.json')

    await expect(created.setProviderSecret('secret://providers/test/other-key', 'other-secret')).rejects.toThrow()

    ;(created as unknown as { vaultPath: string }).vaultPath = vaultPath
    expect(JSON.stringify(created.exportEncryptedDataForTest())).toBe(before)
    expect(created.resolveProviderSecret(apiKeyRef)).toBe(secret)
    await expect(() => created.resolveProviderSecret('secret://providers/test/other-key')).toThrow('Missing provider secret')
  })

  it('does not unlock a new vault when initial persistence fails', async () => {
    if (process.platform === 'win32') return
    const readOnlyParent = path.join(dir, 'readonly')
    await mkdir(readOnlyParent)
    await chmod(readOnlyParent, 0o500)
    const created = vault(path.join(readOnlyParent, 'child', 'vault.json'))

    try {
      await expect(created.createVault('password')).rejects.toThrow()
      expect((await created.status()).unlocked).toBe(false)
      expect(() => created.resolveProviderSecret(apiKeyRef)).toThrow('Vault is locked')
    } finally {
      await chmod(readOnlyParent, 0o700)
    }
  })
})
