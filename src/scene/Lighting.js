import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Iluminação limpa técnica + reflexos gerados localmente (sem HDR externo). */
export function setupLighting(scene, renderer) {
  const hemi = new THREE.HemisphereLight(0xd4e8ff, 0x10151d, 0.75);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(22, 36, 18);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = -36;
  sc.right = 36;
  sc.top = 30;
  sc.bottom = -30;
  sc.near = 5;
  sc.far = 95;
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

  return {
    dispose() {
      envTex.dispose();
    },
  };
}
