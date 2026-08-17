# OPERACAO_ATUAL — Compra Sem Achismo / CRS Digital

Atualizado em: **2026-08-16 23:25 BRT**

Este arquivo é a fonte operacional compartilhada entre os chats. Antes de qualquer alteração relevante, ler este arquivo e conferir o estado atual do repositório.

## 1. Objetivo atual

Prioridade absoluta:

**R$0 → primeira venda real → identificar origem → repetir → automatizar → escalar.**

Não considerar como sucesso isolado página criada, commit, impressão, tráfego sem intenção, e-mail enviado ou automação criada.

Sinais prioritários:
1. venda/pagamento;
2. checkout/clique de alta intenção;
3. clique em produto pago ou apoio;
4. uso real de ferramenta;
5. compartilhamento/lead qualificado;
6. visita/impressão.

**Estado confirmado no fechamento deste sprint: nenhuma venda nova confirmada.**

## 2. Fonte de verdade

- Repositório: `cristiansembarski2-ship-it/crs-digital-factory`
- Branch: `main`
- Site: `https://crs-digital-factory.vercel.app/`
- GitHub = fonte de verdade técnica.
- Este arquivo = fonte de verdade operacional.
- Estado recente confirmado prevalece sobre histórico antigo.

## 3. Produtos e monetização atuais

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
- Uso: apoio voluntário/donationware em ferramentas gratuitas.
- Não confundir com checkout dos produtos pagos.
- Em cálculos internos considerar aproximadamente 5% de taxa.

## 4. Funil prioritário

**Descoberta → ferramenta gratuita → resultado útil → CTA contextual → produto/apoio → checkout → pagamento.**

O gargalo continua sendo **aquisição qualificada + conversão**, não falta de produto.

Regra: se faltam usuários, **distribuir antes de construir**.

## 5. Ativos prioritários agora

- Mapa 3 Cotações gratuito;
- Mapa 3 Cotações Pro;
- Calculadora/Diagnóstico de Savings;
- Painel de Savings Pro;
- Plantão.ics;
- FiscalSafe XML, operado pela Operação B;
- demais guias e ferramentas existentes como infraestrutura de descoberta.

Não criar produto novo sem evidência de demanda ou intenção.

## 6. Conversão e tracking

- Checkouts centralizados em `shared/config.js`.
- UTMs/atribuição propagadas até checkout onde a infraestrutura existente permite.
- Comparador gratuito usa o próprio resultado para contextualizar o upgrade.
- Telemetria própria via `/api/track`, sem enviar preços/cotações pessoais.
- Vercel Analytics / Speed Insights presentes no código.
- Compartilhamento reutiliza `shared/share.js` com UTMs.

## 7. Estado do deploy — CORRIGIDO

O antigo bloqueio por `build-rate-limit` **não está mais ativo**.

Status confirmado neste fechamento:

- Plantão.ics — commit `0219e8f6aa9c71ad8728e095705fdde0c950400c` — **Vercel success**.
- Mapa 3 Cotações — commit `baec1770e7f6161a5faa529aaff6c7565b2034f2` — **Vercel success**.

Não fazer novo commit cosmético só porque o deploy está liberado. Próxima mudança deve responder a sinal real de uso, busca ou receita.

## 8. Sprint autônomo 16/08 — mudanças concluídas

### Plantão.ics

Foi feita uma única rodada focada em descoberta, confiança e compartilhamento, sem transformar a ferramenta em sistema de RH.

Estado publicado:
- foco explícito em **escala 12x36, 24x48 e 24x72**;
- posicionamento para Google Calendar / Apple Calendar / Outlook;
- sem cadastro e sem instalar app;
- geração local no navegador;
- CTA voluntário de apoio via Mercado Pago somente após gerar/baixar valor;
- FAQ e conteúdo de apoio para intenção de busca;
- compartilhamento com UTM reutilizando infraestrutura existente;
- tracking de geração/download/clique de apoio sem enviar conteúdo da agenda.

Commit de fechamento desta frente no sprint: `0219e8f6aa9c71ad8728e095705fdde0c950400c`.

### Mapa 3 Cotações gratuito

A entrada da página foi alinhada à linguagem de intenção comercial real, sem alterar o funcionamento do comparador nem o checkout.

Estado publicado:
- reforço de termos como **planilha de cotação de preços**, **comparar 3 fornecedores** e **comparativo de orçamento**;
- preço, frete, prazo, pagamento e qualidade descritos com mais clareza;
- FAQ/conteúdo estruturado para descoberta;
- caminho para Mapa 3 Cotações Pro preservado;
- sem mudança no preço do Pro e sem criar novo produto.

Commit: `baec1770e7f6161a5faa529aaff6c7565b2034f2`.

## 9. Receita e respostas no fechamento do sprint

Verificação no Gmail feita após as mudanças.

Resultado:
- **nenhum pagamento novo confirmado** de Kiwify ou Mercado Pago;
- **nenhuma resposta comercial humana nova** no período final do sprint;
- a busca recente retornou apenas mensagens anteriores/automáticas e não trouxe sinal quente novo.

Não inferir venda por clique, impressão ou e-mail automático.

## 10. Indexação pública no fechamento

Foram pesquisadas consultas públicas específicas para:
- `gerador escala 12x36` + nosso domínio;
- `planilha cotação 3 fornecedores` + nosso domínio;
- variações com `/Plantao_ICS_V1/` e `/mapa-3-cotacoes/`.

**Resultado: nenhuma aparição pública confirmada nessas consultas neste fechamento.**

Isso não significa que as páginas estejam fora do índice definitivamente; significa apenas que ainda não houve evidência pública nas consultas verificadas. Não contar concorrentes nem snippets de terceiros como indexação nossa.

## 11. Aquisição / outbound

Outreach por e-mail foi usado em volume alto no ciclo anterior e acumulou múltiplos bounces.

Estado operacional:
- Compradores Diretos: pausado até liberação segura;
- Aquisição & Follow-up: pausado até liberação segura;
- Follow-up Distribuição: pausado;
- endereços com bounce permanecem em exclusão operacional;
- não reenviar para endereço com bounce sem nova fonte oficial atual.

Existe rotina de liberação que só deve retomar outbound quando o volume dos últimos 7 dias cair e não houver sinal anormal de bounces/segurança.

**Neste sprint nenhum novo cold email foi enviado.**

## 12. TikTok

Conta usada: **`@compra121`**.

Estado:
- conteúdo orgânico existente permanece;
- duas tentativas de Promote foram rejeitadas antes de veicular;
- custo real dessas tentativas = R$0;
- não insistir em Promote sem causa nova e verificável.

**Neste sprint o TikTok Promote não foi alterado.**

## 13. Plantão.ics — modelo econômico atual

Modelo:

**busca/intenção → gerar agenda grátis → baixar `.ics` → apoio voluntário via Mercado Pago.**

Não criar assinatura, app ou sistema completo de equipe sem uso real suficiente.

## 14. Operação B

A Operação B deve continuar independente da Operação A.

Fonte de sincronização: `OPERACAO_PARALELA.md`.

Oportunidade vencedora registrada pela Operação B: **FiscalSafe XML Lite**, em donationware, sem duplicar Compras/TikTok/Plantão.

## 15. Marca e anonimato

Marca pública:
- **Compra Sem Achismo / CRS Digital**

E-mail:
- `comprasemachismo@gmail.com`

Regra:
- não expor nome pessoal do proprietário em páginas, conteúdo ou marketing;
- identidade legal somente quando inevitável em pagamento/conta privada.

## 16. Próximos gatilhos — não trabalhar no vazio

A próxima ação deve ser disparada por pelo menos um destes sinais:

1. **pagamento/venda** → identificar origem imediatamente e repetir o caminho;
2. **resposta humana com intenção** → avançar a conversa;
3. **clique/uso real mensurável** → melhorar apenas o ponto do funil que vazou;
4. **indexação/impressões reais** → otimizar a página/consulta que apareceu;
5. **oportunidade pública recente permitida** → distribuir ferramenta útil, sem spam;
6. **outbound liberado com volume seguro** → retomar baixo volume e personalização;
7. **TikTok orgânico com distribuição real** → estudar e repetir o formato vencedor.

Sem um desses sinais, evitar redesign, nova calculadora, novo produto, novo anúncio pago e nova rodada de cold email.

## 17. Prioridade operacional permanente

1. receita;
2. aquisição qualificada;
3. distribuição;
4. conversão;
5. retenção/compartilhamento;
6. automação;
7. SEO;
8. novos ativos somente quando justificados.

Ciclo:

**ANALISAR → PRIORIZAR → EXECUTAR → MEDIR → CORRIGIR → DISTRIBUIR → REPETIR.**

Próximo marco:

**primeiro usuário desconhecido → ferramenta → intenção → checkout → primeira venda.**

Depois:

**1 venda → 2 → 5 → 10 → automatizar → escalar.**
