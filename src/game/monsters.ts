import * as THREE from 'three';
import type { CharacterRig } from './characters';

/**
 * Placeholder monster models (until Tripo models land). Each is a broken version of something musical
 * in nature (storyboard v2, Monsters of Solace Bay), so the silhouette should say "instrument" first.
 */

/** The Bellshell: a crab the size of a car whose shell is a cracked ship's bell. Emotes: 'rear', 'settle', 'calm'. */
export function buildBellshell(): CharacterRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const bronze = new THREE.MeshStandardMaterial({ color: 0xa8742c, metalness: 0.7, roughness: 0.35, flatShading: true, side: THREE.DoubleSide, emissive: 0x3a2008, emissiveIntensity: 0.5 });
  const verdigris = new THREE.MeshStandardMaterial({ color: 0x3f8a74, metalness: 0.4, roughness: 0.6, flatShading: true });
  const shellRed = new THREE.MeshStandardMaterial({ color: 0x9a2a1e, roughness: 0.55, flatShading: true });
  const belly = new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.7, emissive: 0xff7a50, emissiveIntensity: 0, flatShading: true });

  // the bell: a lathe profile, mouth down
  const profile = [
    [0.0, 1.55], [0.22, 1.52], [0.36, 1.42], [0.46, 1.2], [0.55, 0.9], [0.72, 0.62], [0.95, 0.46], [1.05, 0.4],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bell = new THREE.Mesh(new THREE.LatheGeometry(profile, 18), bronze);
  bell.castShadow = true;
  bell.scale.set(1.25, 1, 1.05);
  body.add(bell);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.08, 6, 24), bronze);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.42;
  lip.scale.set(1.25, 1.05, 1);
  body.add(lip);
  // verdigris band and the crack down one side
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 5, 20), verdigris);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.86;
  band.scale.set(1.25, 1.05, 1);
  body.add(band);
  const crack = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.95, 0.06), new THREE.MeshBasicMaterial({ color: 0x120804 }));
  crack.position.set(0.55, 0.92, 0.52);
  crack.rotation.set(0.2, 0.6, 0.35);
  body.add(crack);
  // crown / hanger
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 5, 10, Math.PI), bronze);
  crown.position.y = 1.58;
  body.add(crown);

  // underside (the soft belly, bare while rearing)
  const under = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), belly);
  under.position.y = 0.44;
  under.scale.set(1.2, 0.35, 1.0);
  body.add(under);

  // eyestalks
  const eyes: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.42, 5), shellRed);
    stalk.position.set(0.28 * side, 0.62, 1.0);
    stalk.rotation.x = 0.35;
    body.add(stalk);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffcc33, emissiveIntensity: 1.4 }));
    eye.position.set(0.28 * side, 0.86, 1.08);
    body.add(eye);
    eyes.push(eye);
  }

  // claws
  const claws: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(0.95 * side, 0.45, 0.75);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.5, 3, 6), shellRed);
    upper.rotation.set(Math.PI / 2.4, 0, -0.5 * side);
    upper.position.set(0.15 * side, 0, 0.22);
    arm.add(upper);
    const pincer = new THREE.Group();
    pincer.position.set(0.32 * side, 0.08, 0.55);
    const a = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), shellRed);
    a.rotation.x = Math.PI / 2;
    a.position.set(0, 0.07, 0.2);
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 6), shellRed);
    b.rotation.x = Math.PI / 2;
    b.position.set(0, -0.08, 0.18);
    pincer.add(a, b);
    arm.add(pincer);
    body.add(arm);
    claws.push(arm);
  }

  // legs: three a side
  const legs: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const hip = new THREE.Group();
      hip.position.set(0.9 * side, 0.45, 0.25 - i * 0.42);
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.55, 3, 5), shellRed);
      thigh.position.set(0.3 * side, 0.12, 0);
      thigh.rotation.z = -1.05 * side;
      const shin = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.6, 5), shellRed);
      shin.position.set(0.62 * side, -0.18, 0);
      shin.rotation.z = Math.PI + 0.35 * side;
      hip.add(thigh, shin);
      body.add(hip);
      legs.push(hip);
    }
  }

  root.scale.setScalar(1.35);
  let t = Math.random() * 10;
  let walk = 0;
  let rear = 0;
  let rearTarget = 0;
  let calm = false;
  return {
    root,
    setEmote(what) {
      if (what === 'rear') rearTarget = 1;
      if (what === 'settle') rearTarget = 0;
      if (what === 'calm') calm = true;
    },
    update(dt, moving) {
      t += dt;
      if (moving) walk += dt * 10;
      rear += (rearTarget - rear) * Math.min(1, dt * 6);
      // rearing: tip back and lift, showing the belly
      body.rotation.x = -rear * 0.85;
      body.position.y = rear * 0.55 + (moving ? Math.abs(Math.sin(walk)) * 0.05 : 0);
      belly.emissiveIntensity = rear * 0.6;
      legs.forEach((l, i) => (l.rotation.x = moving ? Math.sin(walk + i * 1.7) * 0.35 : Math.sin(t * 1.5 + i) * 0.04));
      // claws snap while maddened, rest when calmed
      claws.forEach((c, i) => {
        c.rotation.y = calm ? 0 : Math.sin(t * 3.2 + i * 2) * 0.25;
        c.rotation.x = -rear * 0.9 + (calm ? 0.1 : Math.sin(t * 2 + i) * 0.08);
      });
      // jittery, out-of-tune shiver
      if (!calm) body.rotation.z = Math.sin(t * 23) * 0.012;
      for (const e of eyes) (e.material as THREE.MeshStandardMaterial).emissiveIntensity = calm ? 0.5 : 1.2 + Math.sin(t * 9) * 0.4;
    },
  };
}
