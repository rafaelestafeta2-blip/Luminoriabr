import * as THREE from 'three';

export interface TitleLetter {
  mesh: THREE.Mesh;
  targetPos: THREE.Vector3;
  initialPos: THREE.Vector3;
}

export interface Animated3DTitle {
  group: THREE.Group;
  update: (progress: number, time: number) => void;
}

/**
 * Creates 3D sculpted typography for "LUMINORIA" with Brazilian Gold & Emerald PBR finish
 */
export function createLuminoria3DTitle(): Animated3DTitle {
  const group = new THREE.Group();

  // Brazilian Gold PBR Material
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd13b,
    roughness: 0.18,
    metalness: 0.92,
    emissive: 0x241700,
  });

  // Brazilian Emerald Core Material for accent
  const emeraldMaterial = new THREE.MeshStandardMaterial({
    color: 0x00c853,
    roughness: 0.22,
    metalness: 0.85,
    emissive: 0x003311,
  });

  const letterShapes: Record<string, () => THREE.BufferGeometry> = {
    L: () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.7, 0);
      shape.lineTo(0.7, 0.25);
      shape.lineTo(0.28, 0.25);
      shape.lineTo(0.28, 1.2);
      shape.lineTo(0, 1.2);
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    U: () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 1.2);
      shape.lineTo(0.26, 1.2);
      shape.lineTo(0.26, 0.35);
      shape.absarc(0.42, 0.35, 0.16, Math.PI, 0, true);
      shape.lineTo(0.58, 1.2);
      shape.lineTo(0.84, 1.2);
      shape.lineTo(0.84, 0.35);
      shape.absarc(0.42, 0.35, 0.42, 0, Math.PI, false);
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    M: () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.22, 0);
      shape.lineTo(0.5, 0.65);
      shape.lineTo(0.78, 0);
      shape.lineTo(1.0, 0);
      shape.lineTo(1.0, 1.2);
      shape.lineTo(0.78, 1.2);
      shape.lineTo(0.78, 0.45);
      shape.lineTo(0.5, 1.0);
      shape.lineTo(0.22, 0.45);
      shape.lineTo(0.22, 1.2);
      shape.lineTo(0, 1.2);
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    I: () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.28, 0);
      shape.lineTo(0.28, 1.2);
      shape.lineTo(0, 1.2);
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    N: () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.24, 0);
      shape.lineTo(0.66, 0.8);
      shape.lineTo(0.66, 0);
      shape.lineTo(0.9, 0);
      shape.lineTo(0.9, 1.2);
      shape.lineTo(0.66, 1.2);
      shape.lineTo(0.24, 0.4);
      shape.lineTo(0.24, 1.2);
      shape.lineTo(0, 1.2);
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    O: () => {
      const shape = new THREE.Shape();
      shape.absarc(0.48, 0.6, 0.48, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0.48, 0.6, 0.24, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    R: () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.25, 0);
      shape.lineTo(0.25, 0.5);
      shape.lineTo(0.5, 0.5);
      shape.lineTo(0.78, 0);
      shape.lineTo(1.05, 0);
      shape.lineTo(0.7, 0.62);
      shape.lineTo(0.78, 0.68);
      shape.absarc(0.5, 0.92, 0.28, 0, Math.PI, false);
      shape.lineTo(0, 1.2);
      shape.closePath();
      const hole = new THREE.Path();
      hole.moveTo(0.25, 0.72);
      hole.lineTo(0.5, 0.72);
      hole.absarc(0.5, 0.92, 0.12, 0, Math.PI, false);
      hole.lineTo(0.25, 1.04);
      hole.closePath();
      shape.holes.push(hole);
      return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    A: () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.26, 0);
      shape.lineTo(0.38, 0.4);
      shape.lineTo(0.62, 0.4);
      shape.lineTo(0.74, 0);
      shape.lineTo(1.0, 0);
      shape.lineTo(0.5, 1.2);
      shape.closePath();
      const hole = new THREE.Path();
      hole.moveTo(0.42, 0.58);
      hole.lineTo(0.58, 0.58);
      hole.lineTo(0.5, 0.9);
      hole.closePath();
      shape.holes.push(hole);
      return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
  };

  const lettersString = 'LUMINORIA';
  const letters: TitleLetter[] = [];
  const spacing = 1.15;
  const startX = -((lettersString.length - 1) * spacing) / 2;

  for (let i = 0; i < lettersString.length; i++) {
    const char = lettersString[i];
    const geoGen = letterShapes[char];
    if (!geoGen) continue;

    const geo = geoGen();
    geo.computeVertexNormals();

    const mat = i % 2 === 0 ? goldMaterial : emeraldMaterial;
    const mesh = new THREE.Mesh(geo, mat);

    const targetPos = new THREE.Vector3(startX + i * spacing, 0.5, 0);
    // Initial cinematic exploded scattering
    const angle = (i / lettersString.length) * Math.PI * 2;
    const initialPos = new THREE.Vector3(
      targetPos.x + Math.cos(angle) * 5 + (Math.random() - 0.5) * 2,
      targetPos.y + Math.sin(angle) * 4 + (Math.random() - 0.5) * 2,
      targetPos.z + 5 + Math.random() * 3
    );

    mesh.position.copy(initialPos);
    mesh.rotation.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);

    group.add(mesh);
    letters.push({ mesh, targetPos, initialPos });
  }

  return {
    group,
    update: (progress: number, time: number) => {
      // Easing transition: from initial exploded position to docked target
      const ease = Math.min(1, Math.max(0, progress));
      const smooth = ease * ease * (3 - 2 * ease); // smoothstep

      letters.forEach((item, index) => {
        // Staggered arrival during first 35% of intro
        const letterProgress = Math.min(1, Math.max(0, (progress - index * 0.025) / 0.35));
        const lSmooth = letterProgress * letterProgress * (3 - 2 * letterProgress);

        item.mesh.position.lerpVectors(item.initialPos, item.targetPos, lSmooth);

        // Add gentle floating breath once assembled
        if (lSmooth >= 0.95) {
          item.mesh.position.y = item.targetPos.y + Math.sin(time * 2 + index * 0.4) * 0.06;
          item.mesh.rotation.y = Math.sin(time * 1.5 + index * 0.3) * 0.05;
          item.mesh.rotation.x = Math.cos(time * 1.2 + index * 0.2) * 0.03;
        } else {
          item.mesh.rotation.x *= 0.95;
          item.mesh.rotation.y *= 0.95;
          item.mesh.rotation.z *= 0.95;
        }
      });
    },
  };
}
