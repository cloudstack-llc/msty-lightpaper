# LightPaper Secret Vault

LightPaper stores provider API keys in an Electron-main encrypted vault. The vault is portable app data, not an OS keychain item, so it can be backed up or moved with the rest of the local LightPaper profile.

## No recovery

Users unlock or create the vault with a master password. LightPaper never stores the master password and does not implement password recovery. If the master password is lost, the encrypted vault contents are unrecoverable and API keys must be re-entered.

## File format

The default vault file is `lightpaper-vault.json` under Electron `app.getPath('userData')`.

```json
{
  "version": 1,
  "cipher": "aes-256-gcm",
  "kdf": "scrypt",
  "kdfParams": { "N": 131072, "r": 8, "p": 1, "keyLength": 32 },
  "salt": "base64",
  "verifier": { "iv": "base64", "ciphertext": "base64", "authTag": "base64" },
  "secrets": {
    "secret://providers/openai/api-key": {
      "iv": "base64",
      "ciphertext": "base64",
      "authTag": "base64",
      "updatedAt": 1730000000000
    }
  },
  "updatedAt": 1730000000000
}
```

- Key derivation uses Node built-in `crypto.scrypt` with the stored parameters.
- Encryption uses AES-256-GCM with a fresh 96-bit IV per secret and authentication tag per encrypted record.
- The verifier is encrypted fixed text used only to reject wrong passwords.
- Secret reference names are stored in plaintext so the UI can show configured/missing status; secret values are encrypted.
- Stored KDF parameters and encrypted record shapes are validated before a vault is unlocked.
- Vault updates are written through a temporary file, hardened to owner-only permissions where supported, and atomically renamed over the previous vault file. A `.bak` copy of the previous encrypted vault is kept beside the active file.

## API key references

Provider configs reference secrets with `auth.apiKeyRef`, for example:

```ts
api.ai.registerProvider({
  id: 'openai.responses',
  name: 'OpenAI Responses API',
  baseUrl: 'https://api.openai.com/v1',
  auth: { type: 'bearer', apiKeyRef: 'secret://providers/openai/api-key' },
  models: []
})
```

Plugin code and renderer state must store only `apiKeyRef`, never raw API keys.

## Resolution boundary

Only Electron AI execution resolves `apiKeyRef` values. The preload API exposes narrow vault operations for status and mutation, but never returns decrypted secret values to the renderer or plugins:

- `vaultStatus()`
- `createVault(masterPassword)`
- `unlockVault(masterPassword)`
- `lockVault()`
- `setProviderSecret(apiKeyRef, secret)`
- `deleteProviderSecret(apiKeyRef)`
- `hasProviderSecret(apiKeyRef)`
- `listSecretRefs()`

The current AI service still returns the offline stub. It now includes the internal resolver path (`createResolvedAiExecutionContext`) that a future real provider call can use inside Electron/main without exposing raw keys across the preload boundary.
