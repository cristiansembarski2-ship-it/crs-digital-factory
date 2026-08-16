# OPERACAO_ATUAL — Compra Sem Achismo / CRS Digital

Atualizado em: **2026-08-16 04:49 BRT**

Este arquivo é a fonte operacional compartilhada entre os chats. Antes de qualquer alteração relevante, ler este arquivo e conferir o estado atual do repositório.

## 1. Objetivo atual

Prioridade absoluta:

**R$0 → primeira venda real → identificar origem → repetir → automatizar → escalar.**

Não considerar como sucesso isolado:
- página criada;
- e-mail enviado;
- post publicado;
- automação criada;
- impressão sem clique;
- tráfego sem sinal comercial.

Sinais prioritários:
1. venda/pagamento;
2. checkout/clique de alta intenção;
3. clique em produto pago;
4. uso real de ferramenta;
5. compartilhamento/lead qualificado;
6. visita/impressão.

**Estado no encerramento deste ciclo: nenhuma venda confirmada.**

## 2. Fonte de verdade

- Repositório: `cristiansembarski2-ship-it/crs-digital-factory`
- Branch: `main`
- Site: `https://crs-digital-factory.vercel.app/`
- GitHub = fonte de verdade técnica.
- Este arquivo = fonte de verdade operacional.
- Estado recente confirmado prevalece sobre histórico antigo.

## 3. Produtos pagos atuais

### Mapa 3 Cotações Pro
- Preço: **R$ 49,90**
- Página: `https://crs-digital-factory.vercel.app/mapa-3-cotacoes-pro/`
- Checkout: `https://pay.kiwify.com.br/cNesrrZ`

### Painel de Savings de Compras Pro
- Preço: **R$ 67,00**
- Página: `https://crs-digital-factory.vercel.app/painel-savings-compras-pro/`
- Checkout: `https://pay.kiwify.com.br/8PCmyr9`

### Apoio / Mercado Pago
- Link: `https://link.mercadopago.com.br/crsdigital`
- Uso atual: apoio/donationware; não confundir com checkout de produto.
- Em cálculos internos considerar aproximadamente 5% de taxa.

## 4. Funil prioritário

**Descoberta → ferramenta gratuita → resultado útil → CTA contextual → produto pago → checkout → pagamento.**

O projeto já possui ativos suficientes. O gargalo continua sendo **aquisição qualificada + conversão**, não falta de produto.

Regra: se o problema for falta de usuários, **distribuir antes de construir**.

## 5. Ativos gratuitos principais

- Mapa 3 Cotações gratuito;
- Calculadora/Diagnóstico de Savings;
- Diagnóstico de Maturidade em Compras;
- Gerador de RFQ;
- Link de Cotação para Fornecedores;
- Custo Oculto de Fornecedor;
- ferramentas para fornecedores;
- guias, planilhas, widgets e embeds;
- `Plantao_ICS_V1` — gerador local de `.ics` para escalas 12x36, 24x48, 24x72 e personalizada.

Não criar ativo semelhante sem justificativa econômica clara.

## 6. Conversão e tracking

- Checkouts centralizados em `shared/config.js`.
- UTMs/atribuição propagadas até checkout.
- Comparador gratuito usa contexto do próprio resultado para CTA de upgrade.
- Telemetria própria via `/api/track`, sem enviar preços/cotações pessoais.
- Vercel Analytics / Speed Insights presentes no código.
- Limitação atual: leitura automática de logs do projeto pelo conector Vercel continua indisponível.

## 7. Estado do deploy

No ciclo atual, o commit mais recente consultado estava com status Vercel **failure por `build-rate-limit`**.

Regra até liberar:
- evitar commits desnecessários;
- não empilhar mudanças cosméticas;
- priorizar ações que funcionem sem novo deploy.

A automação **Plantão Receita** só altera `Plantao_ICS_V1` quando o limite de build liberar.

## 8. Aquisição / outbound

Outreach por e-mail foi usado em volume alto no ciclo anterior e acumulou múltiplos bounces.

Estado atual:
- **Compradores Diretos: pausado**;
- **Aquisição & Follow-up: pausado**;
- **Follow-up Distribuição: pausado**;
- bounces devem permanecer com rótulo `Prospeccao/Bounce` e em exclusão operacional;
- não reenviar para endereço com bounce sem nova fonte oficial atual.

Existe uma tarefa **Liberar Outbound** que somente reativa Compradores Diretos + Aquisição & Follow-up quando:
1. o Gmail cair abaixo de 50 envios nos últimos 7 dias;
2. bounces não estiverem anormais;
3. não existir novo alerta relevante de comprometimento da conta.

Não aumentar volume manualmente antes disso.

## 9. TikTok — estado correto

Conta usada: **`@compra121`**.

Estado confirmado:
- conta pública;
- primeiro vídeo publicado;
- carrossel de 6 fotos publicado e aprovado para exibição orgânica;
- novo vídeo neutro também foi usado em tentativa de Promote;
- conteúdo comercial foi marcado corretamente como **Sua marca**.

### Promote / mídia paga

Foram feitos testes com orçamento baixo, mas **duas tentativas de promoção foram rejeitadas antes de veicular**.

Motivo exibido pelo TikTok:
- **Violação das Diretrizes da comunidade / conteúdo não elegível para Promoção / feed Para Você**.

Consequências:
- **custo real do anúncio = R$0**;
- saldo do Programa de Promoção é devolvido automaticamente;
- não continuar criando novos criativos pagos no escuro neste ciclo;
- TikTok fica apenas orgânico até haver motivo claro para revisitar Promote.

Regra: não gastar mais tempo hoje tentando contornar essa rejeição genérica.

## 10. Plantão.ics — frente paralela de receita

`Plantao_ICS_V1` foi escolhido como segunda frente de monetização independente de Compras/TikTok.

Modelo:
**busca/intenção → gerar agenda grátis → baixar `.ics` → apoio voluntário via Mercado Pago**.

Diferenciação planejada:
- sem cadastro;
- sem instalar app;
- geração local no navegador;
- importação em Google Calendar / Apple Calendar / Outlook;
- foco em 12x36, 24x48, 24x72 e turnos.

Próxima mudança somente quando o Vercel liberar build-rate-limit.

## 11. Automações ativas — estado atual

Há **5 tarefas ativas**; limite atual de tarefas foi atingido.

1. **Respostas de Afiliados / Receita** — horário
   - monitora Gmail por Kiwify, Mercado Pago, venda, pagamento e resposta comercial relevante.

2. **Venda Hoje — Radar** — horário até o fim de hoje
   - busca demanda pública muito recente para Compras e Plantão;
   - só sinaliza oportunidade concreta e compatível com regras da comunidade.

3. **Indexação Pública** — diária
   - monitora aparição real do domínio em buscas para Compras e Plantão.

4. **Plantão Receita** — condition watch diário
   - espera o limite do Vercel liberar;
   - faz uma única melhoria de monetização/descoberta e para sem sinal real.

5. **Liberar Outbound** — diária
   - reativa outbound somente quando volume e segurança permitirem.

### Pausadas
- Search Console Baseline;
- Compradores Diretos;
- Aquisição & Follow-up;
- Follow-up Distribuição.

Não criar nova automação sem antes pausar/substituir uma das atuais.

## 12. Search Console / SEO

- propriedade verificada;
- sitemaps enviados;
- indexação pública ainda não confirmou crescimento útil no último ciclo conhecido;
- SEO não deve paralisar receita/aquisição.

A rotina de captura manual do Search Console foi pausada para preservar slots e evitar exigir ação do proprietário sem necessidade.

## 13. Marca, e-mail e anonimato

Marca pública:
- **Compra Sem Achismo / CRS Digital**

E-mail:
- `comprasemachismo@gmail.com`

Regra:
- não expor nome pessoal do proprietário em páginas, conteúdo ou marketing;
- identidade legal só quando inevitável em pagamento/conta privada.

## 14. Regra de operação autônoma

O proprietário é recurso escasso.

Quando um ciclo terminar, iniciar o próximo ciclo de maior impacto **dentro da mesma execução**, sem pedir microdecisões.

Só interromper por barreira humana real:
- CAPTCHA;
- autenticação/código;
- aceite jurídico;
- pagamento;
- identidade;
- ação física;
- permissão exclusiva do proprietário.

Formato:

**AÇÃO NECESSÁRIA DO PROPRIETÁRIO**  
Faça: [uma única ação]  
Depois: diga `pronto`.

## 15. Divisão de trabalho entre chats

### Chat central / Operação A
- receita atual;
- Gmail;
- Compras;
- TikTok;
- Plantão.ics;
- automações;
- sinais de pagamento e conversão.

### Operação B / outro chat
- procurar e ativar **nova fonte de receita independente**;
- não duplicar Compras, TikTok, Gmail ou Plantão;
- registrar frente paralela em `OPERACAO_PARALELA.md` quando escolher oportunidade vencedora.

## 16. Encerramento deste ciclo

O que **não** fazer ao retomar:
- criar outro anúncio TikTok imediatamente;
- gastar saldo do Promote sem resolver elegibilidade;
- aumentar cold email;
- criar mais uma calculadora/planilha;
- fazer polimento visual sem tráfego;
- repetir buscas genéricas sem sinal novo.

O que deve disparar ação quando retomarmos:
1. **pagamento/venda** → identificar origem e repetir;
2. **resposta humana com intenção** → avançar conversa;
3. **oportunidade pública recente e permitida** → responder/distribuir;
4. **Vercel libera build** → executar uma rodada Plantão Receita;
5. **outbound cai abaixo do limite seguro** → reativar baixo volume;
6. **TikTok orgânico começa a receber distribuição** → analisar formato vencedor antes de produzir mais.

## 17. Prioridade operacional permanente

1. receita;
2. aquisição qualificada;
3. distribuição;
4. conversão;
5. retenção/compartilhamento;
6. automação;
7. SEO;
8. novos ativos só quando justificados.

Ciclo:

**ANALISAR → PRIORIZAR → EXECUTAR → MEDIR → CORRIGIR → DISTRIBUIR → REPETIR.**

Próximo marco:

**primeiro usuário desconhecido → ferramenta → intenção → checkout → primeira venda.**

Depois:

**1 venda → 2 → 5 → 10 → automatizar → escalar.**
