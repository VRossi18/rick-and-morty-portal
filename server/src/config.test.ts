import { afterEach, describe, expect, it, vi } from 'vitest';
import {
   isLocalLlmEndpoint,
   isLlmConfigured,
   resolveLlmApiKey,
} from './config.js';

describe('isLocalLlmEndpoint', () => {
   it('recognizes localhost and loopback', () => {
      expect(isLocalLlmEndpoint('http://localhost:11434/v1')).toBe(true);
      expect(isLocalLlmEndpoint('http://127.0.0.1:11434/v1')).toBe(true);
   });

   it('recognizes ollama service hostname', () => {
      expect(isLocalLlmEndpoint('http://ollama:11434/v1')).toBe(true);
   });

   it('rejects remote Groq endpoint', () => {
      expect(isLocalLlmEndpoint('https://api.groq.com/openai/v1')).toBe(false);
   });
});

describe('resolveLlmApiKey', () => {
   afterEach(() => {
      vi.unstubAllEnvs();
   });

   it('uses LLM_API_KEY when set for remote endpoint', () => {
      vi.stubEnv('LLM_API_KEY', 'gsk_test');
      vi.stubEnv('LLM_BASE_URL', 'https://api.groq.com/openai/v1');
      expect(resolveLlmApiKey()).toBe('gsk_test');
      expect(isLlmConfigured()).toBe(true);
   });

   it('returns dummy key for local endpoint without LLM_API_KEY', () => {
      vi.stubEnv('LLM_API_KEY', '');
      vi.stubEnv('LLM_BASE_URL', 'http://localhost:11434/v1');
      expect(resolveLlmApiKey()).toBe('ollama');
      expect(isLlmConfigured()).toBe(true);
   });

   it('returns null for remote endpoint without LLM_API_KEY', () => {
      vi.stubEnv('LLM_API_KEY', '');
      vi.stubEnv('LLM_BASE_URL', 'https://api.groq.com/openai/v1');
      expect(resolveLlmApiKey()).toBeNull();
      expect(isLlmConfigured()).toBe(false);
   });

   it('prefers explicit LLM_API_KEY over local dummy', () => {
      vi.stubEnv('LLM_API_KEY', 'custom');
      vi.stubEnv('LLM_BASE_URL', 'http://localhost:11434/v1');
      expect(resolveLlmApiKey()).toBe('custom');
   });
});
