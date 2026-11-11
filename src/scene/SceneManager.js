import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { COLORS } from '../config.js';
import { setupLighting } from './Lighting.js';
import { CameraController } from './CameraController.js';

export function webglAvailable() {
  try {
    const cv = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (cv.getContext('webgl2') || cv.getContext('webgl')));
  } catch {
    return false;
  }
}

/** Renderer, cena, câmera, rótulos CSS2D e laço de animação (requestAnimationFrame). */
export class SceneManager {
  constructor(container) {
    this.container = container;
    this.updaters = [];
    this.running = false;
    this.raf = 0;
    this.onContextLost = null;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    const le = this.labelRenderer.domElement;
    le.style.position = 'absolute';
    le.style.inset = '0';
    le.style.pointerEvents = 'none';
    le.style.zIndex = '1';
    container.appendChild(le);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.bg);
    this.scene.fog = new THREE.Fog(COLORS.bg, 105, 230);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    this.lighting = setupLighting(this.scene, this.renderer);

    this._frame = this._frame.bind(this);
    this._lost = (e) => {
      e.preventDefault();
      this.stop();
      if (this.onContextLost) this.onContextLost();
    };
    this.renderer.domElement.addEventListener('webglcontextlost', this._lost);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
    this.cameraController.jumpTo('campo_geral');
  }

  resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.labelRenderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  addUpdater(fn) {
    this.updaters.push(fn);
    return () => {
      this.updaters = this.updaters.filter((f) => f !== fn);
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this._frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  _frame(now) {
    if (!this.running) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    for (const fn of this.updaters) fn(dt);
    this.cameraController.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this._frame);
  }

  dispose() {
    this.stop();
    this.ro.disconnect();
    this.renderer.domElement.removeEventListener('webglcontextlost', this._lost);
    this.cameraController.dispose();
    this.lighting.dispose();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
  }
}
