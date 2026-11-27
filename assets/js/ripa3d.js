/* ==========================================================
   Animações 3D explicativas:
   1. Montagem da ripa no canto (tábua + cantoneira + fita)
   2. Canto da porta (parede 2), com a porta abrindo para a parede da TV
   Medidas em metros.
   ========================================================== */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const $ = (q) => document.querySelector(q);
const gam = (v) => Math.pow(v, 1.8);
const P = 0.015;  // fita a 1,5 cm do canto
const T = 0.015;  // espessura da tábua

/* ---------- base comum ---------- */
function stage(host, fov = 45) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#05060a");
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.005, 30);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  const resize = () => {
    const w = host.clientWidth, h = Math.round(w * 9 / 16);
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "auto";
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize); resize();
  scene.add(new THREE.AmbientLight("#ffffff", 0.4));
  const key = new THREE.DirectionalLight("#ffffff", 0.6); key.position.set(1, 2, 3); scene.add(key);

  let tween = null;
  const fly = (pos, target, ms = 1300) => {
    tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...pos), t1: new THREE.Vector3(...target), s: performance.now(), ms };
  };
  const jump = (pos, target) => { camera.position.set(...pos); controls.target.set(...target); controls.update(); };
  const api = { scene, camera, controls, fly, jump, onFrame: null };
  let running = false;
  const loop = (now) => {
    if (!running) return;
    if (tween) {
      const k = Math.min(1, (now - tween.s) / tween.ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (k >= 1) tween = null;
    }
    api.onFrame && api.onFrame(now);
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  new IntersectionObserver((es) => es.forEach((e) => {
    const was = running; running = e.isIntersecting;
    if (running && !was) requestAnimationFrame(loop);
  })).observe(host);
  host.classList.add("ready");
  return api;
}

function paintedWall(w, h, S = 200) {
  const cv = document.createElement("canvas");
  cv.width = Math.round(w * S); cv.height = Math.round(h * S);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return { mesh, cv, ctx: cv.getContext("2d"), tex, S };
}
function makeLabel(scene, text, scale = 0.36) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(10,12,20,.88)"; g.fillRect(0, 0, 512, 96);
  g.strokeStyle = "#7c4dff"; g.lineWidth = 4; g.strokeRect(2, 2, 508, 92);
  g.fillStyle = "#fff"; g.font = "bold 40px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 256, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
  sp.scale.set(scale, scale * 0.1875, 1); sp.renderOrder = 20; scene.add(sp); return sp;
}
const hueColor = (t) => new THREE.Color().setHSL((t / 8000) % 1, 1, 0.55);
const css = (c, a) => `rgba(${(gam(c.r) * 255) | 0},${(gam(c.g) * 255) | 0},${(gam(c.b) * 255) | 0},${a})`;
const lam = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });

/* Peça da ripa vertical num canto à esquerda (canto em x = 0, parede da TV em z = 0).
   Devolve um grupo com tábua, suportes, cantoneira e fita; sinal = +1 (canto esquerdo) ou −1 (direito). */
function ripaPiece({ w, g, c, h, y0 = 0, sign = 1, boardMat, ledMat }) {
  const grp = new THREE.Group();
  const add = (sx, sy, sz, x, y, z, m, name) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
    b.position.set(sign * x, y0 + y, z); b.name = name || ""; grp.add(b); return b;
  };
  add(w, h, T, w / 2, h / 2, g + T / 2, boardMat, "board");
  const bracket = lam("#7a7f8c");
  for (let y = 0.08; y < h; y += 0.3) add(0.012, 0.03, g, 0.006, y, g / 2, bracket, "bracket");
  const alu = lam("#b8bfcc");
  add(0.012, h, 0.0015, 0.009, h / 2, g - 0.00075, alu, "angle");                 // aba presa na tábua
  add(0.0015, h, c + 0.005, P - 0.00075, h / 2, g - (c + 0.005) / 2, alu, "angle"); // aba onde a fita é colada
  add(0.002, h, 0.010, P + 0.001, h / 2, g - c, lam("#f2f2f2"), "strip");          // placa da fita
  const n = Math.round(h * 60);
  for (let i = 0; i < n; i++) add(0.004, 0.005, 0.005, P + 0.0035, (i + 0.5) / 60, g - c, ledMat, "strip");
  return grp;
}

/* ==========================================================
   1. Montagem da ripa
   ========================================================== */
function ripaBuild() {
  const host = $("#ripa3d");
  if (!host) return;
  const st = stage(host);
  const { scene } = st;
  const WW = 1.2, WH = 0.6;
  let dims = { w: 0.11, g: 0.05, c: 0.01 };

  const wall = paintedWall(WW, WH);
  wall.mesh.position.set(WW / 2, WH / 2, 0); scene.add(wall.mesh);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(WW + 0.6, 1.4), lam("#0e0f13"));
  floor.rotation.x = -Math.PI / 2; floor.position.set(WW / 2, 0, 0.7); scene.add(floor);
  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(0.9, WH), lam("#3a3c45"));
  sideWall.rotation.y = Math.PI / 2; sideWall.position.set(0, WH / 2, 0.45); scene.add(sideWall);

  const boardMat = lam("#e9e9e9", { transparent: true });
  const ledMat = new THREE.MeshBasicMaterial({ color: "#333" });
  let piece = null;
  const build = () => {
    if (piece) scene.remove(piece);
    piece = ripaPiece({ ...dims, h: WH, boardMat, ledMat });
    scene.add(piece);
    apply(false, true);
  };

  const L = (t) => makeLabel(scene, t, 0.26);
  const lbl = { corner: L("canto da sala"), board: L("tábua"), bracket: L("suportes"), angle: L("cantoneira de alumínio"), strip: L("fita, encostada na tábua"), light: L("a luz sai pela fenda"), side: L("parede lateral"), wall: L("parede da TV") };
  const placeLabels = () => {
    const { w, g } = dims;
    lbl.corner.position.set(0.05, 0.66, 0.05);
    lbl.side.position.set(-0.02, 0.4, 0.35);
    lbl.wall.position.set(0.7, 0.45, 0.02);
    lbl.board.position.set(w + 0.12, 0.5, g + 0.03);
    lbl.bracket.position.set(0.12, 0.08, g + 0.12);
    lbl.angle.position.set(0.2, 0.62, g);
    lbl.strip.position.set(0.22, 0.32, g - 0.01);
    lbl.light.position.set(0.45, 0.22, 0.04);
  };

  const CAM = [[0.75, 0.95, 0.8], [0.12, 0.38, 0.03]];
  const steps = [
    { t: "1. O canto da sala: a parede da TV e a parede lateral. A parede lateral vai fazer o papel de apoio da ripa.", show: [], labels: ["corner", "side", "wall"], cam: CAM },
    { t: "2. A tábua é presa no canto com suportes pequenos, a alguns centímetros da parede da TV. Entre as duas fica a fenda.", show: ["board", "bracket"], labels: ["board", "bracket"], cam: CAM },
    { t: "3. Nas costas da tábua vai uma cantoneira de alumínio. A fita é colada nela, encostada na madeira e apontando para a TV (a tábua está transparente para você ver).", show: ["board", "bracket", "angle", "strip"], labels: ["angle", "strip"], xray: true, cam: [[0.35, 0.75, 0.42], [0.03, 0.45, 0.03]] },
    { t: "4. A fita acende. A luz sai pela fenda e lava a parede em direção à TV.", show: ["board", "bracket", "angle", "strip"], lit: true, labels: ["light"], cam: CAM },
    { t: "5. Visto do sofá: só aparecem a tábua branca e a parede colorida. A fita fica escondida.", show: ["board", "bracket", "angle", "strip"], lit: true, labels: [], cam: [[0.75, 0.35, 2.3], [0.45, 0.3, 0]] },
    { t: "6. Visto de quem passa a 1 m da parede da TV, do outro lado: a fita continua escondida atrás da tábua.", show: ["board", "bracket", "angle", "strip"], lit: true, labels: [], cam: [[1.9, 0.5, 1.0], [0.05, 0.3, 0.03]] }
  ];
  let step = 0, xray = false, lit = false;
  const apply = (fly = true, keepCam = false) => {
    const s = steps[step];
    if (piece) piece.children.forEach((m) => (m.visible = s.show.includes(m.name)));
    lit = !!s.lit;
    boardMat.opacity = xray || s.xray ? 0.22 : 1;
    boardMat.depthWrite = !(xray || s.xray);
    Object.entries(lbl).forEach(([k, sp]) => (sp.visible = s.labels.includes(k)));
    placeLabels();
    $("#ripa-step").textContent = s.t;
    $("#ripa-n").textContent = `${step + 1} / ${steps.length}`;
    if (!keepCam) fly ? st.fly(...s.cam) : st.jump(...s.cam);
  };
  $("#ripa-prev").addEventListener("click", () => { step = Math.max(0, step - 1); apply(); });
  $("#ripa-next").addEventListener("click", () => { step = Math.min(steps.length - 1, step + 1); apply(); });
  $("#ripa-xray").addEventListener("change", (e) => { xray = e.target.checked; apply(false, true); });
  let auto = null;
  $("#ripa-play").addEventListener("click", (e) => {
    if (auto) { clearInterval(auto); auto = null; e.target.textContent = "Ver montagem"; return; }
    step = 0; apply(); e.target.textContent = "Pausar";
    auto = setInterval(() => { if (step < steps.length - 1) { step++; apply(); } else { clearInterval(auto); auto = null; e.target.textContent = "Ver montagem"; } }, 4800);
  });
  window.addEventListener("ripachange", (e) => {
    const d = e.detail;
    dims = { w: d.w / 100, g: d.g / 100, c: d.c / 100 };
    build();
  });

  st.onFrame = (now) => {
    const c = hueColor(now), g = wall.ctx, S = wall.S;
    g.globalCompositeOperation = "source-over";
    g.fillStyle = "#2a2c33"; g.fillRect(0, 0, wall.cv.width, wall.cv.height);
    if (lit) {
      const x0 = P * S, x1 = 0.9 * S;
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, css(c, 0.95)); gr.addColorStop(0.35, css(c, 0.45)); gr.addColorStop(1, css(c, 0));
      g.fillStyle = gr; g.fillRect(x0, 0, x1 - x0, wall.cv.height);
    }
    wall.tex.needsUpdate = true;
    ledMat.color.copy(lit ? c : new THREE.Color("#333"));
  };
  build();
  apply(false);
}

/* ==========================================================
   2. Canto da porta
   Canto em x = 1.5 (parede da TV em z = 0, parede 2 em x = 1.5).
   Porta: vão de 0,10 a 1,04 m do canto; dobradiça do lado do canto;
   abre girando em direção à parede da TV.
   ========================================================== */
function doorCorner() {
  const host = $("#porta3d");
  if (!host) return;
  const st = stage(host, 50);
  const { scene } = st;
  const CX = 1.5, H = 2.8, DEP = 1.4;
  const W = 0.11, G = 0.05;

  const tvWall = paintedWall(CX, H, 120);
  tvWall.mesh.position.set(CX / 2, H / 2, 0); scene.add(tvWall.mesh);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(DEP, H), lam("#1b1c22"));
  side.rotation.y = -Math.PI / 2; side.position.set(CX, H / 2, DEP / 2); scene.add(side);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(CX, DEP), lam("#2a2c34"));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX / 2, 0, DEP / 2); scene.add(floor);

  const box = (w, h, d, x, y, z, m, parent = scene) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };
  const frameMat = lam("#5a3f26");
  box(0.04, 2.10, 0.04, CX - 0.02, 1.05, 0.12, frameMat);
  box(0.04, 2.10, 0.04, CX - 0.02, 1.05, 1.02, frameMat);
  box(0.04, 0.04, 0.94, CX - 0.02, 2.12, 0.57, frameMat);
  const hinge = new THREE.Group(); hinge.position.set(CX - 0.02, 0, 0.14); scene.add(hinge);
  box(0.035, 2.08, 0.80, 0, 1.04, 0.40, lam("#8a5a2e"), hinge);
  box(0.065, 0.025, 0.12, -0.05, 1.0, 0.72, lam("#c9c9c9"), hinge);

  // quadro: tábua de cima (no teto), rodapé e ripa vertical no canto
  const boardMat = lam("#e6e6e6");
  const ledMat = new THREE.MeshBasicMaterial({ color: "#333" });
  box(CX, W, T, CX / 2, H - W / 2, G + T / 2, boardMat);
  box(CX, W, T, CX / 2, W / 2, G + T / 2, boardMat);
  const vert = ripaPiece({ w: W, g: G, c: 0.01, h: H - 2 * W, y0: W, sign: -1, boardMat, ledMat });
  vert.position.x = CX; scene.add(vert);

  $("#porta-text").textContent = "A ripa vertical fica no canto, igual às outras. A tábua sai 6,5 cm da parede da TV e a guarnição da porta começa em 10 cm, então sobram uns 3,5 cm. Com a porta aberta, ela passa uns 6 cm à frente da tábua.";
  const PL = (t, x, y, z) => { const s = makeLabel(scene, t, 0.75); s.position.set(x, y, z); return s; };
  PL("parede da TV", 0.45, 2.2, 0.05); PL("parede 2", CX - 0.02, 2.5, 1.1); PL("porta", CX - 0.15, 1.6, 0.6); PL("ripa no canto", CX - 0.35, 1.25, 0.15);

  let open = 0, target = 0;
  $("#porta-toggle").addEventListener("click", (e) => { target = target ? 0 : 1; e.target.textContent = target ? "Fechar a porta" : "Abrir a porta"; });
  document.querySelectorAll("#porta-views .chip").forEach((c) => c.addEventListener("click", () => {
    document.querySelectorAll("#porta-views .chip").forEach((x) => x.classList.toggle("active", x === c));
    const v = { sala: [[-0.2, 1.8, 3.0], [1.05, 1.1, 0.3]], cima: [[0.9, 4.2, 0.9], [0.9, 0, 0.6]] }[c.dataset.v];
    st.fly(...v);
  }));

  st.onFrame = (now) => {
    open += (target - open) * 0.06;
    hinge.rotation.y = -open * Math.PI / 2 * 0.97;
    const c = hueColor(now), g = tvWall.ctx, S = tvWall.S;
    ledMat.color.copy(c);
    g.globalCompositeOperation = "source-over"; g.fillStyle = "#1c1d23"; g.fillRect(0, 0, tvWall.cv.width, tvWall.cv.height);
    let gr = g.createLinearGradient(0, W * S, 0, 1.6 * S);              // de cima para baixo
    gr.addColorStop(0, css(c, 0.7)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.fillRect(0, W * S, CX * S, (1.6 - W) * S);
    gr = g.createLinearGradient(0, (H - W) * S, 0, (H - 1.5) * S);      // rodapé para cima
    gr.addColorStop(0, css(c, 0.6)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.fillRect(0, (H - 1.5) * S, CX * S, (1.5 - W) * S);
    const x = (CX - P) * S;                                              // canto para dentro
    gr = g.createLinearGradient(x, 0, x - 1.3 * S, 0);
    gr.addColorStop(0, css(c, 0.8)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.fillRect(x - 1.3 * S, 0, 1.3 * S, H * S);
    tvWall.tex.needsUpdate = true;
  };
  st.jump([-0.2, 1.8, 3.0], [1.05, 1.1, 0.3]);
}

ripaBuild();
doorCorner();
