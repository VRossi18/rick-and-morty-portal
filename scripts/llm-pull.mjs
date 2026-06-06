import { CONTAINER_NAME, DEFAULT_MODEL, isContainerRunning, pullDefaultModel, run } from './llm-podman.mjs';

if (!isContainerRunning()) {
   console.error(`Ollama is not running. Start it with: pnpm run llm:up`);
   process.exit(1);
}

try {
   run(`podman compose exec ollama ollama pull ${DEFAULT_MODEL}`);
} catch {
   pullDefaultModel();
}

console.log(`Model ${DEFAULT_MODEL} ready in ${CONTAINER_NAME}.`);
