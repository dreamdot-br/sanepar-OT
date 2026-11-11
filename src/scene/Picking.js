import * as THREE from 'three';
import { COLORS } from '../config.js';

function makeBox(color, opacity) {
  const h = new THREE.Box3Helper(new THREE.Box3(), color);
  h.material.depthTest = false;
  h.material.transparent = true;
  h.material.opacity = opacity;
  h.renderOrder = 999;
  h.visible = false;
  return h;
}

/** Seleção por clique (Raycaster) com caixa de destaque. */
export class Picking {
  constructor(sm, { onSelect = () => {}, onHover = () => {} } = {}) {
    this.sm = sm;
    this.dom = sm.renderer.domElement;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.roots = new Set();
    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.selected = null;
    this.hovered = null;
    this.down = null;
    this.pending = false;
    this.lastMove = null;
    this.selBox = makeBox(COLORS.engCyan, 0.95);
    this.hovBox = makeBox(0xffffff, 0.45);
    sm.scene.add(this.selBox, this.hovBox);

    this._move = (e) => {
      this.lastMove = e;
      if (!this.pending) {
        this.pending = true;
        requestAnimationFrame(() => {
          this.pending = false;
          this._hover();
        });
      }
    };
    this._down = (e) => {
      this.down = { x: e.clientX, y: e.clientY };
    };
    this._up = (e) => {
      if (!this.down) return;
      const moved = Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y);
      this.down = null;
      if (moved > 5) return;
      const root = this._hit(e);
      this.onSelect(root ? root.userData.pick : null, root);
    };
    this._leave = () => {
      this._setHover(null);
    };
    this.dom.addEventListener('pointermove', this._move);
    this.dom.addEventListener('pointerdown', this._down);
    this.dom.addEventListener('pointerup', this._up);
    this.dom.addEventListener('pointerleave', this._leave);
    sm.addUpdater(() => this.update());
  }

  register(root, pick) {
    root.userData.pick = pick;
    this.roots.add(root);
  }

  select(root) {
    this.selected = root || null;
  }

  selectById(type, id) {
    for (const r of this.roots) {
      if (r.userData.pick.type === type && r.userData.pick.id === id) {
        this.selected = r;
        return r;
      }
    }
    this.selected = null;
    return null;
  }

  _visible(o) {
    for (let p = o; p; p = p.parent) if (!p.visible) return false;
    return true;
  }

  _hit(e) {
    const rect = this.dom.getBoundingClientRect();
    this.ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.ray.setFromCamera(this.ndc, this.sm.camera);
    const hits = this.ray.intersectObjects([...this.roots].filter((r) => this._visible(r)), true);
    for (const h of hits) {
      if (!h.object.isMesh && !h.object.isSprite) continue;
      if (!this._visible(h.object)) continue;
      let o = h.object;
      while (o && !(o.userData && o.userData.pick)) o = o.parent;
      if (o && this.roots.has(o)) return o;
    }
    return null;
  }

  _hover() {
    if (!this.lastMove || this.down) return;
    this._setHover(this._hit(this.lastMove));
  }

  _setHover(root) {
    if (root === this.hovered) return;
    this.hovered = root;
    this.dom.style.cursor = root ? 'pointer' : '';
    this.onHover(root ? root.userData.pick : null);
  }

  update() {
    this._box(this.selBox, this.selected);
    this._box(this.hovBox, this.hovered && this.hovered !== this.selected ? this.hovered : null);
  }

  _box(helper, root) {
    if (!root || !this._visible(root)) {
      helper.visible = false;
      return;
    }
    helper.box.setFromObject(root);
    helper.box.expandByScalar(0.14);
    helper.visible = !helper.box.isEmpty();
  }

  dispose() {
    this.dom.removeEventListener('pointermove', this._move);
    this.dom.removeEventListener('pointerdown', this._down);
    this.dom.removeEventListener('pointerup', this._up);
    this.dom.removeEventListener('pointerleave', this._leave);
    this.sm.scene.remove(this.selBox, this.hovBox);
    this.selBox.dispose?.();
    this.hovBox.dispose?.();
  }
}
