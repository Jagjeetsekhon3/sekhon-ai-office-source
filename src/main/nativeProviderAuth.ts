import { dirname } from 'node:path';
import type { AgentProvider } from '../shared/agentProvider';
/** Stored API keys also apply to the native cloud CLIs, not only multi-provider engines. */
export function nativeProviderAuthEnv(provider: AgentProvider, getSecret: (ref: string) => string | undefined, geminiSettingsPath?: string): Record<string, string> {
  const backend = provider === 'claude' ? 'anthropic' : provider === 'gemini' ? 'google' : undefined;
  if (!backend) return {};
  const key = getSecret('apikey:' + backend);
  if (!key) return {};
  if (provider === 'claude') return { ANTHROPIC_API_KEY: key };
  return { GEMINI_API_KEY: key, ...(geminiSettingsPath ? {
    // System settings under a user-writable agent folder are rejected by Gemini.
    // API-key sessions use an isolated user profile, retaining their hooks and history.
    GEMINI_CLI_HOME: dirname(geminiSettingsPath),
    // The owner selected this agent's working folder; tool approval remains unchanged.
    GEMINI_CLI_TRUST_WORKSPACE: 'true',
    GEMINI_CLI_SYSTEM_SETTINGS_PATH: ''
  } : {}) };
}
