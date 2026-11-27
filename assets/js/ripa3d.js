/* ==========================================================
   Animações 3D explicativas:
   1. Montagem da ripa, peça por peça
   2. Canto da porta (parede 2), com a porta abrindo para a parede da TV
   Medidas em metros.
   ========================================================== */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];
const gam = (v) => Math.pow(v, 1.8);

/* ---------- base comum: cena, câmera, controles, loop só quando visível ---------- */
function stage(host, fov = 45) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#05060a");
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.01, 30);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  const resize = () => {
    const w = host.clientWidth, h = Math.round(w * 9 / 16);
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "auto";
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize); resize();
  scene.add(new THREE.AmbientLight("#ffffff", 0.35));
  const key = new THREE.DirectionalLight("#ffffff", 0.6); key.position.set(1, 2, 3); scene.add(key);

  // movimento suave da câmera entre pontos de vista
  let tween = null;
  const fly = (pos, target, ms = 1200) => {
    tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...pos), t1: new THREE.Vector3(...target), s: performance.now(), ms };
  };
  const jump = (pos, target) => { camera.position.set(...pos); controls.target.set(...target); controls.update(); };

  const api = { renderer, scene, camera, controls, fly, jump, onFrame: null };
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

// parede com textura pintada (para desenhar a luz rebatida)
function paintedWall(w, h, S = 200) {
  const cv = document.createElement("canvas");
  cv.width = Math.round(w * S); cv.height = Math.round(h * S);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return { mesh, cv, ctx: cv.getContext("2d"), tex, S };
}
// etiqueta 3D (sprite) com texto
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

/* ==========================================================
   1. Montagem da ripa
   ========================================================== */
function ripaBuild() {
  const host = $("#ripa3d");
  if (!host) return;
  const st = stage(host);
  const { scene } = st;
  const WW = 1.2, WH = 0.6;

  const wall = paintedWall(WW, WH);
  wall.mesh.position.set(WW / 2, WH / 2, 0); scene.add(wall.mesh);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(WW + 0.6, 1.2), new THREE.MeshLambertMaterial({ color: "#0e0f13" }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(WW / 2, 0, 0.6); scene.add(floor);
  // parede lateral (o canto), para dar referência
  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(0.8, WH), new THREE.MeshLambertMaterial({ color: "#3a3c45" }));
  sideWall.rotation.y = Math.PI / 2; sideWall.position.set(0, WH / 2, 0.4); scene.add(sideWall);

  const white = new THREE.MeshLambertMaterial({ color: "#e9e9e9", transparent: true });
  const wood = new THREE.MeshLambertMaterial({ color: "#e0b97a" });
  const piece = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); scene.add(m); return m; };

  // espaçador: 2 cm de espessura, 5 cm de profundidade, colado/parafusado na parede
  const spacer = piece(0.02, WH, 0.05, 0.01, WH / 2, 0.025, wood);
  // fita de LED na face interna do espaçador, virada para o centro da parede
  const strip = new THREE.Group();
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.002, WH, 0.012), new THREE.MeshLambertMaterial({ color: "#f2f2f2" }));
  pcb.position.set(0.021, WH / 2, 0.025); strip.add(pcb);
  const ledMat = new THREE.MeshBasicMaterial({ color: "#333" });
  for (let i = 0; i < WH * 60; i++) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.005, 0.005), ledMat);
    d.position.set(0.0235, (i + 0.5) / 60, 0.025); strip.add(d);
  }
  scene.add(strip);
  // tábua da frente: 11 cm de largura, 1,5 cm de espessura
  const front = piece(0.11, WH, 0.015, 0.055, WH / 2, 0.0575, white);

  const L = (t) => makeLabel(scene, t, 0.3);
  const lbl = { spacer: L("espaçador · 5 cm"), strip: L("fita de LED"), front: L("tábua da frente · 11 cm"), light: L("a luz sai pela fenda"), wall: L("parede da TV") };
  lbl.spacer.position.set(-0.1, 0.66, 0.1);
  lbl.strip.position.set(0.2, 0.47, 0.1);
  lbl.front.position.set(0.24, 0.68, 0.12);
  lbl.light.position.set(0.42, 0.3, 0.06);
  lbl.wall.position.set(0.7, 0.55, 0.02);

  const CAM = [[0.7, 0.95, 0.75], [0.14, 0.42, 0.02]];
  const steps = [
    { t: "1. Este é um pedaço da parede da TV, no canto esquerdo. Ela precisa estar lisa e pintada de branco fosco.", show: ["wall"], cam: CAM },
    { t: "2. O espaçador: uma tira de madeira de 5 cm, presa na parede junto ao canto.", show: ["spacer"], cam: CAM },
    { t: "3. A fita de LED é colada na lateral do espaçador, virada para o centro da parede (para a TV).", show: ["spacer", "strip"], cam: CAM },
    { t: "4. A tábua da frente (11 cm) é presa na frente do espaçador e cobre a fita. Entre a tábua e a parede sobra uma fenda de 5 cm.", show: ["spacer", "strip", "front"], cam: CAM },
    { t: "5. A fita acende. A luz não tem para onde ir a não ser pela fenda, e sai lavando a parede em direção à TV.", show: ["spacer", "strip", "front", "light"], cam: CAM },
    { t: "6. Agora visto do sofá: você só enxerga a tábua branca e a parede colorida. O LED fica escondido atrás da tábua.", show: ["spacer", "strip", "front", "light"], cam: [[0.75, 0.35, 2.3], [0.45, 0.3, 0]] }
  ];
  let step = 0, xray = false, lit = false;
  const apply = (fly = true) => {
    const s = steps[step];
    spacer.visible = s.show.includes("spacer");
    strip.visible = s.show.includes("strip");
    front.visible = s.show.includes("front");
    lit = s.show.includes("light");
    white.opacity = xray ? 0.25 : 1;
    lbl.wall.visible = step === 0;
    lbl.spacer.visible = step >= 1 && step <= 3;
    lbl.strip.visible = step === 2 || (xray && step >= 3 && step <= 4);
    lbl.front.visible = step === 3 || step === 4;
    lbl.light.visible = step === 4;
    $("#ripa-step").textContent = s.t;
    $("#ripa-n").textContent = `${step + 1} / ${steps.length}`;
    fly ? st.fly(...s.cam) : st.jump(...s.cam);
  };
  $("#ripa-prev").addEventListener("click", () => { step = Math.max(0, step - 1); apply(); });
  $("#ripa-next").addEventListener("click", () => { step = Math.min(steps.length - 1, step + 1); apply(); });
  $("#ripa-xray").addEventListener("change", (e) => { xray = e.target.checked; apply(false); });
  let auto = null;
  $("#ripa-play").addEventListener("click", (e) => {
    if (auto) { clearInterval(auto); auto = null; e.target.textContent = "Ver montagem"; return; }
    step = 0; apply(); e.target.textContent = "Pausar";
    auto = setInterval(() => { if (step < steps.length - 1) { step++; apply(); } else { clearInterval(auto); auto = null; e.target.textContent = "Ver montagem"; } }, 4500);
  });

  st.onFrame = (now) => {
    const c = hueColor(now);
    const g = wall.ctx, S = wall.S;
    g.globalCompositeOperation = "source-over";
    g.fillStyle = "#2a2c33"; g.fillRect(0, 0, wall.cv.width, wall.cv.height);
    if (lit) {
      const x0 = 0.02 * S, x1 = 0.9 * S;
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, css(c, 0.95)); gr.addColorStop(0.35, css(c, 0.45)); gr.addColorStop(1, css(c, 0));
      g.fillStyle = gr; g.fillRect(x0, 0, x1 - x0, wall.cv.height);
    }
    wall.tex.needsUpdate = true;
    ledMat.color.copy(lit ? c : new THREE.Color("#333"));
  };
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
  const CX = 1.5, H = 2.5, DEP = 1.4;

  const tvWall = paintedWall(CX, H, 120);
  tvWall.mesh.position.set(CX / 2, H / 2, 0); scene.add(tvWall.mesh);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(DEP, H), new THREE.MeshLambertMaterial({ color: "#1b1c22" }));
  side.rotation.y = -Math.PI / 2; side.position.set(CX, H / 2, DEP / 2); scene.add(side);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(CX, DEP), new THREE.MeshLambertMaterial({ color: "#2a2c34" }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX / 2, 0, DEP / 2); scene.add(floor);

  const lam = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const box = (w, h, d, x, y, z, m, parent = scene) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };
  // vão e batente da porta (0,10 a 1,04 m do canto)
  const frameMat = lam("#5a3f26");
  box(0.04, 2.10, 0.04, CX - 0.02, 1.05, 0.12, frameMat);
  box(0.04, 2.10, 0.04, CX - 0.02, 1.05, 1.02, frameMat);
  box(0.04, 0.04, 0.94, CX - 0.02, 2.12, 0.57, frameMat);
  // folha da porta com dobradiça do lado do canto (z = 0,14)
  const hinge = new THREE.Group(); hinge.position.set(CX - 0.02, 0, 0.14); scene.add(hinge);
  box(0.035, 2.08, 0.80, 0, 1.04, 0.40, lam("#8a5a2e"), hinge);
  box(0.065, 0.025, 0.12, -0.05, 1.0, 0.72, lam("#c9c9c9"), hinge); // maçaneta (lado da sala)

  // ripas: de cima, rodapé e vertical (posição depende da opção)
  const ripaMat = lam("#e6e6e6");
  box(CX, 0.12, 0.065, CX / 2, H - 0.25, 0.0325, ripaMat);
  box(CX, 0.12, 0.065, CX / 2, 0.06, 0.0325, ripaMat);
  const vert = box(0.11, H - 0.37, 0.065, 0, (H - 0.37) / 2 + 0.12, 0.0325, ripaMat);

  const options = {
    A: { x: CX - 0.20 - 0.055, show: true, text: "Opção A: ripa vertical a 20 cm do canto. A porta aberta passa uns 6 cm à frente da ripa e a maçaneta fica longe dela. Os dois lados da parede ficam simétricos." },
    B: { x: CX - 0.055, show: true, text: "Opção B: ripa no canto. Cabe, mas fica justo: a porta aberta passa logo à frente da ripa e qualquer guarnição ou prendedor de porta encosta nela." },
    C: { x: 0, show: false, text: "Opção C: sem ripa vertical. Só a ripa de cima e o rodapé. A porta não interfere em nada." }
  };
  let opt = "A", open = 0, target = 0;
  let applyOpt = () => {
    vert.visible = options[opt].show; vert.position.x = options[opt].x;
    $("#porta-text").textContent = options[opt].text;
  };
  $$("#porta-opts .chip").forEach((c) => c.addEventListener("click", () => {
    $$("#porta-opts .chip").forEach((x) => x.classList.toggle("active", x === c)); opt = c.dataset.o; applyOpt();
  }));
  $("#porta-toggle").addEventListener("click", (e) => { target = target ? 0 : 1; e.target.textContent = target ? "Fechar a porta" : "Abrir a porta"; });
  $$("#porta-views .chip").forEach((c) => c.addEventListener("click", () => {
    $$("#porta-views .chip").forEach((x) => x.classList.toggle("active", x === c));
    const v = { sala: [[-0.2, 1.7, 3.0], [1.05, 1.0, 0.3]], cima: [[0.9, 3.8, 0.9], [0.9, 0, 0.6]] }[c.dataset.v];
    st.fly(...v);
  }));

  st.onFrame = (now) => {
    open += (target - open) * 0.06;
    hinge.rotation.y = -open * Math.PI / 2 * 0.97; // abre em direção à parede da TV
    const c = hueColor(now), g = tvWall.ctx, S = tvWall.S;
    g.globalCompositeOperation = "source-over"; g.fillStyle = "#1c1d23"; g.fillRect(0, 0, tvWall.cv.width, tvWall.cv.height);
    // luz da ripa de cima e do rodapé
    let gr = g.createLinearGradient(0, 0.25 * S, 0, 1.6 * S);
    gr.addColorStop(0, css(c, 0.7)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.fillRect(0, 0.25 * S, CX * S, 1.35 * S);
    gr = g.createLinearGradient(0, (H - 0.12) * S, 0, (H - 1.5) * S);
    gr.addColorStop(0, css(c, 0.6)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.fillRect(0, (H - 1.5) * S, CX * S, 1.38 * S);
    if (options[opt].show) {
      const x = (options[opt].x - 0.055) * S;
      gr = g.createLinearGradient(x, 0, x - 1.3 * S, 0);
      gr.addColorStop(0, css(c, 0.8)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.fillRect(x - 1.3 * S, 0, 1.3 * S, H * S);
    }
    tvWall.tex.needsUpdate = true;
  };
  const PL = (t, x, y, z) => { const s = makeLabel(scene, t, 0.75); s.position.set(x, y, z); return s; };
  PL("parede da TV", 0.45, 2.0, 0.05); PL("parede 2", CX - 0.02, 2.35, 1.1); PL("porta", CX - 0.15, 1.6, 0.6);
  const ripaLbl = PL("ripa vertical", 0, 1.3, 0.15);
  const _apply = applyOpt;
  applyOpt = () => { _apply(); ripaLbl.visible = options[opt].show; ripaLbl.position.x = options[opt].x - 0.2; };
  st.jump([-0.2, 1.7, 3.0], [1.05, 1.0, 0.3]);
  applyOpt();
}

if (window.THREE_OK !== false) { ripaBuild(); doorCorner(); }
