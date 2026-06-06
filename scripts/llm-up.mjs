import { startOllamaContainer, tryPodmanComposeUp } from './llm-podman.mjs';

if (!tryPodmanComposeUp()) {
   console.log('podman compose unavailable; using podman run fallback.');
   startOllamaContainer();
}
