import * as THREE from 'three';

/**
 * Procedural set-pieces for each map view. Placeholder for painted 2.5D backgrounds / modelled sets,
 * but built to the art direction: neon, chrome, sunset gradients, wet reflections.
 */

export interface SetPiece {
  group: THREE.Group;
  update(dt: number, t: number): void;
  /** Camera bounds (x/z) so the follow-cam stays framed. */
  camBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  background: THREE.Color;
  fog: THREE.Fog;
  /** Props tied to a hotspot id: shown only while that hotspot's cond holds (e.g. the spare guitar, the window). */
  props?: Record<string, THREE.Object3D>;
}

const std = (color: number, p: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true, ...p });

function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Neon sign text rendered to a canvas; bloom does the glow. */
export function neonText(text: string, color: string, opts: { font?: string; w?: number; h?: number; scale?: number } = {}) {
  const w = opts.w ?? 1024;
  const h = opts.h ?? 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, w, h);
  g.font = opts.font ?? `italic 900 ${Math.floor(h * 0.6)}px "Brush Script MT", "Segoe Script", cursive`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = color;
  g.shadowBlur = h * 0.12;
  g.lineWidth = h * 0.05;
  g.strokeStyle = color;
  g.strokeText(text, w / 2, h / 2);
  g.fillStyle = '#ffffff';
  g.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false });
  const s = opts.scale ?? 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(s, (s * h) / w), mat);
  return { mesh, mat };
}

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  t.magFilter = THREE.NearestFilter;
  return t;
}

const neonMat = (color: number, intensity = 2.5) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, toneMapped: false });

// ---------------------------------------------------------------- The Pink Wyvern

export function buildWyvern(): SetPiece {
  const g = new THREE.Group();
  const checker = canvasTex(64, 64, (c) => {
    c.fillStyle = '#16091f';
    c.fillRect(0, 0, 64, 64);
    c.fillStyle = '#3a0f3a';
    c.fillRect(0, 0, 32, 32);
    c.fillRect(32, 32, 32, 32);
  }, [8, 6]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 12.4), std(0xffffff, { map: checker, roughness: 0.5, metalness: 0.1, flatShading: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = 0;
  floor.receiveShadow = true;
  g.add(floor);

  const wallMat = std(0x241033);
  const brick = canvasTex(128, 128, (c) => {
    c.fillStyle = '#2a1238';
    c.fillRect(0, 0, 128, 128);
    c.strokeStyle = '#1a0a24';
    c.lineWidth = 3;
    for (let y = 0; y < 128; y += 16) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke();
      for (let x = (y / 16) % 2 ? 0 : 16; x < 128; x += 32) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 16); c.stroke(); }
    }
  }, [6, 2]);
  const brickMat = std(0xffffff, { map: brick });
  g.add(box(16.4, 5, 0.3, brickMat, 0, 2.5, -6.3)); // back wall
  g.add(box(0.3, 5, 12.4, wallMat, -8.2, 2.5, 0)); // left
  g.add(box(0.3, 5, 12.4, wallMat, 8.2, 2.5, 0)); // right

  // stage
  const stage = box(12, 0.5, 2.9, std(0x1a1a22, { roughness: 0.4 }), 0, 0.25, -4.85);
  g.add(stage);
  const stageEdge = box(12, 0.05, 0.05, neonMat(0xff2bd6, 1.3), 0, 0.5, -3.4);
  g.add(stageEdge);
  // amp stack
  const ampMat = std(0x121212, { roughness: 0.6 });
  g.add(box(1.0, 0.9, 0.6, ampMat, 4.6, 0.95, -4.6), box(1.0, 0.7, 0.6, ampMat, 4.6, 1.75, -4.6));
  const grille = box(0.86, 0.6, 0.02, std(0x333333), 4.6, 0.95, -4.29);
  g.add(grille);
  const ampLight = box(0.08, 0.08, 0.02, neonMat(0xff3300, 3), 5.0, 2.0, -4.29);
  g.add(ampLight);
  // drum kit
  const drumMat = std(0xffb36b, { metalness: 0.5, roughness: 0.3 });
  for (const [x, z, r] of [[2.6, -5.2, 0.42], [3.4, -5.5, 0.28], [4.0, -5.0, 0.3]] as const) {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.35, 12), drumMat);
    d.position.set(x, 0.75, z);
    g.add(d);
  }
  const cymbal = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 14), std(0xd4a017, { metalness: 1, roughness: 0.2 }));
  cymbal.position.set(2.0, 1.6, -5.4);
  g.add(cymbal);
  // mic stand
  const mic = box(0.03, 1.5, 0.03, std(0xaaaaaa, { metalness: 1, roughness: 0.2 }), 0, 1.25, -3.75);
  g.add(mic);

  // big neon sign
  const sign = neonText('Pink Wyvern', '#ff2bd6', { scale: 7 });
  sign.mesh.position.set(0, 3.2, -6.1);
  g.add(sign.mesh);
  const sub = neonText('LIVE TONIGHT • ROXY & THE WILDFIRES', '#33e0ff', { font: 'bold 70px "Courier New", monospace', scale: 5.5 });
  sub.mesh.position.set(0, 4.25, -6.1);
  sub.mesh.scale.setScalar(0.8);
  g.add(sub.mesh);

  // bar
  const bar = box(2.2, 1.1, 6.4, std(0x2a0f1e, { roughness: 0.3, metalness: 0.3 }), -6.6, 0.55, 1.2);
  g.add(bar);
  g.add(box(2.3, 0.04, 6.5, std(0x1a0a14, { roughness: 0.2, metalness: 0.6 }), -6.6, 1.12, 1.2));
  g.add(box(0.04, 0.04, 6.5, neonMat(0x33e0ff, 1.4), -5.48, 1.1, 1.2));
  // shelves of glowing bottles
  for (let i = 0; i < 14; i++) {
    const col = [0xff2bd6, 0x33e0ff, 0xffd24a, 0x9dff8a][i % 4];
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.32, 6), neonMat(col, 0.8));
    b.position.set(-8.0, 1.8 + (i % 2) * 0.6, -1.5 + Math.floor(i / 2) * 0.75);
    g.add(b);
  }
  // stools
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.08, 10), std(0xff2bd6, { roughness: 0.3 }));
    s.position.set(-5.2, 0.75, -1 + i * 1.5);
    g.add(s, box(0.06, 0.72, 0.06, std(0x999999, { metalness: 1 }), -5.2, 0.36, -1 + i * 1.5));
  }
  // booths
  for (const z of [4.2, 0.6]) {
    g.add(box(2.4, 0.5, 1.6, std(0x8a1050, { roughness: 0.5 }), 6.4, 0.25, z));
    g.add(box(0.3, 1.1, 1.6, std(0x8a1050, { roughness: 0.5 }), 7.75, 0.55, z));
    g.add(box(1.0, 0.06, 1.0, std(0x222222, { metalness: 0.5, roughness: 0.2 }), 6.1, 0.8, z));
  }
  // tables
  for (const [x, z] of [[-2.2, 2.2], [2.6, 3.4]] as const) {
    g.add(box(0.9, 0.05, 0.9, std(0x222222, { metalness: 0.6, roughness: 0.2 }), x, 0.78, z));
    g.add(box(0.08, 0.76, 0.08, std(0x777777, { metalness: 1 }), x, 0.38, z));
  }
  // back door (stage right) to the alley, under a pink EXIT sign
  g.add(box(0.12, 2.3, 1.3, std(0x5a1030, { metalness: 0.4, roughness: 0.5 }), 8.02, 1.15, -2.6));
  g.add(box(0.14, 0.05, 0.6, std(0xbbbbbb, { metalness: 1, roughness: 0.2 }), 7.94, 1.05, -2.25)); // push bar
  const doorFrame = neonMat(0xff2bd6, 1.6);
  g.add(box(0.06, 2.4, 0.06, doorFrame, 7.98, 1.2, -3.28), box(0.06, 2.4, 0.06, doorFrame, 7.98, 1.2, -1.92), box(0.06, 0.06, 1.42, doorFrame, 7.98, 2.4, -2.6));
  const backExit = neonText('EXIT', '#ff2bd6', { font: 'bold 180px "Courier New", monospace', scale: 1.3 });
  backExit.mesh.position.set(7.96, 2.85, -2.6);
  backExit.mesh.rotation.y = -Math.PI / 2;
  g.add(backExit.mesh);
  const doorGlow = new THREE.PointLight(0xff2bd6, 2.2, 4, 1.8);
  doorGlow.position.set(7.4, 2.6, -2.6);
  g.add(doorGlow);

  // jukebox
  const jb = box(0.9, 1.6, 0.6, std(0x3a1a0a, { roughness: 0.4 }), 7.6, 0.8, 2.4);
  g.add(jb);
  const jbArch = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.06, 6, 16, Math.PI), neonMat(0xffd24a, 2));
  jbArch.position.set(7.28, 1.2, 2.4);
  jbArch.rotation.y = -Math.PI / 2;
  g.add(jbArch);


  // ---- discoverables (storyboard v2): what you can examine, so the player sees it first ----
  const props: Record<string, THREE.Object3D> = {};
  const poster = (draw: (c: CanvasRenderingContext2D) => void, w: number, h: number) => {
    const tex = canvasTex(256, Math.round((256 * h) / w), draw);
    tex.magFilter = THREE.LinearFilter;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 }));
  };
  // SAVE THE WORLD poster: a cartoon guitarist punching a meteor (left wall, by the stage)
  const savePoster = poster((c) => {
    const H = c.canvas.height;
    const grd = c.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#1a0a3a');
    grd.addColorStop(1, '#ff2b8a');
    c.fillStyle = grd;
    c.fillRect(0, 0, 256, H);
    c.fillStyle = '#ffd24a';
    c.beginPath();
    c.arc(180, 90, 42, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#ff6a00';
    c.lineWidth = 8;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(210 + i * 8, 60 + i * 12);
      c.lineTo(250, 20 + i * 12);
      c.stroke();
    }
    c.fillStyle = '#111';
    c.fillRect(70, 120, 26, 90); // guitarist
    c.beginPath();
    c.arc(83, 108, 16, 0, Math.PI * 2);
    c.fill();
    c.fillRect(90, 120, 80, 14); // punching arm
    c.fillStyle = '#ff2bd6';
    c.fillRect(40, 170, 70, 18); // guitar
    c.fillStyle = '#fff';
    c.font = 'bold 34px Impact, sans-serif';
    c.textAlign = 'center';
    c.fillText('SAVE THE', 128, H - 70);
    c.fillText('WORLD!', 128, H - 34);
    c.font = '12px sans-serif';
    c.fillText('HEATS TONIGHT \u2022 EST. TIME IMMEMORIAL', 128, H - 12);
  }, 1.0, 1.4);
  savePoster.position.set(-8.04, 2.2, -2.8);
  savePoster.rotation.y = Math.PI / 2;
  g.add(savePoster);
  // Rex's jousting poster, crown drawn on in gold pen (back wall, stage right)
  const rexPoster = poster((c) => {
    const H = c.canvas.height;
    c.fillStyle = '#16233f';
    c.fillRect(0, 0, 256, H);
    c.fillStyle = '#e0b590';
    c.beginPath();
    c.arc(128, 120, 46, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f2c230';
    c.beginPath();
    c.ellipse(128, 70, 50, 26, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#ffd24a';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(88, 50);
    c.lineTo(98, 14);
    c.lineTo(113, 40);
    c.lineTo(128, 6);
    c.lineTo(143, 40);
    c.lineTo(158, 14);
    c.lineTo(168, 50);
    c.closePath();
    c.stroke();
    c.fillStyle = '#d4a017';
    c.fillRect(60, 170, 136, 40);
    c.fillStyle = '#fff';
    c.font = 'bold 30px Impact, sans-serif';
    c.textAlign = 'center';
    c.fillText('REX VALOR', 128, H - 56);
    c.fillStyle = '#ffd24a';
    c.fillText('UNDEFEATED', 128, H - 20);
  }, 0.9, 1.3);
  rexPoster.position.set(6.9, 2.3, -6.13);
  g.add(rexPoster);
  // chalkboard A-frame by the door
  const board = new THREE.Group();
  const slate = poster((c) => {
    const H = c.canvas.height;
    c.fillStyle = '#1d2a22';
    c.fillRect(0, 0, 256, H);
    c.fillStyle = '#f4f4ea';
    c.font = 'bold 24px "Comic Sans MS", cursive';
    c.textAlign = 'center';
    c.fillText('TONIGHT:', 128, 40);
    c.fillText('SAVE THE WORLD', 128, 72);
    c.fillText('HEAT', 128, 102);
    c.font = '18px "Comic Sans MS", cursive';
    c.fillText('Roxy & the Wildfires', 128, 146);
    c.fillText('vs. the Velvet Undertow', 128, 172);
    c.fillText('vs. Gary', 128, 198);
    c.font = '12px "Comic Sans MS", cursive';
    c.fillText('who is gary?', 180, H - 30);
    c.fillText('nobody knows who gary is', 150, H - 12);
  }, 0.8, 1.0);
  slate.position.set(0, 0.85, 0.02);
  slate.rotation.x = -0.18;
  board.add(slate, box(0.9, 1.1, 0.04, std(0x5a3a1a), 0, 0.82, -0.05));
  board.position.set(-3.8, 0, 5.3);
  board.rotation.y = Math.PI;
  g.add(board);
  // front window (right wall, by the door): whole until the Bellshell
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x7ab8ff, transparent: true, opacity: 0.35, metalness: 0.3, roughness: 0.05, emissive: 0x2a3a8a, emissiveIntensity: 0.6 });
  const windowWhole = new THREE.Group();
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.5), glassMat);
  pane.rotation.y = -Math.PI / 2;
  windowWhole.add(pane);
  const frameMat = std(0xff2bd6, { emissive: 0xff2bd6, emissiveIntensity: 0.6 });
  const frameBits = [box(0.06, 0.06, 1.7, frameMat, 0, 0.78, 0), box(0.06, 0.06, 1.7, frameMat, 0, -0.78, 0), box(0.06, 1.6, 0.06, frameMat, 0, 0, 0.82), box(0.06, 1.6, 0.06, frameMat, 0, 0, -0.82)];
  const windowFrame = new THREE.Group();
  windowFrame.add(...frameBits);
  windowFrame.position.set(8.03, 1.8, 5.3);
  windowWhole.position.set(8.03, 1.8, 5.3);
  g.add(windowFrame, windowWhole);
  props.window = windowWhole;
  const broken = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4 + (i % 3) * 0.15, 3), glassMat);
    shard.position.set(0, i < 3 ? 0.62 : -0.62, -0.6 + (i % 3) * 0.6);
    shard.rotation.z = i < 3 ? Math.PI : 0;
    broken.add(shard);
  }
  broken.position.set(8.0, 1.8, 5.3);
  g.add(broken);
  props.window_broken = broken;
  // the spare guitar, "decorative" (right wall, between the back door and the booths)
  const spare = new THREE.Group();
  spare.add(box(0.06, 0.5, 0.36, std(0x6a1b1b, { roughness: 0.3, metalness: 0.3 }), 0, 0, 0));
  spare.add(box(0.04, 0.7, 0.06, std(0x3b2a1a), 0, 0.6, 0));
  spare.add(box(0.05, 0.14, 0.1, std(0x222222), 0, 1.0, 0));
  spare.position.set(8.0, 1.9, -1.1);
  spare.rotation.x = 0.25;
  g.add(spare);
  props.spare_guitar = spare;
  // lost-and-found box at the end of the bar
  const lf = new THREE.Group();
  lf.add(box(0.6, 0.4, 0.45, std(0x9a7a4a), 0, 0.2, 0));
  const glove = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), std(0x222222));
  glove.position.set(0.1, 0.42, 0);
  const letter = box(0.22, 0.02, 0.15, std(0xf4ecd8), -0.12, 0.42, 0.05);
  letter.rotation.y = 0.4;
  lf.add(glove, letter);
  lf.position.set(-6.5, 0, 5.2);
  g.add(lf);
  // tip jar on the bar
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.5, roughness: 0.05 }));
  jar.position.set(-5.75, 1.25, 0.4);
  g.add(jar);
  // amp manual and set list at the stage edge
  const manual = box(0.28, 0.04, 0.36, std(0x2a5a9a), -1.6, 0.52, -3.55);
  manual.rotation.y = 0.3;
  const setList = box(0.3, 0.01, 0.4, std(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.15 }), 1.3, 0.51, -3.6);
  setList.rotation.y = -0.2;
  g.add(manual, setList);

  // disco ball
  const disco = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05, flatShading: true }));
  disco.position.set(0, 4.3, 0);
  g.add(disco);

  // lights
  g.add(new THREE.AmbientLight(0x6a4a8a, 1.6));
  const hemi = new THREE.HemisphereLight(0xff8fd0, 0x1a0a2a, 1.0);
  g.add(hemi);
  const stageSpot = new THREE.SpotLight(0xff4fd8, 40, 14, 0.6, 0.5, 1.5);
  stageSpot.position.set(0, 6, -1);
  stageSpot.target.position.set(0, 0, -4.5);
  stageSpot.castShadow = true;
  stageSpot.shadow.mapSize.set(1024, 1024);
  g.add(stageSpot, stageSpot.target);
  const cyan = new THREE.PointLight(0x33e0ff, 7, 10, 1.6);
  cyan.position.set(-6, 3.6, 1);
  g.add(cyan);
  const warm = new THREE.PointLight(0xffb36b, 5, 9, 1.6);
  warm.position.set(6, 2.8, 2.5);
  g.add(warm);
  const roomFill = new THREE.PointLight(0xb18cff, 8, 14, 1.4);
  roomFill.position.set(0, 3.5, 3);
  g.add(roomFill);

  return {
    group: g,
    camBounds: { minX: -3.5, maxX: 3.5, minZ: -3.2, maxZ: 2.5 },
    props,
    background: new THREE.Color(0x0b0412),
    fog: new THREE.Fog(0x0b0412, 14, 30),
    update(dt, t) {
      disco.rotation.y += dt * 0.8;
      sign.mat.opacity = 0.92 + Math.sin(t * 13) * 0.04 + (Math.sin(t * 0.7) > 0.97 ? -0.5 : 0);
      stageSpot.intensity = 38 + Math.sin(t * 1.3) * 6;
      cyan.intensity = 7 + Math.sin(t * 2.1) * 1.5;
    },
  };
}

// ---------------------------------------------------------------- Wyvern Alley

export function buildAlley(): SetPiece {
  const g = new THREE.Group();
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 18),
    new THREE.MeshStandardMaterial({ color: 0x15121c, roughness: 0.15, metalness: 0.5 }),
  );
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.z = -2;
  asphalt.receiveShadow = true;
  g.add(asphalt);

  const brick = canvasTex(128, 128, (c) => {
    c.fillStyle = '#3a1c24';
    c.fillRect(0, 0, 128, 128);
    c.strokeStyle = '#1f0d12';
    c.lineWidth = 3;
    for (let y = 0; y < 128; y += 16) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke();
      for (let x = (y / 16) % 2 ? 0 : 16; x < 128; x += 32) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 16); c.stroke(); }
    }
  }, [6, 3]);
  const brickMat = std(0xffffff, { map: brick });
  g.add(box(0.4, 7, 18, brickMat, -3.1, 3.5, -2));
  g.add(box(0.4, 7, 18, brickMat, 3.1, 3.5, -2));

  // dumpster
  g.add(box(1.2, 1.2, 2.6, std(0x1f5a3a, { roughness: 0.5, metalness: 0.4 }), -2.0, 0.6, -1.5));
  g.add(box(1.3, 0.08, 2.7, std(0x174a2e, { metalness: 0.4 }), -2.0, 1.24, -1.5));
  // barrels
  const barrelMat = std(0x55606a, { metalness: 0.6, roughness: 0.4 });
  for (const [x, z] of [[1.9, 1.4], [2.3, 0.6], [2.2, -0.4]] as const) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.3, 0.9, 10), barrelMat);
    b.position.set(x, 0.45, z);
    b.castShadow = true;
    g.add(b);
  }
  // a big cardboard box against the wall, a blanket folded inside: somebody lives here
  const cardboard = std(0x8a6a3e, { roughness: 0.9 });
  g.add(box(1.0, 0.75, 1.6, cardboard, 2.4, 0.375, -6.4));
  const flap = box(0.04, 0.5, 1.6, cardboard, 1.86, 0.62, -6.4);
  flap.rotation.z = 0.5;
  g.add(flap);
  g.add(box(0.8, 0.12, 1.3, std(0x6a2a4a, { roughness: 1 }), 2.4, 0.78, -6.35)); // the blanket
  // the black cat on a crate, watching
  g.add(box(0.6, 0.45, 0.6, std(0x5a4228, { roughness: 0.9 }), 2.5, 0.225, -3.2));
  const catMat = std(0x0b0b10, { roughness: 0.6 });
  const cat = new THREE.Group();
  const catBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), catMat);
  catBody.scale.set(1, 0.85, 1.35);
  catBody.position.y = 0.14;
  const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), catMat);
  catHead.position.set(0, 0.3, 0.14);
  cat.add(catBody, catHead);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), catMat);
    ear.position.set(0.05 * sx, 0.4, 0.13);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0xc8ff4a }));
    eye.position.set(0.04 * sx, 0.31, 0.23);
    cat.add(ear, eye);
  }
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.32, 3, 5), catMat);
  tail.position.set(-0.14, 0.08, -0.18);
  tail.rotation.set(0, 0, 1.3);
  cat.add(tail);
  cat.position.set(2.5, 0.45, -3.2);
  cat.rotation.y = -Math.PI / 2 - 0.4;
  g.add(cat);
  // back door
  g.add(box(1.2, 2.2, 0.1, std(0x5a1030, { metalness: 0.4 }), 2.95, 1.1, 4.8));
  const exitSign = neonText('EXIT', '#ff2bd6', { font: 'bold 180px "Courier New", monospace', scale: 1.4 });
  exitSign.mesh.position.set(2.85, 2.6, 4.6);
  exitSign.mesh.rotation.y = -Math.PI / 2;
  g.add(exitSign.mesh);
  // fire escape
  const iron = std(0x222222, { metalness: 0.8, roughness: 0.4 });
  for (const y of [3.2, 5.4]) g.add(box(1.0, 0.06, 5, iron, -2.5, y, -4));
  for (let i = 0; i < 8; i++) g.add(box(0.04, 1.0, 0.04, iron, -2.0, 3.7, -6.4 + i * 0.68));
  // windows with warm light
  for (const [x, y, z, col] of [[-2.88, 4.2, 1.5, 0xffb36b], [2.88, 4.6, -3.5, 0x33e0ff], [-2.88, 5.6, -6.5, 0xff8fd0]] as const) {
    const w = box(0.05, 0.9, 0.7, neonMat(col, 0.8), x, y, z);
    g.add(w);
  }

  // the synthwave horizon at the alley mouth
  const sky = canvasTex(512, 512, (c) => {
    const grad = c.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#12062b');
    grad.addColorStop(0.45, '#6a1b6e');
    grad.addColorStop(0.7, '#ff4f8b');
    grad.addColorStop(0.85, '#ffb36b');
    grad.addColorStop(1, '#2a0a3a');
    c.fillStyle = grad;
    c.fillRect(0, 0, 512, 512);
    // striped sun
    const sunGrad = c.createLinearGradient(0, 220, 0, 420);
    sunGrad.addColorStop(0, '#ffe66b');
    sunGrad.addColorStop(1, '#ff2b8a');
    c.fillStyle = sunGrad;
    c.beginPath();
    c.arc(256, 380, 120, Math.PI, 0);
    c.fill();
    c.fillStyle = '#6a1b6e';
    for (let i = 0; i < 6; i++) c.fillRect(120, 300 + i * 14, 272, 2 + i * 1.5);
    // palm silhouettes
    c.fillStyle = '#0d0418';
    for (const px of [70, 440]) {
      c.fillRect(px - 4, 300, 8, 212);
      for (let a = 0; a < 7; a++) {
        c.save();
        c.translate(px, 300);
        c.rotate(-1.4 + a * 0.45);
        c.beginPath();
        c.ellipse(40, 0, 44, 8, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }
    c.fillRect(0, 440, 512, 72); // skyline base
    for (let i = 0; i < 16; i++) c.fillRect(i * 34, 410 - ((i * 37) % 60), 26, 120);
  });
  const skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: sky, toneMapped: false }));
  skyMesh.position.set(0, 4, -13);
  g.add(skyMesh);

  // steam
  const steamTex = canvasTex(64, 64, (c) => {
    const r = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,220,255,0.5)');
    r.addColorStop(1, 'rgba(255,220,255,0)');
    c.fillStyle = r;
    c.fillRect(0, 0, 64, 64);
  });
  const puffs: THREE.Sprite[] = [];
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0.22 }));
    s.position.set(-2.6, Math.random() * 3, 2.5);
    s.scale.setScalar(1.2);
    puffs.push(s);
    g.add(s);
  }

  // lights
  g.add(new THREE.AmbientLight(0x5a3a7a, 0.8));
  g.add(new THREE.HemisphereLight(0xff8fd0, 0x0a0614, 0.5));
  const pink = new THREE.PointLight(0xff2bd6, 7, 9, 1.5);
  pink.position.set(2.2, 2.6, 4.2);
  g.add(pink);
  const sunset = new THREE.DirectionalLight(0xff8a5a, 1.6);
  sunset.position.set(0, 3, -12);
  sunset.target.position.set(0, 0, 2);
  sunset.castShadow = true;
  g.add(sunset, sunset.target);
  const lamp = new THREE.PointLight(0xffd8a0, 6, 8, 1.5);
  lamp.position.set(0, 4, -3);
  g.add(lamp);

  return {
    group: g,
    camBounds: { minX: -1, maxX: 1, minZ: -6, maxZ: 3.4 },
    background: new THREE.Color(0x12062b),
    fog: new THREE.Fog(0x2a0a3a, 12, 28),
    update(dt, t) {
      pink.intensity = 7 + (Math.sin(t * 17) > 0.9 ? -4 : 0);
      for (const [i, s] of puffs.entries()) {
        s.position.y += dt * (0.5 + (i % 3) * 0.2);
        s.position.x = -2.6 + Math.sin(t + i) * 0.2;
        (s.material as THREE.SpriteMaterial).opacity = Math.max(0, 0.22 - s.position.y * 0.05);
        if (s.position.y > 4) s.position.y = 0.5;
      }
    },
  };
}

export const SETS: Record<string, () => SetPiece> = {
  wyvern: buildWyvern,
  alley: buildAlley,
};
