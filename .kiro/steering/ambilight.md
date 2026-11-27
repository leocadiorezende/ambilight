# Projeto Ambilight (contexto para o Kiro)

Antes de qualquer tarefa neste repositório, leia o documento de passagem: #[[file:docs/PROJETO.md]]

Resumo:
- Site estático em português (HTML/CSS/JS, sem build), publicado no GitHub Pages pela branch `site-ambilight`: https://leocadiorezende.github.io/ambilight/
- Projeto de ambilight de alta qualidade para uma sala de cinema: TV Samsung S85H 55" OLED, Fire TV 4K Max + PS5 → splitter → captura → Raspberry Pi 5 (HyperHDR) → WLED → fitas WS2815.
- Versão escolhida: "Parede da TV" (halo atrás da TV + quadro de tábuas de 11 cm nos 4 cantos da parede da TV, a 5 cm da parede, fita encostada na tábua apontando ao longo da parede). Sempre mostrar as opções com rack e sem rack.
- O usuário é leigo: explicar de forma simples, com desenhos e simulações, conversar antes de mudanças grandes e nunca remover alternativas sem perguntar.
- Regra do projeto: nenhuma luz direta no rosto; o LED nunca pode ficar visível.
- Ao mudar CSS/JS, atualizar o `?v=` dos links em `index.html`.
