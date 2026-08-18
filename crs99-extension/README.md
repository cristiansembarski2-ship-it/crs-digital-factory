# CRS 99 Copilot — Autopilot interno

Extensão local Chrome/Edge para reduzir o trabalho manual de prospecção e proposta no 99Freelas.

## Estado atual — v0.4.0

A v0.4 adiciona um **Autopilot local sem API paga**.

Fluxo principal:

1. o Radar Autopilot lê a página autenticada de projetos do 99Freelas;
2. ranqueia projetos e prioriza exclusivos quando a conta está Premium;
3. ao clicar em **Preparar proposta**, abre o projeto com `crs99=prepare`;
4. o Autopilot analisa o texto completo do projeto;
5. classifica em `ATACAR`, `REVISAR` ou `PULAR`;
6. identifica o tipo de trabalho (planilha/dados, landing page, pesquisa, apresentação, documento, script, tradução, copy etc.);
7. estima aderência, risco, valor e prazo;
8. gera uma proposta personalizada sem inventar experiência, clientes, portfólio ou resultados;
9. se o projeto passar no corte, abre o formulário de proposta;
10. salva o pacote localmente e preenche automaticamente descrição, valor e prazo quando os campos forem reconhecidos;
11. rola até o botão oficial **Enviar proposta**;
12. o clique final de envio continua manual.

Objetivo operacional: o proprietário deve chegar ao formulário já preenchido e precisar apenas revisar e fazer o clique final.

## Premium

A v0.4 está configurada para a conta Premium usada na operação atual:

- projetos exclusivos são elegíveis e recebem prioridade;
- baixa concorrência e recência recebem bônus;
- projetos enviados, fechados, indisponíveis ou em andamento conhecidos são pulados;
- SDR, atendimento contínuo, follow-up comercial humano, presencial e escopos incompatíveis recebem forte penalização.

## Geração automática de proposta

O motor local possui regras por categoria.

Exemplos:

- Excel/Sheets/CSV/estoque/dashboard/automação;
- pesquisa e coleta de dados públicos;
- landing pages e sites estáticos simples;
- Word/PDF/revisão/formatação;
- PowerPoint/Canva;
- scripts Python/JavaScript;
- tradução PT-BR/espanhol;
- copy prática.

O texto gerado descreve o plano de execução e limites do escopo, sem afirmar experiência ou resultados inexistentes.

Pesquisas com e-mail são tratadas como `e-mail público quando disponível`; não se promete dado que não seja publicamente acessível.

## Segurança

- Manifest V3.
- Content scripts limitados ao 99Freelas.
- Não acessa senha ou cookies diretamente.
- Não tenta contornar CAPTCHA ou bloqueios da plataforma.
- Não envia proposta automaticamente.
- O clique final continua humano.
- Propostas da fila remota continuam bloqueadas se contiverem possível contato externo proibido.
- Projetos detectados como fechados/em andamento são gravados localmente para não reaparecerem no radar.

## Arquivos principais

- `manifest.json`
- `background.js`
- `content.js`
- `status-fix.js`
- `autopilot.js`
- `scanner.js`
- `content.css`
- `scanner.css`

## Instalação/atualização local

1. baixe a versão atual da pasta `crs99-extension`;
2. substitua a pasta local antiga;
3. abra `chrome://extensions`;
4. confirme que **Modo do desenvolvedor** está ativo;
5. clique em **Recarregar** no CRS 99 Copilot; se o caminho da pasta mudou, use **Carregar sem compactação** e selecione a nova pasta;
6. em janela anônima, mantenha **Permitir em modo anônimo** habilitado;
7. abra `https://www.99freelas.com.br/projects` e use o botão **Preparar proposta** no Radar Autopilot.

## Limitação deliberada

A v0.4 não chama uma conversa do ChatGPT diretamente. Ela usa o motor de decisão local criado a partir das regras operacionais da CRS. Uma integração futura com modelo via API pode gerar análise semântica ainda mais flexível, mas exigiria serviço/API separado e custo próprio.

Não transformar em produto público antes de uso interno suficiente e evidência de valor.