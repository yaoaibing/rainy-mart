import * as THREE from 'three';

/* =========================================================
   基础工具层：三渲二材质 / 反向外扩描边 / 图元 / 画布贴图
   ========================================================= */

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- 卡通阶梯 ---------- */
const STEP_VALUES = [0.30, 0.52, 0.74, 1.0];
const gradData = new Uint8Array(STEP_VALUES.map((v) => Math.round(v * 255)));
export const GRAD = new THREE.DataTexture(gradData, STEP_VALUES.length, 1, THREE.RedFormat);
GRAD.minFilter = THREE.NearestFilter;
GRAD.magFilter = THREE.NearestFilter;
GRAD.generateMipmaps = false;
GRAD.needsUpdate = true;

export function toon(color, extra = {}) {
  return new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: GRAD }, extra));
}

/* ---------- 描边：视图空间法线外扩，背面渲染 ---------- */
export const OUT_MAT = new THREE.ShaderMaterial({
  uniforms: {
    uW: { value: 0.0018 },
    uC: { value: new THREE.Color(0x0a0f1c) },
  },
  vertexShader: /* glsl */ `
    uniform float uW;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * normal);
      mv.xyz += n * uW * max(1.0, -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uC;
    void main() { gl_FragColor = vec4(uC, 1.0); }
  `,
  side: THREE.BackSide,
});

export function outline(mesh, mul = 1) {
  if (!mesh.geometry) return null;
  const o = new THREE.Mesh(mesh.geometry, OUT_MAT);
  o.castShadow = false;
  o.receiveShadow = false;
  o.userData.isOutline = true;
  mesh.add(o);
  return o;
}

/* ---------- 当前父节点 ---------- */
let _P = null;
export function setP(p) { _P = p; }
export function getP() { return _P; }

const UB = new THREE.BoxGeometry(1, 1, 1);

/* 方块：w,h,d 尺寸；x,y,z 中心点 */
export function B(w, h, d, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(UB, mat);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.recv !== false;
  (o.p || _P).add(m);
  if (o.out) outline(m, o.out === true ? 1 : o.out);
  return m;
}

/* 圆柱 */
export function CYL(rt, rb, h, seg, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.recv !== false;
  (o.p || _P).add(m);
  if (o.out) outline(m, o.out === true ? 1 : o.out);
  return m;
}

/* 球 */
export function SPH(r, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, o.seg || 16, o.seg2 || 12), mat);
  m.position.set(x, y, z);
  if (o.sx || o.sy || o.sz) m.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.recv !== false;
  (o.p || _P).add(m);
  if (o.out) outline(m, o.out === true ? 1 : o.out);
  return m;
}

/* 两点之间的圆柱（杆 / 管 / 线） */
export function BAR(p1, p2, r, mat, o = {}) {
  const a = new THREE.Vector3(p1[0], p1[1], p1[2]);
  const b = new THREE.Vector3(p2[0], p2[1], p2[2]);
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, o.seg || 6), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.recv !== false;
  (o.p || _P).add(m);
  if (o.out) outline(m, o.out === true ? 1 : o.out);
  return m;
}

/* 平面（默认平铺于地面） */
export function PLANE(w, h, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.x = o.rx !== undefined ? o.rx : -Math.PI / 2;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  m.position.set(x, y, z);
  m.receiveShadow = o.recv !== false;
  m.castShadow = false;
  (o.p || _P).add(m);
  return m;
}

/* 局部坐标组 */
export function G(x, y, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  (_P).add(g);
  return g;
}

export function withG(x, y, z, ry, fn, parent) {
  const prev = _P;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  (parent || _P).add(g);
  _P = g;
  fn(g);
  _P = prev;
  return g;
}

/* ---------- 画布贴图 ---------- */
export const JP = '"Yu Gothic UI","Yu Gothic","MS Gothic","Microsoft YaHei",sans-serif';

export function canvasTex(w, h, draw, opt = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opt.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (opt.repeat) t.repeat.set(opt.repeat[0], opt.repeat[1]);
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function texClone(tex, rx, ry) {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* ---------- 光晕 ---------- */
export const GLOW_TEX = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.15)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

export function glow(color, size, x, y, z, opacity = 0.55, parent) {
  const mat = new THREE.SpriteMaterial({
    map: GLOW_TEX,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(size, size, 1);
  s.position.set(x, y, z);
  s.renderOrder = 6;
  (parent || _P).add(s);
  return s;
}
