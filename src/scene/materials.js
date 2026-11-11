// Materiais e texturas para o Diorama 3D Isométrico (estilo maquete cutaway com camadas de solo,
// grama vibrante, asfalto com faixas amarelas, tanques azuis, casa em corte e encanamentos expostos).
import * as THREE from 'three';
import { COLORS } from '../config.js';

export function canvasTexture(w, h, draw, { repeat = null } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

export const floorTexture = canvasTexture(
  256,
  256,
  (g, w, h) => {
    g.fillStyle = '#0c121b';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#152030';
    g.lineWidth = 2;
    g.strokeRect(1, 1, w - 2, h - 2);
  },
  { repeat: [40, 30] }
);

// Textura de telha cerâmica para a casa em corte (cutaway)
export const roofTileTexture = canvasTexture(
  128,
  128,
  (g, w, h) => {
    g.fillStyle = '#d86c36';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#b55120';
    g.lineWidth = 3;
    for (let y = 0; y <= h; y += 16) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    for (let x = 0; x <= w; x += 24) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, h);
      g.stroke();
    }
  },
  { repeat: [2, 2] }
);

const std = (color, o = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.08, ...o });

export const M = {
  floor: new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.95, metalness: 0.0 }),

  // Camadas geológicas do Diorama Cutaway (inspiradas diretamente na referência visual)
  grassTop: std(0x5cb844, { roughness: 0.72, metalness: 0.02 }),
  grassDark: std(0x469632, { roughness: 0.75, metalness: 0.02 }),
  soilTop: std(0xa86838, { roughness: 0.85, metalness: 0.03 }),
  soilMid: std(0xc98249, { roughness: 0.85, metalness: 0.03 }),
  soilDeep: std(0x754829, { roughness: 0.9, metalness: 0.04 }),
  trenchSand: std(0xd4915a, { roughness: 0.86, metalness: 0.02 }),
  pebble: std(0x8e959e, { roughness: 0.75, metalness: 0.08 }),

  // Sistema viário da maquete
  asphalt: std(0x323842, { roughness: 0.82, metalness: 0.06 }),
  curb: std(0xd8dde3, { roughness: 0.65, metalness: 0.05 }),
  laneYellow: std(0xf5c842, { roughness: 0.5, metalness: 0.05 }),
  laneWhite: std(0xf2f5f8, { roughness: 0.5, metalness: 0.05 }),

  // Edificações do Diorama (Casa cutaway + Casa de bombas ETA)
  wallCream: std(0xf4ead5, { roughness: 0.7, metalness: 0.03 }),
  wallInner: std(0xe6d6bc, { roughness: 0.75, metalness: 0.03 }),
  floorWood: std(0xd69658, { roughness: 0.65, metalness: 0.05 }),
  floorTile: std(0xc8e3ed, { roughness: 0.45, metalness: 0.08 }),
  roofCeramic: new THREE.MeshStandardMaterial({
    map: roofTileTexture,
    roughness: 0.6,
    metalness: 0.05,
  }),
  pumpBrick: std(0xd97845, { roughness: 0.68, metalness: 0.06 }),
  pumpRoof: std(0xb5582b, { roughness: 0.65, metalness: 0.08 }),

  // Vegetação Low-Poly
  treeFoliage: std(0x48b03b, { roughness: 0.68, metalness: 0.02, flatShading: true }),
  treeFoliageLight: std(0x64cc4b, { roughness: 0.68, metalness: 0.02, flatShading: true }),
  treeTrunk: std(0x6e4726, { roughness: 0.85, metalness: 0.03 }),

  // Infraestrutura Hidráulica (Tanques, Tubulações, Concreto, Água)
  tankBlue: std(0x2d9cdb, { roughness: 0.38, metalness: 0.22 }),
  tankCap: std(0x217db5, { roughness: 0.42, metalness: 0.25 }),
  pipeWater: std(0x1b8ae6, { emissive: 0x052847, metalness: 0.35, roughness: 0.32 }),
  pipeSub: std(0x26a0f5, { emissive: 0x073459, metalness: 0.3, roughness: 0.32 }),
  pipeYellow: std(0xf2b729, { metalness: 0.3, roughness: 0.38 }),
  pipeGrey: std(0x8b99a8, { metalness: 0.45, roughness: 0.42 }),
  concrete: std(0xaeb7c2, { roughness: 0.72, metalness: 0.08 }),
  concreteDark: std(0x7c8794, { roughness: 0.78, metalness: 0.08 }),
  steel: std(COLORS.steel, { metalness: 0.78, roughness: 0.32 }),
  steelDark: std(COLORS.steelDark, { metalness: 0.65, roughness: 0.45 }),
  frame: std(COLORS.frame, { metalness: 0.55, roughness: 0.6 }),
  waterStream: new THREE.MeshStandardMaterial({
    color: 0x35b8ff,
    emissive: 0x0b4c73,
    roughness: 0.18,
    metalness: 0.1,
    transparent: true,
    opacity: 0.86,
  }),
  waterFill: new THREE.MeshStandardMaterial({
    color: COLORS.waterBright,
    emissive: 0x0a5661,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
  }),

  // Nuvem flutuante no céu (Gateway DHuO -> Lakehouse GCP)
  cloudWhite: new THREE.MeshStandardMaterial({
    color: 0xf0f6ff,
    emissive: 0x1c3554,
    roughness: 0.5,
    metalness: 0.04,
    transparent: true,
    opacity: 0.86,
  }),
  engPink: std(COLORS.engPink, { emissive: 0x520938, roughness: 0.35, metalness: 0.25 }),
  engCyan: std(COLORS.engCyan, { emissive: 0x0b5259, roughness: 0.32, metalness: 0.25 }),
  engOrange: std(COLORS.engOrange, { emissive: 0x592405, roughness: 0.38, metalness: 0.2 }),
  white: std(0xf4f7fa, { roughness: 0.45, metalness: 0.1 }),
  sensorBody: std(0x182536, { metalness: 0.6, roughness: 0.35 }),
  glowCyan: new THREE.MeshBasicMaterial({
    color: COLORS.engCyan,
    transparent: true,
    opacity: 0.94,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
  glowPink: new THREE.MeshBasicMaterial({
    color: COLORS.engPink,
    transparent: true,
    opacity: 0.94,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
};
