/* ==========================================================
   Projeto Ambilight · interações
   ========================================================== */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const num = (v, d = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- barra de progresso e menu ---------- */
  const bar = $("#progress-bar");
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
  };
  document.addEventListener("scroll", onScroll, { passive: true });

  const menuBtn = $("#menu-btn");
  const nav = $("#nav");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  $$("#nav a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

  const navObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        $$("#nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach((s) => navObs.observe(s));

  /* ---------- animação de entrada ---------- */
  const revObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); revObs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  const observeReveal = (root = document) => $$(".reveal:not(.in)", root).forEach((el) => revObs.observe(el));
  observeReveal();

  /* ---------- contadores ---------- */
  $$("[data-count]").forEach((el) => {
    const target = +el.dataset.count;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 1600);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  /* ---------- demonstração de ambilight ---------- */
  const screen = $("#screen");
  const glow = $("#glow");
  if (screen && glow) {
    const sc = screen.getContext("2d", { willReadFrequently: true });
    const gc = glow.getContext("2d");
    const W = screen.width, H = screen.height;
    const GW = glow.width, GH = glow.height;
    // posição da TV dentro do canvas de brilho (o brilho é 156% do tamanho da TV)
    const inset = 0.28 / 1.56;
    const tx0 = GW * inset, tx1 = GW * (1 - inset), ty0 = GH * inset, ty1 = GH * (1 - inset);

    const palettes = [
      ["#ff6b00", "#ffd000", "#2b0a3d", "#ff2d55"], // pôr do sol
      ["#00e5ff", "#0047ff", "#001a33", "#00ffa3"], // oceano
      ["#7cff00", "#00b35c", "#0a2a12", "#e6ff66"], // floresta
      ["#ff00c8", "#7c4dff", "#12002b", "#00e5ff"], // neon
      ["#ff1f1f", "#ff8a00", "#1a0000", "#ffe0a0"]  // explosão
    ];
    let pal = 0, nextCut = 0;
    const blobs = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random(), y: Math.random(), r: 0.25 + Math.random() * 0.3,
      sx: (Math.random() - 0.5) * 0.0006, sy: (Math.random() - 0.5) * 0.0006, c: i % 4
    }));
    const SEG_H = 16, SEG_V = 9;

    const avg = (x, y, w, h) => {
      const d = sc.getImageData(x, y, w, h).data;
      let r = 0, g = 0, b = 0;
      const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      return `rgb(${r / n | 0},${g / n | 0},${b / n | 0})`;
    };

    const frame = (t) => {
      if (t > nextCut) { pal = (pal + 1) % palettes.length; nextCut = t + 5000; }
      const P = palettes[pal];
      sc.fillStyle = P[2];
      sc.fillRect(0, 0, W, H);
      blobs.forEach((b, i) => {
        b.x += b.sx * 16; b.y += b.sy * 16;
        if (b.x < -0.1 || b.x > 1.1) b.sx *= -1;
        if (b.y < -0.1 || b.y > 1.1) b.sy *= -1;
        const x = (b.x + Math.sin(t / 1500 + i) * 0.08) * W;
        const y = (b.y + Math.cos(t / 1700 + i) * 0.08) * H;
        const g = sc.createRadialGradient(x, y, 0, x, y, b.r * W);
        g.addColorStop(0, P[(b.c + 0) % 4 === 2 ? 3 : b.c % 4]);
        g.addColorStop(1, "transparent");
        sc.fillStyle = g;
        sc.fillRect(0, 0, W, H);
      });
      // amostragem das bordas, como o HyperHDR
      gc.clearRect(0, 0, GW, GH);
      const bw = W / SEG_H, bh = H / SEG_V, depth = 24;
      for (let i = 0; i < SEG_H; i++) {
        const gx = tx0 + (i / SEG_H) * (tx1 - tx0), gw = (tx1 - tx0) / SEG_H + 0.5;
        gc.fillStyle = avg(i * bw, 0, bw, depth);
        gc.fillRect(gx, 0, gw, ty0 + 2);
        gc.fillStyle = avg(i * bw, H - depth, bw, depth);
        gc.fillRect(gx, ty1 - 2, gw, GH - ty1 + 2);
      }
      for (let j = 0; j < SEG_V; j++) {
        const gy = ty0 + (j / SEG_V) * (ty1 - ty0), gh = (ty1 - ty0) / SEG_V + 0.5;
        gc.fillStyle = avg(0, j * bh, depth, bh);
        gc.fillRect(0, gy, tx0 + 2, gh);
        gc.fillStyle = avg(W - depth, j * bh, depth, bh);
        gc.fillRect(tx1 - 2, gy, GW - tx1 + 2, gh);
      }
      requestAnimationFrame(frame);
    };
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) requestAnimationFrame(frame);
    else frame(0);
  }

  /* ---------- calculadora de ângulo ---------- */
  const size = $("#tv-size"), dist = $("#tv-dist");
  const updateAngle = () => {
    const inch = +size.value, d = +dist.value;
    const width = inch * 2.54 / 100 * (16 / Math.hypot(16, 9));
    const ang = 2 * Math.atan(width / 2 / d) * 180 / Math.PI;
    $("#tv-size-out").textContent = inch + '"';
    $("#tv-dist-out").textContent = num(d, 2) + " m";
    $("#angle-value").textContent = Math.round(ang) + "°";
    $("#angle-width").textContent = "Largura da tela: " + num(width, 2) + " m";
    const lab = $("#angle-label");
    if (ang < 26) { lab.textContent = "Pequena para a distância"; lab.style.color = "var(--amber)"; }
    else if (ang < 30) { lab.textContent = "Confortável"; lab.style.color = "var(--green)"; }
    else if (ang <= 40) { lab.textContent = "Cinema (SMPTE/THX)"; lab.style.color = "var(--cyan)"; }
    else { lab.textContent = "Grande: exige mover os olhos"; lab.style.color = "var(--pink)"; }
    // desenho: olho em (150,140), tela a 120 px
    const half = Math.tan(ang / 2 * Math.PI / 180) * 120;
    const xa = 150 - half, xb = 150 + half;
    $("#ang-a").setAttribute("x2", xa); $("#ang-b").setAttribute("x2", xb);
    $("#ang-screen").setAttribute("x1", xa); $("#ang-screen").setAttribute("x2", xb);
    window.dispatchEvent(new CustomEvent("tvchange", { detail: { inch, d, width, height: width * 9 / 16 } }));
  };
  size.addEventListener("input", updateAngle);
  dist.addEventListener("input", updateAngle);
  updateAngle();

  /* ---------- calculadora de potência ---------- */
  const pc = $("#power-calc");
  const updatePower = () => {
    const v = (z) => Math.max(0, +$(`[data-z=${z}]`, pc).value || 0);
    const dens = Math.max(1, +$("#pc-density").value || 60);
    const wm = Math.max(0, +$("#pc-wm").value || 0) * (dens / 60);
    const mA = v("tv") + v("rack") + v("cantos");
    const mB = v("cima") + v("rodape");
    const wA = mA * wm, wB = mB * wm, cap = 204;
    $("#pc-leds").textContent = Math.round((mA + mB) * dens).toLocaleString("pt-BR");
    $("#pc-m").textContent = num(mA + mB, 1);
    $("#pc-a").textContent = Math.round(wA) + " W";
    $("#pc-b").textContent = Math.round(wB) + " W";
    const st = (w) => (w <= cap * 0.8 ? "dentro de 80% da capacidade" : "<b>acima de 80%: limitar a corrente no WLED ou usar fonte maior</b>");
    $("#pc-advice").innerHTML = `Fonte A (LRS-200-12, 204 W): ${st(wA)}. Fonte B (LRS-200-12, 204 W): ${st(wB)}. ` +
      `Corrente de pico estimada: A ${num(wA / 12, 1)} A · B ${num(wB / 12, 1)} A. Rolos de 5 m: ${Math.ceil((mA + mB) / 5)} (compre 1 a mais para cortes).`;
  };
  $$("input", pc).forEach((i) => i.addEventListener("input", updatePower));
  $$("#pc-rack .chip").forEach((c) => c.addEventListener("click", () => {
    $$("#pc-rack .chip").forEach((x) => x.classList.toggle("active", x === c));
    const com = c.dataset.r === "com";
    $("[data-z=rack]", pc).value = com ? "2.10" : "0";
    $("[data-z=rodape]", pc).value = com ? "2.80" : "5.00";
    updatePower();
  }));
  updatePower();

  /* ---------- zonas ---------- */
  const zones = {
    tv: {
      title: "Zona 1 · Atrás da TV",
      text: "Fita colada na traseira da TV, a 3–4 cm da borda, com os LEDs virados para a parede. É a base do ambilight e copia as bordas da imagem.",
      specs: { "Comprimento": "~3,52 m", "LEDs": "~211", "Saída": "1", "Energia": "Fonte A, início e fim", "Fixação": "Fita 3M VHB + cantos em L ou soldados" }
    },
    quadro: {
      title: "Quadro de ripas nos cantos",
      text: "Tábuas de 11 cm nas 4 bordas da parede da TV, a 5 cm da parede. A fita fica atrás de cada tábua, encostada na madeira, e a luz lava a parede em direção à TV.",
      specs: { "Comprimento": "~15,2 m sem rack (5 + 5 + 2 × 2,58)", "LEDs": "~910", "Saídas": "2 (cima), 3 (rodapé), 4 (cantos)", "Fita": "Numa cantoneira de alumínio nas costas da tábua", "Visível?": "Do sofá, nunca" }
    },
    rack: {
      title: "Embaixo do rack (opcional)",
      text: "Fita dentro de um perfil de alumínio com difusor, colada embaixo da parte da frente do rack, no recuo de mais de 4 cm da base, virada para o chão. Fica escondida de quem está no sofá. Substitui a luz de baixo da TV, que fica tampada pela soundbar, e completa a moldura de luz.",
      specs: { "Comprimento": "~2,10 m (rack de 2,20 m)", "LEDs": "~126", "Saída": "1, depois da TV", "Energia": "Fonte A", "Posição": "Junto à base recuada, longe da borda da frente", "Acabamento": "Perfil de sobrepor com difusor leitoso" }
    }
  };
  /* ---------- tamanho da TV: atualiza desenhos e contagem de LEDs ---------- */
  // Quadro de ripas: ~15,1 m de fita (com ou sem rack, quase igual).
  const FIXED_M = 15.1; // quadro (com ou sem rack, quase igual)
  const setAttrs = (el, a) => Object.entries(a).forEach(([k, v]) => el.setAttribute(k, v));
  window.addEventListener("tvchange", (e) => {
    const { inch, d, width, height } = e.detail;
    // fita a ~3,5 cm da borda em cada lado
    const perim = 2 * (width - 0.07 + height - 0.07);
    const leds = Math.round(perim * 60);
    const label = `TV ${inch}"`;

    // planta baixa: 100 px = 1 m, centro da parede em x = 280, parede em y = 31
    const pw = width * 100;
    setAttrs($("#p-tv"), { x: 280 - pw / 2, width: pw });
    $("#p-tv-label").textContent = label;
    const eyeY = 31 + d * 100;
    setAttrs($("#p-eye"), { cy: eyeY });
    setAttrs($("#p-view-a"), { y1: eyeY, x2: 280 - pw / 2 });
    setAttrs($("#p-view-b"), { y1: eyeY, x2: 280 + pw / 2 });

    // parede da TV: centro da tela a 1,10 m do chão (y = 170)
    const wh = height * 100, top = 170 - wh / 2;
    setAttrs($("#w-tv"), { x: 250 - pw / 2, y: top, width: pw, height: wh });
    setAttrs($("#w-tv-glow"), { x: 250 - pw / 2 - 6, y: top - 6, width: pw + 12, height: wh + 12 });
    setAttrs($("#w-tv-label"), { y: 170 + 4 });
    $("#w-tv-label").textContent = label;

    // tabela de zonas e calculadora de potência
    $("#zt-tv-len").textContent = "~" + num(perim, 2) + " m";
    $("#zt-tv-leds").textContent = "~" + leds;
    $("#zt-total-len").textContent = "~" + num(perim + FIXED_M, 1) + " m";
    $("#zt-total-leds").textContent = "~" + Math.round((perim + FIXED_M) * 60).toLocaleString("pt-BR");
    const tvInput = $("[data-z=tv]", pc);
    tvInput.value = perim.toFixed(2);
    updatePower();

    zones.tv.specs["Comprimento"] = "~" + num(perim, 2) + " m";
    zones.tv.specs["LEDs"] = "~" + leds;
    zones.tv.title = `Zona 1 · Atrás da TV (${inch}")`;
    if ($('.zone[data-zone="tv"]', wall).classList.contains("on")) showZone("tv");
  });

  const wall = $("#wall-svg");
  const showZone = (k) => {
    const z = zones[k];
    $$(".zone", wall).forEach((g) => g.classList.toggle("on", g.dataset.zone === k));
    wall.classList.add("has-sel");
    $("#zi-title").textContent = z.title;
    $("#zi-text").textContent = z.text;
    $("#zi-specs").innerHTML = Object.entries(z.specs).map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join("");
  };
  $$(".zone", wall).forEach((g) => {
    g.addEventListener("mouseenter", () => showZone(g.dataset.zone));
    g.addEventListener("click", () => showZone(g.dataset.zone));
  });
  $$("#zone-rack .chip").forEach((c) => c.addEventListener("click", () => {
    $$("#zone-rack .chip").forEach((x) => x.classList.toggle("active", x === c));
    const com = c.dataset.r === "com";
    wall.classList.toggle("with-rack", com); wall.classList.toggle("no-rack", !com);
  }));
  updateAngle(); // aplica o tamanho inicial da TV nos desenhos

  /* ---------- lista de compras ---------- */
  // preço: [mínimo, máximo] por unidade, em R$ (estimativa)
  const shop = [
    { group: "Vídeo e sinal", icon: "🎬", items: [
      { id: "firetv", name: "Fire TV Stick 4K Max (você já tem)", qty: 1, price: [0, 0], p: "essencial", desc: "Netflix, Prime Video e Stremio. Já está com você, não precisa comprar.", q: "fire tv stick 4k max", s: ["amz"] },
      { id: "hdmisw", name: "Switch HDMI 3×1 4K 60 Hz HDR", qty: 1, price: [90, 220], p: "essencial", desc: "Junta Fire TV e PS5 numa saída só. HDMI 2.0 (18 Gbps), HDCP 2.2, HDR e troca automática.", q: "switch hdmi 3x1 4k 60hz hdr hdcp 2.2", s: ["ml", "amz"] },
      { id: "split", name: "Splitter HDMI 1×2 4K 60 Hz HDR com downscale (ex.: ezcoo EZ-SP12H2)", qty: 1, price: [250, 550], p: "essencial", desc: "Saída 1: sinal original para a TV. Saída 2: cópia em 1080p para a captura. Precisa ter seleção de EDID. Provavelmente importado.", q: "ezcoo splitter 4k60 downscale hdr", s: ["ali", "amz", "ml"] },
      { id: "cap", name: "Placa de captura USB 3.0 com chip MS2130", qty: 1, price: [80, 220], p: "essencial", desc: "Lê a cópia do vídeo para o HyperHDR. Confirmar o chip MS2130 (a MS2109 é mais lenta).", q: "placa de captura ms2130 usb 3.0", s: ["ali", "ml", "amz"] },
      { id: "hdmi3", name: "Cabo HDMI Ultra High Speed certificado (48 Gbps), 3 m", qty: 2, price: [60, 150], p: "essencial", desc: "Splitter → TV e TV (eARC) → soundbar (ARC). Passam pela parede.", q: "cabo hdmi 2.1 ultra high speed certificado 3m", s: ["ml", "amz"] },
      { id: "hdmi1", name: "Cabo HDMI 4K 60 Hz, 1 m", qty: 3, price: [30, 80], p: "essencial", desc: "PS5 → switch HDMI, switch → splitter e splitter → captura.", q: "cabo hdmi 2.0 4k 1 metro", s: ["ml", "amz"] },
      { id: "hdmips5", name: "Cabo HDMI certificado de 5 m para o PS5", qty: 1, price: [70, 180], p: "essencial", v: "semrack", desc: "Do lugar do PS5 (prateleira ou móvel lateral) até o nicho atrás da TV.", q: "cabo hdmi certificado 5 metros 4k", s: ["ml", "amz"] },
      { id: "ethfire", name: "Adaptador Ethernet para Fire TV (Amazon)", qty: 1, price: [100, 160], p: "opcional", desc: "Só se o Wi-Fi do Fire TV oscilar.", q: "adaptador ethernet amazon fire tv", s: ["amz", "ml"] }
    ]},
    { group: "Processamento", icon: "🧠", items: [
      { id: "pi5", name: "Raspberry Pi 5 (4 GB)", qty: 1, price: [650, 1000], p: "essencial", desc: "Roda o HyperHDR. Alternativa: mini PC Intel N100.", q: "raspberry pi 5 4gb", s: ["ml", "amz"] },
      { id: "pipsu", name: "Fonte oficial Raspberry Pi 27 W USB-C", qty: 1, price: [70, 150], p: "essencial", desc: "Fontes genéricas causam travamentos.", q: "fonte oficial raspberry pi 5 27w", s: ["ml", "amz"] },
      { id: "picase", name: "Case com cooler ativo para Pi 5", qty: 1, price: [60, 200], p: "essencial", desc: "A captura em 60 fps aquece o processador.", q: "case raspberry pi 5 cooler", s: ["ml", "amz"] },
      { id: "sd", name: "Cartão microSD 32 GB A2 (High Endurance ou PRO)", qty: 1, price: [40, 90], p: "essencial", desc: "Sistema operacional do Pi.", q: "cartao microsd 32gb a2 high endurance", s: ["ml", "amz"] }
    ]},
    { group: "Rede", icon: "🔌", items: [
      { id: "sw", name: "Switch gigabit 8 portas (ex.: TP-Link TL-SG108 / LS1008G)", qty: 1, price: [120, 220], p: "essencial", desc: "Ligado ao Deco X60 da sala. Pi, controlador, PS5 e Fire TV ligam nele; o tráfego das luzes fica local.", q: "switch gigabit 8 portas tp-link", s: ["ml", "amz"] },
      { id: "patch", name: "Cabo de rede Cat6, 1 m", qty: 6, price: [10, 25], p: "essencial", desc: "Deco, Pi, controlador, PS5, TV e reserva.", q: "cabo de rede cat6 1 metro", s: ["ml", "amz"] }
    ]},
    { group: "Controle e energia dos LEDs", icon: "⚙️", items: [
      { id: "ctrl", name: "Controlador Gledopto (ESP32, Ethernet, 4 saídas, WLED de fábrica)", qty: 1, price: [250, 500], p: "essencial", desc: "O mesmo tipo do vídeo. Alternativa: QuinLED Dig-Quad com Ethernet. Provavelmente importado.", q: "gledopto wled ethernet esp32 4 outputs", s: ["ali", "amz"] },
      { id: "psu", name: "Fonte Mean Well LRS-200-12 (12 V · 17 A)", qty: 2, price: [180, 320], p: "essencial", desc: "Fonte A: TV, rack e cantos. Fonte B: tábua de cima e rodapé. Sem ventoinha.", q: "fonte mean well lrs-200-12", s: ["ml", "amz"] },
      { id: "fuse", name: "Bloco porta-fusíveis lâmina (6 posições) + fusíveis 7,5 A e 10 A", qty: 1, price: [50, 120], p: "essencial", desc: "Um fusível por trecho de fita.", q: "bloco porta fusivel lamina 6 vias", s: ["ml", "amz"] },
      { id: "wago", name: "Conectores Wago 221 (kit com 2, 3 e 5 vias)", qty: 1, price: [50, 120], p: "essencial", desc: "Distribuição de V+ e GND sem emendas soldadas.", q: "conector wago 221 kit", s: ["ml", "amz"] },
      { id: "cabpp", name: "Cabo paralelo 2 × 1,5 mm² (metro)", qty: 30, price: [3, 6], p: "essencial", desc: "Energia de cada trecho, nas duas pontas, correndo por dentro das tábuas.", q: "cabo paralelo 2x1,5mm", s: ["ml"] },
      { id: "cabdata", name: "Cabo de rede Cat5e sólido (metro), para os dados", qty: 20, price: [2, 5], p: "recomendado", desc: "Um par trançado por trecho (dados + GND).", q: "cabo de rede cat5e metro", s: ["ml"] },
      { id: "dps", name: "Filtro de linha com protetor de surto (DPS), 8 tomadas", qty: 1, price: [80, 200], p: "recomendado", desc: "Protege fontes, Pi, PS5 e soundbar.", q: "filtro de linha dps 8 tomadas", s: ["ml", "amz"] }
    ]},
    { group: "LEDs", icon: "💡", items: [
      { id: "strip", name: "Fita WS2815 12 V, 60 LEDs/m, IP30, rolo de 5 m", qty: 5, price: [120, 260], p: "essencial", desc: "~18,6 m necessários (TV + quadro, e rack se houver). 5 rolos dão sobra para cortes.", q: "fita led ws2815 12v 60 leds ip30 5m", s: ["ali", "ml", "amz"] },
      { id: "canto", name: "Cantoneira de alumínio 1 × 1 cm, barra de 3 m", qty: 6, price: [15, 35], p: "essencial", desc: "Parafusada nas costas de cada tábua. A fita é colada nela, encostada na madeira. Também ajuda a dissipar o calor.", q: "cantoneira aluminio 10x10mm 3 metros", s: ["ml"] },
      { id: "vhb", name: "Fita dupla face 3M VHB 10 mm + promotor de adesão", qty: 1, price: [30, 80], p: "recomendado", desc: "Reforça a fixação da fita na cantoneira e atrás da TV.", q: "fita 3m vhb 10mm", s: ["ml", "amz"] },
      { id: "perfilrack", name: "Perfil de alumínio de sobrepor com difusor leitoso (para o rack)", qty: 1, price: [60, 150], p: "recomendado", v: "rack", desc: "2,10 m no recuo da base do rack.", q: "perfil aluminio sobrepor fita led difusor leitoso", s: ["ml", "amz"] },
      { id: "mount", name: "Suporte de parede fixo para TV 55\" com 5–8 cm de afastamento", qty: 1, price: [100, 300], p: "essencial", desc: "Espaço para a luz espalhar atrás da TV. Conferir o VESA da S85H.", q: "suporte tv 55 fixo vesa", s: ["ml", "amz"] },
      { id: "sbmount", name: "Suporte de soundbar preso ao suporte da TV", qty: 1, price: [80, 200], p: "opcional", v: "semrack", desc: "Alternativa ao suporte que vem com a barra: deixa a barra uns 7 cm à frente da parede, e a luz do rodapé passa por trás dela.", q: "suporte soundbar para suporte de tv vesa", s: ["ml", "amz"] }
    ]},
    { group: "Ripas (marcenaria)", icon: "🪵", items: [
      { id: "tabuas", name: "Tábuas de MDF 15 mm em tiras de 11 cm (~18 m com sobra)", qty: 1, price: [250, 600], p: "essencial", desc: "Tábua de cima (5 m), rodapé (5 m ou 2 × 1,40 m) e cantos (2 × 2,58 m). Pode pedir cortado na marcenaria ou na loja de chapas.", q: "mdf 15mm corte sob medida", s: ["ml"] },
      { id: "supripa", name: "Cantoneiras metálicas pequenas (2,5 cm) para fixar as tábuas", qty: 50, price: [1, 3], p: "essencial", desc: "Seguram cada tábua a 5 cm da parede da TV, presas no teto, no chão ou na parede lateral.", q: "cantoneira metalica 25mm", s: ["ml"] },
      { id: "parafusos", name: "Kit de parafusos e buchas 6 mm", qty: 1, price: [30, 60], p: "essencial", desc: "Fixação dos suportes e das cantoneiras.", q: "kit parafuso bucha 6mm", s: ["ml", "amz"] },
      { id: "tinta", name: "Tinta branca fosca para as tábuas (galão pequeno)", qty: 1, price: [60, 150], p: "recomendado", desc: "Mesma tinta da parede, para as tábuas sumirem no branco.", q: "tinta acrilica branca fosca 900ml", s: ["ml", "amz"] }
    ]},
    { group: "Ferramentas", icon: "🛠️", items: [
      { id: "solda", name: "Estação de solda com controle de temperatura (60 W ou mais)", qty: 1, price: [150, 450], p: "essencial", desc: "Controle de temperatura evita descolar as ilhas da fita.", q: "estacao de solda temperatura 60w", s: ["ml", "amz"] },
      { id: "estanho", name: "Estanho 0,8 mm com fluxo", qty: 1, price: [30, 80], p: "essencial", desc: "Sn63/Pb37 é o mais fácil para iniciante.", q: "estanho 0,8mm 63/37", s: ["ml", "amz"] },
      { id: "fluxo", name: "Fluxo de solda em pasta (no-clean)", qty: 1, price: [20, 60], p: "essencial", desc: "Facilita a solda nas ilhas da fita.", q: "fluxo de solda pasta no clean", s: ["ml", "amz"] },
      { id: "malha", name: "Malha dessoldadora + sugador", qty: 1, price: [20, 50], p: "recomendado", desc: "Para corrigir erros.", q: "malha dessoldadora sugador", s: ["ml", "amz"] },
      { id: "mao", name: "Suporte \"terceira mão\" com lupa", qty: 1, price: [40, 120], p: "recomendado", desc: "Segura fio e fita durante a solda.", q: "terceira mao lupa solda", s: ["ml", "amz"] },
      { id: "desenc", name: "Alicate desencapador automático", qty: 1, price: [40, 120], p: "essencial", desc: "Desencapa sem cortar o cobre.", q: "alicate desencapador automatico", s: ["ml", "amz"] },
      { id: "corte", name: "Alicate de corte diagonal", qty: 1, price: [25, 70], p: "essencial", desc: "Corte de fios e da fita.", q: "alicate de corte diagonal", s: ["ml", "amz"] },
      { id: "multi", name: "Multímetro digital", qty: 1, price: [60, 200], p: "essencial", desc: "Conferir curto antes de ligar e medir a tensão no fim de cada trecho.", q: "multimetro digital", s: ["ml", "amz"] },
      { id: "termo", name: "Kit de tubos termo-retráteis", qty: 1, price: [20, 50], p: "essencial", desc: "Isolamento das soldas.", q: "kit termo retratil", s: ["ml", "amz"] },
      { id: "soprador", name: "Soprador térmico", qty: 1, price: [100, 250], p: "opcional", desc: "Encolhe o termo-retrátil por igual.", q: "soprador termico", s: ["ml", "amz"] },
      { id: "iso", name: "Álcool isopropílico", qty: 1, price: [20, 40], p: "essencial", desc: "Limpeza antes de colar a fita.", q: "alcool isopropilico 1 litro", s: ["ml", "amz"] },
      { id: "laser", name: "Nível a laser de linhas", qty: 1, price: [80, 250], p: "opcional", desc: "Alinha as tábuas. O pedreiro pode ter um.", q: "nivel a laser linhas", s: ["ml", "amz"] }
    ]},
    { group: "Obra e sala", icon: "🧱", items: [
      { id: "el32", name: "Eletroduto corrugado 32 mm (metro)", qty: 5, price: [4, 8], p: "essencial", v: "rack", desc: "Caixa atrás da TV ↔ caixa atrás do rack (HDMI, energia e dados).", q: "eletroduto corrugado 32mm", s: ["ml"] },
      { id: "el25", name: "Eletroduto corrugado 25 mm (metro)", qty: 8, price: [2.5, 5], p: "essencial", v: "semrack", desc: "Nicho → canto inferior (fios das ripas) e lugar do PS5 → nicho (HDMI).", q: "eletroduto corrugado 25mm", s: ["ml"] },
      { id: "caixas", name: "Caixas 4×4 e 4×2 + espelhos (inclui espelho de saída de cabos)", qty: 1, price: [60, 150], p: "essencial", desc: "Atrás da TV e atrás do rack ou do nicho.", q: "espelho saida de cabos escova 4x4", s: ["ml", "amz"] },
      { id: "nicho", name: "Nicho técnico embutido atrás da TV (caixa + tampa + grelha de ventilação)", qty: 1, price: [150, 400], p: "essencial", v: "semrack", desc: "Uns 40 × 30 × 8 cm, com tomadas. Guarda os aparelhos pequenos e as fontes.", q: "caixa de embutir grande com tampa", s: ["ml"] },
      { id: "prateleira", name: "Prateleira ou móvel pequeno para o PS5", qty: 1, price: [60, 300], p: "essencial", v: "semrack", desc: "Numa parede lateral. O controle do PS5 é sem fio.", q: "prateleira flutuante para console", s: ["ml", "amz"] },
      { id: "guia", name: "Passa-fio (arame-guia) de 10 m", qty: 1, price: [20, 60], p: "recomendado", desc: "Para puxar os cabos pelos eletrodutos.", q: "passa fio 10 metros", s: ["ml", "amz"] },
      { id: "prendedor", name: "Prendedor de porta de chão", qty: 1, price: [15, 40], p: "recomendado", desc: "A porta abre para a parede da TV; o prendedor evita que a maçaneta bata.", q: "prendedor de porta chao", s: ["ml", "amz"] },
      { id: "blackout", name: "Cortina blackout (uma por janela)", qty: 2, price: [150, 400], p: "recomendado", desc: "A janela atrás do sofá reflete na tela e a da esquerda clareia a parede da TV.", q: "cortina blackout", s: ["ml", "amz"] }
    ]}
  ];

  const storeUrl = {
    ml: (q) => "https://lista.mercadolivre.com.br/" + q.trim().split(/\s+/).map(encodeURIComponent).join("-"),
    amz: (q) => "https://www.amazon.com.br/s?k=" + encodeURIComponent(q),
    ali: (q) => "https://pt.aliexpress.com/w/wholesale-" + q.trim().split(/\s+/).map(encodeURIComponent).join("-") + ".html"
  };
  const storeName = { ml: "Mercado Livre", amz: "Amazon", ali: "AliExpress" };

  const KEY = "ambilight-compras";
  const done = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  let filter = "all", version = "rack";
  const list = $("#shop-list");

  const renderShop = () => {
    let min = 0, max = 0, count = 0, bought = 0;
    list.innerHTML = shop.map((g) => {
      const items = g.items.filter((it) => (filter === "all" || it.p === filter) && (!it.v || it.v === version));
      if (!items.length) return "";
      const rows = items.map((it) => {
        count++;
        if (done.has(it.id)) bought++;
        min += it.price[0] * it.qty; max += it.price[1] * it.qty;
        const links = it.s.map((s) => `<a href="${storeUrl[s](it.q)}" target="_blank" rel="noopener">${storeName[s]} ↗</a>`).join("");
        return `<div class="item ${done.has(it.id) ? "done" : ""}">
          <input type="checkbox" data-id="${it.id}" ${done.has(it.id) ? "checked" : ""} aria-label="Marcar ${it.name} como comprado">
          <div>
            <div class="item-name">${it.name}<span class="badge ${it.p}">${it.p}</span>${it.v ? `<span class="badge ver">${it.v === "rack" ? "só com rack" : "só sem rack"}</span>` : ""}</div>
            <div class="item-desc">${it.desc}</div>
            <div class="item-links">${links}</div>
          </div>
          <div class="item-side">
            <div class="item-qty">${it.qty} ${it.qty > 1 ? "un./m" : "un."}</div>
            <div class="item-price">${brl(it.price[0] * it.qty)} – ${brl(it.price[1] * it.qty)}</div>
          </div>
        </div>`;
      }).join("");
      return `<div class="shop-group reveal"><h3>${g.icon} ${g.group} <small>${items.length} itens</small></h3>${rows}</div>`;
    }).join("");
    $("#shop-total").textContent = `${brl(min)} – ${brl(max)}`;
    $("#shop-progress").textContent = `${bought} de ${count} comprados`;
    observeReveal(list);
  };
  list.addEventListener("change", (e) => {
    const id = e.target.dataset.id;
    if (!id) return;
    e.target.checked ? done.add(id) : done.delete(id);
    localStorage.setItem(KEY, JSON.stringify([...done]));
    renderShop();
  });
  $$("#shop-filters .chip").forEach((c) => c.addEventListener("click", () => {
    $$("#shop-filters .chip").forEach((x) => x.classList.toggle("active", x === c));
    filter = c.dataset.f;
    renderShop();
  }));
  $$("#shop-version .chip").forEach((c) => c.addEventListener("click", () => {
    $$("#shop-version .chip").forEach((x) => x.classList.toggle("active", x === c));
    version = c.dataset.v;
    renderShop();
  }));
  renderShop();

  /* ---------- passo a passo ---------- */
  const steps = [
    { t: "Decidir e comprar", s: "Fase 0 · antes de tudo", li: [
      "Decidir com rack ou sem rack. Sem rack, decidir onde ficam o PS5 e os aparelhos (nicho atrás da TV, móvel lateral ou outro cômodo).",
      "Testar a internet no lugar dos equipamentos com o celular (fast.com). Filmes 4K pedem pelo menos 25 Mbps estáveis.",
      "Comprar primeiro os importados (splitter, controlador, fitas), que demoram mais.",
      "Montar uma peça de teste de 50 cm da ripa (tábua + cantoneira + fita) e testar à noite."
    ], c: "Versão escolhida, itens essenciais comprados e peça de teste aprovada." },
    { t: "Obra", s: "Fase 1 · pedreiro, eletricista e marceneiro", li: [
      "Remover o painel de madeira, consertar o reboco e fazer massa corrida bem lixada na parede da TV.",
      "Com rack: eletroduto de 32 mm da TV até o rack e tomadas atrás do rack.",
      "Sem rack: nicho técnico atrás da TV com tomadas e ventilação, eletroduto do nicho até o canto inferior e do lugar do PS5 até o nicho.",
      "Tomada atrás da TV (eletricista, circuito de 127/220 V separado da baixa tensão).",
      "Pintar tudo de branco fosco, inclusive as tábuas."
    ], c: "Eletrodutos passam o arame-guia, as tomadas funcionam e a parede está lisa." },
    { t: "TV, HDMI e som", s: "Fase 2 · imagem perfeita antes do ambilight", li: [
      "Instalar o suporte da TV com 5–8 cm de afastamento e a TV com o centro a ~1,05–1,10 m do chão.",
      "Ligar Fire TV e PS5 no switch HDMI, o switch no splitter e a saída 1 do splitter na TV.",
      "Ligar a porta eARC da TV na porta HDMI ARC da JBL Bar 5.1. Sem rack: prender a barra na parede com o suporte que vem com ela, ~12 cm abaixo da TV.",
      "Configurar o áudio seguindo o guia de áudio da seção Software."
    ], c: "Netflix em 4K HDR mostra o selo HDR, o PS5 mostra 4K HDR e o som sai pela barra." },
    { t: "Rede e Raspberry Pi", s: "Fase 3 · cérebro do sistema", li: [
      "Gravar o Raspberry Pi OS Lite (64 bits) com o Raspberry Pi Imager, ativando SSH e o nome \"ambilight\".",
      "Ligar o Deco X60 da sala no switch de rede e o Pi no switch.",
      "No app Deco, reservar IP fixo para o Pi e para o controlador WLED.",
      "Instalar o HyperHDR seguindo o guia oficial em hyperhdr.eu e abrir http://ambilight.local:8090.",
      "Ligar a saída 2 do splitter na placa de captura e a placa numa porta USB 3.0 (azul) do Pi."
    ], c: "A pré-visualização do HyperHDR mostra a imagem do Fire TV." },
    { t: "Montagem das ripas e dos LEDs", s: "Fase 4 · bancada e instalação", li: [
      "Na bancada: parafusar a cantoneira nas costas de cada tábua e colar a fita nela, encostada na madeira, apontando para o lado da TV.",
      "Soldar os fios de cada trecho (V+, GND, dados; BI no GND no início) e isolar com termo-retrátil. Testar cada tábua ligada ao controlador.",
      "Fixar as tábuas nos cantos com os suportes, a 5 cm da parede da TV: em cima junto ao teto, embaixo junto ao chão e nos dois cantos laterais.",
      "Com rack: rodapé em dois pedaços e a fita no recuo da base do rack. Sem rack: rodapé inteiro.",
      "Passar energia (nas duas pontas de cada trecho) e dados por dentro das tábuas até as fontes. Montar fusíveis, Wagos e o GND comum.",
      "Com tudo desligado, conferir com o multímetro que não há curto entre V+ e GND. Ligar e medir a tensão no fim de cada trecho (acima de ~11 V)."
    ], c: "Todas as tábuas e a TV acendem por inteiro com um efeito de teste do WLED." },
    { t: "WLED", s: "Fase 5 · controlador", li: [
      "Ligar o controlador no switch de rede e encontrá-lo no app WLED.",
      "Em LED Preferences: tipo WS281x e a quantidade de LEDs de cada saída (ver seção Software).",
      "Conferir a ordem das cores com vermelho puro. Se não ficar vermelho, trocar a ordem (GRB, RGB…).",
      "Ativar o limite de corrente e a recepção em tempo real (DDP)."
    ], c: "Vermelho, verde, azul e branco corretos em todas as zonas." },
    { t: "HyperHDR", s: "Fase 6 · sincronia com a imagem", li: [
      "Adicionar o dispositivo WLED com o IP do controlador e o total de LEDs.",
      "No editor de layout: TV nas bordas, tábua de cima no topo, rodapé na base, cantos nas laterais e rack na base (se houver). Corrigir o sentido de cada trecho.",
      "Ativar a correção de HDR e rodar a calibração automática da LUT.",
      "Ativar detecção de barras pretas, detecção de sinal e suavização (~100 ms para filmes)."
    ], c: "Com o teste de cores girando, cada canto da parede pega a cor do canto da tela." },
    { t: "Ajuste fino", s: "Fase 7 · na sala escura", li: [
      "Calibrar o branco: tela branca na TV e ajuste até a luz ficar com o mesmo tom.",
      "Deixar o quadro mais fraco que o halo da TV, para não competir com a imagem.",
      "Testar atraso com vídeos de flashes e reduzir a suavização se precisar.",
      "Testar filmes com áudio AC3 e DTS no Stremio, conforme o guia de áudio."
    ], c: "Uma sessão de filme inteira, sem travadas, com cores coerentes e som certo." }
  ];
  $("#steps").innerHTML = steps.map((st, i) => `
    <details class="step reveal" ${i === 0 ? "open" : ""}>
      <summary><span class="step-n">${String(i).padStart(2, "0")}</span>
        <span class="step-title">${st.t}<span class="step-sub">${st.s}</span></span></summary>
      <div class="step-body">
        <ol>${st.li.map((l) => `<li>${l}</li>`).join("")}</ol>
        <div class="check"><b>✓ Teste para avançar:</b> ${st.c}</div>
      </div>
    </details>`).join("");
  observeReveal($("#steps"));

  /* ---------- impressão: abre todas as fases ---------- */
  window.addEventListener("beforeprint", () => $$("details.step").forEach((d) => (d.open = true)));
})();
