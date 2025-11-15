// Import Three.js from a CDN (no install needed)
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Grab the canvas from our HTML
const canvas = document.getElementById('three-canvas');

// Create a scene
const scene = new THREE.Scene();

// Create a camera (like a virtual eye)
const camera = new THREE.PerspectiveCamera(
  75,                     // field of view
  window.innerWidth / window.innerHeight, // aspect ratio
  0.1,                    // near clipping plane
  1000                    // far clipping plane
);
camera.position.z = 3; // move camera back so we can see things

// Create a WebGL renderer and attach it to our canvas
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Add a light so we can see the cube’s faces
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
light.castShadow = true;
light.shadow.mapSize.set(1024, 1024);
light.shadow.camera.near = 0.1;
light.shadow.camera.far = 20;
scene.add(light);

// Fill the scene with a subtle ambient light so shadows are not completely black
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Ground plane to catch shadows
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

// Shake constants used by each interactive cube
const SHAKE_DURATION = 250; // milliseconds
const SHAKE_AMPLITUDE = 0.05; // world units
const SHAKE_FREQUENCY = 20; // oscillations per second

// Encapsulates geometry creation and pointer interactions for each cube
class InteractiveCube {
  constructor(color = 0x33b5a6) {
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshStandardMaterial({ color });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.userData.interactiveCube = this;

    this.basePosition = new THREE.Vector3();
    this.isDragging = false;
    this.activePointerId = null;
    this.lastPointerPosition = { x: 0, y: 0 };
    this.shakeStartTime = null;
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
    this.basePosition.set(x, y, z);
  }

  startDrag(event) {
    this.isDragging = true;
    this.activePointerId = event.pointerId;
    this.lastPointerPosition.x = event.clientX;
    this.lastPointerPosition.y = event.clientY;
    this.shakeStartTime = performance.now();
  }

  handlePointerMove(event) {
    if (!this.isDragging || event.pointerId !== this.activePointerId) {
      return;
    }

    const deltaX = event.clientX - this.lastPointerPosition.x;
    const deltaY = event.clientY - this.lastPointerPosition.y;
    const rotationSpeed = 0.005;
    this.mesh.rotation.y += deltaX * rotationSpeed;
    this.mesh.rotation.x += deltaY * rotationSpeed;

    this.lastPointerPosition.x = event.clientX;
    this.lastPointerPosition.y = event.clientY;
  }

  endDrag() {
    this.isDragging = false;
    this.activePointerId = null;
  }

  isPointerActive(pointerId) {
    return this.activePointerId === pointerId;
  }

  update() {
    if (this.shakeStartTime !== null) {
      const elapsed = performance.now() - this.shakeStartTime;

      if (elapsed < SHAKE_DURATION) {
        const decay = 1 - elapsed / SHAKE_DURATION;
        const oscillation = Math.sin((elapsed / 1000) * Math.PI * 2 * SHAKE_FREQUENCY);
        const offsetX = oscillation * SHAKE_AMPLITUDE * decay;
        const offsetY = oscillation * (SHAKE_AMPLITUDE * 0.5) * decay;
        this.mesh.position.set(
          this.basePosition.x + offsetX,
          this.basePosition.y + offsetY,
          this.basePosition.z
        );
      } else {
        this.mesh.position.copy(this.basePosition);
        this.shakeStartTime = null;
      }
    } else if (
      this.mesh.position.x !== this.basePosition.x ||
      this.mesh.position.y !== this.basePosition.y ||
      this.mesh.position.z !== this.basePosition.z
    ) {
      this.mesh.position.copy(this.basePosition);
    }
  }
}

// Build a 3x3 grid of cubes that sit on top of the ground plane
const cubes = [];
const cubeMeshes = [];
const GRID_SIZE = 3;
const GRID_SPACING = 1.5;
const cubeColors = [
  0x33b5a6,
  0xff8a65,
  0x9575cd,
  0xffc107,
  0x4db6ac,
  0x7986cb,
  0xff7043,
  0x7cb342,
  0xdce775
];

for (let row = 0; row < GRID_SIZE; row += 1) {
  for (let col = 0; col < GRID_SIZE; col += 1) {
    const colorIndex = row * GRID_SIZE + col;
    const cube = new InteractiveCube(cubeColors[colorIndex]);
    const x = (col - (GRID_SIZE - 1) / 2) * GRID_SPACING;
    const z = (row - (GRID_SIZE - 1) / 2) * GRID_SPACING;
    cube.setPosition(x, 0, z);
    scene.add(cube.mesh);
    cubes.push(cube);
    cubeMeshes.push(cube.mesh);
  }
}

// Raycaster & helpers for picking the cube
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let activeCube = null;

function setPointerFromEvent(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerDown(event) {
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(cubeMeshes, false);
  if (intersects.length === 0) {
    return;
  }

  const selectedMesh = intersects[0].object;
  const cube = selectedMesh.userData.interactiveCube;
  if (!cube) {
    return;
  }

  activeCube = cube;
  cube.startDrag(event);

  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function onPointerMove(event) {
  if (!activeCube) {
    return;
  }

  activeCube.handlePointerMove(event);
}

function endDrag(event) {
  if (!activeCube) {
    return;
  }

  if (event && !activeCube.isPointerActive(event.pointerId)) {
    return;
  }

  const pointerId = activeCube.activePointerId;
  activeCube.endDrag();
  activeCube = null;

  if (pointerId !== null) {
    try {
      canvas.releasePointerCapture(pointerId);
    } catch (error) {
      // Ignore errors from releasing captures that are already released.
    }
  }
}

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointerleave', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// Handle window resizing
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  cubes.forEach((cube) => cube.update());

  renderer.render(scene, camera);
}

animate();
