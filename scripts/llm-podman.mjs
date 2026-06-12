import { execSync } from 'node:child_process';

export const CONTAINER_NAME = 'rick-morty-ollama';
export const OLLAMA_IMAGE = 'docker.io/ollama/ollama:latest';
export const DEFAULT_MODEL = 'llama3.1:8b';

export function run(command) {
   execSync(command, { stdio: 'inherit' });
}

export function runCapture(command) {
   return execSync(command, { encoding: 'utf8' }).trim();
}

export function containerNames() {
   try {
      return runCapture(
         `podman ps -a --filter name=^${CONTAINER_NAME}$ --format "{{.Names}}"`,
      );
   } catch {
      return '';
   }
}

export function isContainerRunning() {
   try {
      const name = runCapture(
         `podman ps --filter name=^${CONTAINER_NAME}$ --format "{{.Names}}"`,
      );
      return name === CONTAINER_NAME;
   } catch {
      return false;
   }
}

export function tryPodmanComposeUp() {
   try {
      run('podman compose up -d');
      return true;
   } catch {
      return false;
   }
}

export function startOllamaContainer() {
   if (isContainerRunning()) {
      console.log(`Ollama container "${CONTAINER_NAME}" is already running.`);
      return;
   }

   if (containerNames() === CONTAINER_NAME) {
      run(`podman start ${CONTAINER_NAME}`);
      return;
   }

   run(
      `podman run -d --name ${CONTAINER_NAME} -p 11434:11434 -v ollama_data:/root/.ollama ${OLLAMA_IMAGE}`,
   );
}

export function stopOllamaContainer() {
   if (containerNames() === CONTAINER_NAME) {
      run(`podman stop ${CONTAINER_NAME}`);
      return;
   }

   try {
      run('podman compose down');
   } catch {
      console.log('No Ollama container found.');
   }
}

export function pullDefaultModel() {
   run(`podman exec ${CONTAINER_NAME} ollama pull ${DEFAULT_MODEL}`);
}
