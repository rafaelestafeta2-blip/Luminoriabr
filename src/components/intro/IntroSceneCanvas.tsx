import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createSpiderwebPosterMatrix } from './spiderwebPosterMatrix3D';
import { createLuminoriaNetflixTitle3D } from './luminoriaNetflixTitle3D';
import { useLuminoria } from '../../context/LuminoriaContext';

interface IntroSceneCanvasProps {
  progress: number;
}

export const IntroSceneCanvas: React.FC<IntroSceneCanvasProps> = ({ progress }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const { vodItems } = useLuminoria();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Deep Space Scene, Camera, WebGL Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020204);
    scene.fog = new THREE.FogExp2(0x020204, 0.035);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Studio Reflection Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Cosmic Starfield in Deep Space
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 32;
      starPositions[i + 1] = (Math.random() - 0.5) * 24;
      starPositions[i + 2] = (Math.random() - 0.5) * 30 - 6;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.065,
      transparent: true,
      opacity: 0.85,
    });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);

    // 4. Netflix Dramatic Lighting (Crimson Key + Cool Rim)
    const keySpot = new THREE.SpotLight(0xff2233, 4.5, 30, Math.PI * 0.45, 0.35);
    keySpot.position.set(0, 5, 12);
    scene.add(keySpot);

    const rimLight = new THREE.DirectionalLight(0xe50914, 3.0);
    rimLight.position.set(-6, -3, -5);
    scene.add(rimLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 2.2);
    frontLight.position.set(4, 3, 8);
    scene.add(frontLight);

    // 5. Spiderweb Movie Poster Matrix ("Teia de Aranha")
    const topMovies = vodItems.slice(0, 20);
    const spiderweb = createSpiderwebPosterMatrix(topMovies);
    spiderweb.group.position.set(0, 0, 0);
    scene.add(spiderweb.group);

    // 6. Sculpted 3D "LUMINORIA" Netflix-Style Title
    const title3D = createLuminoriaNetflixTitle3D();
    title3D.group.scale.set(0.68, 0.68, 0.68);
    title3D.group.position.set(0, 0.1, 0);
    scene.add(title3D.group);

    // 7. Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const currProgress = progressRef.current;

      // Update spiderweb poster matrix and letters
      spiderweb.update(currProgress, time);
      title3D.update(currProgress, time);

      // Camera push-in through the spiderweb tunnel
      camera.position.z = 10 - currProgress * 2.2;
      camera.position.x = Math.sin(time * 0.5) * 0.15;
      camera.position.y = Math.cos(time * 0.4) * 0.1;

      // Rotate distant stars
      starfield.rotation.y = time * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [vodItems]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  );
};
