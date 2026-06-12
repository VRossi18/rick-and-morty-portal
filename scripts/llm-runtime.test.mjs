// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import {
   parseRuntimePreference,
   pickAutoRuntime,
   resetRuntimeCache,
   resolveRuntimeLogic,
} from './llm-runtime.mjs';

describe('parseRuntimePreference', () => {
   it('returns null for auto', () => {
      expect(parseRuntimePreference('auto')).toBeNull();
   });

   it('accepts docker and podman', () => {
      expect(parseRuntimePreference('docker')).toBe('docker');
      expect(parseRuntimePreference('PODMAN')).toBe('podman');
   });

   it('rejects invalid values', () => {
      expect(() => parseRuntimePreference('kubernetes')).toThrow(/Invalid LLM_RUNTIME/);
   });
});

describe('pickAutoRuntime', () => {
   it('prefers existing container runtime', () => {
      expect(
         pickAutoRuntime({ hasDocker: true, hasPodman: true, existingRuntime: 'docker' }),
      ).toBe('docker');
   });

   it('uses the only installed runtime', () => {
      expect(pickAutoRuntime({ hasDocker: true, hasPodman: false })).toBe('docker');
      expect(pickAutoRuntime({ hasDocker: false, hasPodman: true })).toBe('podman');
   });

   it('prefers podman when both are installed', () => {
      expect(pickAutoRuntime({ hasDocker: true, hasPodman: true })).toBe('podman');
   });

   it('returns null when none are installed', () => {
      expect(pickAutoRuntime({ hasDocker: false, hasPodman: false })).toBeNull();
   });
});

describe('resolveRuntimeLogic', () => {
   afterEach(() => {
      resetRuntimeCache();
   });

   it('forces docker when LLM_RUNTIME=docker', () => {
      expect(
         resolveRuntimeLogic({
            preference: 'docker',
            hasDocker: true,
            hasPodman: false,
         }),
      ).toEqual({ runtime: 'docker', label: 'docker' });
   });

   it('uses docker when only docker is available in auto mode', () => {
      expect(
         resolveRuntimeLogic({
            preference: 'auto',
            hasDocker: true,
            hasPodman: false,
         }),
      ).toEqual({ runtime: 'docker', label: 'docker (auto)' });
   });

   it('uses podman when container already exists there', () => {
      expect(
         resolveRuntimeLogic({
            preference: 'auto',
            hasDocker: true,
            hasPodman: true,
            podmanHasContainer: true,
         }),
      ).toEqual({ runtime: 'podman', label: 'podman (auto, existing container)' });
   });

   it('throws when explicit runtime is missing', () => {
      expect(() =>
         resolveRuntimeLogic({
            preference: 'docker',
            hasDocker: false,
            hasPodman: true,
         }),
      ).toThrow(/docker was not found/);
   });
});
