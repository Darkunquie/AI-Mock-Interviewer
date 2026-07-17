"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Lipsync, VISEMES } from "wawa-lipsync";

// Free, on-device 3D interviewer: a Ready Player Me avatar whose mouth is driven
// by wawa-lipsync reading the TTS <audio> element (Oculus visemes), plus blinking
// and a gentle idle head sway so it reads as a live person, not a canned clip.
const AVATAR_URL = "/interviewer/avatar.glb";
const VISEME_NAMES = Object.values(VISEMES) as string[]; // "viseme_sil", "viseme_aa", ...

// How far the jaw drops for each phoneme — vowels open, plosives/silence close.
// Driving the jaw by the current viseme (then smoothing) gives per-syllable
// movement, unlike raw loudness which stays flat through continuous speech.
const VISEME_JAW: Record<string, number> = {
  viseme_sil: 0, viseme_PP: 0, viseme_FF: 0.05, viseme_TH: 0.12,
  viseme_DD: 0.14, viseme_kk: 0.15, viseme_CH: 0.12, viseme_SS: 0.08,
  viseme_nn: 0.11, viseme_RR: 0.14, viseme_aa: 0.32, viseme_E: 0.2,
  viseme_I: 0.14, viseme_O: 0.28, viseme_U: 0.15,
};
const BLINK_NAMES = ["eyeBlinkLeft", "eyeBlinkRight", "eyesClosed"];

interface AvatarModelProps {
  speaking: boolean;
  lipsyncRef: RefObject<Lipsync | null>;
}

function AvatarModel({ speaking, lipsyncRef }: AvatarModelProps) {
  const { scene } = useGLTF(AVATAR_URL);
  const { camera } = useThree();

  // Auto-frame the camera on the head so framing is correct for ANY avatar GLB
  // (no magic per-model offsets). Focus slightly below the head so the head +
  // shoulders sit in the tile.
  useEffect(() => {
    scene.updateWorldMatrix(true, true);
    const focus = new THREE.Vector3();
    const head = scene.getObjectByName("Head");
    if (head) {
      head.getWorldPosition(focus);
    } else {
      const box = new THREE.Box3().setFromObject(scene);
      focus.set((box.min.x + box.max.x) / 2, box.max.y - 0.18, (box.min.z + box.max.z) / 2);
    }
    // Frame head + upper body: look below the head joint and pull the camera
    // back so the avatar sits comfortably inside the tall tile (zoomed out).
    // Tight head-shot: head + upper neck only, so any chest branding is cropped.
    const lookY = focus.y - 0.02;
    camera.position.set(focus.x, lookY + 0.03, focus.z + 1.02);
    camera.lookAt(focus.x, lookY, focus.z);
    camera.updateProjectionMatrix();
  }, [scene, camera]);

  // Make skin/hair/fabric catch the studio IBL more strongly and soften the
  // plastic sheen → more realistic, "real person" look.
  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial;
        if (!std.isMeshStandardMaterial) continue;
        std.envMapIntensity = 1.5; // let IBL define the shading (realistic)
        const name = (std.name || mesh.name || "").toLowerCase();
        if (name.includes("skin") || name.includes("head") || name.includes("body") || name.includes("face")) {
          std.metalness = 0;
          std.roughness = Math.min(1, Math.max(0.62, std.roughness)); // soft matte skin, no plastic gloss
        }
        std.needsUpdate = true;
      }
    });
  }, [scene]);

  // Meshes that carry viseme morph targets (RPM head + teeth).
  const faceMeshes = useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.morphTargetDictionary && m.morphTargetInfluences) {
        if ("viseme_aa" in m.morphTargetDictionary || "viseme_PP" in m.morphTargetDictionary) {
          meshes.push(m);
        }
      }
    });
    return meshes;
  }, [scene]);

  const headBone = useMemo(() => scene.getObjectByName("Head") ?? null, [scene]);
  const blink = useRef({ timeToNext: 2, closing: 0 });
  const headBaseRot = useRef<THREE.Euler | null>(null);
  const nod = useRef({ timeToNext: 4, phase: 0 });
  const gaze = useRef({ x: 0, y: 0, tx: 0, ty: 0, timeToNext: 1.5 });
  const jaw = useRef({ v: 0, vol: 0 });

  useFrame((state, delta) => {
    // Set a morph target by name across all face meshes, eased toward a value.
    const setMorph = (name: string, value: number, rate = 0.3) => {
      for (const mesh of faceMeshes) {
        const idx = mesh.morphTargetDictionary![name];
        if (idx !== undefined) {
          const infl = mesh.morphTargetInfluences!;
          infl[idx] = THREE.MathUtils.lerp(infl[idx], value, rate);
        }
      }
    };

    // ---- Lip-sync: per-phoneme jaw target, smoothed (movement, not static) ----
    let currentViseme = "viseme_sil";
    let vol = 0;
    if (speaking && lipsyncRef.current) {
      lipsyncRef.current.processAudio();
      currentViseme = lipsyncRef.current.viseme;
      const f = lipsyncRef.current.features as { volume?: number } | null;
      vol = f?.volume ?? 0;
    }
    // Relax any Oculus viseme morphs — we drive the jaw only.
    for (const v of VISEME_NAMES) setMorph(v, 0, 0.4);

    const js = jaw.current;
    // The current phoneme sets how far the jaw drops; loudness gates it so it
    // closes on pauses. Lerp smooths the per-syllable changes → natural motion.
    const gate = THREE.MathUtils.clamp(vol * 3, 0.15, 1);
    const jawTarget = speaking ? (VISEME_JAW[currentViseme] ?? 0.08) * gate : 0;
    js.v = THREE.MathUtils.lerp(js.v, jawTarget, 0.35);
    setMorph("jawOpen", js.v, 1);
    // A little funnel that scales with the opening (no on/off switching).
    setMorph("mouthFunnel", speaking ? js.v * 0.45 : 0, 0.3);
    setMorph("mouthPucker", 0, 0.3);
    setMorph("mouthStretchLeft", 0, 0.3);
    setMorph("mouthStretchRight", 0, 0.3);
    setMorph("mouthClose", 0, 0.3);

    // ---- Blink ----
    const b = blink.current;
    b.timeToNext -= delta;
    if (b.timeToNext <= 0 && b.closing <= 0) {
      b.closing = 0.12;
      b.timeToNext = 2.5 + Math.random() * 3;
    }
    let blinkTarget = 0;
    if (b.closing > 0) {
      b.closing -= delta;
      blinkTarget = 1;
    }
    for (const mesh of faceMeshes) {
      const dict = mesh.morphTargetDictionary!;
      const infl = mesh.morphTargetInfluences!;
      for (const name of BLINK_NAMES) {
        const idx = dict[name];
        if (idx !== undefined) infl[idx] = THREE.MathUtils.lerp(infl[idx], blinkTarget, 0.5);
      }
    }

    // ---- Natural head motion: organic sway + occasional nods ----
    if (headBone) {
      if (!headBaseRot.current) headBaseRot.current = headBone.rotation.clone();
      const base = headBaseRot.current;
      const t = state.clock.elapsedTime;
      const amt = speaking ? 1.2 : 0.8;

      // Layered sines at different frequencies read as living, non-repeating motion.
      const yaw = (Math.sin(t * 0.45) * 0.07 + Math.sin(t * 0.21) * 0.045) * amt;
      let pitch = (Math.sin(t * 0.38) * 0.045 + Math.sin(t * 0.73) * 0.02) * amt;
      const roll = Math.sin(t * 0.3) * 0.035 * amt;

      // Occasional deliberate nod (a downward dip), more often while speaking.
      const n = nod.current;
      n.timeToNext -= delta;
      if (n.timeToNext <= 0 && n.phase <= 0) {
        n.phase = 1;
        n.timeToNext = (speaking ? 2.2 : 4.5) + Math.random() * 3;
      }
      if (n.phase > 0) {
        n.phase -= delta * 2.2; // ~0.45s nod
        pitch += Math.sin((1 - Math.max(0, n.phase)) * Math.PI) * 0.16;
      }

      headBone.rotation.set(base.x + pitch, base.y + yaw, base.z + roll);
    }

    // ---- Micro-expressions: gaze darts, brow life, resting smile ----
    // Eye saccades: mostly looking at the candidate, occasional small darts.
    const g = gaze.current;
    g.timeToNext -= delta;
    if (g.timeToNext <= 0) {
      // Real eyes hold steady on the person, then dart briefly and back —
      // mostly tiny fixations near center, with the occasional glance away.
      const glanceAway = Math.random() < 0.22;
      if (glanceAway) {
        g.tx = (Math.random() - 0.5) * 0.6;
        g.ty = (Math.random() - 0.5) * 0.28;
        g.timeToNext = 0.5 + Math.random() * 1.4;
      } else {
        g.tx = (Math.random() - 0.5) * 0.2; // micro-fixation, near eye contact
        g.ty = (Math.random() - 0.5) * 0.1;
        g.timeToNext = 1.6 + Math.random() * 2.6;
      }
    }
    // Fast saccade to the target, then hold (not a slow, floaty drift).
    g.x = THREE.MathUtils.lerp(g.x, g.tx, 0.45);
    g.y = THREE.MathUtils.lerp(g.y, g.ty, 0.45);
    setMorph("eyeLookInLeft", Math.max(0, g.x), 0.5);
    setMorph("eyeLookOutRight", Math.max(0, g.x), 0.5);
    setMorph("eyeLookOutLeft", Math.max(0, -g.x), 0.5);
    setMorph("eyeLookInRight", Math.max(0, -g.x), 0.5);
    setMorph("eyeLookUpLeft", Math.max(0, g.y), 0.5);
    setMorph("eyeLookUpRight", Math.max(0, g.y), 0.5);
    setMorph("eyeLookDownLeft", Math.max(0, -g.y), 0.5);
    setMorph("eyeLookDownRight", Math.max(0, -g.y), 0.5);

    // Living brows: gentle drift + a lift while speaking (expressive).
    const tt = state.clock.elapsedTime;
    const brow = 0.06 + Math.sin(tt * 0.5) * 0.05 + (speaking ? 0.14 : 0);
    setMorph("browInnerUp", Math.max(0, brow), 0.15);
    setMorph("browOuterUpLeft", speaking ? 0.1 : 0, 0.15);
    setMorph("browOuterUpRight", speaking ? 0.1 : 0, 0.15);

    // Warm resting micro-smile (eased back while speaking so visemes read clearly).
    const smile = speaking ? 0.05 : 0.14;
    setMorph("mouthSmileLeft", smile, 0.1);
    setMorph("mouthSmileRight", smile, 0.1);
    setMorph("cheekSquintLeft", smile * 0.5, 0.1);
    setMorph("cheekSquintRight", smile * 0.5, 0.1);
  });

  return <primitive object={scene} />;
}

// Procedural image-based lighting (three's RoomEnvironment) — no external HDRI
// download. This is the big realism win: soft, directionally-varied light gives
// PBR skin real sheen and puts catchlights in the eyes (vs flat/cartoon look).
function StudioEnv() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    return () => {
      envTex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

interface InterviewerAvatar3DProps {
  speaking?: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  className?: string;
}

export function InterviewerAvatar3D({
  speaking = false,
  audioRef,
  className = "",
}: InterviewerAvatar3DProps) {
  const lipsyncRef = useRef<Lipsync | null>(null);
  const connectedRef = useRef(false);

  // Attach the lip-sync analyser only once speaking starts: by then the audio
  // element has a src and we're inside a user-gesture-initiated playback, so the
  // AudioContext is allowed to run. (Connecting earlier warns + stays suspended.)
  useEffect(() => {
    if (!speaking) return;
    const el = audioRef.current;
    if (!el) return;
    if (!lipsyncRef.current) {
      // Small history = low latency (mouth tracks the audio closely).
      lipsyncRef.current = new Lipsync({ fftSize: 1024, historySize: 4 });
    }
    if (!connectedRef.current && el.src) {
      try {
        lipsyncRef.current.connectAudio(el);
        connectedRef.current = true;
      } catch {
        // already connected / unsupported — lip-sync just won't run
      }
    }
    // Resume the manager's (private) AudioContext now that we have a gesture.
    const ctx = (lipsyncRef.current as unknown as { audioContext?: AudioContext }).audioContext;
    ctx?.resume?.().catch(() => {});
  }, [speaking, audioRef]);

  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        camera={{ fov: 24, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping; // filmic, less flat/cartoon
          gl.toneMappingExposure = 0.56; // darker
        }}
      >
        <StudioEnv />
        {/* Warm key + soft fill/rim for a natural, slightly warm studio look. */}
        <ambientLight intensity={0.15} color="#ffe2cc" />
        <directionalLight position={[2, 3, 4]} intensity={1.15} color="#ffd0a0" />
        <directionalLight position={[-3, 2, 1]} intensity={0.28} color="#ffeede" />
        <directionalLight position={[0, 2.5, -3]} intensity={0.55} color="#ffc790" />
        <Suspense fallback={null}>
          <AvatarModel speaking={speaking} lipsyncRef={lipsyncRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(AVATAR_URL);
