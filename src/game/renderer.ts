import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { Game, GameEvent } from '../core/game';
import type { Battle } from '../core/battle/engine';
import type { BattleEvent } from '../core/battle/types';
import { npcPosition } from '../core/map';
import type { Vec2 } from '../core/state';
import { evalCond } from '../core/state';
import { buildCharacter, CharacterRig } from './characters';
import { SETS, SetPiece } from './sets';

interface Actor {
  rig: CharacterRig;
  id: string;
  /** Waypoints a scene has queued (`@cmd move_npc`, `@cmd enter_npc`). */
  path: Vec2[];
  leaving?: number;
  leaveDir?: Vec2;
}

/** A combatant on the battle stage. */
interface BattleActor {
  rig: CharacterRig;
  id: string;
  side: 'party' | 'enemy';
  home: THREE.Vector3;
  facing: number;
  /** Current one-shot motion (lunge, hop, cover dash), if any. */
  move?: { to: THREE.Vector3; t: number; dur: number; back: boolean };
  hitT: number;
  ko: number;
  broken: boolean;
}

/** Where each battle is staged inside its field set, and where the camera sits (DESIGN §6: fights happen where you stand). */
const STAGING: Record<string, { center: Vec2; cam: [number, number, number]; spread: number; gap: number }> = {
  dock_crew: { center: { x: 0, z: -1.7 }, cam: [1.2, 8.2, 6.4], spread: 1.7, gap: 1.8 },
  bellshell: { center: { x: 0.4, z: 0.9 }, cam: [2.6, 8.0, 7.4], spread: 1.7, gap: 2.0 },
};
const DEFAULT_STAGING = { center: { x: 0, z: 0 }, cam: [2.0, 8.0, 7.4] as [number, number, number], spread: 1.6, gap: 2.0 };

/** Entrances per field set (`@cmd enter_npc <npc> <from>`). */
const ENTRANCES: Record<string, Record<string, Vec2>> = {
  wyvern: { front: { x: 0, z: 7.2 }, back: { x: 7.9, z: -2.6 }, window: { x: 8.6, z: 5.4 } },
  alley: { front: { x: 0, z: -10.5 }, back: { x: 2.7, z: 5.2 } },
};
const EXIT_DIRS: Record<string, Vec2> = { front: { x: 0, z: 1 }, back: { x: 0, z: -1 }, left: { x: -1, z: 0 }, right: { x: 1, z: 0 } };

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
  /** Where Eddar is drawn while a cutscene walks him to a new spot (the core has already moved him). */
  private playerWalk: THREE.Vector3 | null = null;
  private shake = 0;
  private effects: Effect[] = [];
  private t = 0;
  private lastPlayerPos: Vec2 = { x: 0, z: 0 };
  private battleGroup = new THREE.Group();
  /** Leagues' gold threads stay until the scene says `@fx gold_threads off`. */
  private threadsOn = false;
  private bActors = new Map<string, BattleActor>();
  private battleCam: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;

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
    this.scene.add(this.battleGroup);
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
        if (a) {
          a.leaving = 0;
          a.leaveDir = EXIT_DIRS[e.dir] ?? EXIT_DIRS.back;
          a.path = [];
        }
        break;
      }
      case 'player_move':
        this.playerWalk = this.player.root.position.clone();
        break;
      case 'npc_enter': {
        const a = this.actors.get(e.id);
        const from = ENTRANCES[this.game.map.view]?.[e.from];
        const n = this.game.map.npcs.find((x) => x.id === e.id);
        if (a && from && n) {
          a.rig.root.position.set(from.x, 0, from.z);
          a.path = [npcPosition(this.game.state, this.game.map.id, n)];
        }
        break;
      }
      case 'npc_move':
        this.actors.get(e.id)?.path.push({ x: e.x, z: e.z });
        break;
      case 'scene_end':
        this.camFocus = null;
        break;
      case 'fx':
        if (e.id === 'violet') this.violetFlare(e.target);
        if (e.id === 'gold_threads') {
          if (e.target === 'off') this.threadsOn = false;
          else this.goldThreads(e.target);
        }
        if (e.id === 'eye_flash') this.eyeFlash(e.target);
        if (e.id === 'shatter') this.shatter();
        break;
    }
  }

  private actorPos(id: string): THREE.Vector3 | undefined {
    if (id === 'eddar') return this.player.root.position;
    return this.actors.get(id)?.rig.root.position;
  }

  /** Leagues' music pouring into the band (storyboard v2, "The Canticle" cutscene): gold threads, flowing. */
  private goldThreads(from: string): void {
    const src = this.actorPos(from);
    if (!src) return;
    const g = new THREE.Group();
    this.world.add(g);
    const mats: THREE.MeshBasicMaterial[] = [];
    const flows: { curve: THREE.CatmullRomCurve3; motes: THREE.Mesh[] }[] = [];
    for (const to of ['spike', 'lulu', 'roxy']) {
      const dst = this.actorPos(to);
      if (!dst) continue;
      const a = new THREE.Vector3(src.x, 1.5, src.z);
      const b = new THREE.Vector3(dst.x, 1.6, dst.z);
      const mid = a.clone().lerp(b, 0.5);
      mid.y += 1.4;
      const curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.5).add(new THREE.Vector3(0, 0.4, 0.3)), mid, b]);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0, toneMapped: false });
      mats.push(mat);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.018, 5), mat);
      g.add(tube);
      const motes: THREE.Mesh[] = [];
      for (let i = 0; i < 7; i++) {
        const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), mat);
        g.add(m);
        motes.push(m);
      }
      flows.push({ curve, motes });
    }
    const light = new THREE.PointLight(0xffc94a, 0, 9, 1.5);
    light.position.set(src.x, 2, src.z);
    g.add(light);
    this.threadsOn = true;
    let fade = 1;
    this.effects.push((dt, age) => {
      if (!this.threadsOn) fade = Math.max(0, fade - dt / 1.5);
      const k = Math.min(1, age / 1.5) * fade;
      for (const m of mats) m.opacity = k * (0.65 + Math.sin(age * 6) * 0.2);
      light.intensity = 14 * k;
      for (const f of flows) f.motes.forEach((m, i) => m.position.copy(f.curve.getPoint(((age * 0.45 + i / f.motes.length) % 1))));
      if (fade <= 0) {
        this.world.remove(g);
        return false;
      }
      return true;
    });
  }

  /** White eye-flash on a character, or on the whole band. */
  private eyeFlash(target: string): void {
    const ids = target === 'band' ? ['spike', 'lulu', 'roxy'] : [target];
    for (const id of ids) {
      const at = this.actorPos(id);
      if (!at) continue;
      const light = new THREE.PointLight(0xffffff, 0, 2, 2);
      const h = id === 'leagues' ? 1.85 : 1.75;
      light.position.set(at.x, h, at.z + 0.25);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false }));
      glint.position.copy(light.position);
      this.world.add(light, glint);
      this.effects.push((_dt, age) => {
        const k = age < 0.15 ? age / 0.15 : Math.max(0, 1 - (age - 0.15) / 1.4);
        light.intensity = 6 * k;
        (glint.material as THREE.MeshBasicMaterial).opacity = k;
        glint.scale.set(1 + k * 2.5, 0.5 + k * 0.3, 1);
        if (k <= 0 && age > 0.2) {
          this.world.remove(light, glint);
          return false;
        }
        return true;
      });
    }
  }

  /** The front window bursts inward (the Bellshell). Shards fly and stay where they land. */
  private shatter(): void {
    const at = new THREE.Vector3(7.9, 1.4, 5.3);
    const g = new THREE.Group();
    this.world.add(g);
    const mat = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.75, side: THREE.DoubleSide, emissive: 0x335566 });
    const shards: { m: THREE.Mesh; v: THREE.Vector3; spin: THREE.Vector3 }[] = [];
    for (let i = 0; i < 46; i++) {
      const tri = new THREE.BufferGeometry();
      const sz = 0.08 + Math.random() * 0.16;
      tri.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, sz, Math.random() * sz, 0, Math.random() * sz, sz, 0], 3));
      tri.computeVertexNormals();
      const m = new THREE.Mesh(tri, mat);
      m.position.copy(at).add(new THREE.Vector3(0, (Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.4));
      g.add(m);
      shards.push({ m, v: new THREE.Vector3(-2 - Math.random() * 4, Math.random() * 2.5, (Math.random() - 0.5) * 3), spin: new THREE.Vector3(Math.random() * 9, Math.random() * 9, 0) });
    }
    const flash = new THREE.PointLight(0xcfefff, 40, 8, 1.6);
    flash.position.copy(at);
    g.add(flash);
    this.shake = 0.5;
    this.effects.push((dt, age) => {
      flash.intensity = Math.max(0, 40 * (1 - age / 0.4));
      let moving = false;
      for (const s of shards) {
        if (s.m.position.y <= 0.02) continue;
        moving = true;
        s.v.y -= dt * 9;
        s.m.position.addScaledVector(s.v, dt);
        s.m.rotation.x += s.spin.x * dt;
        s.m.rotation.y += s.spin.y * dt;
        if (s.m.position.y <= 0.02) {
          s.m.position.y = 0.02;
          s.m.rotation.set(-Math.PI / 2, 0, Math.random() * 6);
        }
      }
      return moving || age < 0.5;
    });
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
      const np = npcPosition(this.game.state, map.id, n);
      rig.root.position.set(np.x, 0, np.z);
      rig.root.rotation.y = n.facing;
      this.world.add(rig.root);
      this.actors.set(n.id, { rig, id: n.id, path: [] });
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
    this.playerWalk = null;
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

    const inBattle = this.game.mode === 'battle' && this.bActors.size > 0;
    this.player.root.visible = !inBattle;
    if (inBattle) this.updateBattle(dt);

    // player
    const p = st.player.pos;
    let moving = Math.hypot(p.x - this.lastPlayerPos.x, p.z - this.lastPlayerPos.z) > 0.0005;
    this.lastPlayerPos = { ...p };
    if (this.playerWalk) {
      const dx = p.x - this.playerWalk.x;
      const dz = p.z - this.playerWalk.z;
      const d = Math.hypot(dx, dz);
      const step = dt * 4.5;
      if (d <= step) this.playerWalk = null;
      else {
        this.playerWalk.x += (dx / d) * step;
        this.playerWalk.z += (dz / d) * step;
        moving = true;
      }
    }
    const drawn = this.playerWalk ?? p;
    this.player.root.position.set(drawn.x, 0, drawn.z);
    this.player.root.rotation.y = lerpAngle(this.player.root.rotation.y, st.player.facing, Math.min(1, dt * 14));
    this.player.update(dt, moving);

    // npcs
    for (const n of map.npcs) {
      const a = this.actors.get(n.id);
      if (!a) continue;
      const present = evalCond(st, n.cond);
      if (inBattle) {
        a.rig.root.visible = false;
        continue;
      }
      if (a.leaving !== undefined) {
        a.leaving += dt;
        const dir = a.leaveDir ?? EXIT_DIRS.back;
        a.rig.root.rotation.y = Math.atan2(dir.x, dir.z);
        a.rig.root.position.x += dir.x * dt * 3;
        a.rig.root.position.z += dir.z * dt * 3;
        a.rig.update(dt, true);
        a.rig.root.visible = a.leaving < 3;
        continue;
      }
      a.rig.root.visible = present;
      if (!present) continue;
      const rp = a.rig.root.position;
      if (a.path.length) {
        // walking a scripted path
        const w = a.path[0];
        const dx = w.x - rp.x;
        const dz = w.z - rp.z;
        const dist = Math.hypot(dx, dz);
        const step = dt * 2.6;
        if (dist <= step) {
          rp.x = w.x;
          rp.z = w.z;
          a.path.shift();
        } else {
          rp.x += (dx / dist) * step;
          rp.z += (dz / dist) * step;
          a.rig.root.rotation.y = lerpAngle(a.rig.root.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 10));
        }
        a.rig.update(dt, true);
        continue;
      }
      // face the player while they're close
      const d = Math.hypot(p.x - rp.x, p.z - rp.z);
      const want = d < 3 ? Math.atan2(p.x - rp.x, p.z - rp.z) : n.facing;
      a.rig.root.rotation.y = lerpAngle(a.rig.root.rotation.y, want, Math.min(1, dt * 4));
      a.rig.update(dt, false);
    }

    // set props tied to hotspots (the spare guitar leaves with Leagues; the window breaks)
    if (this.set.props) for (const h of map.hotspots) if (this.set.props[h.id]) this.set.props[h.id].visible = evalCond(st, h.cond);

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
    if (inBattle && this.battleCam) {
      const c = this.battleCam;
      this.camera.position.copy(c.pos);
      this.camera.position.x += Math.sin(this.t * 0.25) * 0.35;
      if (this.shake > 0) {
        this.shake -= dt;
        this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.6;
        this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.6;
      }
      this.camera.lookAt(c.look);
      this.composer.render(dt);
      return;
    }
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

  // ---------------------------------------------------------------- battle staging

  /** Stage a battle in the current set: party on one side, foes on the other, a fixed three-quarter camera. */
  startBattle(b: Battle): void {
    this.clearBattle();
    const st = STAGING[b.def.id] ?? DEFAULT_STAGING;
    const c = st.center;
    const place = (ids: string[], side: 'party' | 'enemy') => {
      const z = c.z + (side === 'party' ? st.gap : -st.gap);
      ids.forEach((id, i) => {
        const u = b.unit(id);
        const rig = buildCharacter(u.model);
        const x = c.x + (i - (ids.length - 1) / 2) * st.spread;
        const home = new THREE.Vector3(x, 0, z + (side === 'enemy' && ids.length > 1 ? Math.abs(i - 1) * -0.4 : 0));
        const facing = side === 'party' ? Math.PI : 0;
        rig.root.position.copy(home);
        rig.root.rotation.y = facing;
        this.battleGroup.add(rig.root);
        this.bActors.set(id, { rig, id, side, home, facing, hitT: 0, ko: 0, broken: false });
      });
    };
    place(b.def.party, 'party');
    place(b.def.enemies, 'enemy');
    this.battleCam = {
      pos: new THREE.Vector3(c.x + st.cam[0], st.cam[1], c.z + st.cam[2]),
      // look a little past the middle, toward the foes, so their labels stay on screen above the party
      look: new THREE.Vector3(c.x, 0.4, c.z - 0.9),
    };
  }

  endBattle(): void {
    this.clearBattle();
    this.battleCam = null;
    this.snapCamera();
  }

  private clearBattle(): void {
    this.battleGroup.clear();
    this.bActors.clear();
  }

  /** Screen position (CSS px) above a combatant's head, for damage numbers and labels. */
  battleScreenPos(id: string, height = 2.2): { x: number; y: number } | null {
    const a = this.bActors.get(id);
    if (!a) return null;
    const p = a.rig.root.position;
    const h = a.rig.root.scale.y * height * (a.id === 'bellshell' ? 1.0 : 1);
    return this.project(p.x, h, p.z);
  }

  /** Animate one battle event. Returns how long the UI should wait before the next one (seconds). */
  animateBattle(e: BattleEvent): number {
    switch (e.type) {
      case 'action': {
        const a = this.bActors.get(e.actor);
        if (!a) return 0.3;
        if (e.skill === 'rear') {
          a.rig.setEmote('rear');
          return 0.8;
        }
        if (e.skill === 'wind_up') {
          a.move = { to: a.home.clone().add(new THREE.Vector3(0, 0, a.side === 'enemy' ? -0.35 : 0.35)), t: 0, dur: 0.6, back: true };
          return 0.7;
        }
        const foe = e.targets.map((t) => this.bActors.get(t)).find((t) => t && t.side !== a.side);
        if (e.skill === 'meltdown') {
          for (const t of e.targets) this.burst(t, 0xff5a1a, 1.2);
          this.shake = 0.5;
          return 1.0;
        }
        if (foe) {
          const to = a.home.clone().lerp(foe.rig.root.position, e.skill === 'read' || e.skill === 'lift' ? 0.18 : 0.62);
          a.move = { to, t: 0, dur: 0.5, back: true };
          if (e.skill === 'read') this.scanRing(foe.id);
          if (e.skill === 'toll') this.shake = 0.45;
          return e.skill === 'read' ? 0.55 : 0.45;
        }
        if (e.skill === 'toll') {
          this.burst(a.id, 0xffd36b, 1.6);
          this.shake = 0.6;
          return 0.8;
        }
        // self/ally skills: a small hop
        a.move = { to: a.home.clone().add(new THREE.Vector3(0, 0.3, 0)), t: 0, dur: 0.4, back: true };
        return 0.45;
      }
      case 'damage': {
        const a = this.bActors.get(e.target);
        if (a) a.hitT = 0.32;
        if (e.amount > 60) this.shake = Math.max(this.shake, 0.25);
        return 0.35;
      }
      case 'heal':
        this.burst(e.target, 0x6bff9a, 0.7);
        return 0.45;
      case 'interrupt': {
        const a = this.bActors.get(e.target);
        if (a) {
          this.battleViolet(a);
          a.move = { to: a.home.clone().add(new THREE.Vector3(0, 0.5, a.side === 'enemy' ? -0.5 : 0.5)), t: 0, dur: 0.6, back: true };
        }
        return 0.6;
      }
      case 'break':
        this.burst(e.target, 0xffd24a, 1.0);
        return 0.5;
      case 'cover': {
        const by = this.bActors.get(e.by);
        const f = this.bActors.get(e.for);
        if (by && f) by.move = { to: f.home.clone().add(new THREE.Vector3(0, 0, -0.7)), t: 0, dur: 0.7, back: true };
        return 0.45;
      }
      case 'status': {
        const a = this.bActors.get(e.target);
        if (!a) return 0;
        if (e.id === 'rearing' && !e.on) a.rig.setEmote('settle');
        if (e.id === 'broken') a.broken = e.on;
        return 0;
      }
      case 'ko': {
        const a = this.bActors.get(e.unit);
        if (a) a.ko = 0.001;
        return 0.6;
      }
      case 'end': {
        if (e.result === 'mercy') this.bActors.get('bellshell')?.rig.setEmote('settle');
        return 0.4;
      }
      default:
        return 0;
    }
  }

  private updateBattle(dt: number): void {
    for (const a of this.bActors.values()) {
      const r = a.rig.root;
      let moving = false;
      if (a.move) {
        a.move.t += dt;
        const k = Math.min(1, a.move.t / a.move.dur);
        const out = a.move.back ? (k < 0.5 ? k * 2 : (1 - k) * 2) : k;
        r.position.lerpVectors(a.home, a.move.to, easeInOut(out));
        moving = true;
        if (k >= 1) {
          a.move = undefined;
          r.position.copy(a.home);
        }
      }
      if (a.hitT > 0) {
        a.hitT -= dt;
        r.position.x = a.home.x + Math.sin(a.hitT * 70) * 0.08;
        r.rotation.z = Math.sin(a.hitT * 40) * 0.06;
      } else r.rotation.z = a.ko > 0 ? r.rotation.z : 0;
      if (a.ko > 0) {
        a.ko += dt;
        r.rotation.z = Math.min(Math.PI / 2, a.ko * 4) * (a.side === 'enemy' ? 1 : -1);
        r.position.y = -Math.min(0.2, a.ko * 0.3);
        if (a.side === 'enemy' && a.ko > 1.2) r.visible = false;
      }
      r.rotation.y = lerpAngle(r.rotation.y, a.facing, Math.min(1, dt * 8));
      if (a.broken && !a.ko) r.rotation.x = Math.sin(this.t * 10) * 0.05;
      a.rig.update(dt, moving);
    }
  }

  private scanRing(id: string): void {
    const a = this.bActors.get(id);
    if (!a) return;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.02, 4, 32), new THREE.MeshBasicMaterial({ color: 0x33e0ff, transparent: true, toneMapped: false }));
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(a.rig.root.position);
    this.battleGroup.add(ring);
    this.effects.push((_dt, age) => {
      ring.position.y = 0.1 + age * 2.4;
      (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - age);
      if (age > 1) {
        this.battleGroup.remove(ring);
        return false;
      }
      return true;
    });
  }

  private burst(id: string, color: number, size: number): void {
    const a = this.bActors.get(id);
    if (!a) return;
    const at = a.rig.root.position;
    const light = new THREE.PointLight(color, 30, 5, 1.6);
    light.position.set(at.x, 1.2, at.z);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 32), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(at.x, 0.05, at.z);
    this.battleGroup.add(light, ring);
    this.effects.push((_dt, age) => {
      const k = Math.max(0, 1 - age / 0.7);
      light.intensity = 30 * k;
      mat.opacity = k;
      ring.scale.setScalar(1 + age * 6 * size);
      if (k <= 0) {
        this.battleGroup.remove(light, ring);
        return false;
      }
      return true;
    });
  }

  /** Lift: Eddar's power, subtle, on the target. (He thinks it was the bin lid.) */
  private battleViolet(a: BattleActor): void {
    const light = new THREE.PointLight(0x9b4dff, 18, 4, 1.6);
    light.position.set(a.rig.root.position.x, 1.0, a.rig.root.position.z);
    this.battleGroup.add(light);
    this.effects.push((_dt, age) => {
      light.intensity = 18 * Math.max(0, 1 - age / 0.5);
      if (age > 0.5) {
        this.battleGroup.remove(light);
        return false;
      }
      return true;
    });
  }
}

const easeInOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

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
