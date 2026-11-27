/* ==========================================================
   Cenas de exemplo ("vídeo" que passa na TV dos simuladores)
   e leitura das bordas, como o HyperHDR faz.
   Uso: const p = Ambi.createPlayer(); p.tick(agora) → cores
   ========================================================== */
(() => {
  "use strict";
  const SW = 160, SH = 90;
  const NT = 20, NS = 10; // segmentos em cima/embaixo e nas laterais

  const scenes = [
    { id: "cores", name: "Teste de cores (girando)", dur: 10 },
    { id: "varredura", name: "Faixa atravessando a tela", dur: 8 },
    { id: "tempestade", name: "Tempestade com raios", dur: 10 },
    { id: "explosao", name: "Explosões", dur: 8 },
    { id: "sirene", name: "Sirene de polícia", dur: 6 },
    { id: "lareira", name: "Lareira", dur: 7 },
    { id: "espaco", name: "Espaço", dur: 8 },
    { id: "estadio", name: "Estádio de futebol", dur: 6 },
    { id: "por", name: "Pôr do sol", dur: 7 },
    { id: "oceano", name: "Oceano", dur: 7 }
  ];

  const flash = (t, at, len = 0.18) => (t >= at && t < at + len ? 1 - (t - at) / len : 0);

  const draw = (s, id, t) => {
    if (id === "cores") {
      const cx = SW / 2, cy = SH / 2, R = 200, n = 72, rot = t * 0.6;
      for (let i = 0; i < n; i++) {
        const a0 = rot + (i / n) * Math.PI * 2, a1 = rot + ((i + 1.2) / n) * Math.PI * 2;
        s.fillStyle = `hsl(${(i / n) * 360},100%,50%)`;
        s.beginPath(); s.moveTo(cx, cy); s.arc(cx, cy, R, a0, a1); s.closePath(); s.fill();
      }
      s.font = "bold 13px Arial"; s.textAlign = "center"; s.textBaseline = "middle";
      s.fillStyle = "rgba(0,0,0,.45)"; s.fillText("Ambilight Color Test", cx + 1, cy + 1);
      s.fillStyle = "#fff"; s.fillText("Ambilight Color Test", cx, cy);
    } else if (id === "varredura") {
      s.fillStyle = "#000"; s.fillRect(0, 0, SW, SH);
      const hue = (t * 90) % 360;
      s.fillStyle = `hsl(${hue},100%,50%)`;
      if (t < 4) { const x = (t / 4) * (SW + 30) - 15; s.fillRect(x - 12, 0, 24, SH); }
      else { const y = ((t - 4) / 4) * (SH + 30) - 15; s.fillRect(0, y - 9, SW, 18); }
    } else if (id === "tempestade") {
      const g = s.createLinearGradient(0, 0, 0, SH);
      g.addColorStop(0, "#0b1424"); g.addColorStop(0.7, "#1c2a3d"); g.addColorStop(1, "#0a0f16");
      s.fillStyle = g; s.fillRect(0, 0, SW, SH);
      for (let i = 0; i < 6; i++) {
        const x = ((i * 37 + t * 6) % (SW + 60)) - 30, y = 12 + (i % 3) * 10;
        const cg = s.createRadialGradient(x, y, 0, x, y, 34);
        cg.addColorStop(0, "rgba(60,75,95,.8)"); cg.addColorStop(1, "rgba(60,75,95,0)");
        s.fillStyle = cg; s.fillRect(0, 0, SW, SH);
      }
      s.fillStyle = "#06080c"; s.fillRect(0, SH - 14, SW, 14);
      const f = Math.max(flash(t, 2.0, 0.35), flash(t, 2.45, 0.2) * 0.8, flash(t, 5.6, 0.4), flash(t, 8.1, 0.3), flash(t, 8.5, 0.15) * 0.7);
      if (f > 0) {
        const bx = t < 4 ? 50 : t < 7 ? 115 : 80;
        s.fillStyle = `rgba(220,230,255,${0.85 * f})`; s.fillRect(0, 0, SW, SH);
        s.strokeStyle = `rgba(255,255,255,${f})`; s.lineWidth = 1.5; s.beginPath();
        let x = bx, y = 0; s.moveTo(x, y);
        while (y < SH - 14) { x += Math.sin(y * 7.3 + bx) * 6; y += 7; s.lineTo(x, y); }
        s.stroke();
      }
    } else if (id === "explosao") {
      s.fillStyle = "#07090d"; s.fillRect(0, 0, SW, SH);
      s.fillStyle = "#0f1620";
      for (let i = 0; i < 12; i++) s.fillRect(i * 14, SH - 20 - ((i * 13) % 22), 12, 40);
      const boom = (cx, cy, at) => {
        const k = t - at;
        if (k < 0 || k > 2.2) return;
        const r = 8 + k * 45, a = Math.max(0, 1 - k / 2.2);
        const g = s.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(255,250,210,${a})`); g.addColorStop(0.3, `rgba(255,170,40,${a})`);
        g.addColorStop(0.7, `rgba(200,50,10,${a * 0.7})`); g.addColorStop(1, "rgba(80,10,0,0)");
        s.fillStyle = g; s.fillRect(0, 0, SW, SH);
        if (k < 0.2) { s.fillStyle = `rgba(255,240,200,${0.6 * (1 - k / 0.2)})`; s.fillRect(0, 0, SW, SH); }
      };
      boom(110, 55, 1.5); boom(40, 60, 4.6);
    } else if (id === "sirene") {
      s.fillStyle = "#05060a"; s.fillRect(0, 0, SW, SH);
      s.fillStyle = "#11131a"; s.fillRect(0, SH - 22, SW, 22);
      const ph = Math.floor(t * 3) % 2;
      const light = (cx, col) => {
        const g = s.createRadialGradient(cx, 30, 0, cx, 30, 70);
        g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
        s.fillStyle = g; s.fillRect(0, 0, SW, SH);
      };
      if (ph === 0) light(30, "rgba(255,20,30,.95)"); else light(130, "rgba(20,60,255,.95)");
    } else if (id === "lareira") {
      s.fillStyle = "#070302"; s.fillRect(0, 0, SW, SH);
      for (let i = 0; i < 14; i++) {
        const x = 30 + i * 7.5, fl = 0.6 + 0.4 * Math.sin(t * 9 + i * 2.1) * Math.sin(t * 5.3 + i);
        const h = 25 + fl * 30;
        const g = s.createRadialGradient(x, SH - 8, 0, x, SH - 8, h);
        g.addColorStop(0, "rgba(255,230,140,.9)"); g.addColorStop(0.4, "rgba(255,120,20,.7)"); g.addColorStop(1, "rgba(120,20,0,0)");
        s.fillStyle = g; s.fillRect(0, 0, SW, SH);
      }
    } else if (id === "espaco") {
      s.fillStyle = "#020308"; s.fillRect(0, 0, SW, SH);
      const ng = s.createRadialGradient(40, 30, 0, 40, 30, 70);
      ng.addColorStop(0, "rgba(90,40,160,.6)"); ng.addColorStop(1, "rgba(0,0,0,0)");
      s.fillStyle = ng; s.fillRect(0, 0, SW, SH);
      for (let i = 0; i < 60; i++) {
        const x = (i * 53.7 - t * 4 * (1 + (i % 3))) % SW, y = (i * 29.3) % SH;
        s.fillStyle = "rgba(255,255,255,.8)"; s.fillRect((x + SW) % SW, y, 1, 1);
      }
      const px = SW + 40 - t * 30;
      const pg = s.createRadialGradient(px, 55, 0, px, 55, 34);
      pg.addColorStop(0, "#7dd3fc"); pg.addColorStop(0.7, "#0369a1"); pg.addColorStop(1, "rgba(3,105,161,0)");
      s.fillStyle = pg; s.fillRect(0, 0, SW, SH);
    } else if (id === "estadio") {
      const g = s.createLinearGradient(0, 0, 0, SH);
      g.addColorStop(0, "#0b1020"); g.addColorStop(0.35, "#1f2a44"); g.addColorStop(0.36, "#15803d"); g.addColorStop(1, "#166534");
      s.fillStyle = g; s.fillRect(0, 0, SW, SH);
      for (let i = 0; i < 6; i++) { s.fillStyle = i % 2 ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.05)"; s.fillRect(i * 27, 32, 27, SH); }
      s.strokeStyle = "rgba(255,255,255,.7)"; s.lineWidth = 1; s.strokeRect(10, 40, SW - 20, SH - 46);
      [25, 135].forEach((x) => { const lg = s.createRadialGradient(x, 6, 0, x, 6, 30); lg.addColorStop(0, "rgba(255,255,240,.9)"); lg.addColorStop(1, "rgba(0,0,0,0)"); s.fillStyle = lg; s.fillRect(0, 0, SW, SH); });
      s.fillStyle = "#fff"; s.beginPath(); s.arc(40 + ((t * 25) % 80), 65 - Math.abs(Math.sin(t * 3)) * 12, 2, 0, 7); s.fill();
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

  const createPlayer = () => {
    const canvas = document.createElement("canvas");
    canvas.width = SW; canvas.height = SH;
    const s = canvas.getContext("2d", { willReadFrequently: true });
    let idx = 0, t0 = 0, auto = true;
    const out = { top: [], bottom: [], left: [], right: [], all: [0, 0, 0] };

    const sample = () => {
      const d = s.getImageData(0, 0, SW, SH).data;
      const avg = (x0, y0, w, h) => {
        let r = 0, g = 0, b = 0, n = 0;
        for (let y = y0; y < Math.min(SH, y0 + h); y += 2) for (let x = x0; x < Math.min(SW, x0 + w); x += 2) {
          const i = (y * SW + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
        }
        return [r / n, g / n, b / n];
      };
      const bw = SW / NT, bh = SH / NS;
      for (let i = 0; i < NT; i++) {
        out.top[i] = avg(Math.floor(i * bw), 0, Math.ceil(bw), 14);
        out.bottom[i] = avg(Math.floor(i * bw), SH - 14, Math.ceil(bw), 14);
      }
      for (let j = 0; j < NS; j++) {
        out.left[j] = avg(0, Math.floor(j * bh), 20, Math.ceil(bh));
        out.right[j] = avg(SW - 20, Math.floor(j * bh), 20, Math.ceil(bh));
      }
      out.all = avg(0, 0, SW, SH);
    };

    return {
      canvas,
      setScene(id) {
        auto = id === "auto";
        if (!auto) idx = Math.max(0, scenes.findIndex((x) => x.id === id));
        t0 = 0;
      },
      tick(now) {
        if (!t0) t0 = now;
        let t = (now - t0) / 1000;
        if (t > scenes[idx].dur) { if (auto) idx = (idx + 1) % scenes.length; t0 = now; t = 0; }
        draw(s, scenes[idx].id, t);
        sample();
        return { name: scenes[idx].name, colors: out };
      }
    };
  };

  /* utilidades de cor compartilhadas */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const smooth = (cur, tgt, k) => {
    ["top", "bottom", "left", "right"].forEach((e) => cur[e].forEach((c, i) => { for (let n = 0; n < 3; n++) c[n] += (tgt[e][i][n] - c[n]) * k; }));
    for (let n = 0; n < 3; n++) cur.all[n] += (tgt.all[n] - cur.all[n]) * k;
  };
  // atraso: fitas WLED reagem em 1–2 quadros; lâmpadas inteligentes ~0,5 s
  const createFollower = () => {
    let shown = null;
    const hist = [];
    return (target, slow) => {
      if (!shown) shown = clone(target);
      hist.push(clone(target));
      if (hist.length > 40) hist.shift();
      smooth(shown, slow ? hist[0] : target, slow ? 0.12 : 0.65);
      return shown;
    };
  };

  window.Ambi = { scenes, createPlayer, createFollower, NT, NS };
})();
