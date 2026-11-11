import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMERA_PRESETS } from '../config.js';

const REF_ASPECT = 1.85;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Órbita/zoom/pan com amortecimento e transições suaves entre presets. */
export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, domElement);
    const c = this.controls;
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = 6;
    c.maxDistance = 140;
    c.maxPolarAngle = Math.PI * 0.485;
    c.screenSpacePanning = false;
    this.tween = null;
    this.current = 'campo_geral';
    this.fitScale = 1;
    this._onStart = () => {
      this.tween = null;
    };
    c.addEventListener('start', this._onStart);
    this.jumpTo('campo_geral');
  }

  _resolve(p) {
    const preset = typeof p === 'string' ? CAMERA_PRESETS[p] : p;
    const pos = new THREE.Vector3(...preset.pos);
    const target = new THREE.Vector3(...preset.target);
    if (preset.fit) {
      const k = Math.max(0.84, REF_ASPECT / Math.max(0.55, this.camera.aspect)) * this.fitScale;
      pos.sub(target).multiplyScalar(k).add(target);
    }
    return { pos, target };
  }

  jumpTo(name) {
    const { pos, target } = this._resolve(name);
    this.tween = null;
    this.camera.position.copy(pos);
    this.controls.target.copy(target);
    this.controls.update();
    this.current = typeof name === 'string' ? name : 'custom';
  }

  flyTo(name, duration = 1.25) {
    const to = this._resolve(name);
    this.tween = {
      t: 0,
      duration,
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      to,
    };
    this.current = typeof name === 'string' ? name : 'custom';
  }

  update(dt) {
    const tw = this.tween;
    if (tw) {
      tw.t += dt;
      const k = ease(Math.min(1, tw.t / tw.duration));
      this.camera.position.lerpVectors(tw.fromPos, tw.to.pos, k);
      this.controls.target.lerpVectors(tw.fromTarget, tw.to.target, k);
      if (tw.t >= tw.duration) this.tween = null;
    }
    this.controls.update();
  }

  dispose() {
    this.controls.removeEventListener('start', this._onStart);
    this.controls.dispose();
  }
}
