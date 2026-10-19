import * as THREE from 'three';

export interface AnimatedFauna {
  group: THREE.Group;
  update: (time: number, delta: number) => void;
}

/**
 * Creates procedural 3-12 part composite Brazilian fauna for the 3D Intro
 * (Arara-Canindé, Tucano-Toco, Onça-Pintada and tropical foliage)
 */
export function createAraraCaninde(): AnimatedFauna {
  const group = new THREE.Group();

  // Materials
  const blueFeatherMat = new THREE.MeshStandardMaterial({
    color: 0x0055d4,
    roughness: 0.35,
    metalness: 0.15,
  });
  const yellowFeatherMat = new THREE.MeshStandardMaterial({
    color: 0xffb703,
    roughness: 0.4,
    metalness: 0.1,
  });
  const beakMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a24,
    roughness: 0.2,
    metalness: 0.4,
  });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
  });

  // 1. Torso
  const bodyGeo = new THREE.ConeGeometry(0.35, 1.2, 16);
  bodyGeo.rotateX(Math.PI);
  const bodyMesh = new THREE.Mesh(bodyGeo, blueFeatherMat);
  group.add(bodyMesh);

  // 2. Yellow Belly
  const bellyGeo = new THREE.SphereGeometry(0.32, 16, 12);
  bellyGeo.scale(0.8, 1.1, 0.6);
  const bellyMesh = new THREE.Mesh(bellyGeo, yellowFeatherMat);
  bellyMesh.position.set(0, 0.1, 0.15);
  group.add(bellyMesh);

  // 3. Head & Beak Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.7, 0.1);

  const headGeo = new THREE.SphereGeometry(0.24, 16, 12);
  const headMesh = new THREE.Mesh(headGeo, blueFeatherMat);
  headGroup.add(headMesh);

  // Curved beak
  const beakGeo = new THREE.ConeGeometry(0.12, 0.38, 12);
  beakGeo.rotateX(Math.PI * 0.45);
  const beakMesh = new THREE.Mesh(beakGeo, beakMat);
  beakMesh.position.set(0, -0.05, 0.25);
  headGroup.add(beakMesh);

  // Face eye patches
  const eyeL = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), eyeWhiteMat);
  eyeL.position.set(0.18, 0.05, 0.12);
  eyeL.rotateY(Math.PI * 0.4);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), eyeWhiteMat);
  eyeR.position.set(-0.18, 0.05, 0.12);
  eyeR.rotateY(-Math.PI * 0.4);
  headGroup.add(eyeR);

  group.add(headGroup);

  // 4. Animated Wings (Left & Right)
  const wingGeo = new THREE.BoxGeometry(1.6, 0.06, 0.5);
  wingGeo.translate(0.8, 0, 0); // Pivot at shoulder

  const leftWing = new THREE.Mesh(wingGeo, blueFeatherMat);
  leftWing.position.set(0.2, 0.4, 0);
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, blueFeatherMat);
  rightWing.position.set(-0.2, 0.4, 0);
  rightWing.scale.set(-1, 1, 1);
  group.add(rightWing);

  // 5. Long Streamer Tail
  const tailGeo = new THREE.ConeGeometry(0.18, 1.6, 8);
  const tailMesh = new THREE.Mesh(tailGeo, blueFeatherMat);
  tailMesh.position.set(0, -1.2, -0.15);
  tailMesh.rotation.x = -0.2;
  group.add(tailMesh);

  return {
    group,
    update: (time: number) => {
      // Wing flapping cycle
      const flap = Math.sin(time * 9) * 0.65;
      leftWing.rotation.z = flap;
      rightWing.rotation.z = -flap;

      // Gentle banking and soaring
      group.position.y += Math.sin(time * 3) * 0.006;
      group.rotation.z = Math.sin(time * 2) * 0.15;
    },
  };
}

export function createTucanoToco(): AnimatedFauna {
  const group = new THREE.Group();

  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.4 });
  const whiteChestMat = new THREE.MeshStandardMaterial({ color: 0xfdfdfd, roughness: 0.5 });
  const beakOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xff6b00,
    roughness: 0.25,
    metalness: 0.2,
  });
  const beakTipMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.3 });

  // Body & White bib
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.9, 12), blackMat);
  group.add(body);

  const bib = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), whiteChestMat);
  bib.scale.set(0.9, 1.2, 0.5);
  bib.position.set(0, 0.2, 0.2);
  group.add(bib);

  // Big Orange Curved Beak
  const beakGroup = new THREE.Group();
  beakGroup.position.set(0, 0.5, 0.2);

  const beakBase = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.85, 12), beakOrangeMat);
  beakBase.rotateX(Math.PI * 0.48);
  beakBase.scale.set(0.65, 1.0, 1.4);
  beakGroup.add(beakBase);

  const beakTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 12), beakTipMat);
  beakTip.rotateX(Math.PI * 0.48);
  beakTip.position.set(0, -0.02, 0.45);
  beakGroup.add(beakTip);

  group.add(beakGroup);

  // Perch branch
  const branchMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), branchMat);
  branch.rotateZ(Math.PI * 0.5);
  branch.position.set(0, -0.45, 0);
  group.add(branch);

  return {
    group,
    update: (time: number) => {
      // Inquisitive head bobbing
      beakGroup.rotation.y = Math.sin(time * 1.5) * 0.25;
      beakGroup.rotation.x = Math.sin(time * 3) * 0.08;
    },
  };
}

export function createOncaPintada(): AnimatedFauna {
  const group = new THREE.Group();

  const jaguarMat = new THREE.MeshStandardMaterial({
    color: 0xd48b28,
    roughness: 0.45,
    metalness: 0.1,
  });
  const blackSpotsMat = new THREE.MeshStandardMaterial({
    color: 0x1f1608,
    roughness: 0.6,
  });

  // Torso
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.4, 12), jaguarMat);
  body.rotateZ(Math.PI * 0.5);
  group.add(body);

  // Head with ears
  const headGroup = new THREE.Group();
  headGroup.position.set(0.85, 0.25, 0);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), jaguarMat);
  headMesh.scale.set(1.1, 0.95, 0.95);
  headGroup.add(headMesh);

  // Ears
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 8), jaguarMat);
  earL.position.set(0, 0.25, 0.15);
  headGroup.add(earL);

  const earR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 8), jaguarMat);
  earR.position.set(0, 0.25, -0.15);
  headGroup.add(earR);

  group.add(headGroup);

  // Rosette spots on back
  for (let i = 0; i < 7; i++) {
    const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 6), blackSpotsMat);
    spot.position.set(-0.45 + i * 0.16, 0.31, (i % 2 === 0 ? 0.1 : -0.1));
    group.add(spot);
  }

  // Tail
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.9, 8), jaguarMat);
  tail.position.set(-0.85, 0.1, 0);
  tail.rotation.z = 0.8;
  group.add(tail);

  return {
    group,
    update: (time: number) => {
      headGroup.rotation.y = Math.sin(time * 0.8) * 0.15;
      tail.rotation.z = 0.8 + Math.sin(time * 2.5) * 0.15;
    },
  };
}
