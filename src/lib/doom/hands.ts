import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// ─── THE HANDS — v2.0 viewmodel seraph hands ────────────────────────────────
// Real 3D geometry (not sprites): rounded palms, 14 jointed fingers per pose,
// pearlescent skin with golden sheen, gilded cuffs of light at the wrists,
// lit by their own key/rim/fill trio and the temple's own PMREM sky. They
// breathe, sway with your look, bob with your steps, and hold things:
// a VOIDCAM raises to your eye, a HALO MUG tips toward your lips.
//
// Rendered AFTER the post chain in a depth-cleared overlay pass — the classic
// viewmodel trick — so bloom never blows them out and they stay crisp.

export type HandPoseName =
  | "idle"
  | "reach"
  | "press"
  | "camera"
  | "mug"
  | "revere"
  | "rest"
  | "thumbs"
  | "carry";

interface HandTarget {
  /** rig-local position of the wrist */
  pos: [number, number, number];
  /** rig-local euler of the palm */
  rot: [number, number, number];
  /** curls per finger [thumb, index, middle, ring, pinky] 0..1 */
  curl: [number, number, number, number, number];
  /** finger fan spread */
  spread: number;
}

interface Pose {
  L: HandTarget;
  R: HandTarget;
  cameraProp: boolean;
  mugProp: boolean;
}

const P = (
  pos: [number, number, number],
  rot: [number, number, number],
  curl: [number, number, number, number, number],
  spread: number
): HandTarget => ({ pos, rot, curl, spread });

const POSES: Record<HandPoseName, Pose> = {
  // relaxed at the sides of view, fingers softly curled
  idle: {
    L: P([-0.17, -0.34, -0.5], [0.25, 0.4, 0.12], [0.3, 0.28, 0.25, 0.27, 0.32], 0.25),
    R: P([0.17, -0.34, -0.5], [0.25, -0.4, -0.12], [0.3, 0.28, 0.25, 0.27, 0.32], 0.25),
    cameraProp: false,
    mugProp: false,
  },
  // right hand forward — pointing at the haloed relic
  reach: {
    L: P([-0.19, -0.36, -0.48], [0.3, 0.45, 0.15], [0.35, 0.3, 0.28, 0.3, 0.35], 0.2),
    R: P([0.03, -0.16, -0.42], [-0.35, -0.1, -0.28], [0.12, 0.04, 0.05, 0.06, 0.1], 0.55),
    cameraProp: false,
    mugProp: false,
  },
  // a decisive button push — index curled ready, wrist cocked
  press: {
    L: P([-0.19, -0.35, -0.48], [0.3, 0.45, 0.15], [0.35, 0.3, 0.28, 0.3, 0.35], 0.2),
    R: P([0.05, -0.19, -0.4], [-0.25, -0.15, -0.2], [0.25, 0.55, 0.6, 0.62, 0.6], 0.3),
    cameraProp: false,
    mugProp: false,
  },
  // both hands cradle the VOIDCAM up to the eye
  camera: {
    L: P([-0.1, -0.15, -0.42], [-0.15, 0.5, 0.35], [0.45, 0.5, 0.52, 0.55, 0.55], 0.12),
    R: P([0.1, -0.16, -0.4], [-0.2, -0.35, -0.3], [0.5, 0.35, 0.38, 0.4, 0.42], 0.1),
    cameraProp: true,
    mugProp: false,
  },
  // right hand raises the HALO MUG
  mug: {
    L: P([-0.19, -0.35, -0.48], [0.3, 0.45, 0.15], [0.35, 0.3, 0.28, 0.3, 0.35], 0.2),
    R: P([0.06, -0.12, -0.4], [-0.5, -0.2, -0.35], [0.4, 0.62, 0.65, 0.66, 0.6], 0.08),
    cameraProp: false,
    mugProp: true,
  },
  // both palms raised in reverence
  revere: {
    L: P([-0.13, -0.1, -0.44], [-0.7, 0.35, 0.3], [0.08, 0.05, 0.05, 0.06, 0.08], 0.7),
    R: P([0.13, -0.1, -0.44], [-0.7, -0.35, -0.3], [0.08, 0.05, 0.05, 0.06, 0.08], 0.7),
    cameraProp: false,
    mugProp: false,
  },
  // seated — hands resting on knees
  rest: {
    L: P([-0.2, -0.38, -0.46], [0.55, 0.5, 0.25], [0.4, 0.45, 0.42, 0.45, 0.5], 0.15),
    R: P([0.2, -0.38, -0.46], [0.55, -0.5, -0.25], [0.4, 0.45, 0.42, 0.45, 0.5], 0.15),
    cameraProp: false,
    mugProp: false,
  },
  // double thumbs up — the checkout blessing
  thumbs: {
    L: P([-0.15, -0.2, -0.44], [-0.4, 0.55, 0.35], [0.9, 0.95, 0.95, 0.95, 0.95], 0.1),
    R: P([0.15, -0.2, -0.44], [-0.4, -0.55, -0.35], [0.9, 0.95, 0.95, 0.95, 0.95], 0.1),
    cameraProp: false,
    mugProp: false,
  },
  // carrying a relic — both hands spread beneath it
  carry: {
    L: P([-0.12, -0.3, -0.42], [0.15, 0.6, 0.2], [0.15, 0.1, 0.1, 0.12, 0.15], 0.85),
    R: P([0.12, -0.3, -0.42], [0.15, -0.6, -0.2], [0.15, 0.1, 0.1, 0.12, 0.15], 0.85),
    cameraProp: false,
    mugProp: false,
  },
};

interface FingerRig {
  root: THREE.Group;
  segs: THREE.Group[];
}

interface HandRig {
  root: THREE.Group;
  palm: THREE.Group;
  fingers: FingerRig[]; // [thumb, index, middle, ring, pinky]
  forearm: THREE.Group;
}

const SKIN = 0xe9c9a6;

export class HandsView {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(55, 1, 0.01, 4);
  private rig = new THREE.Group();
  private handL!: HandRig;
  private handR!: HandRig;
  private cameraProp!: THREE.Group;
  private mugProp!: THREE.Group;
  private skinMat: THREE.MeshPhysicalMaterial;
  private goldMat: THREE.MeshStandardMaterial;
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // live interpolated state
  private poseName: HandPoseName = "idle";
  private cur = {
    L: { ...POSES.idle.L, curl: [...POSES.idle.L.curl] as number[] },
    R: { ...POSES.idle.R, curl: [...POSES.idle.R.curl] as number[] },
  };
  private propVis = { camera: 0, mug: 0 };
  private sway = { x: 0, y: 0 };
  private t = 0;

  constructor(envTexture: THREE.Texture | null) {
    this.scene.add(this.rig);
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);
    this.rig.position.set(0, 0, 0);

    // ── materials: pearlescent seraph skin + gilded cuffs ──
    this.skinMat = new THREE.MeshPhysicalMaterial({
      color: SKIN,
      roughness: 0.52,
      metalness: 0.0,
      clearcoat: 0.18,
      clearcoatRoughness: 0.5,
      sheen: 0.65,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color(0xffdca8),
      envMapIntensity: 0.55,
    });
    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xd9a742,
      roughness: 0.22,
      metalness: 1.0,
      emissive: 0x503a10,
      emissiveIntensity: 0.7,
      envMapIntensity: 1.5,
    });
    this.disposables.push(this.skinMat, this.goldMat);

    if (envTexture) {
      this.scene.environment = envTexture;
    }

    // ── the light trio (temple-toned) ──
    const key = new THREE.DirectionalLight(0xfff1d8, 2.2);
    key.position.set(0.4, 0.9, 0.6);
    const rim = new THREE.DirectionalLight(0xffd9a0, 1.4);
    rim.position.set(-0.7, 0.4, -0.8);
    const fill = new THREE.DirectionalLight(0x9fd8d0, 0.5);
    fill.position.set(0, -0.8, 0.3);
    const amb = new THREE.AmbientLight(0xd8e8ee, 0.65);
    this.scene.add(key, rim, fill, amb);

    this.handL = this.makeHand(-1);
    this.handR = this.makeHand(1);
    this.rig.add(this.handL.root, this.handR.root);

    // ── held props ──
    this.cameraProp = this.makeCameraProp();
    this.mugProp = this.makeMugProp();
    this.cameraProp.visible = false;
    this.mugProp.visible = false;
    this.rig.add(this.cameraProp, this.mugProp);
  }

  // ── geometry factory — a jointed hand of rounded volumes ──
  private makeHand(side: 1 | -1): HandRig {
    const root = new THREE.Group();
    const palm = new THREE.Group();
    palm.position.set(0, 0, 0);
    root.add(palm);

    // palm: rounded slab, slightly cupped
    const palmGeo = new RoundedBoxGeometry(0.085, 0.1, 0.105, 3, 0.028);
    const palmMesh = new THREE.Mesh(palmGeo, this.skinMat);
    palm.add(palmMesh);
    this.disposables.push(palmGeo);

    // knuckle ridge + wrist mound for organic silhouette
    const knuckleGeo = new RoundedBoxGeometry(0.08, 0.03, 0.03, 2, 0.013);
    const knuckle = new THREE.Mesh(knuckleGeo, this.skinMat);
    knuckle.position.set(0, 0.012, 0.052);
    palm.add(knuckle);
    this.disposables.push(knuckleGeo);

    const fingers: FingerRig[] = [];
    // finger placement along the knuckle ridge (x offsets, z forward)
    // [thumb, index, middle, ring, pinky]
    const fx = [0.045, 0.032, 0.01, -0.014, -0.036];
    const fy = [-0.008, 0.012, 0.014, 0.008, -0.002];
    const fl = [0.05, 0.062, 0.068, 0.06, 0.05]; // segment length scale
    const segCounts = [2, 3, 3, 3, 3];

    for (let f = 0; f < 5; f++) {
      const rootG = new THREE.Group();
      // thumb juts sideways-in; fingers fan along the ridge
      if (f === 0) {
        rootG.position.set(side * 0.048, -0.018, 0.018);
        rootG.rotation.set(0.35, side * -0.9, side * -0.5);
      } else {
        rootG.position.set(side * fx[f], fy[f], 0.05);
      }
      const segs: THREE.Group[] = [];
      let parent: THREE.Object3D = rootG;
      for (let s = 0; s < segCounts[f]; s++) {
        const seg = new THREE.Group();
        const len = fl[f] * (s === 0 ? 1 : 0.85);
        const w = 0.02 - s * 0.0022 - (f === 4 ? 0.003 : 0) - (f === 0 ? 0.004 : 0);
        const geo = new RoundedBoxGeometry(w, w * 1.05, len, 2, w * 0.45);
        const mesh = new THREE.Mesh(geo, this.skinMat);
        mesh.position.z = len / 2;
        seg.add(mesh);
        this.disposables.push(geo);
        // pivot at the joint, segment extends +Z
        parent.add(seg);
        segs.push(seg);
        parent = seg;
        // fingertip nail — a sliver of pearl
        if (s === segCounts[f] - 1) {
          const nailGeo = new RoundedBoxGeometry(w * 0.55, 0.004, len * 0.55, 1, 0.0015);
          const nail = new THREE.Mesh(nailGeo, this.skinMat);
          nail.position.set(0, w * 0.5, len * 0.45);
          seg.add(nail);
          this.disposables.push(nailGeo);
        }
      }
      palm.add(rootG);
      fingers.push({ root: rootG, segs });
    }

    // forearm: skin capsule flowing down off-screen + gilded cuff of light
    const forearm = new THREE.Group();
    forearm.position.set(0, -0.055, -0.055);
    forearm.rotation.x = 0.9;
    const armGeo = new THREE.CapsuleGeometry(0.043, 0.34, 6, 12);
    const arm = new THREE.Mesh(armGeo, this.skinMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.z = -0.17;
    forearm.add(arm);
    this.disposables.push(armGeo);

    const cuffGeo = new THREE.CylinderGeometry(0.052, 0.046, 0.075, 18, 1, true);
    const cuff = new THREE.Mesh(cuffGeo, this.goldMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.z = -0.02;
    forearm.add(cuff);
    const cuffRimGeo = new THREE.TorusGeometry(0.05, 0.006, 8, 22);
    const cuffRim = new THREE.Mesh(cuffRimGeo, this.goldMat);
    cuffRim.position.z = 0.015;
    forearm.add(cuffRim);
    this.disposables.push(cuffGeo, cuffRimGeo);
    root.add(forearm);

    return { root, palm, fingers, forearm };
  }

  private makeCameraProp(): THREE.Group {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.45, metalness: 0.35 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x454c54, roughness: 0.3, metalness: 0.85 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0e2a2e, roughness: 0.08, metalness: 0.9 });
    const tealMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: 0x2dd4bf, emissiveIntensity: 1.6, roughness: 0.3 });
    this.disposables.push(bodyMat, metalMat, glassMat, tealMat);
    const mk = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      this.disposables.push(geo);
      g.add(m);
      return m;
    };
    mk(new RoundedBoxGeometry(0.13, 0.085, 0.055, 2, 0.01), bodyMat, 0, 0.02, 0); // body
    mk(new RoundedBoxGeometry(0.035, 0.08, 0.06, 1, 0.008), bodyMat, -0.07, 0.012, 0); // grip
    const lens = mk(new THREE.CylinderGeometry(0.032, 0.036, 0.05, 20), metalMat, 0.012, 0.02, 0.05);
    lens.rotation.x = Math.PI / 2;
    const glass = mk(new THREE.CylinderGeometry(0.024, 0.024, 0.008, 20), glassMat, 0.012, 0.02, 0.077);
    glass.rotation.x = Math.PI / 2;
    mk(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 14), tealMat, -0.03, 0.065, 0.01).rotation.z = Math.PI / 2; // shutter dial
    mk(new RoundedBoxGeometry(0.02, 0.012, 0.02), metalMat, 0.045, 0.068, -0.01); // hot shoe
    g.position.set(0.02, -0.1, -0.46);
    g.rotation.set(0.12, 0, 0);
    return g;
  }

  private makeMugProp(): THREE.Group {
    const g = new THREE.Group();
    const ceramic = new THREE.MeshPhysicalMaterial({
      color: 0xf5efdd, roughness: 0.3, metalness: 0.08, clearcoat: 0.5, clearcoatRoughness: 0.25,
    });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd9a742, roughness: 0.22, metalness: 1, envMapIntensity: 1.4 });
    const coffee = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.18, metalness: 0.35 });
    this.disposables.push(ceramic, gold, coffee);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.07, 22), ceramic);
    g.add(body);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0028, 8, 22), gold);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.035;
    g.add(rim);
    const brew = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.004, 20), coffee);
    brew.position.y = 0.03;
    g.add(brew);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 10, 18), gold);
    handle.position.set(0.04, 0, 0);
    handle.rotation.y = Math.PI / 2;
    g.add(handle);
    for (const geo of [body.geometry, rim.geometry, brew.geometry, handle.geometry]) this.disposables.push(geo);
    g.position.set(0.055, -0.07, -0.42);
    g.rotation.set(-0.5, 0, 0.1);
    return g;
  }

  setPose(name: HandPoseName) {
    this.poseName = name;
  }

  getPose(): HandPoseName {
    return this.poseName;
  }

  /** resize the overlay camera to the canvas aspect */
  resize(w: number, h: number) {
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, t: number, look: { vx: number; vy: number }, bob: { phase: number; amp: number }) {
    this.t = t;
    const target = POSES[this.poseName];
    const k = Math.min(1, dt * 9);
    for (const side of ["L", "R"] as const) {
      const cur = this.cur[side];
      const tgt = target[side];
      for (let i = 0; i < 3; i++) {
        cur.pos[i] += (tgt.pos[i] - cur.pos[i]) * k;
        cur.rot[i] += (tgt.rot[i] - cur.rot[i]) * k;
      }
      for (let f = 0; f < 5; f++) cur.curl[f] += (tgt.curl[f] - cur.curl[f]) * k;
      cur.spread += (tgt.spread - cur.spread) * k;
    }
    this.propVis.camera += ((target.cameraProp ? 1 : 0) - this.propVis.camera) * k;
    this.propVis.mug += ((target.mugProp ? 1 : 0) - this.propVis.mug) * k;
    this.cameraProp.visible = this.propVis.camera > 0.02;
    this.mugProp.visible = this.propVis.mug > 0.02;
    const pop = (v: number) => 0.7 + 0.3 * v;
    this.cameraProp.scale.setScalar(pop(this.propVis.camera));
    this.mugProp.scale.setScalar(pop(this.propVis.mug));

    // apply to rigs
    for (const side of ["L", "R"] as const) {
      const hand = side === "L" ? this.handL : this.handR;
      const cur = this.cur[side];
      hand.root.position.set(cur.pos[0], cur.pos[1], cur.pos[2]);
      hand.palm.rotation.set(cur.rot[0], cur.rot[1], cur.rot[2]);
      const spreadDir = side === "L" ? -1 : 1;
      for (let f = 0; f < 5; f++) {
        const fr = hand.fingers[f];
        const curl = cur.curl[f];
        const segs = fr.segs;
        for (let s = 0; s < segs.length; s++) {
          // distal joints curl more than the root joint
          const local = curl * (s === 0 ? 0.55 : s === 1 ? 0.9 : 1.05);
          segs[s].rotation.x = local * 1.15;
        }
        if (f !== 0) {
          // fan the four fingers by their offset from the middle
          fr.root.rotation.z = spreadDir * cur.spread * (f - 2) * 0.22;
        }
      }
    }

    // ── sway + bob + breathing (the living part) ──
    const swayTX = Math.max(-1, Math.min(1, look.vx)) * 0.05;
    const swayTY = Math.max(-1, Math.min(1, look.vy)) * 0.04;
    this.sway.x += (swayTX - this.sway.x) * Math.min(1, dt * 7);
    this.sway.y += (swayTY - this.sway.y) * Math.min(1, dt * 7);
    this.rig.position.set(
      this.sway.x + Math.cos(bob.phase) * 0.011 * bob.amp,
      this.sway.y + Math.sin(bob.phase * 2) * 0.016 * bob.amp + Math.sin(t * 1.35) * 0.005,
      0
    );
    this.rig.rotation.set(
      -this.sway.y * 1.6,
      -this.sway.x * 1.8,
      this.sway.x * 0.8
    );
    // mug gently tips as if to sip
    if (this.mugProp.visible) {
      this.mugProp.rotation.x = -0.5 + Math.sin(t * 0.9) * 0.08;
    }
  }

  /** render on top of the composed frame — call AFTER composer.render() */
  render(renderer: THREE.WebGLRenderer) {
    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(this.scene, this.camera);
    renderer.autoClear = prevAutoClear;
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
  }
}
