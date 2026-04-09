import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const particleCount = 20000;

const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;

  // random spherical distribution
  const radius = 1.5;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);

  positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
  positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  positions[i3 + 2] = radius * Math.cos(phi);
}
const basePositions = positions.slice();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  color: 0xff0000,
  size: 0.02,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();
  const positions = geometry.attributes.position.array;

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // original sphere position
    const ox = basePositions[i3];
    const oy = basePositions[i3 + 1];
    const oz = basePositions[i3 + 2];

    // normalize (direction from center)
    const length = Math.sqrt(ox * ox + oy * oy + oz * oz);
    const nx = ox / length;
    const ny = oy / length;
    const nz = oz / length;

    // 🔥 distortion (this is the "alive" part)
    const noise =
      Math.sin(nx * 3 + time * 2) +
      Math.sin(ny * 3 + time * 2) +
      Math.sin(nz * 3 + time * 2);

    const distortion = 0.2 * noise;
    const pulse = Math.sin(time * 2) * 0.1;
    const finalRadius = 1.5 + distortion + pulse;

    // rebuild sphere shape every frame
    positions[i3] = nx * finalRadius;
    positions[i3 + 1] = ny * finalRadius;
    positions[i3 + 2] = nz * finalRadius;
  }

  geometry.attributes.position.needsUpdate = true;

  particles.rotation.y += 0.002;

  renderer.render(scene, camera);
}

animate();