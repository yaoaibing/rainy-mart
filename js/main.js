import * as THREE from 'three';
import { createWorld } from './world.js';
import { canvasTex } from './lib.js';

/* =========================================================
   相机 / 交互 / 主循环
   ========================================================= */

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.10;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const bgTex = canvasTex(8, 512, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0.00, '#04060d');
  grd.addColorStop(0.42, '#0a1122');
  grd.addColorStop(0.72, '#16203a');
  grd.addColorStop(1.00, '#243252');
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
});
bgTex.wrapS = bgTex.wrapT = THREE.ClampToEdgeWrapping;
scene.background = bgTex;

const camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 0.3, 400);

/* ---------- 轨道 ---------- */
const ctrl = {
  theta: -0.62, phi: 1.06, dist: 30,
  thetaT: -0.62, phiT: 1.06, distT: 24.2,
  target: new THREE.Vector3(0.80, 1.00, -0.60),
  targetT: new THREE.Vector3(0.80, 1.00, -0.60),
  dragging: false,
  panning: false,
  px: 0, py: 0,
  lastActive: performance.now(),
  intro: true,
};

const el = renderer.domElement;

/* 调试用相机覆盖：?cam=theta,phi,dist,tx,ty,tz */
{
  const q = new URLSearchParams(location.search).get('cam');
  if (q) {
    const [a, b, c, tx, ty, tz] = q.split(',').map(Number);
    ctrl.theta = ctrl.thetaT = a;
    ctrl.phi = ctrl.phiT = b;
    ctrl.dist = ctrl.distT = c;
    if (Number.isFinite(tx)) {
      ctrl.target.set(tx, ty, tz);
      ctrl.targetT.set(tx, ty, tz);
    }
    ctrl.intro = false;
  } else {
    ctrl.intro = true;
  }
}

el.addEventListener('contextmenu', (e) => e.preventDefault());

el.addEventListener('pointerdown', (e) => {
  el.setPointerCapture(e.pointerId);
  ctrl.dragging = true;
  ctrl.panning = (e.button === 2 || e.button === 1 || e.shiftKey);
  ctrl.px = e.clientX;
  ctrl.py = e.clientY;
  ctrl.lastActive = performance.now();
  ctrl.intro = false;
});

el.addEventListener('pointerup', (e) => {
  ctrl.dragging = false;
  ctrl.panning = false;
  try { el.releasePointerCapture(e.pointerId); } catch (_) { }
  ctrl.lastActive = performance.now();
});

el.addEventListener('pointercancel', () => {
  ctrl.dragging = false;
  ctrl.panning = false;
});

el.addEventListener('pointermove', (e) => {
  if (!ctrl.dragging) return;
  const dx = e.clientX - ctrl.px;
  const dy = e.clientY - ctrl.py;
  ctrl.px = e.clientX;
  ctrl.py = e.clientY;

  if (ctrl.panning) {
    const sp = ctrl.dist * 0.0016;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
    ctrl.targetT.addScaledVector(right, -dx * sp);
    ctrl.targetT.addScaledVector(up, dy * sp);
    ctrl.targetT.x = THREE.MathUtils.clamp(ctrl.targetT.x, -4.5, 4.5);
    ctrl.targetT.z = THREE.MathUtils.clamp(ctrl.targetT.z, -4.5, 4.5);
    ctrl.targetT.y = THREE.MathUtils.clamp(ctrl.targetT.y, 0.3, 3.6);
  } else {
    ctrl.thetaT -= dx * 0.0055;
    ctrl.phiT = THREE.MathUtils.clamp(ctrl.phiT - dy * 0.0045, 0.16, 1.47);
  }
  ctrl.lastActive = performance.now();
}, { passive: true });

el.addEventListener('wheel', (e) => {
  e.preventDefault();
  ctrl.intro = false;
  ctrl.distT = THREE.MathUtils.clamp(ctrl.distT * (1 + Math.sign(e.deltaY) * 0.09), 8, 40);
  ctrl.lastActive = performance.now();
}, { passive: false });

/* 双指缩放 */
let pinchStart = 0;
el.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    pinchStart = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
  }
}, { passive: true });

el.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && pinchStart > 0) {
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
    ctrl.distT = THREE.MathUtils.clamp(ctrl.distT * (pinchStart / d), 8, 40);
    pinchStart = d;
    ctrl.lastActive = performance.now();
  }
}, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- 世界 ---------- */
const world = createWorld(scene);

function updateCamera() {
  ctrl.theta += (ctrl.thetaT - ctrl.theta) * 0.09;
  ctrl.phi += (ctrl.phiT - ctrl.phi) * 0.09;
  ctrl.dist += (ctrl.distT - ctrl.dist) * 0.07;
  ctrl.target.lerp(ctrl.targetT, 0.1);

  const sp = Math.sin(ctrl.phi);
  const cp = Math.cos(ctrl.phi);
  camera.position.set(
    ctrl.target.x + ctrl.dist * sp * Math.sin(ctrl.theta),
    ctrl.target.y + ctrl.dist * cp,
    ctrl.target.z + ctrl.dist * sp * Math.cos(ctrl.theta),
  );
  camera.lookAt(ctrl.target);

  if (ctrl.intro && Math.abs(ctrl.distT - ctrl.dist) < 0.4) ctrl.intro = false;
}

let idle = 0;
function animate() {
  const now = performance.now();
  if (!ctrl.dragging && !ctrl.intro && now - ctrl.lastActive > 11000) {
    ctrl.thetaT += 0.0006;
  }
  updateCamera();
  world.tick();
  renderer.render(scene, camera);
  idle++;
  if (idle === 2) window.__ready = true;
}

renderer.setAnimationLoop(animate);
