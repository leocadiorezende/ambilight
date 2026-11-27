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
  };
  size.addEventListener("input", updateAngle);
  dist.addEventListener("input", updateAngle);
  updateAngle();

  /* ---------- calculadora de potência ---------- */
  const pc = $("#power-calc");
  const updatePower = () => {
    const v = (z) => Math.max(0, +$(`[data-z=${z}]`, pc).value || 0);
    const dens = Math.max(1, +$("#pc-density").value || 60);
    const wm = Math.max(0, +$("#pc-wm").value || 0);
    const mA = v("tv") + v("rack");
    const mB = v("col") * 2 + v("teto");
    const leds = Math.round((mA + mB) * dens);
    const wA = mA * wm * (dens / 60), wB = mB * wm * (dens / 60);
    $("#pc-leds").textContent = leds;
    $("#pc-m").textContent = num(mA + mB, 1);
    $("#pc-a").textContent = Math.round(wA) + " W";
    $("#pc-b").textContent = Math.round(wB) + " W";
    const okA = wA <= 150 * 0.8, okB = wB <= 204 * 0.8;
    $("#pc-advice").innerHTML =
      `Fonte A (LRS-150-12, 150 W): ${okA ? "dentro de 80% da capacidade" : "<b>acima de 80%: usar fonte maior ou limitar no WLED</b>"}. ` +
      `Fonte B (LRS-200-12, 204 W): ${okB ? "dentro de 80% da capacidade" : "<b>acima de 80%: usar fonte maior ou limitar no WLED</b>"}. ` +
      `Corrente máxima estimada: A ${num(wA / 12, 1)} A · B ${num(wB / 12, 1)} A. Rolos de 5 m necessários: ${Math.ceil((mA + mB) / 5)} (compre 1 a mais para cortes).`;
  };
  $$("input", pc).forEach((i) => i.addEventListener("input", updatePower));
  updatePower();

  /* ---------- zonas ---------- */
  const zones = {
    tv: {
      title: "Zona 1 · Atrás da TV",
      text: "Fita colada na traseira da TV, a 3–4 cm da borda, com os LEDs virados para a parede. É a base do ambilight e copia as bordas da imagem.",
      specs: { "Comprimento": "~3,56 m", "LEDs": "~214", "Saída": "1", "Energia": "Fonte A, início e fim", "Fixação": "Fita 3M VHB + cantos em L ou soldados" }
    },
    colunas: {
      title: "Zonas 3 e 4 · Colunas laterais",
      text: "Perfis de alumínio embutidos na parede, a 40 cm de cada borda da TV. Copiam as laterais da imagem e ampliam a sensação de tela maior.",
      specs: { "Altura": "2,00 m cada (0,55 a 2,55 m do chão)", "LEDs": "120 cada", "Saídas": "3 (esq.) e 4 (dir.)", "Energia": "Fonte B", "Acabamento": "Difusor leitoso, perfil ≥ 15 mm" }
    },
    teto: {
      title: "Zonas 3 e 4 · Luz indireta no teto",
      text: "Moldura de poliestireno ao longo dos 5 m, 15 a 20 cm abaixo do teto, com a fita virada para cima. Copia o topo da imagem e banha o teto de cor.",
      specs: { "Comprimento": "5,00 m (2 × 2,50 m)", "LEDs": "150 + 150", "Saídas": "3 e 4, depois das colunas", "Sentido": "Do canto ao centro", "Energia": "Fonte B, com injeção no canto" }
    },
    rack: {
      title: "Zona 2 · Embaixo do rack",
      text: "Fita sob a borda do rack, virada para o chão. Substitui a luz de baixo da TV, que fica tampada pela soundbar, e completa a moldura de luz.",
      specs: { "Comprimento": "~1,80 m (confirmar)", "LEDs": "~108", "Saída": "2", "Energia": "Fonte A", "Dica": "Perfil com difusor evita reflexo de pontos no piso" }
    }
  };
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

  /* ---------- lista de compras ---------- */
  // preço: [mínimo, máximo] por unidade, em R$ (estimativa)
  const shop = [
    { group: "Vídeo e sinal", icon: "🎬", items: [
      { id: "firetv", name: "Fire TV Stick 4K Max (2ª geração)", qty: 1, price: [450, 650], p: "essencial", desc: "Fonte dos filmes e séries: Netflix, Prime Video e Stremio. Wi-Fi 6E, HDR10+ e Dolby Atmos.", q: "fire tv stick 4k max", s: ["ml", "amz"] },
      { id: "hdmisw", name: "Switch HDMI 3×1 4K 60 Hz HDR", qty: 1, price: [90, 220], p: "essencial", desc: "Junta Fire TV e PS5 numa saída só. Exigir HDMI 2.0 (18 Gbps), HDCP 2.2, HDR e troca automática de fonte.", q: "switch hdmi 3x1 4k 60hz hdr hdcp 2.2", s: ["ml", "amz"] },
      { id: "split", name: "Splitter HDMI 1×2 4K 60 Hz HDR com downscale (ex.: ezcoo EZ-SP12H2)", qty: 1, price: [250, 550], p: "essencial", desc: "Peça central: a saída 1 passa o sinal original para a TV e a saída 2 reduz para 1080p para a captura. Precisa ter seleção de EDID. Provavelmente importado.", q: "ezcoo splitter 4k60 downscale hdr", s: ["ali", "amz", "ml"] },
      { id: "cap", name: "Placa de captura USB 3.0 com chip MS2130", qty: 1, price: [80, 220], p: "essencial", desc: "Lê a cópia do vídeo para o HyperHDR. Confirmar o chip MS2130; a MS2109 é USB 2.0 e mais lenta.", q: "placa de captura ms2130 usb 3.0", s: ["ali", "ml", "amz"] },
      { id: "hdmi3", name: "Cabo HDMI Ultra High Speed certificado (48 Gbps), 3 m", qty: 2, price: [60, 150], p: "essencial", desc: "Os que passam pela parede: splitter → TV e TV (eARC) → soundbar. Certificados para não ter de trocar depois.", q: "cabo hdmi 2.1 ultra high speed certificado 3m", s: ["ml", "amz"] },
      { id: "hdmi1", name: "Cabo HDMI 4K 60 Hz, 1 m", qty: 3, price: [30, 80], p: "essencial", desc: "Dentro do rack: PS5 → switch HDMI, switch → splitter e splitter → placa de captura.", q: "cabo hdmi 2.0 4k 1 metro", s: ["ml", "amz"] },
      { id: "ethfire", name: "Adaptador Ethernet para Fire TV (Amazon)", qty: 1, price: [100, 160], p: "opcional", desc: "Liga o Fire TV no switch. Como o Deco da sala é sem fio, só vale se o Wi-Fi do Fire TV oscilar.", q: "adaptador ethernet amazon fire tv", s: ["amz", "ml"] }
    ]},
    { group: "Processamento", icon: "🧠", items: [
      { id: "pi5", name: "Raspberry Pi 5 (4 GB)", qty: 1, price: [650, 1000], p: "essencial", desc: "Roda o HyperHDR. Alternativa: mini PC com Intel N100, se estiver mais barato no Brasil.", q: "raspberry pi 5 4gb", s: ["ml", "amz"] },
      { id: "pipsu", name: "Fonte oficial Raspberry Pi 27 W USB-C", qty: 1, price: [70, 150], p: "essencial", desc: "Fontes genéricas causam travamentos por subtensão.", q: "fonte oficial raspberry pi 5 27w", s: ["ml", "amz"] },
      { id: "picase", name: "Case com cooler ativo para Pi 5", qty: 1, price: [60, 200], p: "essencial", desc: "A captura em 60 fps aquece o processador. Preferir ventoinha silenciosa ou case de alumínio.", q: "case raspberry pi 5 cooler", s: ["ml", "amz"] },
      { id: "sd", name: "Cartão microSD 32 GB A2 (linha High Endurance ou PRO)", qty: 1, price: [40, 90], p: "essencial", desc: "Sistema operacional do Pi.", q: "cartao microsd 32gb a2 high endurance", s: ["ml", "amz"] }
    ]},
    { group: "Rede", icon: "🔌", items: [
      { id: "sw", name: "Switch gigabit 8 portas (ex.: TP-Link TL-SG108 / LS1008G)", qty: 1, price: [120, 220], p: "essencial", desc: "Fica no rack, ligado ao Deco X60 da sala. Pi, controlador, PS5 e Fire TV ligam nele e o tráfego das luzes fica local.", q: "switch gigabit 8 portas tp-link", s: ["ml", "amz"] },
      { id: "patch", name: "Cabo de rede Cat6, 1 m", qty: 6, price: [10, 25], p: "essencial", desc: "Deco, Pi, controlador, PS5, TV e reserva.", q: "cabo de rede cat6 1 metro", s: ["ml", "amz"] }
    ]},
    { group: "Controle e energia dos LEDs", icon: "⚙️", items: [
      { id: "ctrl", name: "Controlador Gledopto Elite 4D (ESP32, Ethernet, 4 saídas, WLED de fábrica)", qty: 1, price: [250, 500], p: "essencial", desc: "O mesmo modelo do vídeo. Alternativa profissional: QuinLED Dig-Quad com módulo Ethernet. Provavelmente importado.", q: "gledopto wled ethernet esp32 4 outputs", s: ["ali", "amz"] },
      { id: "psua", name: "Fonte Mean Well LRS-150-12 (12 V · 12,5 A)", qty: 1, price: [150, 260], p: "essencial", desc: "Fonte A: TV, rack e controlador. Sem ventoinha.", q: "fonte mean well lrs-150-12", s: ["ml", "amz"] },
      { id: "psub", name: "Fonte Mean Well LRS-200-12 (12 V · 17 A)", qty: 1, price: [180, 320], p: "essencial", desc: "Fonte B: colunas e teto. Sem ventoinha.", q: "fonte mean well lrs-200-12", s: ["ml", "amz"] },
      { id: "fuse", name: "Bloco porta-fusíveis lâmina (6 posições) + fusíveis 5 A e 7,5 A", qty: 1, price: [50, 120], p: "essencial", desc: "Um fusível por trecho de fita. Protege contra curto-circuito.", q: "bloco porta fusivel lamina 6 vias", s: ["ml", "amz"] },
      { id: "wago", name: "Conectores Wago 221 (kit com 2, 3 e 5 vias)", qty: 1, price: [50, 120], p: "essencial", desc: "Distribuição de V+ e GND no rack sem emendas soldadas.", q: "conector wago 221 kit", s: ["ml", "amz"] },
      { id: "cabpp", name: "Cabo paralelo 2 × 1,5 mm² (metro)", qty: 20, price: [3, 6], p: "essencial", desc: "Alimentação de cada trecho, do rack até a fita, pelos eletrodutos.", q: "cabo paralelo 2x1,5mm", s: ["ml"] },
      { id: "cabdata", name: "Cabo de rede Cat5e sólido (metro), para dados das fitas", qty: 15, price: [2, 5], p: "recomendado", desc: "Um par trançado por trecho (dados + GND). Reduz interferência em trechos longos.", q: "cabo de rede cat5e metro", s: ["ml"] },
      { id: "dps", name: "Filtro de linha com protetor de surto (DPS), 8 tomadas", qty: 1, price: [80, 200], p: "recomendado", desc: "Protege fontes, Pi, PS5 e soundbar.", q: "filtro de linha dps 8 tomadas", s: ["ml", "amz"] }
    ]},
    { group: "LEDs e acabamento", icon: "💡", items: [
      { id: "strip", name: "Fita WS2815 12 V, 60 LEDs/m, IP30, rolo de 5 m", qty: 4, price: [120, 260], p: "essencial", desc: "Endereçável LED a LED, com linha de dados reserva. IP30 (sem silicone) mantém a cor mais fiel. 14,4 m necessários.", q: "fita led ws2815 12v 60 leds ip30 5m", s: ["ali", "ml", "amz"] },
      { id: "perfil", name: "Perfil de alumínio de embutir 2 m com difusor leitoso", qty: 2, price: [60, 150], p: "essencial", desc: "Colunas laterais. Profundidade de pelo menos 15 mm, com tampas e presilhas.", q: "perfil aluminio embutir fita led 2m difusor leitoso", s: ["ml", "amz"] },
      { id: "moldura", name: "Moldura de poliestireno para luz indireta LED (barra de 2 m)", qty: 3, price: [40, 110], p: "essencial", desc: "Substitui a sanca de gesso. 5 m de parede = 3 barras.", q: "moldura poliestireno luz indireta led", s: ["ml", "amz"] },
      { id: "cola", name: "Cola para moldura de poliestireno + massa para emendas", qty: 1, price: [30, 70], p: "essencial", desc: "Fixação e acabamento da moldura antes da pintura.", q: "cola para moldura de poliestireno", s: ["ml", "amz"] },
      { id: "vhb", name: "Fita dupla face 3M VHB 10 mm + promotor de adesão", qty: 1, price: [30, 80], p: "recomendado", desc: "O adesivo da fita de LED costuma soltar com o calor da traseira da TV.", q: "fita 3m vhb 10mm", s: ["ml", "amz"] },
      { id: "canto", name: "Conector em L para fita de 4 vias (10 mm)", qty: 4, price: [3, 10], p: "opcional", desc: "Cantos da TV sem solda. Como você vai soldar, são opcionais.", q: "conector L fita led 4 pinos 10mm", s: ["ml", "ali"] },
      { id: "mount", name: "Suporte de parede fixo para TV 55\" com 5–8 cm de afastamento", qty: 1, price: [100, 300], p: "essencial", desc: "Dá espaço para a luz espalhar atrás da TV. Conferir o padrão VESA da S85H.", q: "suporte tv 55 fixo vesa", s: ["ml", "amz"] }
    ]},
    { group: "Ferramentas", icon: "🛠️", items: [
      { id: "solda", name: "Estação de solda com controle de temperatura (60 W ou mais)", qty: 1, price: [150, 450], p: "essencial", desc: "Controle de temperatura evita descolar as ilhas de cobre da fita.", q: "estacao de solda temperatura 60w", s: ["ml", "amz"] },
      { id: "estanho", name: "Estanho 0,8 mm com fluxo", qty: 1, price: [30, 80], p: "essencial", desc: "Sn63/Pb37 é o mais fácil para iniciante.", q: "estanho 0,8mm 63/37", s: ["ml", "amz"] },
      { id: "fluxo", name: "Fluxo de solda em pasta (no-clean)", qty: 1, price: [20, 60], p: "essencial", desc: "Deixa a solda nas ilhas da fita muito mais fácil.", q: "fluxo de solda pasta no clean", s: ["ml", "amz"] },
      { id: "malha", name: "Malha dessoldadora + sugador de solda", qty: 1, price: [20, 50], p: "recomendado", desc: "Para corrigir erros.", q: "malha dessoldadora sugador", s: ["ml", "amz"] },
      { id: "mao", name: "Suporte \"terceira mão\" com lupa", qty: 1, price: [40, 120], p: "recomendado", desc: "Segura fio e fita durante a solda.", q: "terceira mao lupa solda", s: ["ml", "amz"] },
      { id: "desenc", name: "Alicate desencapador automático", qty: 1, price: [40, 120], p: "essencial", desc: "Desencapa os fios sem cortar o cobre.", q: "alicate desencapador automatico", s: ["ml", "amz"] },
      { id: "corte", name: "Alicate de corte diagonal", qty: 1, price: [25, 70], p: "essencial", desc: "Corte de fios e da fita.", q: "alicate de corte diagonal", s: ["ml", "amz"] },
      { id: "multi", name: "Multímetro digital", qty: 1, price: [60, 200], p: "essencial", desc: "Conferir curto-circuito antes de ligar e medir a tensão no fim de cada trecho.", q: "multimetro digital", s: ["ml", "amz"] },
      { id: "termo", name: "Kit de tubos termo-retráteis", qty: 1, price: [20, 50], p: "essencial", desc: "Isolamento das soldas.", q: "kit termo retratil", s: ["ml", "amz"] },
      { id: "soprador", name: "Soprador térmico", qty: 1, price: [100, 250], p: "opcional", desc: "Encolhe o termo-retrátil por igual. Um isqueiro resolve, com cuidado.", q: "soprador termico", s: ["ml", "amz"] },
      { id: "iso", name: "Álcool isopropílico", qty: 1, price: [20, 40], p: "essencial", desc: "Limpeza das superfícies antes de colar a fita e limpeza das soldas.", q: "alcool isopropilico 1 litro", s: ["ml", "amz"] },
      { id: "laser", name: "Nível a laser de linhas", qty: 1, price: [80, 250], p: "opcional", desc: "Alinha colunas e moldura. O pedreiro pode ter um.", q: "nivel a laser linhas", s: ["ml", "amz"] }
    ]},
    { group: "Materiais de obra", icon: "🧱", items: [
      { id: "el32", name: "Eletroduto corrugado 32 mm (metro)", qty: 5, price: [4, 8], p: "essencial", desc: "TV ↔ rack. Use 40 mm se couber na parede.", q: "eletroduto corrugado 32mm", s: ["ml"] },
      { id: "el25", name: "Eletroduto corrugado 25 mm (metro)", qty: 10, price: [2.5, 5], p: "essencial", desc: "Rack ↔ colunas e colunas ↔ moldura.", q: "eletroduto corrugado 25mm", s: ["ml"] },
      { id: "caixas", name: "Caixas 4×4 e 4×2 + espelhos (inclui espelho de saída de cabos com escova)", qty: 1, price: [60, 150], p: "essencial", desc: "Atrás da TV e atrás do rack.", q: "espelho saida de cabos escova 4x4", s: ["ml", "amz"] },
      { id: "guia", name: "Passa-fio (arame-guia) de 10 m", qty: 1, price: [20, 60], p: "recomendado", desc: "Para puxar os cabos pelos eletrodutos e deixar um guia para o futuro.", q: "passa fio 10 metros", s: ["ml", "amz"] }
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
  let filter = "all";
  const list = $("#shop-list");

  const renderShop = () => {
    let min = 0, max = 0, count = 0, bought = 0;
    list.innerHTML = shop.map((g) => {
      const items = g.items.filter((it) => filter === "all" || it.p === filter);
      if (!items.length) return "";
      const rows = items.map((it) => {
        count++;
        if (done.has(it.id)) bought++;
        min += it.price[0] * it.qty; max += it.price[1] * it.qty;
        const links = it.s.map((s) => `<a href="${storeUrl[s](it.q)}" target="_blank" rel="noopener">${storeName[s]} ↗</a>`).join("");
        return `<div class="item ${done.has(it.id) ? "done" : ""}">
          <input type="checkbox" data-id="${it.id}" ${done.has(it.id) ? "checked" : ""} aria-label="Marcar ${it.name} como comprado">
          <div>
            <div class="item-name">${it.name}<span class="badge ${it.p}">${it.p}</span></div>
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
  renderShop();

  /* ---------- passo a passo ---------- */
  const steps = [
    { t: "Confirmar medidas e comprar", s: "Fase 0 · antes de tudo", li: [
      "Medir a largura da janela e a largura do rack e atualizar as pendências.",
      "Testar a internet no lugar do rack com o celular (fast.com). Filmes 4K pedem pelo menos 25 Mbps estáveis; remuxes 4K do Stremio podem pedir mais de 80 Mbps.",
      "Comprar primeiro os itens importados (splitter, controlador e fitas), que demoram mais para chegar.",
      "Com a TV em mãos, medir a traseira e definir o caminho da fita, a 3–4 cm da borda."
    ], c: "Todos os itens essenciais marcados na lista de compras." },
    { t: "Obra", s: "Fase 1 · pedreiro e eletricista", li: [
      "Remover o painel de madeira e consertar o reboco danificado.",
      "Abrir os rasgos e instalar caixas e eletrodutos conforme a seção Obra.",
      "Passar o arame-guia em todos os eletrodutos e testar a passagem com um conector HDMI real.",
      "Instalar as tomadas atrás da TV e no rack (eletricista, circuito de 127/220 V separado da baixa tensão).",
      "Embutir os perfis das colunas, colar a moldura do teto e pintar tudo de branco fosco."
    ], c: "Todos os eletrodutos passam o arame-guia e as tomadas funcionam." },
    { t: "TV, HDMI e som", s: "Fase 2 · imagem perfeita antes do ambilight", li: [
      "Instalar o suporte com 5–8 cm de afastamento e a TV com o centro a ~1,05–1,15 m do chão.",
      "Ligar Fire TV e PS5 no switch HDMI, o switch na entrada do splitter e a saída 1 do splitter na TV.",
      "Ligar a porta HDMI eARC da TV na entrada HDMI ARC (TV) da JBL Bar 5.1.",
      "No splitter, escolher o modo de EDID que copia a TV (saída 1). Na TV, ativar o sinal HDMI aprimorado (Input Signal Plus) nessa porta.",
      "Fire TV: resolução automática e faixa dinâmica adaptativa. PS5: 4K 60 Hz com HDR e rodar o ajuste de HDR do sistema."
    ], c: "Netflix em 4K HDR mostra o selo HDR na TV, o PS5 mostra 4K HDR e o som sai pela soundbar." },
    { t: "Rede e Raspberry Pi", s: "Fase 3 · cérebro do sistema", li: [
      "Gravar o Raspberry Pi OS Lite (64 bits) no cartão com o Raspberry Pi Imager, ativando SSH e definindo o nome \"ambilight\".",
      "Ligar o Deco X60 da sala no switch de rede e o Pi no switch.",
      "No app Deco, reservar IP fixo para o Pi e, depois, para o controlador WLED.",
      "Instalar o HyperHDR seguindo o guia oficial em hyperhdr.eu e abrir o painel em http://ambilight.local:8090.",
      "Ligar a saída 2 do splitter na placa de captura e a placa numa porta USB 3.0 (azul) do Pi."
    ], c: "A pré-visualização do HyperHDR mostra a imagem do Fire TV." },
    { t: "Montagem dos LEDs", s: "Fase 4 · solda e instalação", li: [
      "Na bancada, soldar os fios de entrada de cada trecho (V+, GND e dados; BI ligado ao GND no início) e isolar com termo-retrátil.",
      "Testar cada trecho ligado ao controlador, antes de colar na parede ou na TV.",
      "Instalar a fita da TV com fita VHB, as colunas nos perfis, o teto na moldura e a fita sob o rack.",
      "Passar energia e dados pelos eletrodutos até o rack. Montar fusíveis, Wagos e o GND comum entre as duas fontes e o controlador.",
      "Com tudo desligado da tomada, conferir com o multímetro que não há curto entre V+ e GND em nenhum trecho.",
      "Ligar e medir a tensão no fim de cada trecho com branco (com limite de corrente ativo): deve ficar acima de ~11 V."
    ], c: "Todas as zonas acendem por inteiro com um efeito de teste do WLED." },
    { t: "WLED", s: "Fase 5 · controlador", li: [
      "Ligar o controlador no switch de rede e encontrá-lo pelo app WLED (botão +, descobrir dispositivos).",
      "Em LED Preferences: tipo WS281x, quantidade de LEDs de cada saída e limite de corrente.",
      "Conferir a ordem das cores: escolher vermelho puro e ver se a fita fica vermelha. Se não, trocar a ordem (GRB, RGB…).",
      "Ativar a recepção em tempo real (DDP/E1.31) e salvar."
    ], c: "Vermelho, verde, azul e branco aparecem corretos em todas as zonas." },
    { t: "HyperHDR", s: "Fase 6 · sincronia com a imagem", li: [
      "Adicionar o dispositivo de LED WLED com o IP do controlador e 862 LEDs.",
      "No editor de layout, posicionar os LEDs: zona 1 nas bordas, colunas nas laterais, teto no topo, rack na base. Corrigir o sentido de cada trecho.",
      "Ativar a correção de HDR e rodar a calibração automática da LUT para a placa de captura.",
      "Ativar detecção de barras pretas, detecção de sinal e suavização (~100 ms para filmes)."
    ], c: "Em vídeos de teste de ambilight no YouTube, cada zona acompanha a região certa da imagem." },
    { t: "Ajuste fino", s: "Fase 7 · na sala escura", li: [
      "Calibrar o branco: tela branca na TV e ajuste no HyperHDR até a luz ficar com o mesmo tom.",
      "Equilibrar o brilho para as colunas e o teto não ofuscarem a tela. O ambilight deve complementar a imagem, não competir com ela.",
      "Testar atraso com vídeos de flashes. Se a luz parecer atrasada, reduzir a suavização.",
      "Stremio: testar um filme com áudio DTS. Se ficar sem som, usar um player externo (Just Player ou VLC).",
      "Posicionar as caixas surround da JBL Bar 5.1 atrás ou ao lado do sofá, na altura dos ouvidos."
    ], c: "Uma sessão de filme inteira, sem travadas, com cores coerentes e som surround." }
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
