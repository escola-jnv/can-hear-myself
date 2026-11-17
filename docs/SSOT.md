# Single Source of Truth

A versão viva deste documento está no Claude Docs ("App de Retorno Ui24R — Single Source of Truth").
Ao tomar uma decisão, registre lá e crie um arquivo em `docs/decisoes/`.

Resumo:
- Servidor local Node.js no PC da igreja; celulares acessam por IP local.
- Front-end HTML/CSS/JS puros, < 50 KB, funciona em celulares antigos.
- Camada de drivers por mesa (Ui24R primeiro; X32/M32 e X Air via OSC; mock para testes).
- Grupos virtuais com movimento relativo em dB; 5 níveis + ajuste fino.
- Presets por pessoa + instrumento + aux.
- Pedido de ajuda com 5 tipos; repertório compartilhado (qualquer um troca a música).
- App Windows com Tauri; servidor Node empacotado (Node SEA) como sidecar.
- Integração com o Proskë (Supabase); stems em Cloudflare R2, cache local, motor de áudio nativo.
