import * as THREE from 'three';
import {
  V3, toon, B, CYL, SPH, BAR, PLANE, withG, setP, outline,
  canvasTex, texClone, roundRect, glow, JP, rnd, pick, getP, GLOW_TEX,
} from './lib.js';

/* =========================================================
   雨夜便利店街角 · 微缩场景（世界坐标统一：y=0 为路面，0.14 为人行道面）
   ========================================================= */

export function createWorld(scene) {
  setP(scene);

  /* ---------------------------------------------------------
     0. 纹理
     --------------------------------------------------------- */
  const C = {
    curb: 0xc6cbd6, wall: 0xf2ede0, trim: 0xdcd7c8,
    steel: 0xb4bccb, darkSteel: 0x3b4254,
  };

  const asphaltTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#39415a';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3200; i++) {
      const s = rnd(0.6, 2.6), v = Math.random();
      g.fillStyle = v > 0.6
        ? `rgba(160,180,215,${rnd(0.03, 0.10)})`
        : `rgba(8,10,18,${rnd(0.03, 0.12)})`;
      g.fillRect(rnd(0, w), rnd(0, h), s, s);
    }
    for (let i = 0; i < 12; i++) {
      g.beginPath();
      g.ellipse(rnd(0, w), rnd(0, h), rnd(24, 100), rnd(16, 64), rnd(0, 3), 0, 7);
      g.fillStyle = `rgba(14,18,30,${rnd(0.06, 0.14)})`;
      g.fill();
    }
    // 湿亮的水膜斑块
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.ellipse(rnd(0, w), rnd(0, h), rnd(30, 90), rnd(14, 46), rnd(0, 3), 0, 7);
      g.fillStyle = `rgba(120,150,200,${rnd(0.05, 0.11)})`;
      g.fill();
    }
  }, { repeat: [3, 3] });

  const swTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6a7080';
    g.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const v = 128 + Math.round(rnd(-8, 10));
        g.fillStyle = `rgb(${v},${v + 5},${v + 16})`;
        g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        for (let k = 0; k < 50; k++) {
          g.fillStyle = `rgba(255,255,255,${rnd(0.02, 0.07)})`;
          g.fillRect(i * s + rnd(4, s - 8), j * s + rnd(4, s - 8), rnd(1, 3), rnd(1, 3));
        }
      }
    }
  });

  const wallTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#eae2d0';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(190,184,168,0.32)';
      g.fillRect(0, i * (h / 6), w, 2);
    }
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(196,190,176,${rnd(0.03, 0.10)})`;
      g.fillRect(rnd(0, w), rnd(0, h), rnd(2, 26), rnd(1, 3));
    }
  }, { repeat: [2, 2] });

  const oldWallTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#9aa0a0';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++) {
      const x = rnd(0, w);
      const gr = g.createLinearGradient(x, 0, x, h);
      gr.addColorStop(0, 'rgba(80,86,88,0.22)');
      gr.addColorStop(1, 'rgba(120,126,126,0.02)');
      g.fillStyle = gr;
      g.fillRect(x, rnd(-40, 100), rnd(4, 26), h);
    }
    for (let i = 0; i < 400; i++) {
      g.fillStyle = `rgba(70,76,78,${rnd(0.02, 0.07)})`;
      g.fillRect(rnd(0, w), rnd(0, h), rnd(2, 18), rnd(1, 4));
    }
  }, { repeat: [2, 2] });

  const concreteTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8e93a4';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 40},${Math.random() > 0.5 ? 255 : 44},255,${rnd(0.02, 0.06)})`;
      g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 4), rnd(1, 4));
    }
  }, { repeat: [4, 4] });

  const grateTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#20242f';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#6a7080';
    for (let i = 0; i < 8; i++) g.fillRect(8, 6 + i * 15, w - 16, 7);
    g.strokeStyle = '#3a4050';
    g.lineWidth = 3;
    g.strokeRect(2, 2, w - 4, h - 4);
  });

  const matTex = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#2b3340';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4b5768';
    g.lineWidth = 5;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#66748a';
    g.font = `bold 28px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('WELCOME', w / 2, h / 2 + 2);
  });

  const fasciaTex = canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#f8f6f0';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2f9e6c';
    roundRect(g, 34, 40, 148, 148, 26);
    g.fill();
    g.fillStyle = '#ffffff';
    g.font = `bold 106px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('H', 108, 114);
    g.fillStyle = '#ef8231';
    g.beginPath();
    g.arc(160, 62, 17, 0, 7);
    g.fill();
    g.textAlign = 'left';
    g.fillStyle = '#1d5b45';
    g.font = `bold 92px ${JP}`;
    g.fillText('ほっとマート', 214, 110);
    g.fillStyle = '#ef8231';
    g.font = `bold 33px ${JP}`;
    g.fillText('HOT MART  ·  OPEN 24 HOURS', 220, 180);
    g.fillStyle = '#2f9e6c';
    g.fillRect(214, 198, 120, 8);
    g.fillStyle = '#ef8231';
    g.fillRect(344, 198, 84, 8);
  });

  const pylonTex = canvasTex(256, 1024, (g, w, h) => {
    g.fillStyle = '#1b5540';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4f1e6';
    g.fillRect(0, 0, w, 10);
    g.fillRect(0, h - 10, w, 10);
    roundRect(g, 40, 46, 176, 176, 34);
    g.fillStyle = '#f7f5ee';
    g.fill();
    g.fillStyle = '#1b5540';
    g.font = `bold 118px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('H', 128, 136);
    g.fillStyle = '#ef8231';
    g.beginPath();
    g.arc(200, 62, 20, 0, 7);
    g.fill();
    const chars = 'ほっとマート';
    g.fillStyle = '#f7f5ee';
    g.font = `bold 92px ${JP}`;
    for (let i = 0; i < chars.length; i++) g.fillText(chars[i], 128, 306 + i * 96);
    g.fillStyle = '#f5a04a';
    g.font = `bold 74px ${JP}`;
    g.fillText('24H', 128, 904);
    g.fillStyle = '#f4f1e6';
    g.font = `bold 34px ${JP}`;
    g.fillText('OPEN', 128, 966);
  });

  const vendTex = canvasTex(512, 1024, (g, w, h) => {
    g.fillStyle = '#d7263d';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#b81c31';
    g.fillRect(0, 0, w, 150);
    g.fillStyle = '#fff';
    g.font = `bold 54px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('つめたい', w / 2, 76);
    g.fillStyle = '#f2f5fa';
    g.fillRect(18, 168, w - 36, 560);
    const rows = 4, cols = 5;
    const cw = (w - 60) / cols, ch = 520 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 30 + c * cw, y = 190 + r * ch;
        g.fillStyle = pick(['#e8433f', '#2f8fd0', '#3fb37a', '#f0a63a', '#8b5cc7', '#e8e2d6']);
        roundRect(g, x + 6, y + 6, cw - 22, ch - 34, 10);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.fillRect(x + 14, y + 18, 8, ch - 58);
        g.fillStyle = '#d7263d';
        g.font = `bold 17px ${JP}`;
        g.fillText('130', x + cw / 2 - 6, y + ch - 18);
      }
    }
    g.fillStyle = '#2b3140';
    g.fillRect(18, 748, w - 36, 120);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? '#8ee6ff' : '#ffd166';
      g.beginPath();
      g.arc(60 + i * 72, 790, 13, 0, 7);
      g.fill();
    }
    g.fillStyle = '#9aa3b2';
    g.fillRect(46, 818, 120, 16);
    g.fillRect(200, 818, 60, 16);
    g.fillStyle = '#1d222c';
    g.fillRect(46, 890, w - 92, 96);
    g.fillStyle = '#2f3744';
    g.fillRect(58, 902, w - 116, 72);
  });

  const fridgeTex = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#b9d6e8';
    g.fillRect(0, 0, w, h);
    const top = g.createLinearGradient(0, 0, 0, h * 0.5);
    top.addColorStop(0, 'rgba(255,255,255,0.55)');
    top.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = top;
    g.fillRect(0, 0, w, h * 0.5);

    const rows = 4, cols = 9;
    const cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw, y = r * ch;
        // 层板
        g.fillStyle = 'rgba(120,150,175,0.35)';
        g.fillRect(x, y + ch - 6, cw, 6);
        // 瓶身
        const col = pick(['#c62f2a', '#1f6fb0', '#cf7a12', '#1f8850', '#e6e2d2', '#5b3f9e', '#b83a76', '#c9a01a']);
        const bw = cw * 0.56, bh = ch * 0.60;
        const bx = x + cw / 2 - bw / 2, by = y + ch * 0.18;
        g.fillStyle = 'rgba(40,60,80,0.25)';
        roundRect(g, bx + 3, by + 5, bw, bh, 6);
        g.fill();
        g.fillStyle = col;
        roundRect(g, bx, by, bw, bh, 6);
        g.fill();
        // 高光与标签
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.fillRect(bx + 5, by + 6, bw * 0.16, bh * 0.6);
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.fillRect(bx + bw * 0.2, by + bh * 0.45, bw * 0.6, bh * 0.18);
        // 瓶盖
        g.fillStyle = 'rgba(255,255,255,0.8)';
        g.fillRect(bx + bw * 0.3, by - 4, bw * 0.4, 6);
      }
    }
    // 柜门分隔
    for (let i = 0; i <= 6; i++) {
      g.fillStyle = 'rgba(60,80,100,0.35)';
      g.fillRect(i * (w / 6) - 3, 0, 6, h);
    }
    g.fillStyle = 'rgba(60,80,100,0.5)';
    g.fillRect(0, 0, w, 6);
  });

  function posterTex(title, sub, bg, fg, accent) {
    return canvasTex(256, 384, (g, w, h) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = accent;
      g.fillRect(0, 0, w, 54);
      g.fillStyle = fg;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `bold 44px ${JP}`;
      g.fillText(title, w / 2, 128);
      g.font = `bold 26px ${JP}`;
      g.fillText(sub, w / 2, 186);
      g.fillStyle = accent;
      roundRect(g, w / 2 - 92, 244, 184, 92, 14);
      g.fill();
      g.fillStyle = '#fff';
      g.font = `bold 34px ${JP}`;
      g.fillText('NEW', w / 2, 292);
    });
  }
  const posters = [
    posterTex('ホットコーヒー', 'あたたかい', '#fff6e6', '#a8531f', '#ef8231'),
    posterTex('肉まん', '80円', '#fff1f3', '#b3213a', '#e8405c'),
    posterTex('アルバイト', '募集中', '#eef7f1', '#1d5b45', '#2f9e6c'),
  ];

  const boardTex = canvasTex(512, 384, (g, w, h) => {
    g.fillStyle = '#c9a877';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(120,90,54,${rnd(0.02, 0.08)})`;
      g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 6), rnd(1, 4));
    }
    const papers = [
      [-150, -60, 150, 190, '#f7f4ea'],
      [10, -90, 130, 170, '#eaf0f7'],
      [-60, 80, 140, 110, '#fff2d8'],
    ];
    for (const [dx, dy, pw, ph, col] of papers) {
      const x = w / 2 + dx, y = h / 2 + dy;
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(x + 6, y + 8, pw, ph);
      g.fillStyle = col;
      g.fillRect(x, y, pw, ph);
      g.fillStyle = 'rgba(60,70,90,0.5)';
      for (let i = 0; i < 7; i++) g.fillRect(x + 14, y + 22 + i * 18, pw - 34 - rnd(0, 30), 4);
      g.fillStyle = '#d8443c';
      g.beginPath();
      g.arc(x + pw / 2, y + 10, 6, 0, 7);
      g.fill();
    }
  });

  const stopTex = canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.beginPath();
    g.moveTo(14, 26); g.lineTo(w - 14, 26); g.lineTo(w / 2, h - 20); g.closePath();
    g.fillStyle = '#d8323c';
    g.fill();
    g.lineWidth = 10;
    g.strokeStyle = '#f6f2ea';
    g.stroke();
    g.fillStyle = '#fff';
    g.font = `bold 58px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('止まれ', w / 2, 112);
  });

  const pSignTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1f5fa8';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#fff';
    g.lineWidth = 12;
    g.strokeRect(12, 12, w - 24, h - 24);
    g.fillStyle = '#fff';
    g.font = `bold 168px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('P', w / 2, h / 2 + 8);
  });

  const nameTex = canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = '#f2f5f8';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2f6a4a';
    g.lineWidth = 8;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#20463a';
    g.font = `bold 56px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('桜町 一丁目', w / 2, h / 2 + 4);
  });

  const manholeTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#22262f';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4a5160';
    g.lineWidth = 4;
    for (let r = 40; r < 120; r += 14) {
      g.beginPath();
      g.arc(w / 2, h / 2, r, 0, 7);
      g.stroke();
    }
    g.lineWidth = 10;
    g.beginPath();
    g.arc(w / 2, h / 2, 118, 0, 7);
    g.stroke();
  });

  const smearTex = canvasTex(128, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const a = Math.pow(t, 2.4) * 0.95;
      const ww = 0.18 + 0.82 * (1 - t);
      g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      g.fillRect(w * (0.5 - ww / 2), y, w * ww, 1);
    }
  });

  /* ---------------------------------------------------------
     1. 材质
     --------------------------------------------------------- */
  const M = {
    asphalt: toon(0xffffff, { map: asphaltTex }),
    curb: toon(C.curb),
    wall: toon(0xded6c5, { map: wallTex }),
    oldWall: toon(0xffffff, { map: oldWallTex }),
    concrete: toon(0xffffff, { map: concreteTex }),
    trim: toon(C.trim),
    steel: toon(C.steel),
    darkSteel: toon(C.darkSteel),
    blackMetal: toon(0x232833),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x9dc8d8, transparent: true, opacity: 0.15, roughness: 0.06,
      metalness: 0, side: THREE.DoubleSide, depthWrite: false,
    }),
    glassDark: new THREE.MeshPhysicalMaterial({
      color: 0x2c3b4a, transparent: true, opacity: 0.5, roughness: 0.2,
      side: THREE.DoubleSide, depthWrite: false,
    }),
    roof: toon(0x767e8e),
    floor: toon(0xe9e2d0),
    white: toon(0xf6f4ee),
    warmLight: toon(0xfff3dd, { emissive: 0xffd9a0, emissiveIntensity: 0.55 }),
  };

  /* ---------------------------------------------------------
     2. 底座
     --------------------------------------------------------- */
  // 底座侧壁：把垂直渐变烘进贴图，弱光下也能读出「实体方块」的体积
  const plinthTex = canvasTex(8, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0.00, '#6c7794');
    gr.addColorStop(0.07, '#4b5570');
    gr.addColorStop(0.30, '#333b52');
    gr.addColorStop(0.62, '#232a3c');
    gr.addColorStop(0.88, '#161b27');
    gr.addColorStop(1.00, '#0d1119');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    // 顶部一线高光，像抛光过的石材边缘
    g.fillStyle = 'rgba(210,224,255,0.50)';
    g.fillRect(0, 1, w, 3);
    g.fillStyle = 'rgba(150,170,215,0.20)';
    g.fillRect(0, 4, w, 2);
    // 中段一条若隐若现的分层线
    g.fillStyle = 'rgba(190,208,245,0.10)';
    g.fillRect(0, Math.round(h * 0.30), w, 2);
  });
  // 侧壁用 basic 材质：烘死的渐变不受灯光影响，任何时候都能读出实体块
  const plinthFace = (tint) => new THREE.MeshBasicMaterial({ map: plinthTex, color: tint });
  const plinthTop = new THREE.MeshBasicMaterial({ color: 0x2d3547 });
  const plinthBot = new THREE.MeshBasicMaterial({ color: 0x090c14 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(12, 0.90, 12), [
    plinthFace(0xffffff), plinthFace(0xf2f6ff), plinthTop, plinthBot,
    plinthFace(0xffffff), plinthFace(0xdfe6f6),
  ]);
  plinth.position.set(0, -0.45, 0);
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  scene.add(plinth);
  outline(plinth);

  // 顶沿亮线 / 凹槽 / 底脚（basic 材质，弱光下也能勾出模型剪影）
  const flat = (c) => new THREE.MeshBasicMaterial({ color: c });
  B(12.12, 0.07, 12.12, flat(0x5b6683), 0, -0.035, 0, { cast: false });
  B(12.02, 0.05, 12.02, flat(0x0e121c), 0, -0.10, 0, { cast: false });
  B(12.18, 0.06, 12.18, flat(0x3a4460), 0, -0.862, 0, { cast: false });
  B(11.94, 0.05, 11.94, flat(0x0b0e16), 0, -0.912, 0, { cast: false });

  /* ---------------------------------------------------------
     3. 地面
     --------------------------------------------------------- */
  const roadPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), M.asphalt);
  roadPlane.rotation.x = -Math.PI / 2;
  roadPlane.position.y = 0.001;
  roadPlane.receiveShadow = true;
  scene.add(roadPlane);

  function slab(w, d, x, z, tex, rep) {
    const top = toon(0xffffff, { map: texClone(tex, w / rep, d / rep) });
    const side = toon(0xb7bcc9);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), [side, side, top, side, side, side]);
    m.position.set(x, 0.07, z);
    m.receiveShadow = true;
    m.castShadow = true;
    scene.add(m);
    return m;
  }
  slab(8.3, 7.9, 1.85, -2.05, swTex, 2.4);     // 主街区 + 店前人行道
  slab(1.35, 10.9, -5.32, -0.5, swTex, 2.4);    // 西路绿化带

  // 路缘石
  B(0.14, 0.17, 7.9, M.curb, -2.37, 0.085, -2.05, { out: 1 });
  B(8.3, 0.17, 0.14, M.curb, 1.85, 0.085, 1.97, { out: 1 });
  B(0.14, 0.17, 10.9, M.curb, -4.66, 0.085, -0.5, { out: 1 });
  B(11.6, 0.12, 0.10, M.curb, 0.2, 0.06, 5.94, { cast: false });

  // 排水沟 + 格栅
  B(8.3, 0.02, 0.26, toon(0x1a2030), 1.85, 0.014, 2.12, { cast: false });
  B(0.26, 0.02, 7.9, toon(0x1a2030), -2.52, 0.014, -2.05, { cast: false });
  const grateMat = new THREE.MeshBasicMaterial({ map: grateTex });
  for (let i = 0; i < 5; i++) PLANE(0.64, 0.26, grateMat, -0.5 + i * 1.55, 0.018, 2.12, { recv: false });
  for (let i = 0; i < 4; i++) PLANE(0.26, 0.64, grateMat, -2.52, 0.018, -3.4 + i * 1.5, { recv: false });
  PLANE(0.9, 0.3, grateMat, 3.4, 0.018, 0.25, { recv: false });

  // 标线
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xdfe6ef, transparent: true, opacity: 0.8, depthWrite: false });
  const lineWorn = new THREE.MeshBasicMaterial({ color: 0xd6dde8, transparent: true, opacity: 0.55, depthWrite: false });
  const line = (w, d, x, z, mat = lineMat) => PLANE(w, d, mat, x, 0.012, z, { recv: false });

  for (let i = 0; i < 6; i++) line(1.72, 0.40, -1.25, 2.12 + i * 0.68, lineWorn); // 斑马线
  line(2.6, 0.16, -3.65, 4.36, lineWorn);   // 停止线
  for (let i = 0; i < 5; i++) line(0.62, 0.10, -5.6 + i * 1.55, 3.98); // 中央虚线
  // 停车位
  line(0.10, 2.30, 0.20, 3.25);
  line(0.10, 2.30, 2.05, 3.25);
  line(0.10, 2.30, 3.90, 3.25);
  line(3.80, 0.10, 2.05, 2.12);
  line(3.80, 0.10, 2.05, 4.36);

  line(11.7, 0.10, 0.2, 5.80);
  line(0.10, 11.7, -5.78, 0.1);
  // 路面「止まれ」白漆
  const roadStopTex = canvasTex(256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(226,234,244,0.88)';
    g.font = `bold 152px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('止', w / 2, 110);
    g.fillText('ま', w / 2, 268);
    g.fillText('れ', w / 2, 426);
  });
  const roadStopMat = new THREE.MeshBasicMaterial({
    map: roadStopTex, transparent: true, depthWrite: false,
  });
  PLANE(1.15, 2.30, roadStopMat, -3.55, 0.013, 3.05, { recv: false });

  // 直行箭头
  (function arrow() {
    const mat = lineMat;
    PLANE(0.22, 1.5, mat, 1.05, 0.012, 4.62, { recv: false });
    const head = new THREE.Mesh(new THREE.CircleGeometry(0.42, 3), mat);
    head.rotation.x = -Math.PI / 2;
    head.rotation.z = Math.PI;
    head.position.set(1.05, 0.012, 3.92);
    scene.add(head);
  })();

  const manholeMat = new THREE.MeshBasicMaterial({ map: manholeTex });
  for (const [mx, mz] of [[0.55, 4.42], [-4.2, 2.6], [-1.9, -0.6]]) {
    const mh = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), manholeMat);
    mh.rotation.x = -Math.PI / 2;
    mh.position.set(mx, 0.014, mz);
    scene.add(mh);
  }

  /* ---------------------------------------------------------
     4. 便利店
     --------------------------------------------------------- */
  const ST = { x0: -1.1, x1: 2.9, z0: -4.6, z1: 0.6, top: 3.54 };
  const store = new THREE.Group();
  scene.add(store);
  setP(store);

  // 后墙 / 右墙 / 左墙
  B(4.0, 3.40, 0.18, M.wall, 0.9, 1.84, -4.51, { out: 1 });
  B(0.18, 3.40, 5.2, M.wall, 2.81, 1.84, -2.0, { out: 1 });
  B(0.18, 3.40, 1.1, M.wall, -1.01, 1.84, -4.05, { out: 1 });
  B(0.18, 1.06, 5.2, M.wall, -1.01, 3.01, -2.0, { out: 1 });   // 左楣
  B(0.20, 0.55, 5.2, M.trim, -1.00, 0.415, -2.0, { out: 1 });  // 左裙
  // 前墙楣 / 裙
  B(4.0, 1.06, 0.18, M.wall, 0.9, 3.01, 0.51, { out: 1 });
  B(4.0, 0.55, 0.18, M.trim, 0.9, 0.415, 0.51, { out: 1 });
  // 角柱
  B(0.18, 1.79, 0.18, M.white, -1.05, 1.585, 0.55, { out: 1 });
  B(0.18, 1.79, 0.18, M.white, 2.85, 1.585, 0.55, { out: 1 });

  // 顶板 + 女儿墙
  B(4.16, 0.20, 5.36, M.roof, 0.9, 3.64, -2.0, { out: 1 });
  B(4.16, 0.22, 0.10, M.trim, 0.9, 3.85, -4.63, { out: 1 });
  B(0.10, 0.22, 5.36, M.trim, -1.13, 3.85, -2.0, { out: 1 });
  B(0.10, 0.22, 5.36, M.trim, 2.93, 3.85, -2.0, { out: 1 });
  B(4.16, 0.16, 0.10, M.trim, 0.9, 3.82, 0.63, { out: 1 });

  // 玻璃
  const glassPane = (w, h, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.renderOrder = 3;
    store.add(m);
    return m;
  };
  glassPane(1.58, 1.79, -0.26, 1.585, 0.575);
  glassPane(1.08, 1.79, 2.30, 1.585, 0.575);
  glassPane(4.00, 1.79, -1.085, 1.585, -1.48, Math.PI / 2);

  // 玻璃反光（两条斜向窄反光带，不要糊成一整片白）
  const sheenTex = canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.save();
    g.translate(w / 2, h / 2);
    g.rotate(-0.62);
    const band = (cx, bw, a0) => {
      const gr = g.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
      gr.addColorStop(0.00, 'rgba(196,226,255,0)');
      gr.addColorStop(0.40, `rgba(222,242,255,${(a0 * 0.55).toFixed(3)})`);
      gr.addColorStop(0.50, `rgba(255,255,255,${a0.toFixed(3)})`);
      gr.addColorStop(0.60, `rgba(222,242,255,${(a0 * 0.55).toFixed(3)})`);
      gr.addColorStop(1.00, 'rgba(196,226,255,0)');
      g.fillStyle = gr;
      g.fillRect(cx - bw / 2, -h, bw, h * 2);
    };
    band(-46, 30, 0.62);
    band(24, 13, 0.40);
    band(64, 6, 0.28);
    g.restore();
  });
  const sheenMat = new THREE.MeshBasicMaterial({
    map: sheenTex, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  for (const [w, x, z, ry] of [[1.58, -0.26, 0.582, 0], [1.08, 2.30, 0.582, 0], [4.0, -1.092, -1.48, Math.PI / 2]]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.79), sheenMat);
    s.position.set(x, 1.585, z);
    s.rotation.y = ry;
    s.renderOrder = 4;
    store.add(s);
  }

  // 竖梃
  const mull = (x, z) => B(0.09, 1.83, 0.11, M.white, x, 1.585, z, { out: 1 });
  [-0.20, 0.55, 1.75].forEach((x) => mull(x, 0.575));
  [-3.50, -2.40, -1.30, -0.20].forEach((z) => B(0.11, 1.83, 0.09, M.white, -1.05, 1.585, z, { out: 1 }));
  // 横梃
  B(4.0, 0.08, 0.11, M.white, 0.9, 2.40, 0.575, { out: 1 });
  B(0.11, 0.08, 5.2, M.white, -1.05, 2.40, -2.0, { out: 1 });

  // 自动门
  B(1.30, 0.12, 0.14, M.steel, 1.15, 2.44, 0.575, { out: 1 });
  B(0.10, 1.80, 0.14, M.steel, 0.55, 1.60, 0.575, { out: 1 });
  B(0.10, 1.80, 0.14, M.steel, 1.75, 1.60, 0.575, { out: 1 });
  function doorLeaf(gx, gy, gz, ry, dir) {
    withG(gx, gy, gz, ry, (dg) => {
      const cx = dir * 0.28;
      B(0.05, 1.75, 0.07, M.steel, cx - 0.26, 1.565, 0, { out: 1 });
      B(0.05, 1.75, 0.07, M.steel, cx + 0.26, 1.565, 0, { out: 1 });
      B(0.56, 0.06, 0.07, M.steel, cx, 2.42, 0, { out: 1 });
      B(0.56, 0.26, 0.07, M.steel, cx, 0.82, 0, { out: 1 });
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 1.42), M.glass);
      pane.position.set(cx, 1.63, 0.045);
      pane.renderOrder = 3;
      dg.add(pane);
      const pane2 = pane.clone();
      pane2.position.set(cx, 1.63, -0.045);
      pane2.rotation.y = Math.PI;
      dg.add(pane2);
      B(0.04, 0.34, 0.05, M.darkSteel, cx + dir * 0.20, 1.15, 0.06, { cast: false });
    }, store);
  }
  doorLeaf(0.62, 0, 0.56, 0, 1);
  doorLeaf(1.70, 0, 0.50, -0.42, -1);

  // 自动门贴纸
  const doorSticker = canvasTex(128, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#e8405c';
    roundRect(g, 4, 12, 120, 40, 8);
    g.fill();
    g.fillStyle = '#fff';
    g.font = `bold 24px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('自動ドア', w / 2, h / 2 + 1);
  });
  const sticker = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), new THREE.MeshBasicMaterial({
    map: doorSticker, transparent: true, depthWrite: false,
  }));
  sticker.position.set(0.90, 1.05, 0.615);
  store.add(sticker);

  // 西墙细节
  CYL(0.055, 0.055, 3.3, 8, toon(0x7d828c), -1.13, 1.86, -4.30);
  B(0.10, 0.05, 0.05, M.darkSteel, -1.13, 0.45, -4.30, { cast: false });
  B(0.10, 0.05, 0.05, M.darkSteel, -1.13, 2.90, -4.30, { cast: false });
  B(0.14, 0.22, 0.34, toon(0x9aa0ac), -1.14, 2.62, -3.05, { out: 1 });
  B(0.10, 0.14, 0.26, toon(0x5b6270), -1.16, 1.02, -3.90, { cast: false });
  // 壁灯
  B(0.18, 0.10, 0.30, M.darkSteel, -1.16, 2.28, -0.62, { out: 1 });
  B(0.12, 0.04, 0.24, M.warmLight, -1.16, 2.21, -0.62, { cast: false });
  glow(0xffcf9b, 1.1, -1.20, 2.18, -0.62, 0.34, store);

  // 招牌
  const signMat = toon(0xffffff, {
    map: fasciaTex, emissive: 0xffffff, emissiveMap: fasciaTex, emissiveIntensity: 0.62,
  });
  B(4.06, 0.90, 0.07, M.trim, 0.9, 3.00, 0.63, { out: 1 });
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(3.94, 0.78), signMat);
  signFace.position.set(0.9, 3.00, 0.673);
  store.add(signFace);

  // 雨棚
  withG(0.9, 2.50, 0.6, 0, () => {
    B(4.10, 0.09, 0.62, toon(0x8a8171), 0, 0.04, 0.32, { out: 1 });
    B(4.10, 0.18, 0.07, toon(0x776f5f), 0, -0.06, 0.61, { out: 1 });
    for (let i = 0; i < 3; i++) {
      CYL(0.075, 0.075, 0.03, 12, M.warmLight, -1.2 + i * 1.2, -0.02, 0.36, { cast: false });
      glow(0xffcf9b, 0.8, -1.2 + i * 1.2, -0.08, 0.36, 0.38, store);
    }
  }, store);

  // 屋顶灯箱（立在女儿墙上，正对街角）
  {
    const roofSignTex = canvasTex(1024, 320, (g, w, h) => {
      g.fillStyle = '#f2f7f1';
      g.fillRect(0, 0, w, h);
      // 上下绿边
      g.fillStyle = '#1f7f52';
      g.fillRect(0, 0, w, 26);
      g.fillRect(0, h - 30, w, 30);
      // 左侧色块
      g.fillStyle = '#1f7f52';
      roundRect(g, 34, 62, 190, 190, 26);
      g.fill();
      g.fillStyle = '#eafaf0';
      g.font = `bold 150px ${JP}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('ほ', 129, 162);
      // 店名
      g.fillStyle = '#1d3a2c';
      g.font = `bold 108px ${JP}`;
      g.textAlign = 'left';
      g.fillText('ほっとマート', 262, 148);
      g.fillStyle = '#2f7d58';
      g.font = `bold 46px ${JP}`;
      g.fillText('SAKURAMACHI 1-2-3', 266, 226);
      // 24H 标签
      g.fillStyle = '#e8405c';
      roundRect(g, 812, 64, 168, 84, 14);
      g.fill();
      g.fillStyle = '#fff';
      g.font = `bold 58px ${JP}`;
      g.textAlign = 'center';
      g.fillText('24H', 896, 108);
      g.fillStyle = '#4b6a58';
      g.font = `bold 34px ${JP}`;
      g.fillText('OPEN', 896, 214);
    });
    // 灯箱用 basic 材质：不受光照影响，图案完全按设计稿呈现
    const boxMat = new THREE.MeshBasicMaterial({ map: roofSignTex });
    const frameMat = toon(0x2f3644);
    // 整体朝街角斜一点，默认视角下正面可读
    withG(0.15, 4.02, 0.30, -0.42, () => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.50, 0.80, 0.16), [
        frameMat, frameMat, frameMat, frameMat, boxMat, boxMat,
      ]);
      box.position.set(0, 0.86, 0);
      box.castShadow = true;
      box.receiveShadow = false;
      getP().add(box);
      // 上下压条
      B(2.64, 0.07, 0.22, frameMat, 0, 0.48, 0, { cast: false });
      B(2.64, 0.07, 0.22, frameMat, 0, 1.24, 0, { cast: false });
      // 支腿
      B(0.09, 0.42, 0.09, frameMat, -0.74, 0.21, 0, { out: 1 });
      B(0.09, 0.42, 0.09, frameMat, 0.74, 0.21, 0, { out: 1 });
    });
    glow(0x9dffd0, 2.8, 0.15, 4.88, 0.48, 0.22);
  }

  // 屋顶设备
  withG(0.9, 3.74, -2.0, 0, () => {
    B(0.9, 0.52, 0.68, M.steel, -0.9, 0.26, -0.7, { out: 1 });
    B(0.82, 0.06, 0.60, toon(0x8e9aad), -0.9, 0.55, -0.7, { cast: false });
    CYL(0.30, 0.30, 0.07, 14, M.steel, -0.9, 0.58, -0.7, { cast: false });
    CYL(0.10, 0.10, 0.95, 8, M.darkSteel, 1.4, 0.48, -1.6, { out: 1 });
    CYL(0.08, 0.08, 0.70, 8, M.darkSteel, 1.65, 0.35, -1.9, { out: 1 });
    B(0.55, 0.55, 0.55, M.concrete, 0.95, 0.28, 1.4, { out: 1 });
    B(0.70, 0.10, 0.70, M.concrete, 0.95, 0.58, 1.4, { cast: false });
    BAR([-1.5, 0, 0.9], [-1.5, 1.5, 0.9], 0.02, M.darkSteel);
    BAR([-1.7, 1.35, 0.9], [-1.3, 1.35, 0.9], 0.015, M.darkSteel);
    BAR([-1.5, 1.1, 0.9], [-1.5, 1.1, 1.05], 0.015, M.darkSteel);
  }, store);

  /* ---- 店内（卖场进深 2.1m，正对橱窗） ---- */
  setP(store);
  PLANE(3.9, 5.1, toon(0xa89c85), 0.9, 0.155, -2.0);
  PLANE(3.9, 5.1, toon(0xe6dcc4, { emissive: 0xffe6bc, emissiveIntensity: 0.5 }), 0.9, 3.46, -2.0, { rx: Math.PI / 2 });
  B(2.9, 0.06, 0.15, M.warmLight, 0.9, 3.41, -0.55, { cast: false });
  B(2.9, 0.06, 0.15, M.warmLight, 0.9, 3.41, -1.30, { cast: false });

  // 店内暖光团（透过橱窗形成发光感）
  glow(0xffcf9b, 3.8, 0.90, 1.55, -0.55, 0.30, store);
  glow(0xffd9a8, 2.2, 2.35, 1.45, -0.50, 0.24, store);
  glow(0xffd9a8, 2.6, -1.85, 1.55, -1.90, 0.22, store);

  // 卖场后隔墙
  B(3.9, 3.36, 0.12, M.wall, 0.9, 1.83, -1.72, { out: 1, cast: false });
  // 冰柜墙
  const fridgeMat = toon(0xffffff, {
    map: fridgeTex, emissive: 0xffffff, emissiveMap: fridgeTex, emissiveIntensity: 0.55,
  });
  const fridge = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.26), fridgeMat);
  fridge.position.set(0.9, 1.30, -1.655);
  store.add(fridge);
  B(3.66, 0.09, 0.12, M.steel, 0.9, 2.46, -1.66, { cast: false });
  B(3.66, 0.10, 0.12, M.steel, 0.9, 0.13, -1.66, { cast: false });

  // 中岛货架
  const shelfBody = toon(0xa89e8a);
  const shelfTop = toon(0xc2b79e);
  const gx0 = -0.52;
  B(0.74, 0.10, 1.12, shelfBody, gx0, 0.21, -1.05, { out: 1 });
  B(0.70, 0.06, 1.06, shelfBody, gx0, 0.60, -1.05, { cast: false });
  B(0.70, 0.06, 1.06, shelfBody, gx0, 0.98, -1.05, { cast: false });
  B(0.06, 0.90, 1.06, shelfTop, gx0, 0.60, -1.05, { cast: false });

  // 收银台
  B(0.82, 0.94, 1.62, toon(0xbfb49c), 2.42, 0.62, -0.62, { out: 1 });
  B(0.88, 0.06, 1.68, toon(0xd8cdb4), 2.42, 1.11, -0.62, { cast: false });
  B(0.34, 0.24, 0.30, M.darkSteel, 2.40, 1.26, -0.25, { out: 1 });
  B(0.30, 0.22, 0.03, toon(0x9fe8ff, { emissive: 0x6fd8ff, emissiveIntensity: 0.8 }), 2.38, 1.47, -0.25, { rx: -0.3, cast: false });
  B(0.40, 0.36, 0.60, M.glassDark, 2.30, 1.32, -1.15, { out: 1 });
  B(0.42, 0.05, 0.62, M.steel, 2.30, 1.14, -1.15, { cast: false });
  B(0.30, 1.10, 1.30, toon(0x9b9280), 2.76, 1.62, -0.62, { cast: false });

  // 吊牌
  for (let i = 0; i < 3; i++) {
    B(0.54, 0.26, 0.02, toon(0xffffff, { emissive: 0xfff0d8, emissiveIntensity: 0.45 }), -0.55, 2.92, -0.35 - i * 0.55, { cast: false });
  }

  // 商品
  const prodColors = [0xef6a5a, 0xf2c14e, 0x64b878, 0x5aa8e0, 0xe8e3d5, 0xc76ad0, 0xf08fb0];
  const prodGroups = new Map();
  function addProd(x, y, z, c, sx = 0.12, sy = 0.18, sz = 0.10, ry = 0) {
    if (!prodGroups.has(c)) prodGroups.set(c, []);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
      new THREE.Vector3(sx, sy, sz),
    );
    prodGroups.get(c).push(m);
  }
  for (const sy of [0.28, 0.66, 1.04]) {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 2; j++) {
        if (Math.random() < 0.1) continue;
        addProd(gx0 - 0.18 + j * 0.36, sy + 0.09, -1.50 + i * 0.12, pick(prodColors), 0.13, 0.17, 0.10, rnd(-0.12, 0.12));
      }
    }
  }
  // 靠窗矮架
  B(1.20, 0.70, 0.30, toon(0xa89e8a), 0.05, 0.49, 0.22, { out: 1, cast: false });
  for (let i = 0; i < 7; i++) {
    B(0.14, 0.24, 0.02, toon(pick([0xe8607a, 0x5aa8e0, 0xf0c04a, 0x7ac88a, 0xd8c8f0])), -0.48 + i * 0.17, 0.76, 0.38, { cast: false });
  }
  for (let i = 0; i < 21; i++) {
    addProd(2.62, 1.25 + Math.floor(i / 7) * 0.22, -1.10 + (i % 7) * 0.14, pick(prodColors), 0.09, 0.13, 0.06);
  }

  prodGroups.forEach((list, color) => {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), toon(color, { emissive: color, emissiveIntensity: 0.1 }), list.length);
    list.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    store.add(mesh);
  });

  /* ---------------------------------------------------------
     5. 后巷
     --------------------------------------------------------- */
  setP(scene);
  B(1.0, 0.02, 5.2, toon(0x8c909e), 3.4, 0.152, -2.0, { cast: false });
  B(1.0, 3.0, 0.20, M.oldWall, 3.4, 1.64, -4.50, { out: 1 });

  // 墙面管道
  for (let i = 0; i < 3; i++) {
    CYL(0.042, 0.042, 3.1, 8, toon(i === 1 ? 0x7a6a5a : 0x6b7280), 2.94 + i * 0.05, 1.69, -3.9);
  }
  for (let i = 0; i < 4; i++) B(0.14, 0.04, 0.05, M.darkSteel, 3.00, 0.74 + i * 0.7, -3.9, { cast: false });

  // 空调
  B(0.52, 0.42, 0.30, toon(0xd8d3c4), 3.72, 1.69, -2.6, { out: 1 });
  B(0.46, 0.36, 0.03, toon(0x9aa0ac), 3.72, 1.69, -2.44, { cast: false });
  withG(3.62, 0.14, -1.35, 0, () => {
    B(0.40, 0.56, 0.72, toon(0xd5d0c2), 0, 0.28, 0, { out: 1 });
    CYL(0.19, 0.19, 0.04, 14, toon(0x8d93a0), -0.21, 0.30, 0, { rz: Math.PI / 2, cast: false });
    B(0.42, 0.05, 0.74, toon(0xb5b0a4), 0, 0.56, 0, { cast: false });
  });

  // 啤酒筐 / 垃圾袋
  for (let i = 0; i < 3; i++) {
    B(0.44, 0.24, 0.32, toon(i % 2 ? 0xc4402f : 0xe0c040), 3.35, 0.26 + i * 0.25, -3.65, { out: 1, ry: 0.1 * i });
  }
  B(0.40, 0.22, 0.30, toon(0x2f6fb0), 3.38, 0.25, -3.28, { out: 1, ry: -0.2 });
  for (let i = 0; i < 4; i++) {
    SPH(0.16, toon(0xd8dde4), 3.55 + rnd(-0.08, 0.08), 0.30, -0.55 + i * 0.17, {
      sx: 1.15, sy: 0.85, sz: 0.95, out: 1, seg: 10, seg2: 8,
    });
  }

  // 挂灯
  BAR([3.4, 3.16, -0.95], [3.4, 2.56, -0.95], 0.012, M.blackMetal, { cast: false });
  CYL(0.07, 0.05, 0.12, 10, M.warmLight, 3.4, 2.50, -0.95, { out: 1 });
  glow(0xffd9a0, 1.7, 3.4, 2.48, -0.95, 0.5);

  // 立入禁止
  const noEntry = canvasTex(128, 96, (g, w, h) => {
    g.fillStyle = '#f4f2ea';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c8402f';
    g.lineWidth = 5;
    g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#c8402f';
    g.font = `bold 19px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('関係者以外', w / 2, 34);
    g.fillText('立入禁止', w / 2, 64);
  });
  const ne = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.27), new THREE.MeshBasicMaterial({ map: noEntry }));
  ne.position.set(2.93, 1.94, -2.4);
  ne.rotation.y = Math.PI / 2;
  scene.add(ne);

  /* ---------------------------------------------------------
     6. 隔壁小楼
     --------------------------------------------------------- */
  B(2.0, 5.6, 5.5, M.oldWall, 4.9, 2.94, -1.85, { out: 1 });
  // 门
  B(0.74, 2.05, 0.10, toon(0x3b3230), 4.60, 1.16, 0.90, { out: 1 });
  B(0.62, 1.90, 0.04, toon(0x6a4a3a), 4.60, 1.16, 0.96, { cast: false });
  B(0.30, 0.40, 0.03, toon(0xffd9a0, { emissive: 0xffb060, emissiveIntensity: 0.9 }), 4.60, 1.74, 0.98, { cast: false });
  B(1.10, 0.07, 0.55, M.darkSteel, 4.60, 2.30, 1.16, { out: 1, rx: -0.06 });

  // 红灯笼
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), toon(0xff6a5a, {
    emissive: 0xff3a2a, emissiveIntensity: 1.1,
  }));
  lantern.scale.set(1, 1.35, 1);
  lantern.position.set(5.20, 2.05, 1.14);
  scene.add(lantern);
  CYL(0.05, 0.05, 0.05, 8, M.darkSteel, 5.20, 2.31, 1.14, { cast: false });
  glow(0xff6a4a, 0.7, 5.20, 2.05, 1.14, 0.3);

  // 竖招牌
  const vSignTex = canvasTex(160, 900, (g, w, h) => {
    g.fillStyle = '#c8202f';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffe9c9';
    g.fillRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#c8202f';
    g.font = `bold 74px ${JP}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    ['ス', 'ナ', 'ッ', 'ク'].forEach((c, i) => g.fillText(c, w / 2, 92 + i * 92));
    g.fillStyle = '#2a2f3d';
    g.font = `bold 68px ${JP}`;
    g.fillText('夢', w / 2, 520);
    g.fillStyle = '#c8202f';
    g.font = `bold 30px ${JP}`;
    g.fillText('SNACK', w / 2, 712);
    g.fillText('OPEN', w / 2, 762);
  });
  const vSignMat = toon(0xffffff, {
    map: vSignTex, emissive: 0xffffff, emissiveMap: vSignTex, emissiveIntensity: 1.0,
  });
  const vSign = new THREE.Mesh(new THREE.BoxGeometry(0.44, 2.55, 0.14), [
    toon(0x8a1a24), toon(0x8a1a24), toon(0x8a1a24), toon(0x8a1a24), vSignMat, vSignMat,
  ]);
  vSign.position.set(4.55, 3.69, 1.02);
  scene.add(vSign);
  outline(vSign);
  glow(0xff5566, 1.7, 4.55, 3.69, 1.12, 0.34);

  // 窗
  const winLit = toon(0xffe2b8, { emissive: 0xffb466, emissiveIntensity: 0.55 });
  const winDark = toon(0x2c3444, { emissive: 0x1a2430, emissiveIntensity: 0.4 });
  B(0.9, 0.8, 0.08, winLit, 4.45, 3.19, 0.92, { out: 1 });
  B(0.66, 0.7, 0.06, winDark, 5.42, 3.19, 0.92, { out: 1 });
  B(0.8, 0.7, 0.08, winDark, 4.60, 4.69, 0.92, { out: 1 });
  B(0.55, 0.55, 0.08, winLit, 5.42, 4.69, 0.92, { out: 1 });
  B(0.5, 0.4, 0.3, toon(0xcfcabc), 5.55, 2.79, 1.05, { out: 1 });
  CYL(0.055, 0.055, 5.4, 8, toon(0x7d828c), 3.96, 2.84, 0.95);
  CYL(0.055, 0.055, 5.4, 8, toon(0x7d828c), 5.84, 2.84, 0.95);
  CYL(0.36, 0.36, 0.72, 14, toon(0xb8bcc6), 5.2, 6.10, -3.6, { out: 1 });
  BAR([4.2, 5.74, -3.2], [4.2, 7.14, -3.2], 0.02, M.darkSteel);
  BAR([4.05, 6.99, -3.2], [4.35, 6.99, -3.2], 0.014, M.darkSteel);
  BAR([4.2, 6.69, -3.2], [4.2, 6.69, -3.05], 0.014, M.darkSteel);

  /* ---------------------------------------------------------
     7. 街角道具
     --------------------------------------------------------- */

  // 竖招牌灯柱
  CYL(0.20, 0.24, 0.10, 12, M.concrete, -1.58, 0.19, 0.95, { out: 1 });
  B(0.15, 2.15, 0.15, M.steel, -1.58, 1.22, 0.95, { out: 1 });
  const pylonMat = toon(0xffffff, {
    map: pylonTex, emissive: 0xffffff, emissiveMap: pylonTex, emissiveIntensity: 0.95,
  });
  const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.82, 0.20), [
    toon(0xe8e4d8), toon(0xe8e4d8), toon(0xe8e4d8), toon(0xe8e4d8), pylonMat, pylonMat,
  ]);
  pylon.position.set(-1.58, 3.60, 0.95);
  pylon.rotation.y = 0.10;
  scene.add(pylon);
  outline(pylon);
  glow(0x9dffc8, 3.2, -1.58, 3.60, 1.12, 0.38);
  glow(0xfff0cf, 1.6, -1.58, 2.45, 1.02, 0.26);

  // 自动贩卖机（面朝 -X）
  const vendMat = toon(0xffffff, {
    map: vendTex, emissive: 0xffffff, emissiveMap: vendTex, emissiveIntensity: 0.8,
  });
  for (const z of [-0.85, -1.95]) {
    B(0.70, 1.92, 0.96, toon(0xb01c30), -1.45, 1.10, z, { out: 1 });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.90, 1.80), vendMat);
    f.position.set(-1.805, 1.12, z);
    f.rotation.y = -Math.PI / 2;
    scene.add(f);
    B(0.72, 0.06, 0.98, toon(0x8e1424), -1.45, 2.08, z, { out: 1 });
    glow(0xbfe8ff, 1.9, -1.86, 1.20, z, 0.32);
    glow(0xffb0b8, 1.0, -1.84, 2.02, z, 0.2);
  }

  // 公告栏
  withG(-1.24, 0.14, -3.35, -Math.PI / 2, (bg) => {
    B(0.06, 1.00, 0.06, M.darkSteel, -0.52, 0.50, 0, { out: 1 });
    B(0.06, 1.00, 0.06, M.darkSteel, 0.52, 0.50, 0, { out: 1 });
    B(1.30, 0.92, 0.06, toon(0x8a6a44), 0, 1.22, 0, { out: 1 });
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.80), new THREE.MeshBasicMaterial({ map: boardTex }));
    bd.position.set(0, 1.22, 0.04);
    bg.add(bd);
    B(1.38, 0.06, 0.16, toon(0x6a5236), 0, 1.72, 0.02, { out: 1 });
  });

  // 自行车
  function buildBike(x, y, z, ry, scale = 1) {
    withG(x, y, z, ry, (g) => {
      const frame = toon(0x5b6b8c);
      const dark = toon(0x2b3242);
      const chrome = toon(0xb8c0cc);
      g.scale.setScalar(scale);
      for (const wx of [-0.52, 0.52]) {
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.028, 8, 22), dark);
        tire.position.set(wx, 0.31, 0);
        tire.castShadow = true;
        g.add(tire);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.012, 6, 20), chrome);
        rim.position.set(wx, 0.31, 0);
        g.add(rim);
        for (let s = 0; s < 4; s++) {
          const a = (s / 4) * Math.PI;
          BAR([wx - Math.cos(a) * 0.25, 0.31 - Math.sin(a) * 0.25, 0],
            [wx + Math.cos(a) * 0.25, 0.31 + Math.sin(a) * 0.25, 0], 0.006, chrome, { cast: false, p: g });
        }
      }
      BAR([-0.52, 0.31, 0], [-0.06, 0.62, 0], 0.022, frame, { p: g });
      BAR([-0.06, 0.62, 0], [0.10, 0.72, 0], 0.022, frame, { p: g });
      BAR([0.10, 0.72, 0], [0.42, 0.30, 0], 0.020, frame, { p: g });
      BAR([-0.06, 0.62, 0], [0.30, 0.30, 0], 0.018, frame, { p: g });
      BAR([0.30, 0.30, 0], [0.42, 0.30, 0], 0.016, frame, { p: g });
      BAR([-0.06, 0.62, 0], [-0.52, 0.31, 0], 0.014, frame, { p: g });
      BAR([0.02, 0.66, 0], [0.02, 0.86, 0], 0.02, chrome, { p: g });
      B(0.24, 0.06, 0.12, dark, 0.02, 0.89, 0, { out: 1 });
      BAR([0.42, 0.30, 0], [0.40, 0.78, 0], 0.02, chrome, { p: g });
      BAR([0.40, 0.78, -0.16], [0.40, 0.78, 0.16], 0.016, chrome, { p: g });
      B(0.26, 0.20, 0.26, toon(0x9aa4b4), 0.56, 0.66, 0, { out: 1 });
      B(0.34, 0.03, 0.20, chrome, -0.30, 0.52, 0, { cast: false });
      B(0.34, 0.03, 0.10, dark, -0.52, 0.60, 0, { rz: 0.1, cast: false });
      B(0.30, 0.03, 0.10, dark, 0.50, 0.58, 0, { rz: -0.1, cast: false });
      BAR([-0.18, 0.06, 0.02], [-0.10, 0.30, 0.06], 0.012, chrome, { p: g });
    });
  }
  buildBike(-1.02, 0.14, 1.36, Math.PI * 0.55, 0.95);
  buildBike(3.24, 0.14, -1.70, Math.PI * 0.5 + 0.1, 0.9);

  // 轻型车（停在路侧车位）
  withG(3.45, 0.02, 3.62, Math.PI / 2 + 0.04, (cg) => {
    cg.scale.setScalar(0.94);
    const body = toon(0x516f9a);
    const bodyDark = toon(0x3b5175);
    const winMat = toon(0x152232, { emissive: 0x0d1826, emissiveIntensity: 0.6 });
    const chrome = toon(0x9aa6b8);
    // 车身
    B(3.34, 0.74, 1.62, body, 0, 0.66, 0, { out: 1 });
    B(3.10, 0.20, 1.66, bodyDark, 0, 0.34, 0, { out: 1 });
    // 车厢
    B(2.16, 0.70, 1.54, body, -0.16, 1.30, 0, { out: 1 });
    B(2.02, 0.06, 1.46, bodyDark, -0.16, 1.66, 0, { out: 1 });
    // 玻璃带
    B(2.04, 0.44, 1.58, winMat, -0.16, 1.30, 0, { cast: false });
    B(0.42, 0.52, 1.44, winMat, 0.96, 1.26, 0, { cast: false, rz: 0.36 });
    B(0.34, 0.50, 1.42, winMat, -1.24, 1.26, 0, { cast: false, rz: -0.30 });
    // 前后保险杠 / 灯
    B(0.16, 0.26, 1.56, bodyDark, 1.66, 0.52, 0, { out: 1 });
    B(0.16, 0.26, 1.56, bodyDark, -1.66, 0.52, 0, { out: 1 });
    B(0.06, 0.14, 0.34, toon(0xfff0c8, { emissive: 0xffd88a, emissiveIntensity: 1.3 }), 1.68, 0.72, 0.52, { cast: false });
    B(0.06, 0.14, 0.34, toon(0xfff0c8, { emissive: 0xffd88a, emissiveIntensity: 1.3 }), 1.68, 0.72, -0.52, { cast: false });
    B(0.06, 0.16, 0.30, toon(0xff8a94, { emissive: 0xff2a44, emissiveIntensity: 1.5 }), -1.68, 0.74, 0.56, { cast: false });
    B(0.06, 0.16, 0.30, toon(0xff8a94, { emissive: 0xff2a44, emissiveIntensity: 1.5 }), -1.68, 0.74, -0.56, { cast: false });
    glow(0xffb0b8, 0.8, -1.72, 0.74, 0.56, 0.35);
    // 车轮
    for (const wx of [-1.02, 1.02]) {
      for (const wz of [-0.74, 0.74]) {
        CYL(0.31, 0.31, 0.20, 14, toon(0x1c2230), wx, 0.31, wz, { rx: Math.PI / 2, out: 1 });
        CYL(0.15, 0.15, 0.21, 10, chrome, wx, 0.31, wz, { rx: Math.PI / 2, cast: false });
      }
    }
    // 后视镜 / 雨刷
    B(0.14, 0.08, 0.14, bodyDark, 0.86, 1.34, 0.84, { out: 1 });
    B(0.14, 0.08, 0.14, bodyDark, 0.86, 1.34, -0.84, { out: 1 });
    B(0.60, 0.02, 0.02, toon(0x2b3242), 0.72, 1.06, 0.2, { rz: 0.3, cast: false });
    // 车顶湿光
    const roofGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.2), new THREE.MeshBasicMaterial({
      map: smearTex, color: 0x9fd0ff, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    roofGlow.rotation.x = -Math.PI / 2;
    roofGlow.position.set(-0.16, 1.69, 0);
    cg.add(roofGlow);
  });

  // 立式看板
  withG(2.02, 0.14, 1.60, 0.55, (ag) => {
    B(0.62, 0.86, 0.05, toon(0xf2efe6), 0, 0.55, 0.10, { out: 1, rx: 0.16 });
    B(0.62, 0.86, 0.05, toon(0xe6e2d6), 0, 0.55, -0.10, { out: 1, rx: -0.16 });
    const afTex = canvasTex(256, 360, (g, w, h) => {
      g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2f9e6c'; g.fillRect(0, 0, w, 62);
      g.fillStyle = '#fff'; g.font = `bold 34px ${JP}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('本日のおすすめ', w / 2, 32);
      g.fillStyle = '#b8442f'; g.font = `bold 62px ${JP}`;
      g.fillText('おでん', w / 2, 132);
      g.fillStyle = '#2b3140'; g.font = `bold 30px ${JP}`;
      g.fillText('70円より', w / 2, 200);
      g.fillStyle = '#ef8231'; roundRect(g, 48, 236, 160, 70, 10); g.fill();
      g.fillStyle = '#fff'; g.font = `bold 30px ${JP}`;
      g.fillText('あったか〜い', w / 2, 272);
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.78), new THREE.MeshBasicMaterial({ map: afTex }));
    face.position.set(0, 0.56, 0.15);
    face.rotation.x = 0.16;
    ag.add(face);
  });

  // 锥桶
  for (const [cx, cz] of [[3.05, 1.20], [3.45, 1.28]]) {
    withG(cx, 0.14, cz, 0, () => {
      CYL(0.03, 0.13, 0.52, 10, toon(0xd8552f), 0, 0.26, 0, { out: 1 });
      CYL(0.10, 0.11, 0.06, 10, toon(0xf0f0ea), 0, 0.24, 0, { cast: false });
      B(0.30, 0.04, 0.30, toon(0xc04b2a), 0, 0.02, 0, { out: 1 });
    });
  }

  // 垃圾桶
  const binColors = [0x3b6ea5, 0x3f8a5c, 0x9a5a3a];
  for (let i = 0; i < 3; i++) {
    withG(2.10 + i * 0.35, 0.14, 0.88, 0, () => {
      B(0.30, 0.62, 0.30, toon(binColors[i]), 0, 0.31, 0, { out: 1 });
      B(0.32, 0.06, 0.32, toon(0x2a2f3a), 0, 0.64, 0, { out: 1 });
      CYL(0.09, 0.09, 0.02, 12, toon(0x171b24), 0, 0.67, 0, { cast: false });
    });
  }

  // 雨伞架
  withG(1.72, 0.14, 1.02, 0.2, () => {
    CYL(0.19, 0.17, 0.46, 14, toon(0x505a6c), 0, 0.23, 0, { out: 1 });
    for (let i = 0; i < 4; i++) {
      const a = i * 1.6 + 0.4;
      const px = Math.cos(a) * 0.10, pz = Math.sin(a) * 0.10;
      const um = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.66, 8), toon(i % 2 ? 0x3f6aa8 : 0x9c5568));
      um.position.set(px, 0.80, pz);
      um.rotation.z = 0.10;
      um.rotation.x = 0.06;
      um.castShadow = true;
      getP().add(um);
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.30, 6), toon(0xb8c0cc));
      stick.position.set(px, 0.34, pz);
      getP().add(stick);
    }
  });

  // 门口地垫
  PLANE(1.30, 0.68, new THREE.MeshBasicMaterial({ map: matTex }), 1.15, 0.146, 1.02, { recv: false });

  // 窗贴海报
  function windowPoster(tex, w, h, x, y, z, ry = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false,
    }));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.renderOrder = 5;
    scene.add(m);
  }
  windowPoster(posters[0], 0.44, 0.66, -0.52, 1.55, 0.60);
  windowPoster(posters[1], 0.40, 0.60, 2.52, 1.66, 0.60);
  windowPoster(posters[2], 0.38, 0.57, -1.10, 1.62, -1.9, -Math.PI / 2);
  windowPoster(posters[0], 0.34, 0.51, -1.10, 1.58, -3.0, -Math.PI / 2);

  // 路灯
  withG(-2.18, 0.14, 1.70, 0, () => {
    CYL(0.075, 0.11, 4.9, 12, toon(0x39404f), 0, 2.45, 0, { out: 1 });
    CYL(0.17, 0.17, 0.14, 12, M.concrete, 0, 0.06, 0, { out: 1 });
    const curve = new THREE.CatmullRomCurve3([
      V3(0, 4.95, 0), V3(0, 5.35, 0.12), V3(0.1, 5.48, 0.55), V3(0.12, 5.45, 0.95),
    ]);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.045, 6, false), toon(0x545c6c));
    arm.castShadow = true;
    getP().add(arm);
    B(0.34, 0.12, 0.62, toon(0x3d4453), 0.12, 5.42, 1.05, { out: 1 });
    B(0.28, 0.05, 0.52, M.warmLight, 0.12, 5.34, 1.05, { cast: false });
    glow(0xffc078, 3.6, 0.12, 5.32, 1.05, 0.6);
    glow(0xffe6c0, 1.2, 0.12, 5.36, 1.05, 0.85);
  });

  // 电线杆
  const POLE = { x: 3.42, z: 1.62, h: 7.0 };
  withG(POLE.x, 0.14, POLE.z, 0, () => {
    CYL(0.115, 0.155, POLE.h, 12, toon(0x9b9fa8), 0, POLE.h / 2, 0, { out: 1 });
    for (const yy of [6.25, 6.65]) {
      B(1.30, 0.08, 0.08, toon(0x6d7280), 0, yy, 0, { out: 1 });
      for (const xx of [-0.5, 0, 0.5]) CYL(0.045, 0.05, 0.12, 8, toon(0x4a4f5c), xx, yy + 0.11, 0, { cast: false });
    }
    CYL(0.26, 0.26, 0.56, 14, toon(0x8d929c), 0, 5.55, 0.28, { out: 1 });
    B(0.16, 0.10, 0.16, M.darkSteel, 0, 5.87, 0.28, { cast: false });
    B(0.26, 0.36, 0.20, toon(0x767b86), 0, 3.85, 0.14, { out: 1 });
    CYL(0.05, 0.05, 1.0, 8, M.blackMetal, 0.02, 1.6, 0.06, { cast: false });

    // 反光镜
    BAR([0, 3.5, 0], [0, 3.5, 0.55], 0.03, M.darkSteel, { cast: false });
    const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.27, 24), toon(0x536b7d, { emissive: 0x101d26, emissiveIntensity: 0.5 }));
    mirror.position.set(0, 3.5, 0.58);
    mirror.rotation.y = -0.25;
    getP().add(mirror);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.028, 6, 24), toon(0xd9dee6));
    ring.position.copy(mirror.position);
    ring.rotation.y = -0.25;
    getP().add(ring);

    // 路牌
    const nmMat = new THREE.MeshBasicMaterial({ map: nameTex });
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.20), nmMat);
    nm.position.set(0, 2.72, 0.13);
    getP().add(nm);
    const nm2 = nm.clone();
    nm2.position.set(0, 2.72, -0.13);
    nm2.rotation.y = Math.PI;
    getP().add(nm2);
  });

  // 护栏
  function rail(x1, z1, x2, z2, h = 0.78) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const ry = Math.atan2(x2 - x1, z2 - z1);
    withG((x1 + x2) / 2, 0.14, (z1 + z2) / 2, ry, () => {
      const n = Math.max(2, Math.round(len / 1.1));
      for (let i = 0; i <= n; i++) {
        const zz = -len / 2 + (len / n) * i;
        CYL(0.042, 0.042, h, 8, toon(0xd9dee6), 0, h / 2, zz, { out: 1 });
        SPH(0.05, toon(0xd9dee6), 0, h, zz, { cast: false, seg: 8, seg2: 6 });
      }
      CYL(0.035, 0.035, len, 8, toon(0xd9dee6), 0, h - 0.09, 0, { out: 1, rx: Math.PI / 2 });
      CYL(0.028, 0.028, len, 8, toon(0xd9dee6), 0, h - 0.36, 0, { out: 1, rx: Math.PI / 2 });
    });
  }
  rail(-2.32, 1.84, -2.32, 0.55);
  rail(-4.70, 3.55, -4.70, 0.40);

  // 停车标志
  withG(3.98, 0.14, 2.10, 0, () => {
    CYL(0.035, 0.035, 1.9, 8, M.steel, 0, 0.95, 0, { out: 1 });
    const pMat = new THREE.MeshBasicMaterial({ map: pSignTex });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.44), pMat);
    p.position.set(0, 1.75, 0.03);
    getP().add(p);
    const p2 = p.clone();
    p2.position.set(0, 1.75, -0.03);
    p2.rotation.y = Math.PI;
    getP().add(p2);
  });

  // 猫
  withG(0.02, 0.14, 1.72, -0.7, () => {
    const fur = toon(0xcfc7b8);
    const dark = toon(0x4a4550);
    SPH(0.10, fur, 0, 0.10, 0, { sx: 1.0, sy: 1.05, sz: 1.35, out: 1, seg: 12, seg2: 10 });
    SPH(0.085, fur, 0, 0.235, 0.075, { out: 1, seg: 12, seg2: 10 });
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.07, 6), fur);
      ear.position.set(sx * 0.048, 0.30, 0.075);
      ear.rotation.z = -sx * 0.28;
      ear.castShadow = true;
      getP().add(ear);
      SPH(0.014, dark, sx * 0.032, 0.245, 0.152, { cast: false, seg: 6, seg2: 6 });
    }
    const curve = new THREE.CatmullRomCurve3([
      V3(0, 0.08, -0.12), V3(0.08, 0.05, -0.22), V3(0.17, 0.08, -0.20),
    ]);
    const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.022, 6, false), fur);
    tail.castShadow = true;
    getP().add(tail);
  });

  // 盆栽
  function plant(x, z, s = 1) {
    withG(x, 0.14, z, 0, () => {
      CYL(0.13 * s, 0.10 * s, 0.22 * s, 10, toon(0x8a6a52), 0, 0.11 * s, 0, { out: 1 });
      for (let i = 0; i < 4; i++) {
        SPH(0.11 * s, toon(0x3f7a52), rnd(-0.08, 0.08) * s, (0.26 + i * 0.07) * s, rnd(-0.06, 0.06) * s,
          { out: 1, seg: 10, seg2: 8 });
      }
    });
  }
  plant(-2.12, 0.42, 0.85);
  plant(3.30, 1.16, 0.78);
  plant(5.58, 1.16, 0.7);

  // 西路绿化带
  const hedgeMat = toon(0x2f5f47);
  for (let i = 0; i < 11; i++) {
    SPH(rnd(0.30, 0.36), hedgeMat, -5.82, 0.48, 3.10 - i * 0.56, {
      sx: 0.85, sy: 0.9, sz: 1, out: 0, seg: 10, seg2: 8, cast: false,
    });
  }
  function tree(x, z, s = 1) {
    withG(x, 0.14, z, 0, () => {
      CYL(0.09 * s, 0.15 * s, 1.5 * s, 8, toon(0x5a4a40), 0, 0.75 * s, 0, { out: 1 });
      SPH(0.55 * s, toon(0x2c5a42), 0, 1.85 * s, 0, { out: 1, seg: 10, seg2: 8, sy: 0.9 });
      SPH(0.42 * s, toon(0x356a4c), 0.42 * s, 1.55 * s, 0.12 * s, { out: 1, seg: 10, seg2: 8 });
      SPH(0.38 * s, toon(0x2a5340), -0.36 * s, 1.62 * s, -0.18 * s, { out: 1, seg: 10, seg2: 8 });
    });
  }
  tree(-5.30, 3.30, 0.95);

  // 西路外缘矮墙
  B(0.16, 0.42, 10.8, toon(0x6e7484), -5.94, 0.35, -0.5, { out: 1 });
  B(0.22, 0.08, 10.8, toon(0x8b92a4), -5.94, 0.58, -0.5, { cast: false });

  // 后院背景
  for (let i = 0; i < 10; i++) {
    SPH(rnd(0.28, 0.38), hedgeMat, -1.4 + i * 0.78, 0.56, -5.86, {
      sx: 1, sy: 0.85, sz: 0.75, out: 1, seg: 10, seg2: 8, cast: false,
    });
  }
  tree(-1.9, -5.35, 1.15);
  tree(0.9, -5.5, 0.95);
  tree(5.35, -5.25, 1.05);

  // 止まれ 标志（倒三角，挂在街角电杆旁）
  withG(-5.05, 0.14, 2.62, 0.30, () => {
    CYL(0.045, 0.05, 2.40, 8, toon(0x8d939f), 0, 1.20, 0, { out: 1 });
    const sp = new THREE.Mesh(
      new THREE.PlaneGeometry(0.66, 0.66),
      new THREE.MeshBasicMaterial({ map: stopTex, transparent: true, depthWrite: false }),
    );
    sp.position.set(0, 2.38, 0.03);
    sp.renderOrder = 3;
    getP().add(sp);
    const sp2 = sp.clone();
    sp2.position.set(0, 2.38, -0.03);
    sp2.rotation.y = Math.PI;
    getP().add(sp2);
    glow(0xff6a72, 0.9, 0, 2.38, 0.06, 0.22);
  });

  // 对街电线杆
  withG(-5.38, 0.14, 2.35, 0, () => {
    CYL(0.10, 0.15, 6.4, 10, toon(0x6b707c), 0, 3.2, 0, { out: 1 });
    for (const yy of [5.7, 6.05]) {
      B(1.1, 0.07, 0.07, toon(0x6d7280), 0, yy, 0, { out: 1 });
      for (const xx of [-0.42, 0, 0.42]) CYL(0.04, 0.045, 0.11, 8, toon(0x4a4f5c), xx, yy + 0.1, 0, { cast: false });
    }
  });

  // 后院
  withG(0, 0.14, 0, 0, () => {
    // 后墙门 & 灯
    B(0.80, 1.90, 0.10, toon(0x545a68), 1.9, 0.95, -4.66, { out: 1 });
    B(0.16, 0.26, 0.04, toon(0xffd9a0, { emissive: 0xffb060, emissiveIntensity: 0.7 }), 1.9, 1.72, -4.72, { cast: false });
    CYL(0.09, 0.06, 0.10, 10, M.warmLight, 1.9, 2.40, -4.75, { out: 1 });
    glow(0xffc98a, 1.3, 1.9, 2.35, -4.78, 0.38);
    // 后院围栏
    B(6.4, 0.30, 0.14, toon(0x5c6272), 2.2, 0.15, -5.80, { out: 1 });
    // 杂物
    B(0.60, 0.50, 0.40, toon(0x4a5568), 3.1, 0.25, -5.10, { out: 1, ry: 0.2 });
    B(0.50, 0.44, 0.36, toon(0x3f6b52), 3.15, 0.72, -5.12, { out: 1, ry: -0.12 });
    B(0.56, 0.40, 0.40, toon(0x7a5a3a), 0.55, 0.20, -5.05, { out: 1, ry: 0.35 });
    B(0.44, 0.34, 0.34, toon(0x8a9080), 0.48, 0.57, -5.08, { out: 1, ry: -0.2 });
  });

  // 电线
  const wireMat = toon(0x14181f);
  function wire(a, b, sag = 0.5, r = 0.016) {
    const curve = new THREE.CatmullRomCurve3([
      V3(...a),
      V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - sag, (a[2] + b[2]) / 2),
      V3(...b),
    ]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, r, 4, false), wireMat);
    m.castShadow = false;
    scene.add(m);
  }
  wire([POLE.x, 6.95, POLE.z], [-5.38, 5.95, 2.35], 0.6);
  wire([POLE.x, 6.79, POLE.z], [-5.38, 5.55, 2.35], 0.68);
  wire([POLE.x, 6.19, POLE.z], [-5.38, 5.10, 2.35], 0.76);
  wire([POLE.x, 6.79, POLE.z], [2.55, 3.90, -0.35], 0.32);
  wire([POLE.x, 6.19, POLE.z], [5.6, 6.10, -0.6], 0.3, 0.013);
  wire([POLE.x, 5.6, POLE.z], [POLE.x, 3.9, POLE.z + 0.22], 0.04, 0.012);
  wire([-5.38, 5.95, 2.35], [-5.90, 4.3, 1.2], 0.1, 0.012);

  /* ---------------------------------------------------------
     8. 湿地面 / 灯晕 / 雨
     --------------------------------------------------------- */
  function puddle(x, z, r, y) {
    const geo = new THREE.CircleGeometry(r, 22);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), py = pos.getY(i);
      if (Math.hypot(px, py) > 0.01) {
        const k = 1 + rnd(-0.16, 0.18);
        pos.setXY(i, px * k, py * k);
      }
    }
    pos.needsUpdate = true;
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0x111e30, transparent: true, opacity: 0.62, depthWrite: false,
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.renderOrder = 1;
    scene.add(m);
  }
  puddle(-1.0, 2.95, 0.95, 0.016);
  puddle(1.6, 3.60, 0.60, 0.016);
  puddle(-3.2, 3.40, 0.78, 0.016);
  puddle(2.6, 2.50, 0.44, 0.016);
  puddle(0.30, 4.55, 0.52, 0.016);
  puddle(-1.75, 0.30, 0.40, 0.148);
  puddle(1.00, 1.22, 0.30, 0.148);
  puddle(3.40, -1.20, 0.28, 0.152);
  puddle(4.55, 4.30, 0.70, 0.016);
  puddle(0.9, 5.35, 0.55, 0.016);

  const smearMat = (color, opacity) => new THREE.MeshBasicMaterial({
    map: smearTex, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  function smear(x, z, w, h, color, opacity, y = 0.02, rz = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), smearMat(color, opacity));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = rz;
    m.position.set(x, y, z);
    m.renderOrder = 2;
    scene.add(m);
  }
  smear(1.0, 1.95, 3.6, 2.4, 0xffbf7a, 0.42, 0.02, Math.PI);
  smear(-0.25, 1.85, 1.6, 1.9, 0xffd6a0, 0.24, 0.02, Math.PI);
  smear(-1.55, 2.00, 1.5, 2.6, 0x6effb0, 0.24, 0.02, Math.PI);
  smear(-2.05, 2.35, 2.4, 3.4, 0xffc078, 0.34, 0.02, Math.PI);
  smear(-2.10, -1.4, 1.2, 2.0, 0x9fe8ff, 0.28, 0.152, Math.PI / 2);
  smear(4.55, 1.90, 1.6, 2.6, 0xff4a5e, 0.32, 0.02, Math.PI);
  smear(3.40, 0.55, 0.9, 1.4, 0xffcf9b, 0.22, 0.152);
  smear(-1.25, 3.50, 2.0, 3.0, 0xaecce8, 0.12, 0.02);

  const spill = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.8), new THREE.MeshBasicMaterial({
    map: smearTex, color: 0xffd2a0, transparent: true, opacity: 0.28,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  spill.rotation.x = -Math.PI / 2;
  spill.rotation.z = Math.PI;
  spill.position.set(0.9, 0.024, 2.0);
  spill.renderOrder = 2;
  scene.add(spill);

  // 店门口地面溢光（贴地的暖色渐变，把橱窗的光「摊」到人行道上）
  const escTex = canvasTex(4, 64, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0.00, 'rgba(255,216,164,0.95)');
    gr.addColorStop(0.35, 'rgba(255,200,140,0.45)');
    gr.addColorStop(1.00, 'rgba(255,190,130,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });
  const esc = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.15), new THREE.MeshBasicMaterial({
    map: escTex, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  esc.rotation.x = -Math.PI / 2;
  esc.position.set(0.9, 0.158, 1.12);
  esc.renderOrder = 2;
  scene.add(esc);

  // 地面光池：让湿沥青有「被灯照着」的落点，而不是一片死黑
  function pool(x, z, r, color, opacity, y = 0.026) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({
      map: GLOW_TEX, color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.renderOrder = 2;
    scene.add(m);
    return m;
  }
  pool(0.9, 2.05, 3.2, 0xffbe80, 0.26);           // 店前暖光
  pool(-2.06, 2.75, 2.8, 0xffc78a, 0.30);          // 路灯下
  pool(-2.00, -1.55, 1.9, 0x9fe0ff, 0.20);         // 自动贩卖机前
  pool(4.55, 1.35, 1.9, 0xff4a5e, 0.15);           // 红色竖招牌
  pool(-1.55, 0.60, 1.3, 0x8dffc8, 0.14, 0.152);   // 竖灯箱前的人行道
  pool(3.40, -0.60, 1.4, 0xffcf9b, 0.13, 0.152);   // 小巷口
  pool(-4.30, 4.05, 2.4, 0x9abbe6, 0.10);          // 对街弱反光
  
  // 雨的冷色底光，压住整块路面
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({
    map: GLOW_TEX, color: 0x24406d, transparent: true, opacity: 0.07,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.set(0, 0.008, 0);
  sheen.renderOrder = 1;
  scene.add(sheen);

  // 雨
  const RAIN_N = 4200;
  const rPos = new Float32Array(RAIN_N * 2 * 3);
  const rSeed = new Float32Array(RAIN_N * 2 * 3);
  const rSpeed = new Float32Array(RAIN_N * 2);
  const rTop = new Float32Array(RAIN_N * 2);
  for (let i = 0; i < RAIN_N; i++) {
    const x = rnd(-6.6, 6.6), z = rnd(-6.6, 6.6), y = rnd(0, 15), sp = rnd(8, 13);
    for (let k = 0; k < 2; k++) {
      const idx = i * 2 + k;
      rPos[idx * 3] = x; rPos[idx * 3 + 1] = y; rPos[idx * 3 + 2] = z;
      rSeed[idx * 3] = x; rSeed[idx * 3 + 1] = y; rSeed[idx * 3 + 2] = z;
      rSpeed[idx] = sp;
      rTop[idx] = k;
    }
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
  rainGeo.setAttribute('aSeed', new THREE.BufferAttribute(rSeed, 3));
  rainGeo.setAttribute('aSpeed', new THREE.BufferAttribute(rSpeed, 1));
  rainGeo.setAttribute('aTop', new THREE.BufferAttribute(rTop, 1));

  const rainMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uH: { value: 15.0 } },
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      attribute float aSpeed;
      attribute float aTop;
      uniform float uTime;
      uniform float uH;
      varying float vA;
      void main() {
        float y = mod(aSeed.y - uTime * aSpeed, uH);
        float len = 0.15 + aSpeed * 0.012;
        vec3 p = vec3(aSeed.x, y + aTop * len, aSeed.z);
        p.x += (uH - y) * 0.055;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = -mv.z;
        // 近处雨丝压暗，避免糊在镜头前变成白划痕
        float nearFade = mix(0.30, 1.0, smoothstep(3.0, 14.0, depth));
        vA = smoothstep(0.0, 2.2, y) * (1.0 - smoothstep(uH - 5.0, uH, y)) * 0.30 * nearFade;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() { gl_FragColor = vec4(0.72, 0.86, 1.0, vA); }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  scene.add(rain);

  const rippleMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main() {
        vec2 uv = vUv * vec2(42.0, 42.0);
        vec2 id = floor(uv);
        vec2 f = fract(uv) - 0.5;
        float h = hash(id);
        float t = fract(uTime * 0.85 + h);
        float r = t * 0.33;
        float d = length(f);
        float ring = smoothstep(0.055, 0.005, abs(d - r)) * pow(1.0 - t, 1.6);
        gl_FragColor = vec4(0.80, 0.92, 1.0, ring * 0.34);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const rippleRoad = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), rippleMat);
  rippleRoad.rotation.x = -Math.PI / 2;
  rippleRoad.position.y = 0.018;
  rippleRoad.renderOrder = 2;
  scene.add(rippleRoad);

  const rippleSwMat = rippleMat.clone();
  rippleSwMat.uniforms = rippleMat.uniforms;
  const rippleSw = new THREE.Mesh(new THREE.PlaneGeometry(8.3, 7.9), rippleSwMat);
  rippleSw.rotation.x = -Math.PI / 2;
  rippleSw.position.set(1.85, 0.153, -2.05);
  rippleSw.renderOrder = 2;
  scene.add(rippleSw);

  /* ---------------------------------------------------------
     9. 灯光
     --------------------------------------------------------- */
  scene.add(new THREE.AmbientLight(0x5f7bbd, 0.24));
  scene.add(new THREE.HemisphereLight(0x6f8ecb, 0x18202f, 0.42));

  const rim = new THREE.DirectionalLight(0x54b6ff, 0.85);
  rim.position.set(6, 6, -10);
  scene.add(rim);

  const moon = new THREE.DirectionalLight(0xa9c8ff, 1.30);
  moon.position.set(-9, 15, 9);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  const sc = moon.shadow.camera;
  sc.left = -11; sc.right = 11; sc.top = 11; sc.bottom = -11;
  sc.near = 1; sc.far = 46;
  sc.updateProjectionMatrix();
  moon.shadow.bias = -0.0009;
  moon.shadow.normalBias = 0.02;
  scene.add(moon);

  const warmIn = new THREE.PointLight(0xffcf9b, 1.7, 8, 2);
  warmIn.position.set(1.0, 2.6, -1.8);
  scene.add(warmIn);

  const inGlow = new THREE.PointLight(0xffdcb0, 1.5, 5, 2);
  inGlow.position.set(0.6, 2.9, -0.4);
  scene.add(inGlow);

  const spillLight = new THREE.PointLight(0xffb066, 13, 9, 2);
  spillLight.position.set(1.0, 1.9, 1.5);
  scene.add(spillLight);

  const lampLight = new THREE.PointLight(0xffb872, 42, 14, 2);
  lampLight.position.set(-2.06, 5.4, 2.6);
  scene.add(lampLight);

  const vendLight = new THREE.PointLight(0xbfe8ff, 10, 6, 2);
  vendLight.position.set(-2.0, 1.3, -1.4);
  scene.add(vendLight);

  const alleyLight = new THREE.PointLight(0xffd39b, 8, 5, 2);
  alleyLight.position.set(3.4, 2.4, -0.95);
  scene.add(alleyLight);

  const signLight = new THREE.PointLight(0xff5a70, 5, 5.5, 2);
  signLight.position.set(4.55, 3.6, 1.4);
  scene.add(signLight);

  /* ---------------------------------------------------------
     10. 时钟
     --------------------------------------------------------- */
  const clock = new THREE.Clock();
  return {
    tick() {
      const t = clock.getElapsedTime();
      rainMat.uniforms.uTime.value = t;
      rippleMat.uniforms.uTime.value = t;
      lantern.material.emissiveIntensity = 1.0 + Math.sin(t * 2.1) * 0.12;
    },
  };
}
