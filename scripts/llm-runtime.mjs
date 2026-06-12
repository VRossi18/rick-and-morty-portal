import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

export const CONTAINER_NAME = 'rick-morty-ollama';
export const COMPOSE_SERVICE = 'ollama';
export const OLLAMA_IMAGE = 'ollama/ollama:latest';
export const DEFAULT_MODEL = 'llama3.1:8b';

let resolvedRuntime = null;
let resolutionLabel = '';

export function readLlmRuntimeFromEnvFile() {
   const envPath = path.join(REPO_ROOT, '.env');
   if (!existsSync(envPath)) {
      return undefined;
   }

   try {
      const content = readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
         const trimmed = line.trim();
         if (!trimmed || trimmed.startsWith('#')) {
            continue;
         }
         const match = trimmed.match(/^LLM_RUNTIME=(.*)$/);
         if (!match) {
            continue;
         }
         const value = match[1].trim().replace(/^["']|["']$/g, '');
         return value || undefined;
      }
   } catch {
      return undefined;
   }

   return undefined;
}

export function getLlmRuntimePreference() {
   const fromProcess = process.env.LLM_RUNTIME?.trim();
   if (fromProcess) {
      return fromProcess.toLowerCase();
   }

   const fromFile = readLlmRuntimeFromEnvFile();
   if (fromFile) {
      return fromFile.toLowerCase();
   }

   return 'auto';
}

export function parseRuntimePreference(preference) {
   const normalized = preference.trim().toLowerCase();
   if (normalized === 'auto') {
      return null;
   }
   if (normalized === 'docker' || normalized === 'podman') {
      return normalized;
   }
   throw new Error(`Invalid LLM_RUNTIME "${preference}". Use auto, docker, or podman.`);
}

export function pickAutoRuntime({ hasDocker, hasPodman, existingRuntime }) {
   if (existingRuntime) {
      return existingRuntime;
   }
   if (hasPodman && !hasDocker) {
      return 'podman';
   }
   if (hasDocker && !hasPodman) {
      return 'docker';
   }
   if (hasPodman && hasDocker) {
      return 'podman';
   }
   return null;
}

export function resolveRuntimeLogic(options) {
   const {
      preference = 'auto',
      hasDocker = false,
      hasPodman = false,
      podmanHasContainer = false,
      dockerHasContainer = false,
   } = options;

   const explicit = parseRuntimePreference(preference);
   if (explicit) {
      if (explicit === 'docker' && !hasDocker) {
         throw new Error(
            'LLM_RUNTIME=docker but docker was not found in PATH. See docs/llm-local.md',
         );
      }
      if (explicit === 'podman' && !hasPodman) {
         throw new Error(
            'LLM_RUNTIME=podman but podman was not found in PATH. See docs/llm-local.md',
         );
      }
      return { runtime: explicit, label: explicit };
   }

   if (podmanHasContainer) {
      return { runtime: 'podman', label: 'podman (auto, existing container)' };
   }
   if (dockerHasContainer) {
      return { runtime: 'docker', label: 'docker (auto, existing container)' };
   }

   const picked = pickAutoRuntime({ hasDocker, hasPodman });
   if (!picked) {
      throw new Error(
         'No container runtime found. Install Docker or Podman, then run pnpm run llm:up. See docs/llm-local.md',
      );
   }

   return { runtime: picked, label: `${picked} (auto)` };
}

function commandExists(binary) {
   try {
      if (process.platform === 'win32') {
         execSync(`where.exe ${binary}`, { stdio: 'ignore' });
      } else {
         execSync(`command -v ${binary}`, { stdio: 'ignore', shell: true });
      }
      return true;
   } catch {
      return false;
   }
}

function containerExistsForRuntime(runtime) {
   try {
      const name = execSync(
         `${runtime} ps -a --filter name=^${CONTAINER_NAME}$ --format "{{.Names}}"`,
         { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] },
      ).trim();
      return name === CONTAINER_NAME;
   } catch {
      return false;
   }
}

export function resolveRuntime() {
   if (resolvedRuntime) {
      return resolvedRuntime;
   }

   const preference = getLlmRuntimePreference();
   const hasDocker = commandExists('docker');
   const hasPodman = commandExists('podman');
   const podmanHasContainer = hasPodman && containerExistsForRuntime('podman');
   const dockerHasContainer = hasDocker && containerExistsForRuntime('docker');

   const { runtime, label } = resolveRuntimeLogic({
      preference,
      hasDocker,
      hasPodman,
      podmanHasContainer,
      dockerHasContainer,
   });

   resolvedRuntime = runtime;
   resolutionLabel = label;
   return runtime;
}

export function runtimeLabel() {
   resolveRuntime();
   return resolutionLabel;
}

function getRuntime() {
   return resolveRuntime();
}

export function run(command) {
   execSync(command, { stdio: 'inherit' });
}

export function runCapture(command) {
   return execSync(command, { encoding: 'utf8' }).trim();
}

export function containerExists() {
   const runtime = getRuntime();
   try {
      const name = runCapture(
         `${runtime} ps -a --filter name=^${CONTAINER_NAME}$ --format "{{.Names}}"`,
      );
      return name === CONTAINER_NAME;
   } catch {
      return false;
   }
}

export function isContainerRunning() {
   const runtime = getRuntime();
   try {
      const name = runCapture(
         `${runtime} ps --filter name=^${CONTAINER_NAME}$ --format "{{.Names}}"`,
      );
      return name === CONTAINER_NAME;
   } catch {
      return false;
   }
}

export function tryComposeUp() {
   const runtime = getRuntime();
   try {
      run(`${runtime} compose up -d`);
      return true;
   } catch {
      return false;
   }
}

export function tryComposeDown() {
   const runtime = getRuntime();
   try {
      run(`${runtime} compose down`);
      return true;
   } catch {
      return false;
   }
}

export function startOllamaContainer() {
   const runtime = getRuntime();
   if (isContainerRunning()) {
      console.log(`Ollama container "${CONTAINER_NAME}" is already running.`);
      return;
   }

   if (containerExists()) {
      run(`${runtime} start ${CONTAINER_NAME}`);
      return;
   }

   run(
      `${runtime} run -d --name ${CONTAINER_NAME} -p 11434:11434 -v ollama_data:/root/.ollama ${OLLAMA_IMAGE}`,
   );
}

export function stopOllamaContainer() {
   const runtime = getRuntime();
   if (containerExists()) {
      run(`${runtime} stop ${CONTAINER_NAME}`);
      return;
   }

   console.log('No Ollama container found.');
}

export function pullDefaultModel() {
   const runtime = getRuntime();
   run(`${runtime} exec ${CONTAINER_NAME} ollama pull ${DEFAULT_MODEL}`);
}

export function tryComposePull() {
   const runtime = getRuntime();
   try {
      run(`${runtime} compose exec ${COMPOSE_SERVICE} ollama pull ${DEFAULT_MODEL}`);
      return true;
   } catch {
      return false;
   }
}

export function resetRuntimeCache() {
   resolvedRuntime = null;
   resolutionLabel = '';
}
