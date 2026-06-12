import {
   resolveRuntime,
   runtimeLabel,
   startOllamaContainer,
   tryComposeUp,
} from './llm-runtime.mjs';

resolveRuntime();
console.log(`Using container runtime: ${runtimeLabel()}`);

if (!tryComposeUp()) {
   console.log('compose unavailable; using container run fallback.');
   startOllamaContainer();
}
