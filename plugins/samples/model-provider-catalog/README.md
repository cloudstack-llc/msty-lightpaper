# Model Provider Catalog

Registers provider and model configuration records for AI workflows.

This sample intentionally stores API key references such as `secret://providers/openai/api-key`, not raw API keys. LightPaper stores actual keys in the Electron-side encrypted local vault and resolves references only during Electron AI execution. The vault has no password recovery; lost master passwords make stored keys unrecoverable.
