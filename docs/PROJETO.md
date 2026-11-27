# Projeto Ambilight · Sala de cinema — documento de passagem

Este arquivo guarda tudo o que foi decidido até agora, para continuar o projeto em outra conversa sem perder contexto.

- Site publicado: https://leocadiorezende.github.io/ambilight/
- Repositório: https://github.com/leocadiorezende/ambilight (branch `site-ambilight`, que é a branch padrão e a fonte do GitHub Pages)
- Idioma: tudo em português do Brasil. O usuário é leigo em eletrônica e quer explicações simples, com imagens e animações.

## Como o usuário gosta de trabalhar

- Conversar antes de mudar coisas grandes. Quando ele diz "só me responde, não muda nada", não mexer no site.
- Sempre oferecer **opções** (ex.: com rack e sem rack) em vez de escolher por ele e remover a alternativa.
- Explicar com desenhos, simulações e exemplos; ele não entende cortes técnicos sozinhos.
- Compras no Brasil (Mercado Livre, Amazon BR; AliExpress para importados).
- Regra principal: **nenhuma luz direta no rosto de ninguém**. Só luz rebatida; o LED nunca pode aparecer.
- Foco no filme: as luzes são um "plus", não podem atrapalhar a imagem nem refletir na tela.

## A sala (medidas do usuário)

- Sala 5,00 × 3,00 m, pé-direito 2,80 m.
- Parede 1 (TV), 5,00 m: sem janela nem porta. Rack de 2,20 × 0,37 m, 46 cm de altura, centralizado (1,40 m de cada lado), com base recuada de mais de 4 cm.
- Parede 2 (direita, 3,00 m): porta de 94 × 210 cm (com batente), começa a 10 cm do canto da parede da TV. **A dobradiça fica do lado do canto e a porta abre girando em direção à parede da TV** (aberta, fica paralela à parede da TV, ~14 cm à frente dela).
- Parede 3 (fundo, 5,00 m): janela 150 × 111 cm, começa a 1,20 m do canto com a parede 2, base a 95 cm. O sofá ocupa a parede 3 inteira.
- Parede 4 (esquerda, 3,00 m): janela 150 × 110 cm, começa a 1,08 m do canto da parede da TV, base a 95 cm. Ar-condicionado de 1,06 m, começa a 92 cm do canto da parede da TV, base a 2,50 m do chão.
- TV até o encosto do sofá: 2,50 m (olhos a ~2,35 m). Parede branca. As duas janelas precisam de cortina blackout (a de trás reflete na tela).
- A casa é do usuário; a reforma é simples. Ele **não** quer passar cabo de rede do roteador até a sala.

## Equipamentos

- TV: **Samsung S85H 55" OLED (2026)** (ele cogitou 65"; a 55" é a escolha atual).
- Fonte de vídeo: **Fire TV Stick 4K Max (já tem)**. Netflix, Prime e muito Stremio. Também vai usar **PS5** (jogos de aventura; 4K 60 Hz com ambilight está ok).
- Som: **JBL Bar 5.1 Surround** (Bar 5.1 CNTR + Bar 5.1 SUB). Barra única, **sem caixas traseiras destacáveis**. 325 W RMS (175 barra + 150 sub de 10"). Formatos: MP3, WAV, **Dolby Digital** (sem DTS, sem TrueHD/Atmos). Ligação com a TV por **HDMI ARC (não eARC)**. Tem entrada HDMI e óptica (não usadas). **Vem com suporte de parede.** Barra 101,8 × 5,8 × 10 cm; sub 30,5 × 44 × 30,5 cm.
- Rede: TP-Link Deco X60 (mesh). O Deco da sala é ligado sem fio ao principal.

## Arquitetura do sistema (decidida)

```
Fire TV + PS5 → switch HDMI 3×1 (4K60 HDR) → splitter HDMI 1×2 com downscale (EDID copiando da TV)
   ├─ saída 1 (4K HDR original) → TV
   └─ saída 2 (1080p) → placa de captura USB MS2130 → Raspberry Pi 5 com HyperHDR
                                                    → switch de rede gigabit local → controlador WLED (Ethernet, 4 saídas) → fitas
TV (eARC) → cabo HDMI → JBL Bar 5.1 Surround (HDMI ARC) → subwoofer sem fio
```

- Fitas WS2815 12 V, 60 LEDs/m, IP30. Controlador Gledopto com ESP32, Ethernet e 4 saídas (WLED de fábrica). HyperHDR envia por DDP.
- O tráfego das luzes fica no switch local; o Deco sem fio só leva internet.
- Lâmpadas inteligentes (Hue, WiZ, AmbiScape da Philips) foram descartadas: atrasam ~0,5 s.

## Versão escolhida: "Parede da TV"

- **Halo atrás da TV** + **quadro de ripas nos 4 cantos da parede da TV**. Sem luz no teto, sem colunas, nada nas paredes laterais nem atrás do sofá (refletiria na tela).
- **A ripa:** tábua de **11 cm** (MDF/madeira pintada de branco fosco) presa **no canto** da parede da TV (junto ao teto, junto ao chão e nos dois cantos laterais), a **5 cm** da parede da TV. A própria parede lateral/teto/chão fecha o outro lado. **Sem espaçador.**
- **A fita fica atrás da tábua, encostada na madeira (~1 cm), apontando ao longo da parede** (em direção à TV). Vai colada numa **cantoneira de alumínio 1 × 1 cm parafusada nas costas da tábua** (nada colado na tinta). O usuário **não** quer a fita virada para a parede.
- Visibilidade calculada (tábua 11, fenda 5, fita a 1 cm): laterais só aparecem para quem está a menos de ~55 cm da parede da TV; rodapé ~20 cm; tábua de cima ~16 cm. Do sofá e da porta, nunca. Fórmula: escondido se `c·(L − p) / (D − (g − c)) < w − p`.
- A porta funciona com a ripa no canto (tábua ocupa 6,5 cm; guarnição da porta em 10 cm). No filme a porta fica fechada. Prendedor de porta no chão.
- Paredes precisam de massa corrida bem lixada + tinta fosca (luz rasante mostra imperfeições).
- Fazer uma **peça de teste de 50 cm** antes da parede toda.

### Com rack × sem rack (o usuário quer as duas opções)

| | Com rack | Sem rack |
|---|---|---|
| Soundbar | Em cima do rack | Na parede, embaixo da TV (suporte incluso), ~12 cm abaixo da TV |
| Rodapé de luz | 2 pedaços de 1,40 m; fita no recuo da base do rack iluminando o chão | 5,00 m inteiro |
| Equipamentos | Dentro do rack | Opções: B nicho atrás da TV (~40 × 30 × 8 cm ventilado) + PS5 em prateleira/móvel lateral; C móvel pequeno na lateral; D outro cômodo |
| Subwoofer | Ao lado do rack | Num canto perto do sofá |

### Zonas e LEDs (55")

| Zona | Comprimento | LEDs | Saída |
|---|---|---|---|
| Atrás da TV | ~3,52 m | ~211 | 1 |
| Embaixo do rack (só com rack) | ~2,10 m | ~126 | 1, depois da TV |
| Tábua de cima | 5,00 m | 300 | 2 |
| Rodapé | 5,00 m sem rack / 2 × 1,40 m com rack | 300 / 168 | 3 |
| Cantos esquerdo e direito | 2 × 2,58 m | 2 × 155 | 4 (fio passa por dentro da tábua de cima) |
| **Total** | ~18,6 m | **~1.120** | 5 rolos de 5 m |

### Elétrica (versão nova)

- 2 × Mean Well **LRS-200-12** (12 V, 17 A, sem ventoinha).
- Fonte A: TV + rack + cantos (~10,8 m, ~155 W de pico). Fonte B: tábua de cima + rodapé (~10 m, ~144 W de pico). Consumo de referência 14,4 W/m (conferir na ficha da fita).
- Fusível por trecho, GND comum entre fontes e controlador, energia nas duas pontas de cada trecho de 5 m, dados em par trançado.
- Limite de corrente no WLED abaixo da capacidade das fontes.

## Áudio (guia no site, seção Software)

- Stremio: passthrough só AC3; se for um botão só, desligado. Preferir fontes "DD 5.1"/"AC3"/"DD+".
- DTS e TrueHD tocam, mas em **estéreo** (ARC só leva PCM 2 canais). DD+ da Netflix/Prime vira DD 5.1 na TV.
- Fire TV: Som surround "Melhor disponível". TV: formato de saída de áudio digital "Automático", Anynet+ ligado. Splitter: EDID copiando da TV.
- Barra: modo surround (MultiBeam) e calibração automática.

## Estado do site (última atualização)

- Todas as seções estão na versão "Parede da TV", com as opções **com rack** e **sem rack** lado a lado (botões em Zonas, Elétrica, Compras; tabelas em Sala 3D e Obra; notas no Passo a passo).
- Estimativa da lista de compras (sem TV e som, preços não conferidos): **com rack R$ 4.940 – 11.190**; **sem rack R$ 5.240 – 12.120**.
- Calculadora de potência: com rack, fonte A ~155 W e fonte B ~112 W; sem rack, A ~125 W e B ~144 W (2 × LRS-200-12, dentro de 80%).

## Pendências

1. Decidir **com rack** ou **sem rack** (e, sem rack, onde guardar PS5 e eletrônicos: opções B, C ou D).
2. Medir a TV real quando chegar (perímetro da fita).
3. Confirmar disponibilidade no Brasil do splitter com downscale (ex.: ezcoo EZ-SP12H2) e do controlador Gledopto com Ethernet.
4. Testar o Wi-Fi do Deco no lugar dos equipamentos.
5. Fazer a peça de teste da ripa.
6. Preços da lista são estimativas; ainda não foram conferidos nas lojas.

## O site (como está construído)

Site estático, sem build. Publicado pelo GitHub Pages a partir da branch `site-ambilight`.

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Todas as seções |
| `assets/css/style.css` | Visual escuro "tecnológico", animações, versão para impressão |
| `assets/js/main.js` | Menu, calculadoras (ângulo, potência), zonas, lista de compras (array `shop`), passo a passo (array `steps`) |
| `assets/js/scenes.js` | Cenas de vídeo de exemplo e leitura das bordas (`window.Ambi`) |
| `assets/js/sim.js` | Simulador 2D da sala (vista do sofá) |
| `assets/js/room3d.js` | Sala em 3D (Three.js via CDN, ES module) |
| `assets/js/ripa3d.js` | Animações 3D da montagem da ripa e do canto da porta |
| `assets/js/ripacalc.js` | Calculadora de visibilidade da fita |

Seções: Início · Visão geral · Simulador · Sala 3D · A ripa · A sala · Sinal · Zonas de luz · Elétrica · Obra · Compras · Passo a passo · Software · Pendências.

### Cuidados técnicos

- Depois de mudar CSS ou JS, atualizar o `?v=` dos links em `index.html` (cache do navegador já causou texto ilegível).
- Os módulos ES (`room3d.js`, `ripa3d.js`) não carregam por `file://`; para testar localmente, servir por HTTP.
- Testes visuais: Playwright com Chromium headless (`--use-angle=swiftshader` para WebGL). Na sandbox, `/tmp` é apagado entre comandos: instalar e rodar no mesmo comando.
- O evento `tvchange` (tamanho da TV) e `ripachange` (medidas da ripa) sincronizam desenhos e simulações.
