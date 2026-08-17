# CRS 99 Copilot — estado operacional

Atualizado em: 2026-08-17 20:42 BRT

## Objetivo

Reduzir a barreira humana entre uma oportunidade qualificada no 99Freelas e o envio de uma proposta personalizada, sem criar um robô de spam nem assumir o clique final de envio.

Fluxo-alvo:

**Radar Automação B2B → oportunidade >= 8/10 e realmente aberta → pacote gravado na fila CRS → proprietário abre link → extensão valida estado → extensão preenche proposta/preço/prazo → proprietário revisa e clica Enviar.**

## Implementado — v0.1

Pasta da extensão: `crs99-extension/`

Fila: `crs99/opportunities.json`

Recursos:

- Manifest V3;
- roda apenas em páginas `/project/*` do 99Freelas;
- lê a fila JSON da CRS Digital;
- identifica a oportunidade pela URL/slug;
- mostra aderência, preço, prazo e risco;
- heurística local de aderência quando a vaga ainda não está na fila;
- bloqueia preenchimento quando detecta projeto fechado;
- alerta em projeto exclusivo e bloqueia por padrão;
- procura o formulário de proposta;
- preenche proposta, valor e prazo por reconhecimento semântico dos campos;
- bloqueia pacote que contenha possível e-mail, telefone, WhatsApp, Telegram, Instagram ou link externo;
- nunca clica no botão final de envio;
- botão de copiar briefing existe apenas como fallback quando ainda não há pacote na fila.

## Radar integrado

A automação `Radar Automação B2B` foi atualizada para, quando encontrar projeto 99Freelas realmente aberto e aderência >= 8/10:

1. confirmar a página atual;
2. criar proposta personalizada dentro das regras;
3. definir preço, prazo e risco;
4. atualizar `crs99/opportunities.json` com status `ready`;
5. preservar propostas com status `sent`;
6. não enviar proposta automaticamente.

## Primeiro registro da fila

Projeto de estoque automatizado integrado à entrada e saída:

`https://www.99freelas.com.br/project/planilha-de-controle-de-estoque-automatizada-integrada-a-entrada-e-saida-776483`

Status: `sent`.

Aderência: 9,2/10.

Valor: R$790.

Prazo: 4 dias úteis.

## Regras de segurança operacional

- não automatizar CAPTCHA;
- não contornar exclusividade da plataforma;
- não usar credenciais/cookies do 99Freelas fora do navegador;
- não enviar proposta em massa;
- não inserir contato ou link externo antes da contratação;
- não tirar pagamento da plataforma;
- não fazer clique final automático na v0.1.

## Critério para v0.2

Testar a extensão em páginas reais da conta e ajustar os seletores caso o HTML autenticado do formulário tenha nomes diferentes.

Após o primeiro teste funcional, adicionar histórico local e telemetria apenas de eventos não sensíveis: projeto reconhecido, pacote encontrado, preenchimento iniciado/concluído e campos não encontrados. Nunca coletar senha, cookie, mensagem privada ou conteúdo confidencial do cliente.

## Productização futura

Não vender ainda.

Somente avaliar publicação como produto após uso interno suficiente, propostas reais e evidência de que reduz tempo sem aumentar violações/rejeições. O produto futuro deve ser um copiloto de qualidade, não um disparador automático de propostas.
