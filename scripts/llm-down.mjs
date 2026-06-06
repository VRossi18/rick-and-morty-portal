import { containerNames, run, stopOllamaContainer } from './llm-podman.mjs';

try {
   run('podman compose down');
} catch {
   // compose provider may be missing
}

if (containerNames()) {
   stopOllamaContainer();
}
