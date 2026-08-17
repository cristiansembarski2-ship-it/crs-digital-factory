# CRS 99 Copilot — estado operacional

Atualizado em: 2026-08-17 20:54 BRT

## Objetivo

Reduzir a barreira humana entre uma oportunidade qualificada no 99Freelas e o envio de uma proposta personalizada, sem criar um robô de spam nem assumir o clique final de envio.

Fluxo-alvo:

**Radar Automação B2B → candidato >= 8/10 → pacote gravado na fila CRS → proprietário abre link → extensão valida o estado real dentro da sessão autenticada → extensão preenche proposta/preço/prazo → proprietário revisa e clica Enviar.**

## Implementado — v0.1.1

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

## Teste autenticado concluído

Em 17/08/2026 o proprietário instalou a extensão no Chrome e abriu uma página real do 99Freelas autenticado.

Resultado confirmado visualmente:

- painel CRS 99 Copilot apareceu corretamente;
- projeto foi reconhecido como aberto;
- pacote remoto correto foi encontrado;
- aderência, valor, prazo e risco foram carregados;
- a oportunidade já enviada foi reconhecida como `sent`;
- o botão principal ficou bloqueado para impedir envio duplicado.

Bug visual observado: o título inicial capturado da página podia vir de um elemento `h1` incorreto. Foi criada correção no repositório para priorizar título da fila/slug confiável nas próximas versões locais.

## Radar integrado — regra nova

A automação `Radar Automação B2B` está ativa **a cada 1 hora**.

Motivo: projetos do 99Freelas podem fechar rápido e o índice público mostrou estados contraditórios/desatualizados.

Por isso, o radar NÃO é mais autoridade sobre o status real da vaga.

Fluxo atual:

1. encontrar candidatos recentes, priorizando até 24 horas;
2. exigir aderência >= 8/10;
3. criar proposta personalizada dentro das regras;
4. definir preço, prazo e risco;
5. atualizar `crs99/opportunities.json` com status `candidate`;
6. preservar `sent` e `closed`;
7. nunca afirmar que a vaga está definitivamente aberta apenas pelo índice público;
8. deixar o CRS 99 Copilot, dentro da sessão autenticada, decidir se o projeto pode avançar;
9. não enviar proposta automaticamente.

Se a página real mostrar fechado, exclusivo incompatível ou ausência de fluxo de proposta, o preenchimento deve ser bloqueado.

## Primeiro registro da fila

Projeto de estoque automatizado integrado à entrada e saída:

`https://www.99freelas.com.br/project/planilha-de-controle-de-estoque-automatizada-integrada-a-entrada-e-saida-776483`

Status: `sent`.

Aderência: 9,2/10.

Valor: R$790.

Prazo: 4 dias úteis.

## Falha aprendida

Um segundo projeto de dashboard apareceu como aberto em um índice público, mas a sessão real do proprietário mostrou que já estava fechado.

Conclusão operacional:

**busca pública encontra candidatos; sessão autenticada valida disponibilidade.**

Não repetir recomendação como “aberta” sem validação pelo Copilot.

## Gmail

Verificação em 17/08/2026 não encontrou e-mails recentes do 99Freelas que pudessem funcionar como segunda fonte imediata de vagas.

## Regras de segurança operacional

- não automatizar CAPTCHA;
- não contornar exclusividade da plataforma;
- não usar credenciais/cookies do 99Freelas fora do navegador;
- não enviar proposta em massa;
- não inserir contato ou link externo antes da contratação;
- não tirar pagamento da plataforma;
- não fazer clique final automático na v0.1.

## Próximo estágio — v0.2

Prioridade técnica:

- validar uma oportunidade `candidate` realmente aberta dentro da sessão;
- testar o preenchimento real de proposta + valor + prazo;
- ajustar seletores do formulário autenticado se necessário;
- depois adicionar histórico local e leitura de páginas/listagens para reduzir ainda mais os cliques do proprietário.

Telemetria futura somente de eventos não sensíveis: projeto reconhecido, pacote encontrado, preenchimento iniciado/concluído e campos não encontrados. Nunca coletar senha, cookie, mensagem privada ou conteúdo confidencial do cliente.

## Productização futura

Não vender ainda.

Somente avaliar publicação como produto após uso interno suficiente, propostas reais e evidência de que reduz tempo sem aumentar violações/rejeições. O produto futuro deve ser um copiloto de qualidade, não um disparador automático de propostas.
