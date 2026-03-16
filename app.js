/* global GRAPH_MANIFEST */

const listEl = document.getElementById("graphList");
const emptyEl = document.getElementById("empty");
const searchEl = document.getElementById("search");
const manifestInfoEl = document.getElementById("manifestInfo");

const stageEl = document.getElementById("stage");
const hintEl = document.getElementById("hint");
const imgWrapEl = document.getElementById("imgWrap");
const imgEl = document.getElementById("img");
const statusEl = document.getElementById("status");
const btnOpenFileEl = document.getElementById("btnOpenFile");

const btnFit = document.getElementById("btnFit");
const btn100 = document.getElementById("btn100");
const btnReset = document.getElementById("btnReset");

const graphs = (GRAPH_MANIFEST?.graphs || []).slice();

function formatDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch {
    return String(d);
  }
}

function setManifestInfo() {
  const gen = GRAPH_MANIFEST?.generatedAt ? formatDate(GRAPH_MANIFEST.generatedAt) : "unknown";
  manifestInfoEl.textContent = `Graphs: ${graphs.length} • Manifest: ${gen}`;
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

let activeId = null;

function renderList() {
  const q = (searchEl.value || "").trim().toLowerCase();
  const filtered = q
    ? graphs.filter(g => (g.title || "").toLowerCase().includes(q) || (g.file || "").toLowerCase().includes(q))
    : graphs;

  clearChildren(listEl);
  emptyEl.classList.toggle("hidden", filtered.length !== 0);

  for (const g of filtered) {
    const li = document.createElement("li");
    li.className = "graph-item" + (g.id === activeId ? " graph-item--active" : "");
    li.tabIndex = 0;

    const name = document.createElement("div");
    name.className = "graph-name";
    name.textContent = g.title || g.file || "Untitled";
    li.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "graph-meta";
    const p1 = document.createElement("span");
    p1.className = "pill";
    p1.textContent = (g.kind || "image").toUpperCase();
    meta.appendChild(p1);
    if (g.updatedAt) {
      const p2 = document.createElement("span");
      p2.className = "pill";
      p2.textContent = `Updated: ${formatDate(g.updatedAt)}`;
      meta.appendChild(p2);
    }
    li.appendChild(meta);

    const open = () => openGraph(g.id);
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });

    listEl.appendChild(li);
  }
}

// Zoom/pan state (image-local transform in CSS pixels)
let scale = 1;
let tx = 0;
let ty = 0;
let naturalW = 0;
let naturalH = 0;

function applyTransform() {
  imgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  const pct = Math.round(scale * 100);
  statusEl.textContent = activeId
    ? `${pct}% • ${naturalW}×${naturalH}px`
    : "";
}

function resetView() {
  scale = 1;
  tx = 0;
  ty = 0;
  applyTransform();
}

function fitToStage() {
  if (!naturalW || !naturalH) return;
  const rect = stageEl.getBoundingClientRect();
  const pad = 30;
  const w = Math.max(1, rect.width - pad * 2);
  const h = Math.max(1, rect.height - pad * 2);
  const s = Math.min(w / naturalW, h / naturalH);
  scale = Math.max(0.05, Math.min(8, s));
  const imgW = naturalW * scale;
  const imgH = naturalH * scale;
  tx = Math.round((rect.width - imgW) / 2);
  ty = Math.round((rect.height - imgH) / 2);
  applyTransform();
}

function clampScale(next) {
  return Math.max(0.05, Math.min(12, next));
}

function zoomAt(clientX, clientY, zoomFactor) {
  const rect = stageEl.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  const prev = scale;
  const next = clampScale(prev * zoomFactor);
  if (next === prev) return;

  // Keep the point under the cursor stable:
  // screen = translate + scale * image
  // Solve new translate so that image point remains the same.
  const ix = (x - tx) / prev;
  const iy = (y - ty) / prev;

  scale = next;
  tx = x - ix * next;
  ty = y - iy * next;
  applyTransform();
}

let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartTx = 0;
let dragStartTy = 0;

stageEl.addEventListener("wheel", (e) => {
  if (!activeId) return;
  e.preventDefault();
  const direction = e.deltaY > 0 ? 1 / 1.12 : 1.12;
  zoomAt(e.clientX, e.clientY, direction);
}, { passive: false });

stageEl.addEventListener("pointerdown", (e) => {
  if (!activeId) return;
  dragging = true;
  stageEl.setPointerCapture(e.pointerId);
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartTx = tx;
  dragStartTy = ty;
});

stageEl.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  tx = dragStartTx + (e.clientX - dragStartX);
  ty = dragStartTy + (e.clientY - dragStartY);
  applyTransform();
});

stageEl.addEventListener("pointerup", (e) => {
  dragging = false;
  try { stageEl.releasePointerCapture(e.pointerId); } catch {}
});

stageEl.addEventListener("pointercancel", () => { dragging = false; });

btnFit.addEventListener("click", fitToStage);
btn100.addEventListener("click", () => { resetView(); });
btnReset.addEventListener("click", () => { resetView(); fitToStage(); });

window.addEventListener("resize", () => {
  if (activeId) fitToStage();
});

function openGraph(id) {
  const g = graphs.find(x => x.id === id);
  if (!g) return;
  activeId = id;
  renderList();

  hintEl.classList.add("hidden");

  // Remove any prior iframe view
  const oldFrame = stageEl.querySelector("iframe");
  if (oldFrame) oldFrame.remove();

  if (g.kind === "interactive") {
    imgWrapEl.classList.add("hidden");
    btnOpenFileEl.classList.add("hidden");
    statusEl.textContent = "Interactive view";

    const frame = document.createElement("iframe");
    frame.src = g.file;
    frame.style.position = "absolute";
    frame.style.inset = "0";
    frame.style.width = "100%";
    frame.style.height = "100%";
    frame.style.border = "0";
    stageEl.appendChild(frame);
    return;
  }

  imgWrapEl.classList.remove("hidden");
  btnOpenFileEl.classList.remove("hidden");

  const src = `graphs/${encodeURIComponent(g.file)}`;
  imgEl.onload = () => {
    naturalW = imgEl.naturalWidth || 0;
    naturalH = imgEl.naturalHeight || 0;
    resetView();
    fitToStage();
  };
  imgEl.onerror = () => {
    statusEl.textContent = "Failed to load image.";
  };
  imgEl.src = src;
  btnOpenFileEl.href = src;
  btnOpenFileEl.download = g.file;
}

searchEl.addEventListener("input", renderList);

setManifestInfo();
renderList();
