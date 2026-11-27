# Projeto Ambilight · Sala de cinema

Site estático com o projeto completo de ambilight e imersão da sala: arquitetura do sinal, zonas de luz, elétrica, obra, lista de compras e passo a passo.

## Resumo do projeto

- **TV:** Samsung S85H 55" OLED (2026)
- **Fontes de vídeo:** Fire TV Stick 4K Max e PS5, via switch HDMI e splitter HDMI com redução de resolução (4K 60 Hz HDR)
- **Processamento:** Raspberry Pi 5 com HyperHDR e placa de captura USB MS2130
- **Luzes:** ~877 LEDs (com TV de 55") WS2815 12 V em 5 zonas (atrás da TV, colunas laterais, teto e rack), 1 controlador WLED com Ethernet
- **Som:** JBL Bar 5.1 ligada por HDMI ARC

## Como ver o site

Abra o `index.html` no navegador. O site não tem etapa de build nem dependências; usa só HTML, CSS e JavaScript.

## Estrutura

```
index.html            conteúdo das seções
assets/css/style.css  visual, animações e versão para impressão
assets/js/main.js     demonstração, calculadoras, lista de compras e passo a passo
```

Para editar a lista de compras ou o passo a passo, altere os arrays `shop` e `steps` em `assets/js/main.js`.

Os preços da lista são estimativas aproximadas para planejamento e precisam ser conferidos nas lojas.
