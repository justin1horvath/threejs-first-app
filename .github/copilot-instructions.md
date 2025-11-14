# Guidance for AI coding agents — threejs-first-app

This is a very small, single-page Three.js project implemented as static files. The goal of this file is to provide concise, actionable guidance for an AI coding agent working on feature changes, fixes, or refactors.

Quick summary
- Purpose: simple demo that renders a rotating cube using Three.js.
- Structure: `index.html` (loads canvas and `main.js`), `main.js` (ES module, scene setup & loop), `style.css` (canvas sizing).
- No bundler or package.json — Three.js is imported from a pinned CDN module in `main.js`.

How to run locally (very important)
- The app uses `type="module"` imports, so `index.html` must be served over HTTP (not opened via `file://`).
- Recommended quick commands:
  - `python3 -m http.server 8000` then open `http://localhost:8000`
  - Or use VS Code Live Server extension to serve the workspace root.

Key patterns & project-specific conventions
- Imports: `main.js` imports Three.js directly from unpkg and pins a version: `https://unpkg.com/three@0.160.0/build/three.module.js`. Keep imports pinned when editing.
- Single entry file: `main.js` contains scene, camera, renderer, geometry, light, and the animation loop. Minimal global state — use the existing canvas id `three-canvas`.
- Canvas sizing: `renderer.setSize(window.innerWidth, window.innerHeight)` and the canvas element fills the viewport (`style.css`). Consider adding `renderer.setPixelRatio(window.devicePixelRatio)` for HiDPI displays when improving visuals.
- Resize handling: `window.addEventListener('resize', ...)` updates camera aspect and renderer size — preserve this when refactoring.

Examples for common edits
- Add OrbitControls (example import):
  `import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js'`
  Then `const controls = new OrbitControls(camera, renderer.domElement);` and call `controls.update()` in the animation loop.
- Change camera distance: `camera.position.z = 3` (current default). Adjust to reframe the scene.
- Improve pixel ratio: after creating `renderer`, call `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.

Debugging & common failure modes
- If you see import/CORS errors or "module scripts are not allowed to be loaded from file://", ensure the app is served over HTTP (see "How to run locally").
- Use the browser DevTools console to inspect errors. WebGL failures often show as renderer/context creation errors.

Integration & external dependencies
- Only external dependency: Three.js via unpkg CDN (module). If adding example utilities (OrbitControls, GLTFLoader) import from the matching `examples/jsm/*` path on unpkg with the same pinned version.
- If migrating to npm, add a `package.json` and use `npm install three` then change imports to local node_modules or a bundler setup. Be careful to update example imports accordingly (examples live under `three/examples/jsm/...`).

What an AI agent should and should not change without confirmation
- SHOULD: small visual tweaks, add simple controls (OrbitControls), add new geometry or materials, add comments, or minor performance improvements (pixel ratio limit, frustum culling notes).
- SHOULD NOT (without user confirmation): migrate the project to a bundler or change the import strategy (CDN → npm) since that changes the developer workflow.

Files to inspect when modifying behavior
- `main.js` — primary logic (scene graph, renderer, animation loop).
- `index.html` — module script tag and canvas id `three-canvas`.
- `style.css` — canvas sizing and page background.

If a `.github/copilot-instructions.md` already exists
- Merge preserving any unique guidance. Prioritize concrete, discoverable details (imports, run commands, file names, canvas id and module constraints) and remove stale or generic instructions.

If anything here is unclear or you need more examples (e.g., adding GLTF loading or switching to npm/bundler), ask which direction to take and I'll provide a step-by-step patch.
