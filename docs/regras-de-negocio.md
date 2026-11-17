# Regras de negócio

## Níveis
- 5 níveis por grupo/canal, definidos em `config.levels`. Nível 0 = desligado (mute do envio).
- Nenhum envio passa de `config.maxDb`.

## Grupos virtuais
- Um grupo move os envios aux de todos os seus canais pelo mesmo valor em dB (movimento relativo).
- O balanço interno do grupo é definido pelo técnico (offset em dB por canal).
- Se um canal atinge `maxDb`: `groupLimitBehavior = "stop"` para o grupo inteiro; `"clamp"` deixa os outros subirem.

## Sessões
- Cada aux só pode ter uma pessoa conectada. Tentativa em aux ocupada retorna aviso.

## Presets
- Chave: pessoa + instrumento + aux. Salvos no servidor em `data/presets/`.
- Sem preset salvo: por padrão, ao acessar a mesa, todos os volumes estarão no nível 3.

## Pedidos de ajuda
1. Não estou me ouvindo
2. Problema no fone
3. Problema no instrumento ou microfone
4. Música ou clique errado
5. Outro
- Estados: aberto → visto → resolvido.

## Repertório
- Qualquer músico cadastra e troca a música atual (sem permissões).
- Troca de música pede confirmação no celular.
- BPM sempre acima de 100: se a fonte der abaixo de 100, dobrar.

## Log de atividade
- Toda mudança vira uma linha: horário, pessoa, ação, alvo, valor, aux. Salvo por dia em `data/logs/`.
