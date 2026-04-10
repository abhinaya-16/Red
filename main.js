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
renderer.autoClear = false;
document.body.appendChild(renderer.domElement);

const particleCount = 20000;

scene.background = new THREE.Color(0x000000);

const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;
  const radius = 1.5;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);

  positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
  positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  positions[i3 + 2] = radius * Math.cos(phi);
}
const basePositions = positions.slice();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// ── RED HALO LAYER (large, dim, red) ──────────────────────────────
const haloMaterial = new THREE.PointsMaterial({
  color: 0xff1100,
  size: 0.07,
  transparent: true,
  opacity: 0.25,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const haloParticles = new THREE.Points(geometry, haloMaterial);
scene.add(haloParticles);

// ── WHITE CORE LAYER (small, bright, white) ───────────────────────
const material = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.02,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const particles = new THREE.Points(geometry, material);
scene.add(particles);

const clock = new THREE.Clock();

// =====================
// 🔥 FIRE STREAK SPARKS
// =====================

const sparkCount = 3000;

const sparkGeometry = new THREE.BufferGeometry();
const sparkPositions = new Float32Array(sparkCount * 2 * 3);
const sparkVelocities = new Float32Array(sparkCount * 3);

for (let i = 0; i < sparkCount; i++) {
  const i6 = i * 6;
  const i3 = i * 3;

  const radius = 1.6;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  sparkPositions[i6]     = x;
  sparkPositions[i6 + 1] = y;
  sparkPositions[i6 + 2] = z;
  sparkPositions[i6 + 3] = x;
  sparkPositions[i6 + 4] = y;
  sparkPositions[i6 + 5] = z;

  const len = Math.sqrt(x*x + y*y + z*z);
  const nx = x / len;
  const ny = y / len;
  const nz = z / len;

  sparkVelocities[i3]     = nx * (0.03 + Math.random() * 0.03);
  sparkVelocities[i3 + 1] = ny * (0.03 + Math.random() * 0.03);
  sparkVelocities[i3 + 2] = nz * (0.03 + Math.random() * 0.03);
}

sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

// ── RED HALO SPARK LINES (wide, dim red) ──────────────────────────
const sparkHaloMaterial = new THREE.LineBasicMaterial({
  color: 0xff1100,
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  linewidth: 3  // note: only works in WebGL1 / some drivers
});
const sparkHalo = new THREE.LineSegments(sparkGeometry, sparkHaloMaterial);
scene.add(sparkHalo);

// ── WHITE CORE SPARK LINES (thin, bright white) ───────────────────
const sparkMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const sparks = new THREE.LineSegments(sparkGeometry, sparkMaterial);
scene.add(sparks);

//--------------------------------------------------------------------

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();
  const positions = geometry.attributes.position.array;

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    const ox = basePositions[i3];
    const oy = basePositions[i3 + 1];
    const oz = basePositions[i3 + 2];

    const length = Math.sqrt(ox * ox + oy * oy + oz * oz);
    const nx = ox / length;
    const ny = oy / length;
    const nz = oz / length;

    const noise =
      Math.sin(nx * 3 + time * 2) +
      Math.sin(ny * 3 + time * 2) +
      Math.sin(nz * 3 + time * 2);

    const distortion = 0.2 * noise;
    const pulse = Math.sin(time * 2) * 0.1;
    const finalRadius = 1.5 + distortion + pulse;

    positions[i3]     = nx * finalRadius;
    positions[i3 + 1] = ny * finalRadius;
    positions[i3 + 2] = nz * finalRadius;
  }

  geometry.attributes.position.needsUpdate = true;

  // sync rotation on both layers
  particles.rotation.y  += 0.002;
  haloParticles.rotation.y = particles.rotation.y;

  const sparkPos = sparkGeometry.attributes.position.array;

  for (let i = 0; i < sparkCount; i++) {
    const i6 = i * 6;
    const i3 = i * 3;

    let x = sparkPos[i6];
    let y = sparkPos[i6 + 1];
    let z = sparkPos[i6 + 2];

    x += sparkVelocities[i3];
    y += sparkVelocities[i3 + 1];
    z += sparkVelocities[i3 + 2];

    sparkPos[i6 + 3] = sparkPos[i6];
    sparkPos[i6 + 4] = sparkPos[i6 + 1];
    sparkPos[i6 + 5] = sparkPos[i6 + 2];

    sparkPos[i6]     = x;
    sparkPos[i6 + 1] = y;
    sparkPos[i6 + 2] = z;

    const dist = Math.sqrt(x*x + y*y + z*z);
    const minReset = 2.5 + Math.random() * 2.5;

    if (dist > minReset) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 1 + Math.random() * 0.6;

      const sx = radius * Math.sin(phi) * Math.cos(theta);
      const sy = radius * Math.sin(phi) * Math.sin(theta);
      const sz = radius * Math.cos(phi);

      sparkPos[i6]     = sx;
      sparkPos[i6 + 1] = sy;
      sparkPos[i6 + 2] = sz;
      sparkPos[i6 + 3] = sx;
      sparkPos[i6 + 4] = sy;
      sparkPos[i6 + 5] = sz;

      const len = Math.sqrt(x*x + y*y + z*z);
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;

      const spread = 0.05;

      sparkVelocities[i3]     = nx * (0.03 + Math.random() * 0.03) + (Math.random() - 0.5) * spread;
      sparkVelocities[i3 + 1] = ny * (0.03 + Math.random() * 0.03) + (Math.random() - 0.5) * spread;
      sparkVelocities[i3 + 2] = nz * (0.03 + Math.random() * 0.03) + (Math.random() - 0.5) * spread;
    }
  }

  sparkGeometry.attributes.position.needsUpdate = true;

  const flicker = 0.6 + Math.sin(time * 10) * 0.2;
  sparkMaterial.opacity     = flicker;
  sparkHaloMaterial.opacity = flicker * 0.8;

  renderer.setClearColor(0x000000, 0.1);
  renderer.clear();
  renderer.render(scene, camera);
}

animate();