import { afterEach, describe, expect, it, vi } from 'vitest';
import {
   getLlmToolMaxSteps,
   isLocalLlmEndpoint,
   isLlmConfigured,
   isLlmToolsEnabled,
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

describe('isLlmToolsEnabled', () => {
   afterEach(() => {
      vi.unstubAllEnvs();
   });

   it('defaults to false when unset', () => {
      vi.stubEnv('LLM_TOOLS_ENABLED', '');
      expect(isLlmToolsEnabled()).toBe(false);
   });

   it('recognizes true values', () => {
      vi.stubEnv('LLM_TOOLS_ENABLED', 'true');
      expect(isLlmToolsEnabled()).toBe(true);
      vi.stubEnv('LLM_TOOLS_ENABLED', '1');
      expect(isLlmToolsEnabled()).toBe(true);
      vi.stubEnv('LLM_TOOLS_ENABLED', 'yes');
      expect(isLlmToolsEnabled()).toBe(true);
   });

   it('rejects other values', () => {
      vi.stubEnv('LLM_TOOLS_ENABLED', 'false');
      expect(isLlmToolsEnabled()).toBe(false);
   });
});

describe('getLlmToolMaxSteps', () => {
   afterEach(() => {
      vi.unstubAllEnvs();
   });

   it('defaults to 5 when unset or invalid', () => {
      vi.stubEnv('LLM_TOOL_MAX_STEPS', '');
      expect(getLlmToolMaxSteps()).toBe(5);
      vi.stubEnv('LLM_TOOL_MAX_STEPS', '0');
      expect(getLlmToolMaxSteps()).toBe(5);
   });

   it('uses configured positive integer', () => {
      vi.stubEnv('LLM_TOOL_MAX_STEPS', '3');
      expect(getLlmToolMaxSteps()).toBe(3);
   });
});
