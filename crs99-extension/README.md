# CRS 99 Copilot — v1.0.0

Extensão local Chrome/Edge para reduzir atrito ao enviar propostas no 99Freelas.

## Objetivo

Fluxo operacional:

1. abrir `https://www.99freelas.com.br/projects`;
2. a extensão lê apenas os projetos que já estão no DOM da página;
3. injeta **Preparar proposta** junto ao projeto real;
4. o clique abre aquele projeto em nova aba;
5. o ID numérico do projeto é validado;
6. a proposta é gerada e salva em `crs99Plan:<ID>`;
7. o formulário oficial é aberto;
8. detalhes, valor e duração são preenchidos automaticamente;
9. o usuário revisa e faz o clique final em **Enviar proposta**;
10. o ID é salvo como `sent` e a aba original de projetos muda o botão para **Enviada**.

O clique final nunca é automatizado.

## Arquitetura ativa

O `manifest.json` carrega somente três arquivos funcionais:

- `core.js` — ID real, estado local e migração única do estado antigo;
- `projects-flow.js` — botões na página `/projects` e reescaneamento leve do DOM;
- `project-flow.js` — preparação, classificação, preço/prazo, autofill e registro de envio.

Arquivos das versões anteriores permanecem no repositório apenas como histórico e **não são carregados pelo manifest**.

## Estado local

Estados usados:

- `new`
- `prepared`
- `sent`
- `closed`

O ID numérico é a chave principal. Exemplos abaixo representam o mesmo projeto:

- `/project/nome-do-projeto-777011`
- `/project/bid/777011`
- `/p/777011`

Se o ID do plano não for igual ao ID do formulário, o preenchimento é bloqueado.

Também são tratados como proposta já enviada textos como:

- `Melhorar proposta`
- `Editar proposta`
- `Cancelar proposta`
- `Você já enviou uma proposta`
- `Sua proposta foi enviada`

## Velocidade

A v1 não mantém fila flutuante, não consulta dezenas de projetos em segundo plano e não usa polling contínuo.

Na página de projetos existe apenas:

- leitura inicial do DOM;
- reescaneamento manual pelo botão `CRS: reescanear`;
- debounce leve ao rolar a página para capturar projetos carregados depois.

## Propostas

O gerador local cobre planilhas, dados, pesquisa, documentos, apresentações, design simples, sites/landing pages, scripts, tradução, copy, vídeo, social, candidatura a vagas e prospecção/SDR.

Termos de intenção principal têm prioridade. Exemplo: `SDR para captar clientes que querem landing pages` é classificado como prospecção/SDR, não como desenvolvimento de landing page.

Nunca são inventados experiência, portfólio, clientes, resultados, formação, credenciais ou cases.

## Instalação/atualização

1. baixe o ZIP da branch `main`;
2. extraia/substitua a pasta local;
3. abra `chrome://extensions`;
4. ative **Modo do desenvolvedor**;
5. recarregue **CRS 99 Copilot** ou use **Carregar sem compactação** apontando para `crs99-extension`;
6. se usar janela anônima, mantenha **Permitir em modo anônimo** habilitado;
7. abra `https://www.99freelas.com.br/projects`.

## Teste principal

O primeiro teste deve ser feito em um projeto ainda não enviado:

`Preparar proposta → nova aba → projeto correto → formulário correto → detalhes + valor + duração preenchidos`.

Não altere mais a arquitetura antes de observar esse teste real.