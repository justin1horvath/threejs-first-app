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

// Create a simple box geometry and a basic material, then mesh them together
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x33b5a6 });
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
scene.add(cube);

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

// Raycaster & helpers for picking the cube
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let isDragging = false;
let activePointerId = null;
const lastPointerPosition = { x: 0, y: 0 };
let shakeStartTime = null;
const SHAKE_DURATION = 250; // milliseconds
const SHAKE_AMPLITUDE = 0.05; // world units
const SHAKE_FREQUENCY = 20; // oscillations per second

function setPointerFromEvent(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerDown(event) {
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObject(cube, false);
  if (intersects.length === 0) {
    return;
  }

  isDragging = true;
  activePointerId = event.pointerId;
  lastPointerPosition.x = event.clientX;
  lastPointerPosition.y = event.clientY;
  shakeStartTime = performance.now();

  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function onPointerMove(event) {
  if (!isDragging || event.pointerId !== activePointerId) {
    return;
  }

  const deltaX = event.clientX - lastPointerPosition.x;
  const deltaY = event.clientY - lastPointerPosition.y;

  const rotationSpeed = 0.005;
  cube.rotation.y += deltaX * rotationSpeed;
  cube.rotation.x += deltaY * rotationSpeed;

  lastPointerPosition.x = event.clientX;
  lastPointerPosition.y = event.clientY;
}

function endDrag(event) {
  if (!isDragging || (event && event.pointerId !== activePointerId)) {
    return;
  }

  if (activePointerId !== null) {
    try {
      canvas.releasePointerCapture(activePointerId);
    } catch (error) {
      // Ignore errors from releasing captures that are already released.
    }
  }

  isDragging = false;
  activePointerId = null;
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

  if (shakeStartTime !== null) {
    const elapsed = performance.now() - shakeStartTime;

    if (elapsed < SHAKE_DURATION) {
      const decay = 1 - elapsed / SHAKE_DURATION;
      const oscillation = Math.sin((elapsed / 1000) * Math.PI * 2 * SHAKE_FREQUENCY);
      cube.position.x = oscillation * SHAKE_AMPLITUDE * decay;
      cube.position.y = oscillation * (SHAKE_AMPLITUDE * 0.5) * decay;
    } else {
      cube.position.set(0, 0, 0);
      shakeStartTime = null;
    }
  } else if (cube.position.x !== 0 || cube.position.y !== 0) {
    cube.position.set(0, 0, 0);
  }

  renderer.render(scene, camera);
}

animate();
