/* ==========================================================
   Simulador de imersão da sala
   Vista do sofá olhando para a parede da TV (perspectiva).
   Escala da parede da TV: 100 px = 1 m (5,00 × 2,80 m).
   ========================================================== */
(() => {
  "use strict";
  const cv = document.getElementById("sim");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height;

  /* ---------- geometria ---------- */
  const X0 = 230, X1 = 730, Y0 = 110, Y1 = 390;      // parede da TV
  const FX0 = -140, FX1 = W + 140, FY0 = -80, FY1 = H + 100; // plano da frente
  const planes = {
    back: [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]],
    ceil: [[X0, Y0], [X1, Y0], [FX1, FY0], [FX0, FY0]],
    floor: [[X0, Y1], [X1, Y1], [FX1, FY1], [FX0, FY1]],
    left: [[X0, Y0], [X0, Y1], [FX0, FY1], [FX0, FY0]],
    right: [[X1, Y0], [X1, Y1], [FX1, FY1], [FX1, FY0]]
  };
  const base = { back: "#16171d", ceil: "#101116", floor: "#0c0d11", left: "#121318", right: "#121318" };
  const RACK = { x: 370, y: 344, w: 220, h: 46 };
  const SB = { x: 430, y: 337, w: 100, h: 7 };
  let TV = { x: 0, y: 0, w: 0, h: 0 };
  const setTvSize = (inch) => {
    const w = inch * 2.54 * (16 / Math.hypot(16, 9)); // cm = px
    const h = w * 9 / 16;
    TV = { x: 480 - w / 2, y: 280 - h / 2, w, h }; // centro a 1,10 m do chão
  };
  setTvSize(55);
  window.addEventListener("tvchange", (e) => setTvSize(e.detail.inch));

  /* ---------- cenas (vídeo de exemplo) ---------- */
  const sc = document.createElement("canvas");
  sc.width = 160; sc.height = 90;
  const s = sc.getContext("2d", { willReadFrequently: true });
  const SW = sc.width, SH = sc.height;

  const scenes = [
    { id: "tempestade", name: "Tempestade com raios", dur: 10 },
    { id: "explosao", name: "Explosões", dur: 8 },
    { id: "por", name: "Pôr do sol", dur: 7 },
    { id: "oceano", name: "Oceano", dur: 7 }
  ];
  let sceneIdx = 0, sceneT0 = 0, auto = true;

  const flash = (t, at, len = 0.18) => (t >= at && t < at + len ? 1 - (t - at) / len : 0);

  const drawScene = (id, t) => {
    if (id === "tempestade") {
      const g = s.createLinearGradient(0, 0, 0, SH);
      g.addColorStop(0, "#0b1424"); g.addColorStop(0.7, "#1c2a3d"); g.addColorStop(1, "#0a0f16");
      s.fillStyle = g; s.fillRect(0, 0, SW, SH);
      for (let i = 0; i < 6; i++) {
        const x = ((i * 37 + t * 6) % (SW + 60)) - 30, y = 12 + (i % 3) * 10;
        const cg = s.createRadialGradient(x, y, 0, x, y, 34);
        cg.addColorStop(0, "rgba(60,75,95,.8)"); cg.addColorStop(1, "rgba(60,75,95,0)");
        s.fillStyle = cg; s.fillRect(0, 0, SW, SH);
      }
      s.fillStyle = "#06080c"; s.fillRect(0, SH - 14, SW, 14); // horizonte
      const f = Math.max(flash(t, 2.0), flash(t, 2.25, 0.12) * 0.8, flash(t, 5.6, 0.25), flash(t, 8.1), flash(t, 8.3, 0.1) * 0.7);
      if (f > 0) {
        const bx = t < 4 ? 50 : t < 7 ? 115 : 80;
        s.fillStyle = `rgba(220,230,255,${0.85 * f})`; s.fillRect(0, 0, SW, SH);
        s.strokeStyle = `rgba(255,255,255,${f})`; s.lineWidth = 1.5; s.beginPath();
        let x = bx, y = 0; s.moveTo(x, y);
        while (y < SH - 14) { x += (Math.sin(y * 7.3 + bx) * 6); y += 7; s.lineTo(x, y); }
        s.stroke();
      }
    } else if (id === "explosao") {
      s.fillStyle = "#07090d"; s.fillRect(0, 0, SW, SH);
      s.fillStyle = "#0f1620";
      for (let i = 0; i < 12; i++) s.fillRect(i * 14, SH - 20 - ((i * 13) % 22), 12, 40); // prédios
      const boom = (cx, cy, at) => {
        const k = t - at;
        if (k < 0 || k > 2.2) return;
        const r = 8 + k * 45, a = Math.max(0, 1 - k / 2.2);
        const g = s.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(255,250,210,${a})`); g.addColorStop(0.3, `rgba(255,170,40,${a})`);
        g.addColorStop(0.7, `rgba(200,50,10,${a * 0.7})`); g.addColorStop(1, "rgba(80,10,0,0)");
        s.fillStyle = g; s.fillRect(0, 0, SW, SH);
        if (k < 0.15) { s.fillStyle = `rgba(255,240,200,${0.6 * (1 - k / 0.15)})`; s.fillRect(0, 0, SW, SH); }
      };
      boom(110, 55, 1.5); boom(40, 60, 4.6);
    } else if (id === "por") {
      const g = s.createLinearGradient(0, 0, 0, SH);
      g.addColorStop(0, "#2b0f4a"); g.addColorStop(0.45, "#c2410c"); g.addColorStop(0.7, "#f59e0b"); g.addColorStop(1, "#1a0b05");
      s.fillStyle = g; s.fillRect(0, 0, SW, SH);
      const sy = 48 + t * 2;
      const sg = s.createRadialGradient(80, sy, 0, 80, sy, 26);
      sg.addColorStop(0, "rgba(255,240,180,1)"); sg.addColorStop(1, "rgba(255,180,60,0)");
      s.fillStyle = sg; s.fillRect(0, 0, SW, SH);
      s.fillStyle = "#120804"; s.fillRect(0, SH - 18, SW, 18);
    } else {
      const g = s.createLinearGradient(0, 0, 0, SH);
      g.addColorStop(0, "#0ea5e9"); g.addColorStop(0.5, "#0369a1"); g.addColorStop(1, "#022c43");
      s.fillStyle = g; s.fillRect(0, 0, SW, SH);
      for (let i = 0; i < 5; i++) {
        s.strokeStyle = `rgba(165,243,252,${0.25 + i * 0.08})`; s.lineWidth = 2; s.beginPath();
        for (let x = 0; x <= SW; x += 4) s.lineTo(x, 45 + i * 9 + Math.sin(x / 12 + t * 2 + i) * 3);
        s.stroke();
      }
    }
  };

  /* ---------- amostragem das bordas ---------- */
  const NT = 20, NS = 10;
  const target = { top: [], bottom: [], left: [], right: [], all: [0, 0, 0] };
  const sample = () => {
    const d = s.getImageData(0, 0, SW, SH).data;
    const avg = (x0, y0, w, h) => {
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y0 + h; y += 2) for (let x = x0; x < x0 + w; x += 2) {
        const i = (y * SW + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
      }
      return [r / n, g / n, b / n];
    };
    const bw = SW / NT, bh = SH / NS;
    for (let i = 0; i < NT; i++) {
      target.top[i] = avg(Math.floor(i * bw), 0, Math.ceil(bw), 14);
      target.bottom[i] = avg(Math.floor(i * bw), SH - 14, Math.ceil(bw), 14);
    }
    for (let j = 0; j < NS; j++) {
      target.left[j] = avg(0, Math.floor(j * bh), 20, Math.ceil(bh));
      target.right[j] = avg(SW - 20, Math.floor(j * bh), 20, Math.ceil(bh));
    }
    target.all = avg(0, 0, SW, SH);
  };

  // estado suavizado + histórico para simular atraso
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let shown = null;
  const history = [];
  const smoothTo = (cur, tgt, k) => {
    if (Array.isArray(cur[0]) || (Array.isArray(cur) && Array.isArray(tgt[0]))) {
      for (let i = 0; i < cur.length; i++) smoothTo(cur[i], tgt[i], k);
    } else for (let c = 0; c < 3; c++) cur[c] += (tgt[c] - cur[c]) * k;
  };

  /* ---------- controles ---------- */
  const layers = {
    halo: true, moldura: true, rack: true, tetoFrente: true,
    tetoTodo: false, laterais: false, tras: false
  };
  const presets = {
    sotv: ["halo"],
    parede: ["halo", "moldura", "rack", "tetoFrente"],
    mega: ["halo", "moldura", "rack", "tetoFrente", "tetoTodo", "laterais"],
    exagero: ["halo", "moldura", "rack", "tetoFrente", "tetoTodo", "laterais", "tras"]
  };
  let extra = 0.6, slow = false;

  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const syncToggles = () => $$("#sim-layers input").forEach((i) => (i.checked = layers[i.dataset.l]));
  $$("#sim-layers input").forEach((i) => i.addEventListener("change", () => {
    layers[i.dataset.l] = i.checked;
    $$("#sim-presets .chip").forEach((c) => c.classList.remove("active"));
  }));
  $$("#sim-presets .chip").forEach((c) => c.addEventListener("click", () => {
    Object.keys(layers).forEach((k) => (layers[k] = presets[c.dataset.p].includes(k)));
    $$("#sim-presets .chip").forEach((x) => x.classList.toggle("active", x === c));
    syncToggles();
  }));
  $("#sim-extra").addEventListener("input", (e) => {
    extra = e.target.value / 100;
    $("#sim-extra-out").textContent = e.target.value + "%";
  });
  $("#sim-slow").addEventListener("change", (e) => (slow = e.target.checked));
  $$("#sim-scenes .chip").forEach((c) => c.addEventListener("click", () => {
    $$("#sim-scenes .chip").forEach((x) => x.classList.toggle("active", x === c));
    auto = c.dataset.s === "auto";
    if (!auto) { sceneIdx = scenes.findIndex((x) => x.id === c.dataset.s); sceneT0 = performance.now(); }
  }));
  syncToggles();

  /* ---------- desenho ---------- */
  const gam = (v) => 255 * Math.pow(v / 255, 1.8);
  const rgba = (c, a) => `rgba(${gam(c[0]) | 0},${gam(c[1]) | 0},${gam(c[2]) | 0},${Math.max(0, Math.min(1, a))})`;
  const span = (a0, a1, n, i) => [Math.round(a0 + i * (a1 - a0) / n), Math.round(a0 + (i + 1) * (a1 - a0) / n)];
  const poly = (p) => { ctx.beginPath(); p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
  const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  const inPlane = (name, fn) => { ctx.save(); poly(planes[name]); ctx.clip(); fn(); ctx.restore(); };
  const glow = (x, y, r, c, a, sy = 1) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, sy);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.restore();
  };

  // luz de uma borda: cores interpoladas ao longo da borda e esmaecendo para dentro
  const oc = document.createElement("canvas");
  oc.width = W; oc.height = H;
  const o = oc.getContext("2d");
  const edge = (cols, x, y, w, h, axis, fade, a) => {
    o.globalCompositeOperation = "source-over";
    o.clearRect(x, y, w, h);
    const g = axis === "h" ? o.createLinearGradient(x, 0, x + w, 0) : o.createLinearGradient(0, y, 0, y + h);
    cols.forEach((c, i) => g.addColorStop((i + 0.5) / cols.length, rgba(c, 1)));
    o.fillStyle = g; o.fillRect(x, y, w, h);
    const f = fade === "down" ? o.createLinearGradient(0, y, 0, y + h)
      : fade === "up" ? o.createLinearGradient(0, y + h, 0, y)
      : fade === "right" ? o.createLinearGradient(x, 0, x + w, 0)
      : o.createLinearGradient(x + w, 0, x, 0);
    f.addColorStop(0, `rgba(0,0,0,${a})`); f.addColorStop(1, "rgba(0,0,0,0)");
    o.globalCompositeOperation = "destination-in";
    o.fillStyle = f; o.fillRect(x, y, w, h);
    ctx.drawImage(oc, x, y, w, h, x, y, w, h);
  };

  const render = (L) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    Object.entries(planes).forEach(([k, p]) => { poly(p); ctx.fillStyle = base[k]; ctx.fill(); });

    ctx.globalCompositeOperation = "lighter";
    const ex = extra;
    const nExtras = ["moldura", "rack", "tetoFrente", "tetoTodo", "laterais", "tras"].filter((k) => layers[k]).length;

    // luz rebatida geral (quanto mais camadas, mais a sala clareia)
    const spill = (nExtras * 0.025 + (layers.tras ? 0.08 : 0)) * ex;
    if (spill > 0) Object.keys(planes).forEach((k) => inPlane(k, () => { ctx.fillStyle = rgba(L.all, spill); ctx.fillRect(-200, -200, W + 400, H + 400); }));

    // 1. halo da TV
    if (layers.halo) inPlane("back", () => {
      const r = 75;
      for (let i = 0; i < NT; i++) {
        const x = TV.x + (i + 0.5) * TV.w / NT;
        glow(x, TV.y, r, L.top[i], 0.2); glow(x, TV.y + TV.h, r, L.bottom[i], 0.2);
      }
      for (let j = 0; j < NS; j++) {
        const y = TV.y + (j + 0.5) * TV.h / NS;
        glow(TV.x, y, r, L.left[j], 0.3); glow(TV.x + TV.w, y, r, L.right[j], 0.3);
      }
    });

    // 2. moldura de ripas: luz das bordas da parede para dentro
    if (layers.moldura) {
      const a = 0.6 * ex, depth = 120;
      edge(L.top, X0, Y0, X1 - X0, depth, "h", "down", a);
      edge(L.bottom, X0, Y1 - depth, X1 - X0, depth, "h", "up", a);
      edge(L.left, X0, Y0, depth, Y1 - Y0, "v", "right", a);
      edge(L.right, X1 - depth, Y0, depth, Y1 - Y0, "v", "left", a);
    }

    // 3. rack e chão
    if (layers.rack) inPlane("floor", () => {
      for (let i = 0; i < 8; i++) {
        const c = L.bottom[Math.floor(4 + i * (NT - 8) / 8)];
        glow(RACK.x + 14 + i * (RACK.w - 28) / 7, Y1 + 6, 70, c, 0.35 * ex, 0.35);
      }
    });

    // 4. teto junto à parede da TV
    if (layers.tetoFrente) inPlane("ceil", () => {
      for (let i = 0; i < NT; i++) {
        const x = X0 + (i + 0.5) * (X1 - X0) / NT;
        glow(x, Y0, 110, L.top[i], 0.3 * ex, 0.6);
      }
    });

    // 5. teto da sala toda
    if (layers.tetoTodo) inPlane("ceil", () => {
      const g = ctx.createLinearGradient(0, Y0, 0, FY0);
      g.addColorStop(0, rgba(L.all, 0.15 * ex)); g.addColorStop(1, rgba(L.all, 0.55 * ex));
      ctx.fillStyle = g; ctx.fillRect(FX0, FY0, FX1 - FX0, Y0 - FY0);
    });

    // 6. paredes laterais
    if (layers.laterais) {
      const avgOf = (arr) => arr.reduce((a, c) => [a[0] + c[0] / arr.length, a[1] + c[1] / arr.length, a[2] + c[2] / arr.length], [0, 0, 0]);
      const lc = avgOf(L.left), rc = avgOf(L.right);
      inPlane("left", () => {
        const g = ctx.createLinearGradient(X0, 0, FX0, 0);
        g.addColorStop(0, rgba(lc, 0.1 * ex)); g.addColorStop(1, rgba(lc, 0.55 * ex));
        ctx.fillStyle = g; ctx.fillRect(FX0, FY0, X0 - FX0, FY1 - FY0);
      });
      inPlane("right", () => {
        const g = ctx.createLinearGradient(X1, 0, FX1, 0);
        g.addColorStop(0, rgba(rc, 0.1 * ex)); g.addColorStop(1, rgba(rc, 0.55 * ex));
        ctx.fillStyle = g; ctx.fillRect(X1, FY0, FX1 - X1, FY1 - FY0);
      });
    }

    ctx.globalCompositeOperation = "source-over";

    // ripas (pintadas de branco, quase invisíveis no escuro)
    if (layers.moldura) {
      ctx.strokeStyle = "rgba(255,255,255,.10)"; ctx.lineWidth = 3;
      ctx.strokeRect(X0 + 3, Y0 + 3, X1 - X0 - 6, Y1 - Y0 - 6);
    }

    // rack e soundbar
    const rl = layers.rack ? 0.06 : 0;
    ctx.fillStyle = "#1b1d24"; ctx.fillRect(RACK.x, RACK.y, RACK.w, RACK.h - 6);
    ctx.fillStyle = "#121318"; ctx.fillRect(RACK.x + 8, RACK.y + RACK.h - 6, RACK.w - 16, 6);
    if (rl) { ctx.fillStyle = rgba(L.bottom[10], rl * ex * 3); ctx.fillRect(RACK.x, RACK.y + RACK.h - 8, RACK.w, 2); }
    ctx.fillStyle = "#2a2d36"; ctx.fillRect(SB.x, SB.y, SB.w, SB.h);

    // TV
    ctx.fillStyle = "#050506"; ctx.fillRect(TV.x - 2, TV.y - 2, TV.w + 4, TV.h + 4);
    ctx.drawImage(sc, TV.x, TV.y, TV.w, TV.h);

    // reflexo na tela: vem do que está na frente da TV
    const refl = ((layers.tras ? 0.55 : 0) + (layers.laterais ? 0.18 : 0) + (layers.tetoTodo ? 0.15 : 0) +
      (layers.tetoFrente ? 0.03 : 0) + (layers.moldura ? 0.02 : 0)) * ex;
    const reflNow = refl * (0.35 + lum(L.all));
    if (reflNow > 0.01) {
      const g = ctx.createLinearGradient(TV.x, TV.y, TV.x + TV.w, TV.y + TV.h);
      g.addColorStop(0, rgba(L.all, reflNow * 0.55)); g.addColorStop(0.5, rgba(L.all, reflNow * 0.15)); g.addColorStop(1, rgba(L.all, reflNow * 0.4));
      ctx.fillStyle = g; ctx.fillRect(TV.x, TV.y, TV.w, TV.h);
      // silhueta do sofá refletida
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.5, reflNow)})`;
      ctx.fillRect(TV.x, TV.y + TV.h * 0.72, TV.w, TV.h * 0.28);
    }
    meter(refl);

    // sofá em primeiro plano
    ctx.fillStyle = "#040405";
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H - 50);
    ctx.quadraticCurveTo(W / 2, H - 80, W, H - 50); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(L.all, 0.08 + spill); ctx.lineWidth = 2; ctx.stroke();
  };

  let lastMeter = "";
  const meter = (r) => {
    const label = r < 0.05 ? "Nenhum" : r < 0.15 ? "Baixo" : r < 0.3 ? "Médio" : "Alto";
    if (label === lastMeter) return;
    lastMeter = label;
    const el = $("#sim-refl");
    el.textContent = label;
    el.dataset.level = label;
  };

  /* ---------- loop ---------- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loop = (now) => {
    if (!sceneT0) sceneT0 = now;
    let t = (now - sceneT0) / 1000;
    if (t > scenes[sceneIdx].dur) {
      if (auto) sceneIdx = (sceneIdx + 1) % scenes.length;
      sceneT0 = now; t = 0;
    }
    $("#sim-scene").textContent = scenes[sceneIdx].name;
    drawScene(scenes[sceneIdx].id, t);
    sample();
    if (!shown) shown = clone(target);
    // atraso: fitas WLED reagem em 1–2 quadros; lâmpadas inteligentes ~0,5 s
    history.push(clone(target));
    if (history.length > 40) history.shift();
    const src = slow ? history[0] : target;
    const k = slow ? 0.12 : 0.65;
    ["top", "bottom", "left", "right"].forEach((e) => smoothTo(shown[e], src[e], k));
    smoothTo(shown.all, src.all, k);
    render(shown);
    if (!reduce) requestAnimationFrame(loop);
  };

  // só anima quando o simulador está visível na tela
  let running = false;
  new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting && !running) { running = true; requestAnimationFrame(loop); }
    });
  }).observe(cv);
})();
