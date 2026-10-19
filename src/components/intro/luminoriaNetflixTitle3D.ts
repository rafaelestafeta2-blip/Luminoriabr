import * as THREE from 'three';

export interface NetflixTitle3D {
  group: THREE.Group;
  update: (progress: number, time: number) => void;
}

/**
 * Creates sculpted 3D "LUMINORIA" typography in Netflix-grade Crimson Red and Polished Chrome
 */
export function createLuminoriaNetflixTitle3D(): NetflixTitle3D {
  const group = new THREE.Group();

  // Premium Netflix Red PBR Material with slight emissive glow
  const redMaterial = new THREE.MeshStandardMaterial({
    color: 0xe50914,
    roughness: 0.15,
    metalness: 0.85,
    emissive: 0x330005,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0x222228,
    roughness: 0.1,
    metalness: 0.95,
  });

  const letterShapes: Record<string, () => THREE.BufferGeometry> = {
    L: () => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(0.68, 0);
      s.lineTo(0.68, 0.24);
      s.lineTo(0.26, 0.24);
      s.lineTo(0.26, 1.2);
      s.lineTo(0, 1.2);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    U: () => {
      const s = new THREE.Shape();
      s.moveTo(0, 1.2);
      s.lineTo(0.26, 1.2);
      s.lineTo(0.26, 0.35);
      s.absarc(0.42, 0.35, 0.16, Math.PI, 0, true);
      s.lineTo(0.58, 1.2);
      s.lineTo(0.84, 1.2);
      s.lineTo(0.84, 0.35);
      s.absarc(0.42, 0.35, 0.42, 0, Math.PI, false);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    M: () => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(0.22, 0);
      s.lineTo(0.5, 0.65);
      s.lineTo(0.78, 0);
      s.lineTo(1.0, 0);
      s.lineTo(1.0, 1.2);
      s.lineTo(0.78, 1.2);
      s.lineTo(0.78, 0.45);
      s.lineTo(0.5, 1.0);
      s.lineTo(0.22, 0.45);
      s.lineTo(0.22, 1.2);
      s.lineTo(0, 1.2);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    I: () => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(0.26, 0);
      s.lineTo(0.26, 1.2);
      s.lineTo(0, 1.2);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    N: () => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(0.24, 0);
      s.lineTo(0.66, 0.8);
      s.lineTo(0.66, 0);
      s.lineTo(0.9, 0);
      s.lineTo(0.9, 1.2);
      s.lineTo(0.66, 1.2);
      s.lineTo(0.24, 0.4);
      s.lineTo(0.24, 1.2);
      s.lineTo(0, 1.2);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    O: () => {
      const s = new THREE.Shape();
      s.absarc(0.48, 0.6, 0.48, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0.48, 0.6, 0.24, 0, Math.PI * 2, true);
      s.holes.push(hole);
      return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    R: () => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(0.25, 0);
      s.lineTo(0.25, 0.5);
      s.lineTo(0.5, 0.5);
      s.lineTo(0.78, 0);
      s.lineTo(1.05, 0);
      s.lineTo(0.7, 0.62);
      s.lineTo(0.78, 0.68);
      s.absarc(0.5, 0.92, 0.28, 0, Math.PI, false);
      s.lineTo(0, 1.2);
      s.closePath();
      const hole = new THREE.Path();
      hole.moveTo(0.25, 0.72);
      hole.lineTo(0.5, 0.72);
      hole.absarc(0.5, 0.92, 0.12, 0, Math.PI, false);
      hole.lineTo(0.25, 1.04);
      hole.closePath();
      s.holes.push(hole);
      return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
    A: () => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(0.26, 0);
      s.lineTo(0.38, 0.4);
      s.lineTo(0.62, 0.4);
      s.lineTo(0.74, 0);
      s.lineTo(1.0, 0);
      s.lineTo(0.5, 1.2);
      s.closePath();
      const hole = new THREE.Path();
      hole.moveTo(0.42, 0.58);
      hole.lineTo(0.58, 0.58);
      hole.lineTo(0.5, 0.9);
      hole.closePath();
      s.holes.push(hole);
      return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    },
  };

  const lettersString = 'LUMINORIA';
  const letters: { mesh: THREE.Mesh; targetX: number }[] = [];
  const spacing = 1.1;
  const startX = -((lettersString.length - 1) * spacing) / 2;

  for (let i = 0; i < lettersString.length; i++) {
    const char = lettersString[i];
    const geoGen = letterShapes[char];
    if (!geoGen) continue;

    const geo = geoGen();
    geo.computeVertexNormals();

    const mat = redMaterial;
    const mesh = new THREE.Mesh(geo, [mat, chromeMaterial]);
    const targetX = startX + i * spacing;

    mesh.position.set(targetX, -0.6, 0);
    group.add(mesh);
    letters.push({ mesh, targetX });
  }

  // Rear Netflix light rays
  const beamCount = 9;
  const beamGeo = new THREE.CylinderGeometry(0.04, 0.8, 6, 8);
  beamGeo.rotateX(Math.PI * 0.5);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xe50914,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
  });

  const beamsGroup = new THREE.Group();
  for (let b = 0; b < beamCount; b++) {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(startX + b * spacing + 0.4, 0, -1.2);
    beam.rotation.z = (b - (beamCount - 1) / 2) * 0.12;
    beamsGroup.add(beam);
  }
  group.add(beamsGroup);

  return {
    group,
    update: (progress: number, time: number) => {
      // Zoom from deep in space towards viewer (Netflix Ta-Dum timing)
      const zoomEase = Math.min(1, Math.max(0, progress / 0.45));
      const sCurve = zoomEase * zoomEase * (3 - 2 * zoomEase);

      // Start at z = -8 and zoom to z = 0
      group.position.z = -8 + sCurve * 8;
      group.scale.setScalar(0.2 + sCurve * 0.8);

      // Gentle slow cinematic drift once arrived
      if (progress > 0.45) {
        group.position.z = (progress - 0.45) * 0.8;
      }

      // Pulse rear beam light rays
      beamsGroup.rotation.z = Math.sin(time * 1.5) * 0.05;
      beamMat.opacity = 0.2 + Math.sin(time * 3) * 0.1;
    },
  };
}
