import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Iluminação técnica com transição suave Dia / Madrugada para as Narrativas de Negócio. */
export function setupLighting(scene, renderer) {
  const hemi = new THREE.HemisphereLight(0xd4e8ff, 0x10151d, 0.75);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(22, 36, 18);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = -38;
  sc.right = 38;
  sc.top = 32;
  sc.bottom = -32;
  sc.near = 5;
  sc.far = 110;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.04;
  key.target.position.set(0, 0, -2);
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight(0x6ec5ff, 0.55);
  fill.position.set(-24, 15, -14);
  scene.add(fill);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.48;
  pmrem.dispose();

  let nightBlend = 0;

  return {
    updateNightMode(wantNight, dt) {
      const target = wantNight ? 1 : 0;
      nightBlend += (target - nightBlend) * Math.min(1, dt * 2.5);
      key.intensity = 2.0 - nightBlend * 1.38;
      hemi.intensity = 0.75 - nightBlend * 0.42;
      fill.intensity = 0.55 + nightBlend * 0.25;
      scene.environmentIntensity = 0.48 - nightBlend * 0.22;
    },
    dispose() {
      envTex.dispose();
    },
  };
}
