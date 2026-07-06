"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

const ACCENT = "#ff5c28";
const BONE = "#8a8578";
const CARBON = "#131316";
const LINE = "#33333a";

/* Seeded PRNG keeps the layout stable across re-renders (render purity). */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 2200 particles drifting around their base points, pulled toward the cursor. */
function Particles({ count = 2200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);

  const { positions, base } = useMemo(() => {
    const rnd = mulberry32(1337);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (rnd() - 0.5) * 22;
      positions[i + 1] = (rnd() - 0.5) * 14;
      positions[i + 2] = (rnd() - 0.5) * 10 - 2;
    }
    return { positions, base: positions.slice() };
  }, [count]);

  useFrame((state, dt) => {
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const mx = (state.pointer.x * state.viewport.width) / 2;
    const my = (state.pointer.y * state.viewport.height) / 2;
    const t = state.clock.elapsedTime;
    const pull = Math.min(dt, 0.05) * 5;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const bx = base[ix];
      const by = base[ix + 1];
      const bz = base[ix + 2];
      let x = arr[ix];
      let y = arr[ix + 1];

      // magnet: particles within reach lean toward the cursor
      const dx = mx - x;
      const dy = my - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 20 && d2 > 0.01) {
        const f = (1 - Math.sqrt(d2) / 4.5) * 0.9;
        x += dx * f * pull;
        y += dy * f * pull;
      }

      // spring home + slow orbital drift
      x += (bx + Math.sin(t * 0.28 + bz) * 0.5 - x) * 0.02;
      y += (by + Math.cos(t * 0.22 + bx) * 0.5 - y) * 0.02;

      arr[ix] = x;
      arr[ix + 1] = y;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={BONE}
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** Central artifact: matte core with signal-orange wireframe shell. */
function Core() {
  const group = useRef<THREE.Group>(null!);

  useFrame((state, dt) => {
    const g = group.current;
    g.rotation.y += dt * 0.16;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, state.pointer.y * 0.45, 0.05);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, state.pointer.x * -0.25, 0.05);
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.015;
    g.scale.setScalar(s);
  });

  return (
    <group ref={group}>
      <mesh scale={1.88}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={CARBON} />
      </mesh>
      <mesh scale={1.9}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={ACCENT} wireframe />
      </mesh>
      <mesh scale={2.75} rotation={[0.45, 0.2, 0.1]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={LINE} wireframe transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

const SHARDS: Array<{
  pos: [number, number, number];
  scale: number;
  kind: "tetra" | "octa";
}> = [
  { pos: [-5.4, 2.6, -2], scale: 0.5, kind: "tetra" },
  { pos: [-6.8, -1.8, -1], scale: 0.7, kind: "octa" },
  { pos: [-3.4, -3.2, 0.5], scale: 0.35, kind: "tetra" },
  { pos: [4.6, 3.1, -2.5], scale: 0.6, kind: "octa" },
  { pos: [6.2, -2.4, -1.5], scale: 0.45, kind: "tetra" },
  { pos: [3.4, -3.6, 0], scale: 0.3, kind: "octa" },
  { pos: [-1.8, 3.8, -3], scale: 0.4, kind: "octa" },
  { pos: [1.6, 4.2, -1], scale: 0.28, kind: "tetra" },
];

function Shards() {
  return (
    <>
      {SHARDS.map((s, i) => (
        <Float
          key={i}
          speed={1.2 + (i % 3) * 0.5}
          rotationIntensity={1.6}
          floatIntensity={1.4}
        >
          <mesh position={s.pos} scale={s.scale}>
            {s.kind === "tetra" ? (
              <tetrahedronGeometry args={[1, 0]} />
            ) : (
              <octahedronGeometry args={[1, 0]} />
            )}
            <meshBasicMaterial
              color={i % 3 === 0 ? ACCENT : BONE}
              wireframe
              transparent
              opacity={0.65}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

/** Camera parallax rig — eases toward the pointer, always looks at origin. */
function Rig() {
  useFrame((state) => {
    const cam = state.camera;
    cam.position.x += (state.pointer.x * 1.5 - cam.position.x) * 0.04;
    cam.position.y += (state.pointer.y * 0.9 - cam.position.y) * 0.04;
    cam.lookAt(0, 0, 0);
  });
  return null;
}

export default function AuthScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 9], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <Particles />
      <Core />
      <Shards />
      <Rig />
    </Canvas>
  );
}
