# Regras de negócio

## Níveis
- 5 níveis por grupo/canal (0 a 4), definidos em `config.levels`. Nível 0 = desligado (mute do envio).
- Nenhum envio passa de `config.maxDb`.

## Grupos virtuais
- Um grupo move os envios aux de todos os seus canais juntos.
- O músico também pode ajustar cada peça do grupo (ex.: bumbo, caixa) pelo ajuste por canal.
- Mudar o nível do grupo não apaga o ajuste individual das peças.
- Se um canal atinge `maxDb`: `groupLimitBehavior = "stop"` para o grupo inteiro; `"clamp"` deixa os outros subirem.

## Sessões
- Cada aux só pode ter uma pessoa conectada. Tentativa em aux ocupada retorna aviso.

## Presets ("Salvar minha mix")
- Botão **Salvar** no app do músico. Chave: pessoa + instrumento + aux. Salvos no servidor em `data/presets/`.
- Ao entrar de novo com a mesma pessoa, instrumento e aux, a mix salva volta sozinha.
- Sem preset salvo: tudo começa no **nível 3** (grupos, canais, master, clique e talkback).

## Pedidos de ajuda
1. Não estou me ouvindo
2. Problema no fone
3. Problema no instrumento ou microfone
4. Música ou clique errado
5. Vem cá
- Estados: aberto → visto (técnico toca no pedido) → resolvido (técnico toca em "Resolvido").
- O músico vê "A caminho" no visto, e o botão volta a "Ajuda" no resolvido.

## Repertório
- Cadastro, ordem e troca da música atual ficam no **Painel do Técnico**.
- Trocar a música pede confirmação. Todos os celulares mostram nome, tom e BPM na hora.
- BPM sempre acima de 100: se a fonte der abaixo de 100, dobrar.
- *Pendente:* a decisão original era "qualquer músico troca a música"; hoje o app do músico só mostra a música atual.

## Segurança na rede da igreja
- Os celulares só controlam a **própria mix**.
- Mapeamento de canais, troca de mesa e busca de mesa só funcionam no **PC do servidor**. De outro aparelho o painel mostra tudo, mas não salva.

## Log de atividade
- Toda mudança vira uma linha: horário, pessoa, ação, alvo, valor, aux. Salvo por dia em `data/logs/`.
- Erros do servidor vão para `data/logs/erros.log`.
