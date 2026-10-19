import * as THREE from 'three';
import { VodItem } from '../../types/luminoria';

export interface SpiderwebMatrix {
  group: THREE.Group;
  update: (progress: number, time: number) => void;
}

/**
 * Creates a 3D dark-space Spiderweb ("Teia de Aranha") matrix
 * populated with top movie poster cards and glowing radial laser threads
 */
export function createSpiderwebPosterMatrix(topMovies: VodItem[]): SpiderwebMatrix {
  const group = new THREE.Group();

  // 1. Procedural Fallback Poster Canvas (Zero 404s guaranteed)
  const createPosterTexture = (movie: VodItem): THREE.Texture => {
    if (movie.posterUrl) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      const tex = loader.load(
        movie.posterUrl,
        () => {},
        undefined,
        () => {} // fallback
      );
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 450);
      grad.addColorStop(0, '#1a0508');
      grad.addColorStop(0.5, '#0d0d14');
      grad.addColorStop(1, '#050508');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 300, 450);

      // Red cinematic accent line
      ctx.fillStyle = '#E50914';
      ctx.fillRect(20, 20, 6, 410);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(movie.title.slice(0, 18), 35, 230);

      ctx.fillStyle = '#E50914';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('LUMINORIA PRO', 35, 260);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  // 2. Spiderweb Web Threads (Concentric Web Rings + Radial Web Spokes)
  const webLineMat = new THREE.LineBasicMaterial({
    color: 0xe50914,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });

  const ringsCount = 5;
  const spokesCount = 12;
  const webRings: THREE.LineLoop[] = [];

  // Concentric Rings
  for (let r = 1; r <= ringsCount; r++) {
    const radius = r * 1.8;
    const zOffset = -r * 1.2;
    const points: THREE.Vector3[] = [];

    for (let s = 0; s <= spokesCount; s++) {
      const theta = (s / spokesCount) * Math.PI * 2;
      // Slight web sag curve between spokes
      const sag = Math.cos(theta * spokesCount * 0.5) * 0.15;
      points.push(
        new THREE.Vector3(
          Math.cos(theta) * (radius - sag),
          Math.sin(theta) * (radius - sag),
          zOffset
        )
      );
    }

    const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
    const ringLine = new THREE.LineLoop(ringGeo, webLineMat);
    group.add(ringLine);
    webRings.push(ringLine);
  }

  // Radial Spokes (from center outward to outermost ring)
  const spokePoints: THREE.Vector3[] = [];
  for (let s = 0; s < spokesCount; s++) {
    const theta = (s / spokesCount) * Math.PI * 2;
    spokePoints.push(new THREE.Vector3(0, 0, 0));
    spokePoints.push(
      new THREE.Vector3(
        Math.cos(theta) * 9.5,
        Math.sin(theta) * 9.5,
        -ringsCount * 1.2
      )
    );
  }
  const spokeGeo = new THREE.BufferGeometry().setFromPoints(spokePoints);
  const spokeLines = new THREE.LineSegments(spokeGeo, webLineMat);
  group.add(spokeLines);

  // 3. Top Movie Posters Placed on Spiderweb Nodes
  const posterGeo = new THREE.PlaneGeometry(1.25, 1.85);
  const posterMeshes: {
    mesh: THREE.Mesh;
    basePos: THREE.Vector3;
    baseRot: THREE.Euler;
  }[] = [];

  const displayMovies =
    topMovies.length > 0
      ? topMovies.slice(0, 16)
      : [{ id: '1', title: 'Deadpool & Wolverine' } as VodItem];

  displayMovies.forEach((movie, i) => {
    const ringIdx = (i % (ringsCount - 1)) + 1;
    const radius = ringIdx * 1.85;
    const theta = (i / displayMovies.length) * Math.PI * 2;
    const zPos = -ringIdx * 1.15;

    const texture = createPosterTexture(movie);
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.25,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(posterGeo, mat);

    // Position along spiderweb
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius;
    mesh.position.set(x, y, zPos);

    // Look slightly towards center
    mesh.lookAt(0, 0, zPos + 6);
    const baseRot = mesh.rotation.clone();

    // Subtle glowing neon border around poster
    const edgeGeo = new THREE.EdgesGeometry(posterGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xff3b30,
      transparent: true,
      opacity: 0.6,
    });
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    mesh.add(edgeLine);

    group.add(mesh);
    posterMeshes.push({ mesh, basePos: mesh.position.clone(), baseRot });
  });

  return {
    group,
    update: (progress: number, time: number) => {
      // Gentle web breathing and vibration
      group.rotation.z = time * 0.04;

      posterMeshes.forEach((item, idx) => {
        // Floating motion on the web
        const floatOffset = Math.sin(time * 2 + idx) * 0.08;
        item.mesh.position.y = item.basePos.y + floatOffset;

        // As intro progresses, posters slightly spread out for hyper-space effect
        const spread = 1 + progress * 0.35;
        item.mesh.position.x = item.basePos.x * spread;

        // Subtle wobble
        item.mesh.rotation.z = item.baseRot.z + Math.sin(time * 1.5 + idx) * 0.04;
      });
    },
  };
}
