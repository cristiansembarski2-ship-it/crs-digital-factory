# CRS 99 Copilot — MVP interno

Extensão local Chrome/Edge para reduzir o trabalho manual de prospecção no 99Freelas.

## Objetivo da v0.1

Fluxo:

1. o radar CRS encontra e qualifica uma oportunidade;
2. a oportunidade aprovada é registrada em `crs99/opportunities.json` com URL, aderência, preço, prazo, risco e proposta personalizada;
3. ao abrir a página do projeto, a extensão reconhece a URL;
4. bloqueia preenchimento se detectar projeto fechado;
5. alerta se detectar projeto exclusivo;
6. abre o formulário de proposta quando disponível;
7. preenche proposta, preço e prazo quando encontra os campos;
8. o envio final continua manual.

A extensão **não envia propostas automaticamente** e não deve ser usada para disparo em massa.

## Instalação local no Chrome

1. baixe ou copie a pasta `crs99-extension` para o computador;
2. abra `chrome://extensions`;
3. ative **Modo do desenvolvedor**;
4. clique em **Carregar sem compactação**;
5. selecione a pasta `crs99-extension`;
6. abra um projeto no 99Freelas e confirme que o painel `CRS 99 Copilot` aparece no canto inferior direito.

No Edge, use `edge://extensions` e o equivalente a **Carregar sem compactação**.

## Segurança e regras

- Manifest V3.
- Content script limitado a páginas `/project/*` do 99Freelas.
- A fila remota é somente JSON; nenhum JavaScript remoto é executado.
- Não acessa senha, cookies ou credenciais do 99Freelas.
- Não tenta contornar CAPTCHA, bloqueios ou exclusividade.
- Não clica no botão final de envio.
- Antes de preencher, bloqueia propostas que contenham indícios de e-mail, telefone, WhatsApp, Telegram, Instagram ou links externos.

## Estrutura da fila

Arquivo: `crs99/opportunities.json`.

Campos principais por oportunidade:

- `projectKey`: slug final da URL do projeto;
- `url`: link público;
- `status`: `ready`, `sent`, `closed`, `waiting`;
- `fit`: aderência de 0 a 10;
- `price`: valor proposto;
- `days`: prazo em dias;
- `risk`: principal risco de escopo;
- `proposal`: texto personalizado;
- `allowExclusive`: somente `true` quando a elegibilidade do perfil tiver sido confirmada.

## Próximas versões condicionadas a uso real

- detectar mudanças no HTML do formulário e melhorar seletores;
- histórico local de projetos vistos/preenchidos;
- receber automaticamente novos pacotes gerados pelo Radar Automação B2B;
- acompanhamento de respostas;
- métricas de proposta → resposta → contratação;
- adaptador Workana separado.

Não transformar em produto público antes de uso interno suficiente e evidência de valor.
