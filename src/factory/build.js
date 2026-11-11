// Utilitários de construção procedural (geometrias simples reutilizáveis).
import * as THREE from 'three';

export function box(w, h, d, material, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

export function cylinder(rTop, rBottom, h, material, seg = 24, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

export function at(obj, x, y, z, rotY = 0) {
  obj.position.set(x, y, z);
  obj.rotation.y = rotY;
  return obj;
}
