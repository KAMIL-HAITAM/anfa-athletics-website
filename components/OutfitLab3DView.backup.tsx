"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";

export type OutfitTopStyle =
  | "tee"
  | "hoodie"
  | "compression"
  | "crop"
  | "bra";

export type OutfitBottomStyle =
  | "jogger"
  | "leggings"
  | "shorts";

type GarmentProfile = [number, number, number];

function createTorsoGeometry(
  style: OutfitTopStyle
): THREE.BufferGeometry {
  let profile: GarmentProfile[] = [
    [-0.58, 0.39, 0.18],
    [-0.51, 0.42, 0.20],
    [-0.22, 0.40, 0.19],
    [0.18, 0.39, 0.18],
    [0.39, 0.44, 0.19],
    [0.51, 0.29, 0.15],
    [0.55, 0.16, 0.12],
  ];

  if (style === "crop") {
    profile = [
      [-0.28, 0.37, 0.18],
      [-0.22, 0.39, 0.18],
      [-0.05, 0.37, 0.17],
      [0.20, 0.35, 0.16],
      [0.37, 0.41, 0.17],
      [0.49, 0.29, 0.14],
      [0.53, 0.12, 0.11],
    ];
  } else if (style === "bra") {
    profile = [
      [-0.17, 0.31, 0.13],
      [-0.11, 0.36, 0.15],
      [0.02, 0.35, 0.15],
      [0.14, 0.31, 0.13],
      [0.21, 0.17, 0.11],
    ];
  } else if (style === "compression") {
    profile = profile.map(([y, width, depth]) => [
      y,
      width * 0.82,
      depth * 0.90,
    ]);
  }

  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const indices: number[] = [];
  const segments = 32;
  const pointsPerRing = segments + 1;

  for (const [y, width, depth] of profile) {
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      positions.push(
        Math.cos(angle) * width,
        y,
        Math.sin(angle) * depth
      );
    }
  }

  for (let ring = 0; ring < profile.length - 1; ring++) {
    for (let i = 0; i < segments; i++) {
      const a = ring * pointsPerRing + i;
      const b = (ring + 1) * pointsPerRing + i;
      const c = b + 1;
      const d = a + 1;

      indices.push(a, b, d, b, c, d);
    }
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

function TopGarment({
  color,
  style,
}: {
  color: string;
  style: OutfitTopStyle;
}) {
  const geometry = useMemo(
    () => createTorsoGeometry(style),
    [style]
  );

  const isBra = style === "bra";
  const isHoodie = style === "hoodie";
  const sleeveLength = isHoodie ? 0.66 : 0.46;

  return (
    <group position={[0, style === "bra" ? -0.1 : 0.23, 0]}>
      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.82}
          side={THREE.DoubleSide}
        />
      </mesh>

      {!isBra &&
        ([-1, 1] as const).map((side) => (
          <mesh
            key={side}
            position={[
              side * (style === "compression" ? 0.43 : 0.51),
              0.25,
              0,
            ]}
            rotation={[0, 0, side * 0.82]}
            castShadow
          >
            <cylinderGeometry
              args={[
                isHoodie ? 0.17 : 0.145,
                isHoodie ? 0.15 : 0.135,
                sleeveLength,
                24,
                1,
                true,
              ]}
            />
            <meshStandardMaterial
              color={color}
              roughness={0.84}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

      {isBra &&
        ([-1, 1] as const).map((side) => (
          <mesh
            key={side}
            position={[side * 0.17, 0.25, 0.015]}
            rotation={[0, 0, -side * 0.1]}
          >
            <boxGeometry args={[0.055, 0.24, 0.055]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        ))}

      <mesh
        position={[0, 0.535, 0.015]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.135, 0.025, 8, 28]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>

      {isHoodie && (
        <>
          <mesh
            position={[0, 0.46, -0.13]}
            scale={[0.23, 0.25, 0.18]}
          >
            <sphereGeometry args={[1, 28, 20]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>

          <mesh position={[0, -0.25, 0.19]}>
            <boxGeometry args={[0.43, 0.20, 0.035]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        </>
      )}
    </group>
  );
}

function BottomGarment({
  color,
  style,
}: {
  color: string;
  style: OutfitBottomStyle;
}) {
  const isShorts = style === "shorts";
  const legHeight = isShorts ? 0.48 : 1.05;
  const legCenter = isShorts ? -0.18 : -0.43;

  return (
    <group position={[0, -0.65, 0]}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.66, 0.30, 0.34]} />
        <meshStandardMaterial color={color} roughness={0.86} />
      </mesh>

      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.69, 0.11, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.86} />
      </mesh>

      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh
            position={[side * 0.18, legCenter, 0]}
            castShadow
          >
            <cylinderGeometry
              args={[
                isShorts ? 0.18 : 0.195,
                isShorts ? 0.16 : 0.135,
                legHeight,
                24,
              ]}
            />
            <meshStandardMaterial
              color={color}
              roughness={0.9}
            />
          </mesh>

          {!isShorts && (
            <mesh position={[side * 0.18, -0.95, 0]}>
              <boxGeometry args={[0.28, 0.075, 0.30]} />
              <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
function Mannequin() {
  const skin = "#ad8669";
  const shadowSkin = "#9d765b";

  return (
    <group>
      {/* Head */}
      {/* Head */}
      <mesh
        position={[0, 1.02, -0.015]}
        scale={[0.155, 0.19, 0.145]}
        castShadow
      >
  <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color={skin} roughness={0.88} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 0.76, -0.025]} castShadow>
        <cylinderGeometry args={[0.092, 0.115, 0.22, 24]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>

      {/* Torso underneath the clothing */}
      <mesh
        position={[0, 0.18, -0.035]}
        scale={[0.31, 0.43, 0.15]}
        castShadow
      >
  <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      <mesh
        position={[0, 0.57, -0.025]}
        scale={[0.38, 0.25, 0.17]}
        castShadow
      >
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>

      {/* Pelvis */}
      <mesh
        position={[0, -0.39, -0.02]}
        scale={[0.29, 0.23, 0.15]}
        castShadow
      >
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color={shadowSkin} roughness={0.92} />
      </mesh>

      {/* Arms, forearms and hands */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh
            position={[side * 0.42, 0.47, -0.035]}
            rotation={[0, 0, side * 0.58]}
            scale={[0.13, 0.29, 0.12]}
            castShadow
          >
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color={skin} roughness={0.9} />
          </mesh>

          <mesh
            position={[side * 0.59, 0.19, -0.015]}
            rotation={[0, 0, side * 0.22]}
            scale={[0.095, 0.25, 0.09]}
            castShadow
          >
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color={skin} roughness={0.9} />
          </mesh>

          <mesh
            position={[side * 0.65, -0.045, 0.005]}
            rotation={[0, 0, side * 0.15]}
            scale={[0.065, 0.105, 0.05]}
            castShadow
          >
            <sphereGeometry args={[1, 20, 16]} />
            <meshStandardMaterial color={skin} roughness={0.92} />
          </mesh>
        </group>
      ))}

      {/* Thighs and lower legs underneath the trousers */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh
            position={[side * 0.16, -0.79, -0.025]}
            rotation={[0, 0, -side * 0.025]}
            scale={[0.145, 0.37, 0.13]}
            castShadow
          >
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color={skin} roughness={0.92} />
          </mesh>

          <mesh
            position={[side * 0.16, -1.13, -0.02]}
            scale={[0.105, 0.29, 0.105]}
            castShadow
          >
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color={skin} roughness={0.92} />
          </mesh>

          {/* Simple feet */}
          <mesh
            position={[side * 0.16, -1.265, 0.065]}
            scale={[0.115, 0.075, 0.22]}
            castShadow
          >
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color="#202120" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
export default function OutfitLab3DView({
  topColor,
  bottomColor,
  topStyle,
  bottomStyle,
}: {
  topColor: string;
  bottomColor: string;
  topStyle: OutfitTopStyle;
  bottomStyle: OutfitBottomStyle;
}) {
  return (
    <Canvas
      camera={{ position: [2.1, 0.5, 4.7], fov: 38 }}
      dpr={[1, 1.5]}
      shadows
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
       gl.toneMapping = THREE.ACESFilmicToneMapping;
       gl.toneMappingExposure = 1.35;
       }}
>
      <color attach="background" args={["#171818"]} />

      <ambientLight intensity={1.8} />

<hemisphereLight
  args={["#f4f0e8", "#585d56", 1.7]}
/>

<directionalLight
  position={[4, 6, 5]}
  intensity={3.2}
  castShadow
/>

<directionalLight
  position={[-4, 3, -2]}
  intensity={2}
/>

<directionalLight
  position={[0, 2, 5]}
  intensity={1.3}
/>

      <group position={[0, 0.35, 0]}>
  <Mannequin />

  <TopGarment color={topColor} style={topStyle} />
  <BottomGarment color={bottomColor} style={bottomStyle} />
        <mesh position={[0, -1.37, 0]} receiveShadow>
          <cylinderGeometry args={[1.45, 1.45, 0.045, 64]} />
          <meshStandardMaterial
            color="#252827"
            roughness={0.95}
          />
        </mesh>
      </group>

      <OrbitControls
  target={[0, -0.1, 0]}
  enablePan={false}
  minDistance={3.2}
  maxDistance={7}
  minPolarAngle={0.4}
  maxPolarAngle={2.5}
/>
    </Canvas>
  );
}