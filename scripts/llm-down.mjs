import {
   containerExists,
   resolveRuntime,
   runtimeLabel,
   stopOllamaContainer,
   tryComposeDown,
} from './llm-runtime.mjs';

resolveRuntime();
console.log(`Using container runtime: ${runtimeLabel()}`);

tryComposeDown();

if (containerExists()) {
   stopOllamaContainer();
}
