import * as THREE from 'three';
import { buildBellshell } from './monsters';

/**
 * Placeholder character models built from primitives (until Tripo models land).
 * Each has a distinct silhouette and palette per DESIGN.md §3, plus a simple walk/idle rig.
 */

export interface CharacterRig {
  root: THREE.Group;
  update(dt: number, moving: boolean): void;
  setEmote(what: string): void;
}

interface Spec {
  scale: number;
  skin: number;
  jacket: number;
  shirt: number;
  pants: number;
  shoes: number;
  hair: number;
  /** A full-face mask; the number is the seam's glow colour. */
  mask?: number;
  hairStyle: 'messy' | 'quiff' | 'pony' | 'mohawk' | 'buns' | 'cap' | 'bob' | 'bald' | 'big' | 'short' | 'long';
  shoulders?: number; // pauldron colour
  bulk?: number; // torso width multiplier
  extra?: (g: THREE.Group, mats: Record<string, THREE.Material>) => void;
  /** Eyes that glow (Leagues Soprano). */
  eyeGlow?: number;
}

const SPECS: Record<string, Spec> = {
  eddar: { scale: 1, skin: 0xe8c4a6, jacket: 0x3a6ea5, shirt: 0x222222, pants: 0x2b2f3a, shoes: 0x7a1f1f, hair: 0x2a1d17, hairStyle: 'messy',
    extra: (g) => { // pencil behind ear
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 5), new THREE.MeshStandardMaterial({ color: 0xf2c94c }));
      p.position.set(0.13, 1.62, 0); p.rotation.z = 1.2; g.add(p);
    } },
  roxy: { scale: 0.98, skin: 0xf0c9a8, jacket: 0x1a1a1a, shirt: 0xc8102e, pants: 0x3a0f1a, shoes: 0xff4400, hair: 0xff3a1a, hairStyle: 'pony',
    extra: (g) => { // guitar
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.07), new THREE.MeshStandardMaterial({ color: 0xd4141c, roughness: 0.3, metalness: 0.4 }));
      body.position.set(0.02, 0.98, 0.2); body.rotation.z = 0.6; g.add(body);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.04), new THREE.MeshStandardMaterial({ color: 0x3b2a1a }));
      neck.position.set(-0.2, 1.24, 0.2); neck.rotation.z = 0.6; g.add(neck);
    } },
  rex: { scale: 1.22, skin: 0xe0b590, jacket: 0xf4f1ea, shirt: 0x1d1d1d, pants: 0x1b2340, shoes: 0x111111, hair: 0xf2c230, hairStyle: 'quiff', shoulders: 0xd4a017, bulk: 1.35 },
  mama_dee: { scale: 1.02, skin: 0x8a5a3c, jacket: 0xff7fbf, shirt: 0xffffff, pants: 0x3a2a4a, shoes: 0x222222, hair: 0x1b1b1b, hairStyle: 'big', bulk: 1.2 },
  spike: { scale: 1.02, skin: 0xd9b08c, jacket: 0x111111, shirt: 0x4c8f2a, pants: 0x222222, shoes: 0x444444, hair: 0x7dff3a, hairStyle: 'mohawk' },
  lulu: { scale: 0.92, skin: 0xc68e6a, jacket: 0x5a2e8a, shirt: 0xffb36b, pants: 0x1f1f2e, shoes: 0xffffff, hair: 0xff9a2e, hairStyle: 'buns' },
  // Early patrons (Jesse's 0.3b notes): the regulars who heckle the band and spill on Eddar's floor.
  dwayne: { scale: 1.08, skin: 0xd6a582, jacket: 0x7a2a2a, shirt: 0xe8e0d0, pants: 0x2a2a3a, shoes: 0x222222, hair: 0x5a3a1a, hairStyle: 'short', bulk: 1.3 },
  tammy_dad: { scale: 1.0, skin: 0xb07a52, jacket: 0x3a5a7a, shirt: 0xd8d0b0, pants: 0x4a4038, shoes: 0x3a2a1a, hair: 0x6a6a6a, hairStyle: 'bald', bulk: 1.15 },
  superfan: { scale: 0.94, skin: 0xf0d0b8, jacket: 0xff3a8a, shirt: 0x111111, pants: 0x1a1a2a, shoes: 0xffffff, hair: 0x33e0ff, hairStyle: 'pony' },
  kings_fan: { scale: 1.0, skin: 0x8a5a3c, jacket: 0x1a1a1a, shirt: 0x33e0ff, pants: 0x3a3a3a, shoes: 0x222222, hair: 0x111111, hairStyle: 'cap' },
  gil: { scale: 0.95, skin: 0xd8b49a, jacket: 0x5a5146, shirt: 0x9a9182, pants: 0x3a352e, shoes: 0x2a2a2a, hair: 0x9a9a9a, hairStyle: 'cap' },
  grubb: { scale: 0.86, skin: 0xd9a77e, jacket: 0x7a5a2a, shirt: 0xcccccc, pants: 0x3a3a3a, shoes: 0x222222, hair: 0x4a3420, hairStyle: 'bob', bulk: 1.15 },
  // Leagues Soprano: a moth-eaten black robe with faded gold notes, a black breastplate, and white eyes lit from within.
  leagues: { scale: 1.06, skin: 0x5a3a26, jacket: 0x101014, shirt: 0x1a1a1f, pants: 0x0c0c0e, shoes: 0x0a0a0a, hair: 0x141010, hairStyle: 'short', eyeGlow: 0xffffff,
    extra: (g) => {
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, 1.25, 10, 1, true), new THREE.MeshStandardMaterial({ map: robeTexture(), side: THREE.DoubleSide, roughness: 0.9, flatShading: true }));
      robe.position.y = 0.78;
      g.add(robe);
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.19, 0.42, 8), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, metalness: 0.9, roughness: 0.25 }));
      plate.position.y = 1.2;
      g.add(plate);
    } },
  // The Woman in the Mask (Sable): tall and lithe, form-fitting black under a long black trench, a mask
  // over the whole face, and long neon-silver hair left free.
  sable: { scale: 1.06, skin: 0xe6c7b2, jacket: 0x0b0b0e, shirt: 0x141218, pants: 0x0b0b0e, shoes: 0x111111, hair: 0xd8e4ff, hairStyle: 'long', bulk: 0.86, mask: 0xb18cff,
    extra: (g) => {
      const coatMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: 0.55, metalness: 0.15, side: THREE.DoubleSide, flatShading: true });
      // open at the front, so the coat swings around the legs
      const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 1.0, 12, 1, true, 0.55, Math.PI * 2 - 1.1), coatMat);
      coat.position.y = 0.88;
      coat.castShadow = true;
      g.add(coat);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.18, 10, 1, true, 0.7, Math.PI * 2 - 1.4), coatMat);
      collar.position.y = 1.5;
      g.add(collar);
    } },
  // The dock crew.
  brick: { scale: 1.2, skin: 0xb88a68, jacket: 0x5a4a3a, shirt: 0x8a8f99, pants: 0x2a2f3a, shoes: 0x1a1a1a, hair: 0x2a2018, hairStyle: 'bald', bulk: 1.6 },
  moss: { scale: 0.98, skin: 0xd2a88a, jacket: 0x3f5a3a, shirt: 0x7fa37a, pants: 0x2a2a22, shoes: 0x3a2a1a, hair: 0x2a3a20, hairStyle: 'cap', bulk: 0.9,
    extra: (g) => {
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 5, 10, Math.PI * 1.3), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 1, roughness: 0.3 }));
      hook.position.set(0.32, 0.72, 0.08);
      g.add(hook);
    } },
  vinnie: { scale: 1.05, skin: 0xc49a7a, jacket: 0x4a5a6a, shirt: 0x9aa5b1, pants: 0x2a3440, shoes: 0x222222, hair: 0x111111, hairStyle: 'bald', bulk: 1.2 },
};

export function buildCharacter(model: string): CharacterRig {
  if (model === 'bellshell') return buildBellshell();
  const spec = SPECS[model] ?? SPECS.eddar;
  const std = (color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true, ...extra });
  const mats = {
    skin: std(spec.skin),
    jacket: std(spec.jacket, model === 'roxy' ? { roughness: 0.35, metalness: 0.2 } : {}),
    shirt: std(spec.shirt),
    pants: std(spec.pants),
    shoes: std(spec.shoes, model === 'roxy' ? { emissive: 0xff3300, emissiveIntensity: 0.6 } : {}),
    hair: std(spec.hair, model === 'roxy' ? { emissive: 0xff2200, emissiveIntensity: 0.35 } : model === 'sable' ? { emissive: 0x9ab8ff, emissiveIntensity: 0.3, roughness: 0.3 } : {}),
  };
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const bulk = spec.bulk ?? 1;

  const limb = (r: number, len: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 7), mat);
    m.castShadow = true;
    return m;
  };

  // legs (pivot at hip)
  const legs: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(0.1 * side * bulk, 0.82, 0);
    const leg = limb(0.075 * bulk, 0.62, mats.pants);
    leg.position.y = -0.38;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.26), mats.shoes);
    shoe.position.set(0, -0.78, 0.05);
    hip.add(leg, shoe);
    body.add(hip);
    legs.push(hip);
  }
  // torso
  const torso = new THREE.Group();
  torso.position.y = 0.82;
  body.add(torso);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * bulk, 0.16 * bulk, 0.6, 8), mats.jacket);
  chest.position.y = 0.32;
  chest.castShadow = true;
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.16 * bulk, 0.42, 0.05), mats.shirt);
  shirt.position.set(0, 0.34, 0.17 * bulk);
  torso.add(chest, shirt);
  if (spec.shoulders !== undefined) {
    const gold = std(spec.shoulders, { metalness: 0.9, roughness: 0.25, emissive: spec.shoulders, emissiveIntensity: 0.15 });
    for (const side of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), gold);
      p.position.set(0.25 * side * bulk, 0.6, 0);
      p.scale.set(1.3, 0.8, 1.1);
      torso.add(p);
    }
  }
  // arms (pivot at shoulder)
  const arms: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(0.25 * side * bulk, 0.58, 0);
    const arm = limb(0.06 * bulk, 0.5, mats.jacket);
    arm.position.y = -0.3;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06 * bulk, 6, 5), mats.skin);
    hand.position.y = -0.62;
    sh.add(arm, hand);
    torso.add(sh);
    arms.push(sh);
  }
  // head
  const head = new THREE.Group();
  head.position.y = 0.7;
  head.scale.setScalar(1.3);
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mats.skin);
  skull.position.y = 0.14;
  skull.scale.set(0.95, 1.1, 1);
  skull.castShadow = true;
  head.add(skull);
  const eyeMat = new THREE.MeshBasicMaterial({ color: spec.eyeGlow ?? 0x111111, toneMapped: !spec.eyeGlow });
  if (spec.eyeGlow) {
    const glow = new THREE.PointLight(spec.eyeGlow, 1.2, 1.6, 2);
    glow.position.set(0, 0.16, 0.2);
    head.add(glow);
  }
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(spec.eyeGlow ? 0.026 : 0.018, 5, 4), eyeMat);
    eye.position.set(0.05 * side, 0.16, 0.135);
    head.add(eye);
  }
  addHair(head, spec.hairStyle, mats.hair);
  if (spec.mask !== undefined) {
    // a smooth black mask over the whole face, with one thin glowing seam where the eyes would be
    const mask = new THREE.Mesh(
      new THREE.SphereGeometry(0.158, 14, 10, Math.PI / 2 - 1.15, 2.3, Math.PI * 0.2, Math.PI * 0.62),
      new THREE.MeshStandardMaterial({ color: 0x050507, metalness: 0.85, roughness: 0.15, side: THREE.DoubleSide }),
    );
    mask.position.y = 0.14;
    mask.scale.set(0.98, 1.13, 1.04);
    head.add(mask);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.01), new THREE.MeshBasicMaterial({ color: spec.mask }));
    seam.position.set(0, 0.165, 0.158);
    head.add(seam);
  }
  spec.extra?.(body, mats);

  root.scale.setScalar(spec.scale);

  let t = Math.random() * 10;
  let walkPhase = 0;
  let emote = '';
  let emoteT = 0;
  return {
    root,
    setEmote(what) {
      emote = what;
      emoteT = 2.5;
    },
    update(dt, moving) {
      t += dt;
      if (moving) walkPhase += dt * 9;
      const swing = moving ? Math.sin(walkPhase) * 0.6 : 0;
      legs[0].rotation.x = swing;
      legs[1].rotation.x = -swing;
      arms[0].rotation.x = -swing * 0.8;
      arms[1].rotation.x = swing * 0.8;
      body.position.y = moving ? Math.abs(Math.cos(walkPhase)) * 0.04 : 0;
      torso.scale.y = 1 + Math.sin(t * 2) * 0.01; // breathing
      head.rotation.y = moving ? 0 : Math.sin(t * 0.5) * 0.15;
      if (emoteT > 0) {
        emoteT -= dt;
        if (emote === 'fire') mats.hair.emissiveIntensity = 1.5 + Math.sin(t * 30) * 0.5;
        if (emote === 'kiss') head.rotation.x = -0.25;
        if (emoteT <= 0) {
          if (model === 'roxy') mats.hair.emissiveIntensity = 0.35;
          head.rotation.x = 0;
        }
      }
    },
  };
}

function addHair(head: THREE.Group, style: Spec['hairStyle'], mat: THREE.Material) {
  const add = (geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, rz = 0, s: [number, number, number] = [1, 1, 1]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, 0, rz);
    m.scale.set(...s);
    head.add(m);
    return m;
  };
  const cap = () => add(new THREE.SphereGeometry(0.16, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.17, -0.01, 0, 0, [1.02, 0.9, 1.05]);
  switch (style) {
    case 'messy':
      cap();
      for (let i = 0; i < 5; i++) add(new THREE.ConeGeometry(0.05, 0.14, 4), -0.08 + i * 0.04, 0.22, 0.12, 1.2, (i - 2) * 0.25);
      break;
    case 'quiff':
      cap();
      add(new THREE.SphereGeometry(0.11, 8, 6), 0, 0.33, 0.07, -0.4, 0, [1.1, 0.8, 1.6]);
      break;
    case 'pony':
      cap();
      add(new THREE.ConeGeometry(0.09, 0.5, 6), 0.2, 0.08, -0.05, 0, 2.6);
      break;
    case 'mohawk':
      for (let i = 0; i < 5; i++) add(new THREE.ConeGeometry(0.035, 0.22, 4), 0, 0.33, 0.1 - i * 0.06, 0, 0);
      break;
    case 'buns':
      cap();
      add(new THREE.SphereGeometry(0.07, 6, 5), -0.12, 0.3, -0.02);
      add(new THREE.SphereGeometry(0.07, 6, 5), 0.12, 0.3, -0.02);
      break;
    case 'cap': {
      cap();
      const peak = add(new THREE.BoxGeometry(0.22, 0.02, 0.12), 0, 0.2, 0.15);
      peak.rotation.x = 0.1;
      break;
    }
    case 'bob':
      add(new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.62), 0, 0.15, -0.01);
      break;
    case 'long':
      cap();
      // falls straight down the back, narrowing to a point
      add(new THREE.SphereGeometry(0.163, 10, 8, Math.PI / 2 + 0.9, Math.PI * 2 - 1.8, 0, Math.PI * 0.72), 0, 0.14, -0.01, 0, 0, [1, 1.12, 1.05]); // the back of the head
      add(new THREE.CylinderGeometry(0.13, 0.06, 0.66, 8, 1, false, Math.PI / 2, Math.PI), 0, -0.18, -0.13, 0.16, 0); // down the back, over the coat
      add(new THREE.BoxGeometry(0.035, 0.28, 0.05), -0.14, 0.04, 0.02, 0, 0.05);
      add(new THREE.BoxGeometry(0.035, 0.28, 0.05), 0.14, 0.04, 0.02, 0, -0.05);
      break;
    case 'big':
      add(new THREE.SphereGeometry(0.2, 10, 8), 0, 0.3, -0.08);
      break;
    case 'bald':
      break;
    case 'short':
      add(new THREE.SphereGeometry(0.162, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.2), 0, 0.15, -0.01);
      break;
  }
}

/** A moth-eaten black robe printed with faded gold music notes. */
function robeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0d0c10';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(176, 140, 70, 0.75)';
  g.font = '28px serif';
  const notes = ['\u266A', '\u266B', '\u2669', '\u266C'];
  for (let i = 0; i < 40; i++) g.fillText(notes[i % 4], (i * 53) % 256, 20 + ((i * 37) % 240));
  // moth holes
  g.fillStyle = '#2a2430';
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    g.arc((i * 97) % 256, (i * 61) % 256, 2 + (i % 4), 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
