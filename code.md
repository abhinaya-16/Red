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
renderer.autoClear = false; // important for blending effects
document.body.appendChild(renderer.domElement);

// Adds glowing red light around the particles, making them look more fiery
// const composer = new EffectComposer(renderer);
// composer.addPass(new RenderPass(scene, camera));

// const bloomPass = new UnrealBloomPass(
//   new THREE.Vector2(window.innerWidth, window.innerHeight),
//   1.5, // strength (increase for more glow)
//   0.4, // radius
//   0.85 // threshold
// );

// composer.addPass(bloomPass);

const particleCount = 20000;

scene.background = new THREE.Color(0x000000);

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

// Spark animation: we take the original sphere positions, 
// calculate a distortion based on noise, and then rebuild the sphere shape every frame.
// The result is a dynamic, fiery effect that looks like sparks flying off the surface. 
// The particles also rotate slowly to add more life to the scene.

// =====================
// 🔥 FIRE STREAK SPARKS
// =====================

const sparkCount = 3000;

// each spark = 2 points (start + end)
const sparkGeometry = new THREE.BufferGeometry();
const sparkPositions = new Float32Array(sparkCount * 2 * 3);
const sparkVelocities = new Float32Array(sparkCount * 3);

for (let i = 0; i < sparkCount; i++) {
  const i6 = i * 6;
  const i3 = i * 3;

  // spawn on sphere surface
  const radius = 1.6;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  // line start = current position
  sparkPositions[i6] = x;
  sparkPositions[i6 + 1] = y;
  sparkPositions[i6 + 2] = z;

  // line end (initially same)
  sparkPositions[i6 + 3] = x;
  sparkPositions[i6 + 4] = y;
  sparkPositions[i6 + 5] = z;

  // outward velocity (IMPORTANT: straight radial)
  const len = Math.sqrt(x*x + y*y + z*z);
  const nx = x / len;
  const ny = y / len;
  const nz = z / len;

  sparkVelocities[i3] = nx * (0.05 + Math.random() * 0.05);
  sparkVelocities[i3 + 1] = ny * (0.05 + Math.random() * 0.05);
  sparkVelocities[i3 + 2] = nz * (0.05 + Math.random() * 0.05);
}

sparkGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(sparkPositions, 3)
);

// 🔥 thin neon red lines
const sparkMaterial = new THREE.LineBasicMaterial({
  color: 0xff2200,
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

  const sparkPos = sparkGeometry.attributes.position.array;

for (let i = 0; i < sparkCount; i++) {
  const i6 = i * 6;
  const i3 = i * 3;

  // current head position
  let x = sparkPos[i6];
  let y = sparkPos[i6 + 1];
  let z = sparkPos[i6 + 2];

  // move forward (NO random jitter → keeps straight crackle look)
  x += sparkVelocities[i3];
  y += sparkVelocities[i3 + 1];
  z += sparkVelocities[i3 + 2];

  // trail = previous position
  sparkPos[i6 + 3] = sparkPos[i6];
  sparkPos[i6 + 4] = sparkPos[i6 + 1];
  sparkPos[i6 + 5] = sparkPos[i6 + 2];

  // new head
  sparkPos[i6] = x;
  sparkPos[i6 + 1] = y;
  sparkPos[i6 + 2] = z;

  const dist = Math.sqrt(x*x + y*y + z*z);

  const minReset = 2.5 + Math.random() * 2.5; // soft shell break
  const fadeStart = 2.5 + Math.random() * 1.5;

if (dist > minReset){
    // respawn clean (no jitter)
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const radius = 1 + Math.random() * 0.6; // 🔥 BREAKS PERFECT SPHERE

    const sx = radius * Math.sin(phi) * Math.cos(theta);
    const sy = radius * Math.sin(phi) * Math.sin(theta);
    const sz = radius * Math.cos(phi);

    sparkPos[i6] = sx;
    sparkPos[i6 + 1] = sy;
    sparkPos[i6 + 2] = sz;

    sparkPos[i6 + 3] = sx;
    sparkPos[i6 + 4] = sy;
    sparkPos[i6 + 5] = sz;

    const len = Math.sqrt(x*x + y*y + z*z);
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;

    // 🔥 ADD DIVERGENCE (this kills uniform shell effect)
    const spread = 0.05;

    sparkVelocities[i3] =
      nx * (0.04 + Math.random() * 0.06) +
      (Math.random() - 0.5) * spread;

    sparkVelocities[i3 + 1] =
      ny * (0.04 + Math.random() * 0.06) +
      (Math.random() - 0.5) * spread;

    sparkVelocities[i3 + 2] =
      nz * (0.04 + Math.random() * 0.06) +
      (Math.random() - 0.5) * spread;
  }
}

sparkGeometry.attributes.position.needsUpdate = true;
  sparkMaterial.opacity = 0.6 + Math.sin(time * 10) * 0.2;
  renderer.setClearColor(0x000000, 0.1); // low alpha = trails
  renderer.clear();

  renderer.render(scene, camera);
}

animate();