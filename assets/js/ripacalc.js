/* ==========================================================
   Calculadora: a fita de LED aparece para quem está na sala?
   Corte da ripa (visto de cima no caso das laterais).
   Fita aponta ao longo da parede da TV, escondida atrás da tábua.

   Medidas (cm):
     w = largura da tábua (do canto até a borda da madeira)
     g = fenda: distância da parede da TV até a tábua
     c = distância da fita até a tábua
     p = distância da fita até o canto (fixo: 1,5 cm)
   Um observador a D da parede da TV e a L do canto (ao longo da parede)
   não vê o LED quando  c·(L − p) / (D − (g − c)) < w − p.
   ========================================================== */
(() => {
  "use strict";
  const root = document.getElementById("ripacalc");
  if (!root) return;
  const $ = (q) => root.querySelector(q);
  const P = 1.5;
  const num = (v, d = 0) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

  const types = {
    lateral: {
      name: "Ripa lateral (cantos)", side: "parede lateral", along: "ao longo da parede da TV",
      worst: 485, // cm: do canto esquerdo até o outro lado da sala
      obs: [
        ["Sentado no sofá, no meio", 250, 235],
        ["Sentado no sofá, na outra ponta", 470, 235],
        ["Em pé, entrando pela porta", 450, 60],
        ["Em pé, a 50 cm da parede da TV, no outro canto", 470, 50],
        ["Em pé, a 30 cm da parede da TV, no outro canto", 470, 30]
      ]
    },
    rodape: {
      name: "Rodapé", side: "chão", along: "para cima",
      worst: 158, // olho em pé a 1,60 m, fita a ~2 cm do chão
      obs: [
        ["Sentado no sofá", 103, 235],
        ["Em pé no meio da sala", 158, 150],
        ["Em pé a 50 cm da parede", 158, 50],
        ["Em pé a 30 cm da parede", 158, 30],
        ["Em pé, encostando o pé no rodapé", 158, 15]
      ]
    },
    topo: {
      name: "Ripa de cima (no teto)", side: "teto", along: "para baixo",
      worst: 120, // teto 2,80 m, olho em pé a 1,60 m
      obs: [
        ["Sentado no sofá", 175, 235],
        ["Em pé no meio da sala", 120, 150],
        ["Em pé a 50 cm da parede", 120, 50],
        ["Em pé a 30 cm da parede", 120, 30],
        ["Em pé, colado na parede", 120, 15]
      ]
    }
  };

  const state = { type: "lateral", w: 11, g: 5, c: 1 };
  const dmin = (L) => (state.g - state.c) + state.c * (L - P) / (state.w - P);

  const svg = $("#rc-svg");
  const S = 9; // px por cm no desenho
  const OX = 30, OY = 34;  // canto: linha lateral em x = OX, parede da TV em y = OY

  const draw = () => {
    const T = types[state.type], { w, g, c } = state;
    const zL = g - c, t = 1.5;
    const X = (cm) => OX + cm * S, Y = (cm) => OY + cm * S;
    // raio limite: passa pela borda interna da tábua (w, g)
    const dx = w - P, dz = c;
    const far = 60;
    const lx = X(P + dx * far), ly = Y(zL + dz * far);
    // observador escolhido
    const o = T.obs[+$("#rc-obs").value];
    const odx = o[1] - P, odz = o[2] - zL;
    const k = 38 / Math.hypot(odx, odz);
    const visible = o[2] < dmin(o[1]);
    // linha até a tábua (se escondido) ou até a borda do desenho (se visível)
    let ex, ey;
    if (!visible) { const s = c / odz; ex = X(P + odx * s); ey = Y(g); }
    else { ex = X(P + odx * k * 2); ey = Y(zL + odz * k * 2); }

    svg.innerHTML = `
      <defs><clipPath id="rc-clip"><rect x="0" y="0" width="380" height="240"/></clipPath></defs>
      <g clip-path="url(#rc-clip)">
        <polygon points="${X(P)},${Y(zL)} ${lx},${ly} 400,${Y(zL)}" class="rc-zone"/>
        <rect x="0" y="0" width="380" height="${OY}" class="rc-wall"/>
        <rect x="0" y="0" width="${OX}" height="240" class="rc-wall"/>
        <rect x="${X(0)}" y="${Y(g)}" width="${w * S}" height="${t * S}" class="rc-board"/>
        <rect x="${X(0.3)}" y="${Y(g - 1)}" width="${0.15 * S}" height="${1 * S}" class="rc-angle"/>
        <rect x="${X(0.3)}" y="${Y(g - 0.15)}" width="${(P - 0.3) * S}" height="${0.15 * S}" class="rc-angle"/>
        <rect x="${X(P) - 3}" y="${Y(zL) - 6}" width="6" height="12" rx="2" class="rc-led"/>
        <line x1="${X(P)}" y1="${Y(zL)}" x2="${lx}" y2="${ly}" class="rc-limit"/>
        <line x1="${X(P)}" y1="${Y(zL)}" x2="${ex}" y2="${ey}" class="rc-ray ${visible ? "bad" : "ok"}"/>
        ${!visible ? `<circle cx="${ex}" cy="${ey}" r="4" class="rc-hit"/>` : ""}
      </g>
      <text x="${OX + 4}" y="${OY - 10}" class="rc-t l">parede da TV</text>
      <text x="${OX - 8}" y="${OY + 110}" class="rc-t" transform="rotate(-90 ${OX - 8} ${OY + 110})">${T.side}</text>
      <text x="${X(w / 2)}" y="${Y(g + t) + 14}" class="rc-t">tábua ${num(w)} cm</text>
      <text x="${X(w) + 8}" y="${Y(g / 2) + 3}" class="rc-t l">fenda ${num(g)} cm</text>
      <text x="${X(P) + 10}" y="${Y(zL) + 4}" class="rc-t l led">fita (${num(c, 1)} cm da tábua)</text>
      <text x="370" y="${Y(zL) + 40}" class="rc-t r zone">zona onde dá para ver a fita</text>
      <text x="370" y="232" class="rc-t r">${visible ? "a linha vermelha passa pela fenda: este observador VÊ a fita" : "a linha verde bate na tábua: este observador NÃO vê a fita"}</text>`;

    $("#rc-min").textContent = `${num(dmin(T.worst), 0)} cm`;
    $("#rc-list").innerHTML = T.obs.map(([n, L, D]) => {
      const ok = D >= dmin(L);
      return `<li class="${ok ? "ok" : "bad"}"><span>${ok ? "✓" : "✗"}</span>${n}<b>${ok ? "não vê" : "vê a fita"}</b></li>`;
    }).join("");
    window.dispatchEvent(new CustomEvent("ripachange", { detail: { ...state } }));
  };

  const bind = (id, key, outFmt) => {
    const el = $(id), out = $(id + "-out");
    el.addEventListener("input", () => { state[key] = +el.value; out.textContent = outFmt(+el.value); draw(); });
    out.textContent = outFmt(+el.value);
  };
  bind("#rc-w", "w", (v) => `${num(v)} cm`);
  bind("#rc-g", "g", (v) => `${num(v)} cm`);
  bind("#rc-c", "c", (v) => `${num(v, 1)} cm`);

  const fillObs = () => {
    $("#rc-obs").innerHTML = types[state.type].obs.map((o, i) => `<option value="${i}">${o[0]}</option>`).join("");
    $("#rc-obs").value = String(types[state.type].obs.length - 2);
  };
  root.querySelectorAll("#rc-types .chip").forEach((b) => b.addEventListener("click", () => {
    root.querySelectorAll("#rc-types .chip").forEach((x) => x.classList.toggle("active", x === b));
    state.type = b.dataset.t; fillObs(); draw();
  }));
  $("#rc-obs").addEventListener("change", draw);
  fillObs(); draw();
})();
