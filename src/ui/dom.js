// Utilidades mínimas de DOM e formatação (PT-BR).
import { FIDELITY } from '../content/catalog.js';

export function h(tag, attrs = null, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function setChildren(el, ...children) {
  clear(el);
  append(el, children);
  return el;
}

export function chip(id, { label = null, title = true } = {}) {
  const f = FIDELITY[id] || FIDELITY.inv;
  return h(
    'span',
    { class: `chip ${id}`, title: title ? `${f.label}: ${f.desc}` : null },
    label || f.short
  );
}

export const fmtNum = (v, d = 0) =>
  v === null || v === undefined
    ? '—'
    : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

export function setText(el, text) {
  if (el && el.textContent !== text) el.textContent = text;
}
