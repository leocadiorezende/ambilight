/* ==========================================================
   Sala em 3D: 5,00 × 3,00 m, pé-direito 2,80 m.
   Coordenadas em metros: x = largura (0 = parede da esquerda),
   y = altura, z = profundidade (0 = parede da TV, 3 = parede do sofá).
   A luz de cada camada é pintada em texturas das paredes a cada quadro.
   ========================================================== */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const host = document.getElementById("room3d");
if (host && window.Ambi) init();

function init() {
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const { NT, NS } = Ambi;
  const RW = 5, RD = 3, RH = 2.8, S = 80; // S = px por metro nas texturas

  /* ---------- renderizador e câmera ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#000");
  const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.03, 60);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxDistance = 10;
  controls.minDistance = 0.3;

  const resize = () => {
    const w = host.clientWidth, h = Math.round(w * 9 / 16);
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "auto";
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);

  const views = {
    sofa: { pos: [2.5, 1.05, 2.35], target: [2.5, 1.15, 0] },
    porta: { pos: [4.55, 1.6, 2.7], target: [2.0, 1.0, 0.2] },
    cima: { pos: [2.5, 7.8, 1.55], target: [2.5, 0, 1.5] },
    fora: { pos: [2.5, 2.4, 6.8], target: [2.5, 1.2, 1.0] }
  };
  const setView = (k) => {
    camera.position.set(...views[k].pos);
    controls.target.set(...views[k].target);
    controls.update();
  };

  /* ---------- paredes com textura pintada ---------- */
  const mkPlane = (w, h, toPx, pos, rot, base) => {
    const cv = document.createElement("canvas");
    cv.width = Math.round(w * S); cv.height = Math.round(h * S);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
    mesh.position.set(...pos); mesh.rotation.set(...rot);
    scene.add(mesh);
    return { cv, ctx: cv.getContext("2d"), tex, toPx, base };
  };
  // cada parede usa suas próprias coordenadas (u, v) em metros
  const P = {
    tv: mkPlane(RW, RH, (x, h) => [x * S, (RH - h) * S], [RW / 2, RH / 2, 0], [0, 0, 0], "#1a1b21"),
    ceil: mkPlane(RW, RD, (x, z) => [x * S, (RD - z) * S], [RW / 2, RH, RD / 2], [Math.PI / 2, 0, 0], "#131419"),
    floor: mkPlane(RW, RD, (x, z) => [x * S, z * S], [RW / 2, 0, RD / 2], [-Math.PI / 2, 0, 0], "#101116"),
    left: mkPlane(RD, RH, (z, h) => [(RD - z) * S, (RH - h) * S], [0, RH / 2, RD / 2], [0, Math.PI / 2, 0], "#16171c"),
    right: mkPlane(RD, RH, (z, h) => [z * S, (RH - h) * S], [RW, RH / 2, RD / 2], [0, -Math.PI / 2, 0], "#16171c"),
    back: mkPlane(RW, RH, (x, h) => [(RW - x) * S, (RH - h) * S], [RW / 2, RH / 2, RD], [0, Math.PI, 0], "#16171c")
  };

  // retângulo em metros → retângulo em pixels da textura
  const rectPx = (pl, u0, v0, u1, v1) => {
    const [ax, ay] = pl.toPx(u0, v0), [bx, by] = pl.toPx(u1, v1);
    return [Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay)];
  };

  /* ---------- objetos ---------- */
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
  const box = (w, h, d, x, y, z, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); scene.add(m); return m;
  };
  // rack 2,20 × 0,46 × 0,37 m com base recuada
  // rack (opcional) com a soundbar em cima
  const rackGrp = new THREE.Group(); scene.add(rackGrp);
  const inRack = (m) => { scene.remove(m); rackGrp.add(m); return m; };
  inRack(box(2.2, 0.40, 0.37, 2.5, 0.06 + 0.20, 0.185, lam("#cfc8bd")));
  inRack(box(2.1, 0.06, 0.28, 2.5, 0.03, 0.14, lam("#8f897f")));
  inRack(box(1.0, 0.06, 0.10, 2.5, 0.49, 0.14, lam("#1d1e22")));
  // sem rack: soundbar num suporte preso no suporte da TV, ~7 cm à frente da parede
  const wallBar = new THREE.Group(); scene.add(wallBar);
  const sbBar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.10), lam("#1d1e22")); wallBar.add(sbBar);
  const sbArm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.02), lam("#2b2d33")); wallBar.add(sbArm);
  const sub = box(0.30, 0.42, 0.35, 1.05, 0.21, 0.25, lam("#18191d"));   // subwoofer
  let hasRack = true;
  function placeRack() {
    rackGrp.visible = hasRack; wallBar.visible = !hasRack;
    const bottom = 1.1 - TV.h / 2;
    sbBar.position.set(2.5, bottom - 0.12, 0.12);
    sbArm.position.set(2.5, bottom - 0.05, 0.075);
    if (hasRack) sub.position.set(1.05, 0.21, 0.25); else sub.position.set(0.25, 0.21, 1.6);
  }
  box(0.22, 0.30, 1.06, 0.11, 2.65, 1.45, lam("#e8e8e8"));        // ar-condicionado
  const sofaMat = lam("#7d6e5c");
  box(5, 0.45, 0.85, 2.5, 0.225, 2.325, sofaMat);                 // assento
  box(5, 0.92, 0.32, 2.5, 0.46, 2.84, sofaMat);                   // encosto
  box(0.18, 0.65, 1.05, 0.09, 0.325, 2.47, sofaMat);              // braços
  box(0.18, 0.65, 1.05, 4.91, 0.325, 2.47, sofaMat);

  // porta (parede 2): dobradiça do lado do canto da TV, abre em direção à parede da TV
  const doorHinge = new THREE.Group(); doorHinge.position.set(RW - 0.02, 0, 0.14); scene.add(doorHinge);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.035, 2.08, 0.80), lam("#6b4a2a")); leaf.position.set(0, 1.04, 0.40); doorHinge.add(leaf);
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.025, 0.12), lam("#bdbdbd")); knob.position.set(-0.05, 1.0, 0.72); doorHinge.add(knob);
  let doorOpen = 0, doorTarget = 0;

  // ripas da moldura (pintadas de branco)
  const ripaMat = lam("#e6e6e6");
  const ripas = new THREE.Group();
  [[RW, 0.11, 0.015, RW / 2, RH - 0.055, 0.0575], [RW, 0.11, 0.015, RW / 2, 0.055, 0.0575],
   [0.11, RH - 0.22, 0.015, 0.055, RH / 2, 0.0575], [0.11, RH - 0.22, 0.015, RW - 0.055, RH / 2, 0.0575]]
    .forEach(([w, h, d, x, y, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ripaMat); m.position.set(x, y, z); ripas.add(m); });
  scene.add(ripas);

  // TV
  const player = Ambi.createPlayer();
  const follow = Ambi.createFollower();
  const screenTex = new THREE.CanvasTexture(player.canvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const tvBody = box(1, 1, 0.03, 2.5, 1.1, 0.085, lam("#050506"));
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: screenTex }));
  tvScreen.position.set(2.5, 1.1, 0.101); scene.add(tvScreen);
  const reflMat = new THREE.MeshBasicMaterial({ color: "#fff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const tvRefl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), reflMat);
  tvRefl.position.set(2.5, 1.1, 0.103); scene.add(tvRefl);
  let TV = { w: 1.22, h: 0.69 };
  const setTv = (inch) => {
    const w = inch * 0.0254 * (16 / Math.hypot(16, 9)), h = w * 9 / 16;
    TV = { w, h };
    tvBody.scale.set(w + 0.01, h + 0.01, 1);
    tvScreen.scale.set(w, h, 1); tvRefl.scale.set(w, h, 1);
    buildStrips();
    placeRack();
  };

  // luzes para os objetos (sofá, rack): seguem a cor média
  const amb = new THREE.AmbientLight("#ffffff", 0.05);
  scene.add(amb);
  const pTv = new THREE.PointLight("#ffffff", 0, 0, 1.4); pTv.position.set(2.5, 1.1, 0.35); scene.add(pTv);
  const pFloor = new THREE.PointLight("#ffffff", 0, 0, 1.6); pFloor.position.set(2.5, 0.1, 0.6); scene.add(pFloor);
  const pCeil = new THREE.PointLight("#ffffff", 0, 0, 1.4); pCeil.position.set(2.5, 2.7, 1.5); scene.add(pCeil);

  /* ---------- posição real das fitas (modo raio-X) ---------- */
  const stripColors = { halo: "#00e5ff", moldura: "#ff3d81", rack: "#ffb300", tetoFrente: "#b388ff", tetoTodo: "#7c4dff", laterais: "#00e676", tras: "#ff1744" };
  const strips = {};
  const seg = (g, a, b, col) => {
    const d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.018, Math.abs(d.x)), Math.max(0.018, Math.abs(d.y)), Math.max(0.018, Math.abs(d.z))),
      new THREE.MeshBasicMaterial({ color: col, depthTest: false, transparent: true, opacity: 0.95 }));
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.renderOrder = 10; g.add(m);
  };
  function buildStrips() {
    Object.values(strips).forEach((g) => scene.remove(g));
    const add = (k, list) => { const g = new THREE.Group(); list.forEach(([a, b]) => seg(g, a, b, stripColors[k])); strips[k] = g; scene.add(g); };
    const x0 = 2.5 - TV.w / 2 + 0.035, x1 = 2.5 + TV.w / 2 - 0.035, y0 = 1.1 - TV.h / 2 + 0.035, y1 = 1.1 + TV.h / 2 - 0.035, zt = 0.065;
    add("halo", [[[x0, y1, zt], [x1, y1, zt]], [[x0, y0, zt], [x1, y0, zt]], [[x0, y0, zt], [x0, y1, zt]], [[x1, y0, zt], [x1, y1, zt]]]);
    add("moldura", [[[0, RH - 0.015, 0.04], [RW, RH - 0.015, 0.04]], [[0, 0.03, 0.04], [RW, 0.03, 0.04]], [[0.015, 0.11, 0.04], [0.015, RH - 0.11, 0.04]], [[RW - 0.015, 0.11, 0.04], [RW - 0.015, RH - 0.11, 0.04]]]);
    add("rack", [[[1.45, 0.055, 0.31], [3.55, 0.055, 0.31]]]);
    add("tetoFrente", [[[0, 2.68, 0.03], [RW, 2.68, 0.03]]]);
    add("tetoTodo", [[[0.03, 2.62, 0.08], [0.03, 2.62, 0.9]], [[0.03, 2.62, 2.0], [0.03, 2.62, RD - 0.03]], [[0, 2.62, RD - 0.03], [RW, 2.62, RD - 0.03]], [[RW - 0.03, 2.62, 0.08], [RW - 0.03, 2.62, RD - 0.03]]]);
    add("laterais", [[[0.015, 0.15, 0.13], [0.015, 2.5, 0.13]], [[RW - 0.015, 0.15, 0.13], [RW - 0.015, 2.5, 0.13]]]);
    add("tras", [[[0.2, 0.95, RD - 0.02], [RW - 0.2, 0.95, RD - 0.02]]]);
    syncStrips();
  }

  /* ---------- controles ---------- */
  const layers = { halo: true, moldura: true, rack: true, tetoFrente: false, tetoTodo: false, laterais: false, tras: false };
  const presets = {
    sotv: ["halo"],
    parede: ["halo", "moldura", "rack"],
    mega: ["halo", "moldura", "rack", "tetoFrente", "tetoTodo", "laterais"],
    exagero: ["halo", "moldura", "rack", "tetoFrente", "tetoTodo", "laterais", "tras"]
  };
  let extra = 0.6, slow = false, showStrips = false;
  function syncStrips() { Object.entries(strips).forEach(([k, g]) => (g.visible = showStrips && layers[k] && (k !== "rack" || hasRack))); ripas.visible = layers.moldura || layers.tetoFrente || layers.laterais; }
  const syncToggles = () => $$("#r3-layers input").forEach((i) => (i.checked = layers[i.dataset.l]));
  $$("#r3-layers input").forEach((i) => i.addEventListener("change", () => { layers[i.dataset.l] = i.checked; $$("#r3-presets .chip").forEach((c) => c.classList.remove("active")); syncStrips(); }));
  $$("#r3-presets .chip").forEach((c) => c.addEventListener("click", () => {
    Object.keys(layers).forEach((k) => (layers[k] = presets[c.dataset.p].includes(k)));
    $$("#r3-presets .chip").forEach((x) => x.classList.toggle("active", x === c));
    syncToggles(); syncStrips();
  }));
  $$("#r3-views .chip").forEach((c) => c.addEventListener("click", () => { $$("#r3-views .chip").forEach((x) => x.classList.toggle("active", x === c)); setView(c.dataset.v); }));
  $("#r3-strips").addEventListener("change", (e) => { showStrips = e.target.checked; syncStrips(); });
  $("#r3-door").addEventListener("change", (e) => (doorTarget = e.target.checked ? 1 : 0));
  const rackInput = $('#r3-layers input[data-l="rack"]');
  $("#r3-rack").addEventListener("change", (e) => {
    hasRack = e.target.checked; placeRack();
    rackInput.disabled = !hasRack; rackInput.closest("label").classList.toggle("off", !hasRack);
    syncStrips();
  });
  rackInput.disabled = false;
  $("#r3-slow").addEventListener("change", (e) => (slow = e.target.checked));
  $("#r3-extra").addEventListener("input", (e) => { extra = e.target.value / 100; $("#r3-extra-out").textContent = e.target.value + "%"; });
  const sc = $("#r3-scenes");
  sc.innerHTML = '<option value="auto">Automático (todas as cenas)</option>' + Ambi.scenes.map((x) => `<option value="${x.id}">${x.name}</option>`).join("");
  sc.addEventListener("change", () => player.setScene(sc.value));
  window.addEventListener("tvchange", (e) => setTv(e.detail.inch));

  /* ---------- pintura da luz ---------- */
  const gam = (v) => 255 * Math.pow(v / 255, 1.8);
  const rgba = (c, a) => `rgba(${gam(c[0]) | 0},${gam(c[1]) | 0},${gam(c[2]) | 0},${Math.max(0, Math.min(1, a))})`;
  const avgOf = (arr) => arr.reduce((a, c) => [a[0] + c[0] / arr.length, a[1] + c[1] / arr.length, a[2] + c[2] / arr.length], [0, 0, 0]);
  const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;

  const glow = (pl, u, v, r, c, a, sx = 1, sy = 1) => {
    const [x, y] = pl.toPx(u, v), R = r * S, g = pl.ctx;
    g.save(); g.translate(x, y); g.scale(sx, sy);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, R);
    gr.addColorStop(0, rgba(c, a)); gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr; g.fillRect(-R, -R, 2 * R, 2 * R); g.restore();
  };
  // faixa de luz junto a uma borda: cores interpoladas ao longo da borda, esmaecendo
  const oc = document.createElement("canvas"); oc.width = 512; oc.height = 512;
  const o = oc.getContext("2d");
  const band = (pl, rect, cols, along, fade, a) => {
    const [x, y, w, h] = rect.map(Math.round);
    if (w < 1 || h < 1) return;
    o.globalCompositeOperation = "source-over"; o.clearRect(0, 0, w, h);
    const g = along === "x" ? o.createLinearGradient(0, 0, w, 0) : o.createLinearGradient(0, 0, 0, h);
    cols.forEach((c, i) => g.addColorStop(cols.length === 1 ? 0.5 : i / (cols.length - 1), rgba(c, 1)));
    o.fillStyle = g; o.fillRect(0, 0, w, h);
    const f = { down: [0, 0, 0, h], up: [0, h, 0, 0], right: [0, 0, w, 0], left: [w, 0, 0, 0] }[fade];
    const fg = o.createLinearGradient(...f);
    fg.addColorStop(0, `rgba(0,0,0,${a})`); fg.addColorStop(1, "rgba(0,0,0,0)");
    o.globalCompositeOperation = "destination-in"; o.fillStyle = fg; o.fillRect(0, 0, w, h);
    pl.ctx.drawImage(oc, 0, 0, w, h, x, y, w, h);
  };

  const drawStatic = () => {
    // cortinas blackout fechadas nas duas janelas e porta
    const curtain = (pl, u0, v0, u1, v1) => {
      const [x, y, w, h] = rectPx(pl, u0, v0, u1, v1);
      pl.ctx.fillStyle = "#0c0d12"; pl.ctx.fillRect(x - 10, y - 12, w + 20, h + 24);
      pl.ctx.strokeStyle = "rgba(255,255,255,.03)";
      for (let i = 0; i < w + 20; i += 9) { pl.ctx.beginPath(); pl.ctx.moveTo(x - 10 + i, y - 12); pl.ctx.lineTo(x - 10 + i, y + h + 12); pl.ctx.stroke(); }
    };
    curtain(P.left, 1.08, 0.95, 2.58, 2.05);
    curtain(P.back, 2.30, 0.95, 3.80, 2.06);
    const [dx, dy, dw, dh] = rectPx(P.right, 0.10, 0, 1.04, 2.10);
    P.right.ctx.fillStyle = "#060607"; P.right.ctx.fillRect(dx, dy, dw, dh);
    P.right.ctx.strokeStyle = "#3a2a1a"; P.right.ctx.lineWidth = 4; P.right.ctx.strokeRect(dx, dy, dw, dh);
    // piso
    const f = P.floor.ctx; f.strokeStyle = "rgba(255,255,255,.025)"; f.lineWidth = 1;
    for (let i = 0; i <= RW; i += 0.6) { f.beginPath(); f.moveTo(i * S, 0); f.lineTo(i * S, RD * S); f.stroke(); }
    for (let i = 0; i <= RD; i += 0.6) { f.beginPath(); f.moveTo(0, i * S); f.lineTo(RW * S, i * S); f.stroke(); }
  };

  const paint = (L) => {
    const ex = extra;
    const nExtras = ["moldura", "rack", "tetoFrente", "tetoTodo", "laterais", "tras"].filter((k) => layers[k]).length;
    const spill = (nExtras * 0.02 + (layers.tras ? 0.06 : 0) + (layers.halo ? 0.01 : 0)) * ex;
    const lc = avgOf(L.left), rc = avgOf(L.right), tc = avgOf(L.top), bc = avgOf(L.bottom);

    Object.values(P).forEach((pl) => { pl.ctx.globalCompositeOperation = "source-over"; pl.ctx.fillStyle = pl.base; pl.ctx.fillRect(0, 0, pl.cv.width, pl.cv.height); });
    drawStatic();
    Object.values(P).forEach((pl) => {
      pl.ctx.globalCompositeOperation = "lighter";
      if (spill > 0) { pl.ctx.fillStyle = rgba(L.all, spill); pl.ctx.fillRect(0, 0, pl.cv.width, pl.cv.height); }
    });

    const tx0 = 2.5 - TV.w / 2, tx1 = 2.5 + TV.w / 2, ty0 = 1.1 - TV.h / 2, ty1 = 1.1 + TV.h / 2;
    if (layers.halo) {
      for (let i = 0; i < NT; i++) {
        const x = tx0 + (i + 0.5) * TV.w / NT;
        glow(P.tv, x, ty1, 0.75, L.top[i], 0.2); glow(P.tv, x, ty0, 0.75, L.bottom[i], 0.2);
      }
      for (let j = 0; j < NS; j++) {
        const h = ty1 - (j + 0.5) * TV.h / NS;
        glow(P.tv, tx0, h, 0.75, L.left[j], 0.3); glow(P.tv, tx1, h, 0.75, L.right[j], 0.3);
      }
    }
    if (layers.moldura) {
      const a = 0.6 * ex, d = 1.2;
      band(P.tv, rectPx(P.tv, 0, RH - d, RW, RH), L.top, "x", "down", a);   // tábua de cima, no teto
      band(P.tv, rectPx(P.tv, 0, 0, RW, d), L.bottom, "x", "up", a);         // rodapé
      band(P.tv, rectPx(P.tv, 0, 0, d, RH), L.left, "y", "right", a);        // cantos
      band(P.tv, rectPx(P.tv, RW - d, 0, RW, RH), L.right, "y", "left", a);
      band(P.floor, rectPx(P.floor, 0, 0, RW, 0.4), L.bottom, "x", "down", a * 0.35);
    }
    if (layers.rack && hasRack) {
      for (let i = 0; i < 8; i++) glow(P.floor, 1.55 + i * 0.27, 0.42, 0.55, L.bottom[Math.floor(4 + i * (NT - 8) / 8)], 0.3 * ex, 1, 0.55);
    }
    if (layers.tetoFrente) band(P.ceil, rectPx(P.ceil, 0, 0, RW, 1.3), L.top, "x", "up", 0.5 * ex);
    if (layers.tetoTodo) {
      band(P.ceil, rectPx(P.ceil, 0, 0, RW, 1.1), L.top, "x", "up", 0.45 * ex);
      band(P.ceil, rectPx(P.ceil, 0, 0, 1.0, RD), [lc], "y", "right", 0.45 * ex);
      band(P.ceil, rectPx(P.ceil, RW - 1.0, 0, RW, RD), [rc], "y", "left", 0.45 * ex);
      band(P.ceil, rectPx(P.ceil, 0, RD - 1.0, RW, RD), [L.all], "x", "down", 0.45 * ex);
      [[P.left, lc], [P.right, rc]].forEach(([pl, c]) => band(pl, rectPx(pl, 0, RH - 0.9, RD, RH), [c], "x", "down", 0.3 * ex));
      band(P.back, rectPx(P.back, 0, RH - 0.9, RW, RH), [L.all], "x", "down", 0.3 * ex);
    }
    if (layers.laterais) {
      band(P.left, rectPx(P.left, 0, 0, 1.6, RH), L.left, "y", "left", 0.55 * ex);
      band(P.right, rectPx(P.right, 0, 0, 1.6, RH), L.right, "y", "right", 0.55 * ex);
    }
    if (layers.tras) band(P.back, rectPx(P.back, 0, 0.95, RW, RH), [L.all], "x", "up", 0.55 * ex);

    Object.values(P).forEach((pl) => (pl.tex.needsUpdate = true));
    screenTex.needsUpdate = true;

    // reflexo na tela
    const refl = ((layers.tras ? 0.55 : 0) + (layers.laterais ? 0.18 : 0) + (layers.tetoTodo ? 0.15 : 0) +
      (layers.tetoFrente ? 0.03 : 0) + (layers.moldura ? 0.02 : 0)) * ex;
    reflMat.color.setRGB(gam(L.all[0]) / 255, gam(L.all[1]) / 255, gam(L.all[2]) / 255, THREE.SRGBColorSpace);
    reflMat.opacity = Math.min(0.6, refl * (0.35 + lum(L.all)) * 0.6);
    const label = refl < 0.05 ? "Nenhum" : refl < 0.15 ? "Baixo" : refl < 0.3 ? "Médio" : "Alto";
    const el = $("#r3-refl"); if (el.textContent !== label) { el.textContent = label; el.dataset.level = label; }

    // objetos iluminados pela cor média
    const col = (c) => new THREE.Color().setRGB(gam(c[0]) / 255, gam(c[1]) / 255, gam(c[2]) / 255, THREE.SRGBColorSpace);
    pTv.color.copy(col(L.all)); pTv.intensity = (layers.halo ? 0.6 : 0) + (layers.moldura ? 0.8 * ex : 0);
    pFloor.color.copy(col(bc)); pFloor.intensity = layers.rack ? 0.8 * ex : 0;
    pCeil.color.copy(col(tc)); pCeil.intensity = (layers.tetoFrente ? 0.4 * ex : 0) + (layers.tetoTodo ? 1.0 * ex : 0) + (layers.tras ? 0.6 * ex : 0);
    amb.color.copy(col(L.all)); amb.intensity = 0.04 + spill * 3;
  };

  /* ---------- loop ---------- */
  let running = false;
  const loop = (now) => {
    if (!running) return;
    const f = player.tick(now);
    $("#r3-scene").textContent = f.name;
    paint(follow(f.colors, slow));
    doorOpen += (doorTarget - doorOpen) * 0.06;
    doorHinge.rotation.y = -doorOpen * Math.PI / 2 * 0.97;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  new IntersectionObserver((es) => es.forEach((e) => {
    const was = running; running = e.isIntersecting;
    if (running && !was) requestAnimationFrame(loop);
  })).observe(host);

  resize();
  setTv(+($("#tv-size")?.value || 55));
  setView("sofa");
  syncToggles();
  host.classList.add("ready");
}
