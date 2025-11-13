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

// Create a simple box geometry and a basic material, then mesh them together
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x33b5a6 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add a light so we can see the cube’s faces
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

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

  // Rotate the cube a bit each frame
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}

animate();