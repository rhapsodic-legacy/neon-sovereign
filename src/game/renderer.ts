import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { Game, GameEvent } from '../core/game';
import type { Vec2 } from '../core/state';
import { evalCond } from '../core/state';
import { buildCharacter, CharacterRig } from './characters';
import { SETS, SetPiece } from './sets';

interface Actor {
  rig: CharacterRig;
  id: string;
  leaving?: number;
}

/** Three.js presentation of the field: set-piece, characters, hotspot markers, follow camera, bloom. */
export class FieldRenderer {
  readonly renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 100);
  private set: SetPiece | null = null;
  private world = new THREE.Group();
  private player: CharacterRig;
  private actors = new Map<string, Actor>();
  private markers = new Map<string, THREE.Object3D>();
  private camTarget = new THREE.Vector3();
  private camFocus: string | null = null;
  private shake = 0;
  private effects: Effect[] = [];
  private t = 0;
  private lastPlayerPos: Vec2 = { x: 0, z: 0 };

  constructor(
    private readonly container: HTMLElement,
    private game: Game,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.4, 0.82));
    this.composer.addPass(new OutputPass());
    this.scene.add(this.world);
    this.player = buildCharacter('eddar');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  bind(game: Game): void {
    this.game = game;
  }

  resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  onEvent(e: GameEvent): void {
    switch (e.type) {
      case 'map':
        this.loadMap();
        break;
      case 'cam':
        if (e.args[0] === 'focus') this.camFocus = e.args[1] === 'eddar' ? null : e.args[1];
        if (e.args[0] === 'shake') this.shake = 0.35;
        break;
      case 'emote':
        this.actors.get(e.who)?.rig.setEmote(e.what);
        break;
      case 'npc_exit': {
        const a = this.actors.get(e.id);
        if (a) a.leaving = 0;
        break;
      }
      case 'scene_end':
        this.camFocus = null;
        break;
      case 'fx':
        if (e.id === 'violet') this.violetFlare(e.target);
        break;
    }
  }

  /** Eddar's power leaking out (DESIGN T4): a brief violet flash and a puff of sparks. Nobody in the scene notices. */
  private violetFlare(target: string): void {
    const at = target === 'eddar' ? this.player.root.position : this.actors.get(target)?.rig.root.position;
    if (!at) return;
    const g = new THREE.Group();
    g.position.set(at.x, 1.1, at.z);
    const light = new THREE.PointLight(0x9b4dff, 30, 7, 1.6);
    g.add(light);
    const mat = new THREE.MeshBasicMaterial({ color: 0xc58cff, transparent: true, toneMapped: false });
    const sparks: { m: THREE.Mesh; v: THREE.Vector3 }[] = [];
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.035 + Math.random() * 0.03), mat);
      const a = Math.random() * Math.PI * 2;
      const up = Math.random() * 1.6 - 0.3;
      sparks.push({ m, v: new THREE.Vector3(Math.cos(a) * (1 + Math.random() * 1.6), up, Math.sin(a) * (1 + Math.random() * 1.6)) });
      g.add(m);
    }
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 32), new THREE.MeshBasicMaterial({ color: 0xb06bff, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.08;
    g.add(ring);
    this.world.add(g);
    this.effects.push((dt, age) => {
      const k = Math.max(0, 1 - age / 0.9);
      light.intensity = 30 * k * k;
      mat.opacity = k;
      for (const s of sparks) {
        s.m.position.addScaledVector(s.v, dt);
        s.v.y -= dt * 2.5;
      }
      ring.scale.setScalar(1 + age * 9);
      (ring.material as THREE.MeshBasicMaterial).opacity = k * 0.8;
      if (k <= 0) {
        this.world.remove(g);
        return false;
      }
      return true;
    });
  }

  private loadMap(): void {
    this.world.clear();
    this.actors.clear();
    this.markers.clear();
    const map = this.game.map;
    this.set = (SETS[map.view] ?? SETS.wyvern)();
    this.world.add(this.set.group);
    this.scene.background = this.set.background;
    this.scene.fog = this.set.fog;
    this.world.add(this.player.root);
    for (const n of map.npcs) {
      const rig = buildCharacter(n.model);
      rig.root.position.set(n.pos.x, 0, n.pos.z);
      rig.root.rotation.y = n.facing;
      this.world.add(rig.root);
      this.actors.set(n.id, { rig, id: n.id });
    }
    for (const h of map.hotspots) {
      const m = makeMarker(h.marker);
      if (!m) continue;
      m.position.set(h.pos.x, 0, h.pos.z);
      this.world.add(m);
      this.markers.set(h.id, m);
    }
    for (const ex of map.exits) {
      if (ex.cond === 'never') continue;
      const m = makeExitMarker(ex.pos, map.walk);
      this.world.add(m);
      this.markers.set(`exit:${ex.id}`, m);
    }
    this.effects = [];
    const p = this.game.state.player.pos;
    this.camTarget.set(p.x, 0, p.z);
    this.snapCamera();
  }

  private snapCamera(): void {
    const b = this.set!.camBounds;
    const tx = clamp(this.camTarget.x, b.minX, b.maxX);
    const tz = clamp(this.camTarget.z, b.minZ, b.maxZ);
    this.camera.position.set(tx, 7.6, tz + 9.4);
    this.camera.lookAt(tx, 1.2, tz);
  }

  /** Screen position (CSS px) of a world point, for UI prompts. */
  project(x: number, y: number, z: number): { x: number; y: number } {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return {
      x: ((v.x + 1) / 2) * this.container.clientWidth,
      y: ((1 - v.y) / 2) * this.container.clientHeight,
    };
  }

  frame(dt: number): void {
    if (!this.set) return;
    this.t += dt;
    const st = this.game.state;
    const map = this.game.map;

    // player
    const p = st.player.pos;
    const moving = Math.hypot(p.x - this.lastPlayerPos.x, p.z - this.lastPlayerPos.z) > 0.0005;
    this.lastPlayerPos = { ...p };
    this.player.root.position.set(p.x, 0, p.z);
    this.player.root.rotation.y = lerpAngle(this.player.root.rotation.y, st.player.facing, Math.min(1, dt * 14));
    this.player.update(dt, moving);

    // npcs
    for (const n of map.npcs) {
      const a = this.actors.get(n.id);
      if (!a) continue;
      const present = evalCond(st, n.cond);
      if (a.leaving !== undefined) {
        a.leaving += dt;
        a.rig.root.rotation.y = Math.PI;
        a.rig.root.position.z -= dt * 3;
        a.rig.update(dt, true);
        if (a.leaving > 3) a.rig.root.visible = false;
        continue;
      }
      a.rig.root.visible = present;
      if (!present) continue;
      // face the player while they're close
      const d = Math.hypot(p.x - n.pos.x, p.z - n.pos.z);
      const want = d < 3 ? Math.atan2(p.x - n.pos.x, p.z - n.pos.z) : n.facing;
      a.rig.root.rotation.y = lerpAngle(a.rig.root.rotation.y, want, Math.min(1, dt * 4));
      a.rig.update(dt, false);
    }

    // markers
    for (const h of map.hotspots) {
      const m = this.markers.get(h.id);
      if (!m) continue;
      m.visible = evalCond(st, h.cond);
      m.userData.update?.(this.t);
    }

    // exit markers: cyan chevrons when you can leave, dim pink when the door is still locked
    for (const ex of map.exits) {
      const m = this.markers.get(`exit:${ex.id}`);
      if (!m) continue;
      const open = evalCond(st, ex.cond);
      m.userData.update?.(this.t, open);
    }

    // one-shot effects
    this.effects = this.effects.filter((fx) => {
      fx.age = (fx.age ?? 0) + dt;
      return fx(dt, fx.age);
    });

    this.set.update(dt, this.t);

    // camera
    let fx = p.x;
    let fz = p.z;
    if (this.camFocus) {
      const a = this.actors.get(this.camFocus);
      if (a) {
        fx = (a.rig.root.position.x + p.x) / 2;
        fz = (a.rig.root.position.z + p.z) / 2;
      }
    }
    this.camTarget.lerp(new THREE.Vector3(fx, 0, fz), Math.min(1, dt * 3));
    const b = this.set.camBounds;
    const tx = clamp(this.camTarget.x, b.minX, b.maxX);
    const tz = clamp(this.camTarget.z, b.minZ, b.maxZ);
    const zoom = this.game.mode === 'scene' ? 0.82 : 1;
    this.camera.position.set(tx, 7.6 * zoom, tz + 9.4 * zoom);
    if (this.shake > 0) {
      this.shake -= dt;
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.6;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.6;
    }
    this.camera.lookAt(tx, 1.2, tz);

    this.composer.render(dt);
  }
}

type Effect = ((dt: number, age: number) => boolean) & { age?: number };

/** A floor chevron just inside the walkable area, pointing at the exit. */
function makeExitMarker(pos: { x: number; z: number }, walk: { x: number; z: number }[]): THREE.Object3D {
  let cx = 0;
  let cz = 0;
  for (const v of walk) {
    cx += v.x / walk.length;
    cz += v.z / walk.length;
  }
  const dir = new THREE.Vector2(pos.x - cx, pos.z - cz).normalize();
  const g = new THREE.Group();
  g.position.set(pos.x - dir.x * 0.9, 0.02, pos.z - dir.y * 0.9);
  g.rotation.y = Math.atan2(dir.x, dir.y);
  const shape = new THREE.Shape();
  shape.moveTo(-0.32, -0.12);
  shape.lineTo(0, 0.2);
  shape.lineTo(0.32, -0.12);
  shape.lineTo(0.32, -0.26);
  shape.lineTo(0, 0.06);
  shape.lineTo(-0.32, -0.26);
  const mat = new THREE.MeshBasicMaterial({ color: 0x33e0ff, transparent: true, toneMapped: false, side: THREE.DoubleSide });
  const chevrons: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
    m.rotation.x = Math.PI / 2; // shape +y -> local +z (toward the exit)
    m.position.z = i * 0.3;
    g.add(m);
    chevrons.push(m);
  }
  g.userData.update = (t: number, open: boolean) => {
    mat.color.setHex(open ? 0x33e0ff : 0xff2bd6);
    mat.opacity = open ? 0.55 + Math.sin(t * 4) * 0.35 : 0.22;
    chevrons.forEach((c, i) => (c.position.z = i * 0.3 + (open ? ((t * 0.6) % 0.3) : 0)));
  };
  return g;
}

function makeMarker(kind?: string): THREE.Object3D | null {
  if (kind === 'puddle') {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 14),
      new THREE.MeshStandardMaterial({ color: 0x8a4a14, emissive: 0x3a1800, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.9 }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.01;
    const g = new THREE.Group();
    m.position.y = 0.012;
    g.add(m);
    const glint = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.y = 0.6;
    g.add(glint);
    g.userData.update = (t: number) => {
      glint.position.y = 0.6 + Math.sin(t * 3) * 0.08;
      glint.rotation.y = t * 2;
    };
    return g;
  }
  if (kind === 'sparkle') {
    const g = new THREE.Group();
    const s = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.09),
      new THREE.MeshStandardMaterial({ color: 0x33e0ff, emissive: 0x33e0ff, emissiveIntensity: 3, toneMapped: false }),
    );
    s.position.y = 1.4;
    g.add(s);
    g.userData.update = (t: number) => {
      s.position.y = 1.4 + Math.sin(t * 2.5) * 0.1;
      s.rotation.y = t * 1.5;
    };
    return g;
  }
  return null;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
