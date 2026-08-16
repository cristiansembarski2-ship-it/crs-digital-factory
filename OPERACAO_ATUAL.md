# OPERACAO_ATUAL — Compra Sem Achismo / CRS Digital

Atualizado em: 2026-08-16

Este arquivo é a fonte operacional compartilhada entre o chat central e o Work. Antes de qualquer alteração relevante, leia este arquivo e confirme o estado atual do repositório.

## 1. Objetivo atual

Prioridade absoluta:

**R$0 → primeira venda real → identificar origem → repetir → automatizar → escalar.**

Não considerar como sucesso isolado:
- página criada;
- e-mail enviado;
- post preparado;
- automação criada;
- impressão sem clique;
- tráfego sem sinal comercial.

Sinais prioritários:
1. venda/pagamento;
2. checkout iniciado ou clique de alta intenção;
3. clique em produto pago;
4. uso real de ferramenta;
5. compartilhamento/lead qualificado;
6. visita/impressão.

## 2. Fonte de verdade

- Repositório oficial: `cristiansembarski2-ship-it/crs-digital-factory`
- Branch principal: `main`
- Site principal: `https://crs-digital-factory.vercel.app/`
- O GitHub é a fonte de verdade técnica.
- Este arquivo é a fonte de verdade operacional compartilhada.
- Quando histórico antigo conflitar com código/estado mais recente, prevalece o estado mais recente confirmado.

## 3. Produtos pagos atuais

### Mapa 3 Cotações Pro
- Preço: **R$ 49,90**
- Página: `https://crs-digital-factory.vercel.app/mapa-3-cotacoes-pro/`
- Checkout atual: `https://pay.kiwify.com.br/cNesrrZ`
- Função: comparação profissional de fornecedores, custo total, avaliação qualitativa, ranking, cadastro e histórico.

### Painel de Savings de Compras Pro
- Preço: **R$ 67,00**
- Página: `https://crs-digital-factory.vercel.app/painel-savings-compras-pro/`
- Checkout atual: `https://pay.kiwify.com.br/8PCmyr9`

### Apoio / Mercado Pago
- Link: `https://link.mercadopago.com.br/crsdigital`
- Não confundir com checkout de produto.
- Em cálculos financeiros internos, considerar aproximadamente 5% de taxa quando este link for usado.

## 4. Funil prioritário

**Descoberta → ferramenta gratuita → resultado útil → CTA contextual → produto pago → Kiwify → pagamento.**

O projeto já possui ativos suficientes. O gargalo atual é **aquisição + conversão**, não falta de produto.

Antes de criar nova ferramenta, responder internamente:

> O problema atual é falta de produto ou falta de pessoas usando o que já existe?

Se for falta de usuários, distribuir antes de construir.

## 5. Ativos gratuitos principais

Entre os ativos já existentes estão:
- Mapa 3 Cotações gratuito;
- Desafio 3 Cotações;
- Calculadora de Savings;
- Diagnóstico de Savings;
- Diagnóstico de Maturidade em Compras;
- Gerador de RFQ;
- Link de Cotação para Fornecedores;
- Custo Oculto de Fornecedor;
- Gerador de Proposta Comercial;
- Ferramentas para Fornecedores;
- modelos, planilhas, guias e conteúdos SEO;
- widgets e embeds.

Não criar outro ativo semelhante sem uma justificativa econômica clara.

## 6. Conversão e tracking

- Checkouts centralizados em `shared/config.js`.
- CTAs possuem tracking/UTMs.
- O comparador gratuito foi ajustado para usar o próprio resultado do usuário como contexto de upgrade quando houver divergência entre preço, prazo e nota técnica.
- Existe telemetria própria via `/api/track` para eventos operacionais do funil, sem enviar preços/cotações pessoais do usuário.
- Existe integração com Vercel Web Analytics / Speed Insights no código.
- Limitação atual: o conector Vercel reconhece a equipe, mas retorna 404 para o projeto mesmo usando domínio/slug; leitura automática dos logs pelo conector ainda não está disponível.

## 7. Aquisição e distribuição

Estratégias já em operação:
- SEO;
- Search Console;
- IndexNow;
- parceiros e afiliados;
- creators de Excel/negócios;
- portais de Procurement / Supply Chain;
- consultorias e escolas;
- compradores diretos com e-mail público de Compras/Suprimentos;
- embeds/widgets;
- conteúdo curto reutilizável;
- Canva;
- comunidades/fóruns quando regras permitem;
- outreach por e-mail com baixo volume e personalização.

Regra: **não fazer spam, não inventar métricas, não usar urgência falsa, não violar regras de plataforma.**

## 8. Automações ativas

Estado consolidado mais recente: **4 tarefas ativas**, preservando 1 vaga livre.

1. **Respostas de Afiliados / Receita**
   - monitora venda, pagamento e respostas comerciais relevantes;
   - prioridade máxima para sinais de receita.

2. **Aquisição & Follow-up**
   - combina novos parceiros + follow-up;
   - consulta Gmail antes de enviar;
   - evita duplicatas, opt-outs e bounces;
   - mantém lista de exclusão de endereços que falharam.

3. **Radar de Compras**
   - busca discussões públicas recentes com intenção real;
   - só sinaliza oportunidade quando uma resposta útil e transparente puder mencionar ferramenta gratuita sem violar regras.

4. **Compradores Diretos**
   - roda duas vezes por semana;
   - encontra no máximo 2 empresas brasileiras por execução com canal público atual de Compras/Suprimentos/Procurement;
   - prioriza construção, engenharia, indústria, facilities e operações B2B;
   - oferece primeiro o Mapa 3 Cotações gratuito;
   - usa UTM exclusivo por empresa;
   - consulta Gmail e bounces antes de enviar;
   - etiqueta envios como `Receita/PrimeiraVenda`.

Não preencher a vaga livre restante sem um caso claro de maior impacto em receita/aquisição.

## 9. Bounces / qualidade de prospecção

- Já houve múltiplos e-mails com falha de entrega.
- Notificações devem ser etiquetadas como `Prospeccao/Bounce`.
- Endereços com bounce entram em lista operacional de exclusão e não devem receber novo envio/follow-up sem uma nova fonte oficial e atual.
- Apollo foi testado, porém a busca global por pessoas via API está bloqueada no plano Free e não há contatos salvos úteis. Não pedir upgrade automaticamente.

## 10. Marca, e-mail e anonimato

Marca pública:
- **Compra Sem Achismo / CRS Digital**

E-mail operacional de marca:
- `comprasemachismo@gmail.com`

Regra de anonimato:
- não expor o nome pessoal do proprietário em páginas, conteúdo ou marketing público;
- identidade pode aparecer apenas quando inevitável em sistemas de pagamento/conta privada.

## 11. TikTok

Planejamento inicial:
- nome desejado: `Compra Sem Achismo | Excel`
- usuário prioritário: `@comprasemachismo`

Estado mais recente observado no histórico:
- conta usada: **`@compra121`**
- primeiro vídeo foi preparado com vídeo, capa, legenda, hashtags, música e configurações;
- o proprietário autorizou publicar;
- porém a sessão atingiu limite imediatamente depois.

Status correto:

**PUBLICAÇÃO DO PRIMEIRO TIKTOK NÃO CONFIRMADA.**

Tentativa de verificação pública por busca web ficou bloqueada pelo robots.txt do TikTok. Não interromper o proprietário só por isso; verificar quando houver acesso apropriado à conta ou quando TikTok se tornar o próximo gargalo real.

## 12. Reddit

Houve preparação de post no `r/SideProject` para a Calculadora de Savings.

Status correto:

**PUBLICAÇÃO NÃO CONFIRMADA.**

Não contar como distribuição efetiva até confirmação.

## 13. Search Console

- propriedade verificada por tag HTML;
- sitemap(s) enviados;
- dados iniciais ainda estavam em processamento na última checagem conhecida;
- SEO não deve paralisar a operação enquanto dados amadurecem.

Quando houver dados reais, priorizar:
- consultas com impressões e baixo CTR;
- páginas com crescimento de impressão;
- páginas com tráfego mas pouca conversão;
- termos reais antes de criar novas páginas.

## 14. Regra de operação autônoma

O proprietário é recurso escasso.

**Fim de uma resposta não significa fim do trabalho.** Quando um ciclo terminar, iniciar automaticamente o próximo ciclo de maior impacto. Não esperar `continue`, `pode ir` ou confirmação equivalente.

Não pedir que ele escolha:
- design;
- título;
- CTA;
- cor;
- formato;
- palavra-chave;
- canal;
- pequena decisão técnica;
- alternativa reversível.

Só interromper por barreira humana real, por exemplo:
- CAPTCHA;
- código de autenticação;
- aceite jurídico;
- pagamento;
- criação de conta com dados pessoais;
- confirmação de identidade;
- ação física;
- permissão que só o proprietário pode conceder.

Formato obrigatório quando isso ocorrer:

**AÇÃO NECESSÁRIA DO PROPRIETÁRIO**  
Faça: [uma única ação]  
Depois: diga `pronto`.

## 15. Divisão de trabalho entre chats

### Chat central
Responsável por:
- estratégia;
- priorização;
- receita;
- aquisição;
- decisões;
- automações;
- Gmail;
- mudanças rápidas;
- escolher e executar a próxima ação de maior impacto.

### Work
Responsável por execução pesada quando houver créditos/disponibilidade:
- auditorias completas;
- mudanças em muitos arquivos;
- refactors;
- geração em lote;
- análises longas;
- testes técnicos extensos;
- produção pesada de materiais.

Se Work estiver sem créditos, o chat central assume a operação normalmente.

## 16. Prioridade operacional permanente

Ordem:
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

## 17. Regra final

Não transformar a operação em uma coleção de ativos sem mercado.

O próximo marco é:

**primeiro usuário desconhecido → ferramenta → intenção → checkout → primeira venda.**

Depois disso:

**1 venda → 2 → 5 → 10 → automatizar → escalar.**
