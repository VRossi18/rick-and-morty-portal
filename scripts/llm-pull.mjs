import {
   CONTAINER_NAME,
   DEFAULT_MODEL,
   isContainerRunning,
   pullDefaultModel,
   resolveRuntime,
   runtimeLabel,
   tryComposePull,
} from './llm-runtime.mjs';

resolveRuntime();
console.log(`Using container runtime: ${runtimeLabel()}`);

if (!isContainerRunning()) {
   console.error('Ollama is not running. Start it with: pnpm run llm:up');
   process.exit(1);
}

if (!tryComposePull()) {
   pullDefaultModel();
}

console.log(`Model ${DEFAULT_MODEL} ready in ${CONTAINER_NAME}.`);
