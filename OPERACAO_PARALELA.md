# OPERACAO_PARALELA — Operação B / Novas Fontes de Receita

Atualizado em: 2026-08-16

## 1. Objetivo

Meta desta operação:

**R$0 → receber o primeiro R$1 de uma fonte independente da Operação A → identificar origem → repetir → automatizar → escalar.**

Esta operação não trabalha Compra Sem Achismo, Mapa 3 Cotações, Painel de Savings, TikTok `@compra121`, prospecção de Compras, parceiros de Compras, Plantão.ics ou os checkouts da Kiwify já administrados pela Operação A.

## 2. Oportunidade vencedora

**FiscalSafe XML Lite**

- Rota: `https://crs-digital-factory.vercel.app/fiscalsafe/`
- Problema: pré-conferir lotes de XML de NF-e/NFC-e rapidamente antes de importação, arquivamento ou revisão manual.
- Público: profissionais fiscais, escritórios contábeis, BPO financeiro/fiscal, pequenas empresas e equipes administrativas que recebem pastas de XML.
- Operação: local no navegador; XML não é enviado ao servidor da CRS Digital.
- Monetização inicial: **donationware / apoio opcional** pelo Mercado Pago já existente.
- Link de pagamento: `https://link.mercadopago.com.br/crsdigital`
- Promessa permitida: pré-auditoria estrutural e organização básica do lote.
- Promessa proibida: validação fiscal oficial, conformidade tributária, validação XSD oficial, consulta SEFAZ, assinatura digital ou substituição de contador/software fiscal.

### Por que venceu

A ferramenta já existe, já funciona sem cadastro, já tem CTA de pagamento, não exige nova entrega premium e atende uma rotina recorrente que o mercado demonstra pagar para automatizar.

A menor distância atual até dinheiro é:

**pessoa com pasta de XML → usa FiscalSafe → gera CSV/identifica atenção → recebe pedido de apoio → Mercado Pago.**

Não foi criado produto novo.

## 3. Inventário de oportunidades fora da Operação A

### FiscalSafe XML Lite — vencedor

- Problema resolvido: triagem estrutural local de lotes NF-e/NFC-e, duplicidade por chave, ausência de protocolo/dados básicos e CSV.
- Comprador provável: fiscal/contador/BPO/empresa que trabalha com XML em lote.
- Intenção de compra: média/alta; softwares para XML fiscal têm cobrança recorrente e ferramentas pontuais pagas.
- Urgência: alta em fechamento fiscal, importação e tratamento de lotes; o ambiente NF-e também passa por atualizações frequentes em 2026.
- Concorrência: alta, porém grande parte dos concorrentes vende coleta, armazenamento, API, consulta SEFAZ ou análise tributária mais ampla. O FiscalSafe ocupa uma faixa simples, local e sem cadastro.
- Risco técnico: baixo enquanto a promessa permanecer estrutural.
- Risco jurídico: controlável com disclaimer atual; não vender como auditoria tributária oficial.
- Operação anônima: sim, usando apenas CRS Digital.
- Monetização: imediata via donationware; produto pago futuro somente se houver uso e intenção comprovados.
- Distribuição: página indexável, guia SEO já existente, GitHub, sitemap/IndexNow e comunidades fiscais somente quando regras permitirem.
- Trabalho restante: baixo.

### LPC FitLab for Godot 4 — arquivado

- Problema: validar grade/spritesheet, visualizar frames e exportar base SpriteFrames para Godot 4.
- Público: desenvolvedores indie 2D/Godot e usuários de LPC.
- Há demanda real, inclusive perguntas recentes em fóruns.
- Porém o Godot Asset Library possui vários importadores gratuitos e ferramentas recentes de spritesheet/AnimatedSprite2D; há concorrência gratuita forte e a própria biblioteca apresenta dezenas de ativos relacionados a sprites.
- A versão Pro ainda não existe e o próprio `product.json` define pagamento como não conectado.
- Para monetizar seria necessário criar/entregar Pro ou depender de apoio voluntário em um público acostumado a OSS gratuito.
- Distância até dinheiro maior que FiscalSafe.
- Status: **não desenvolver agora**.

### Página genérica `/apoie/` — rejeitada como fonte independente

- Possui caminho de pagamento, mas não resolve um problema específico nem cria aquisição própria.
- Pode apoiar a infraestrutura geral, mas não é uma oportunidade independente validável.

### Plantão.ics — excluído

- Produto existente, mas explicitamente sob responsabilidade da Operação A.

### Ecossistema de Compras — excluído

- Ferramentas, produtos, parceiros, conteúdo e distribuição de Procurement/Compras permanecem com a Operação A.

## 4. Evidências de mercado — FiscalSafe

Fontes consultadas em 2026-08-16:

1. Portal oficial NF-e — documentos vigentes e schemas:
   - `https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=6WfrpZYE4Ik%3D`
   - `https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=BMPFMBoln3w%3D`
   - O Portal mostrava quase 3 milhões de emissores e dezenas de bilhões de NF-e autorizadas.
   - Em 2026 houve múltiplas atualizações de NTs e schemas, inclusive RTC/IBS-CBS e CNPJ alfanumérico.

2. Fórum Contábeis — discussão de 2026 sobre extração/tratamento em lote:
   - `https://www.contabeis.com.br/forum/tributos-estaduais-municipais/412495/como-extrair-arquivo-xml-e-excel-em-lote-no-emissor-nacional/`
   - Participantes relatam uso de SIEG/NFSeek e alternativas manuais com Excel para fechamento.

3. SIGE Cloud — XML em lote é uma rotina explícita de contabilidade:
   - `https://ajuda.sigecloud.com.br/como-baixar-xml-em-lote-de-nf-e-emitidas-no-sige-cloud/`

4. eNotas — download em lote de XML/Excel para visão do contador:
   - `https://atendimento.enotas.com.br/hc/pt-br/articles/35773346958221--Menu-Empresa-Como-baixar-o-PDF-XML-ou-CSV-das-notas-fiscais-na-eNotas-pela-Vis%C3%A3o-do-Contador`

5. Programador Fiscal — produto pago para importar XML NF-e em lote e organizar em Excel:
   - `https://programadorfiscal.com.br/importe-xml-nfe/`
   - Oferta observada: R$97/mês, além de planos semestral/anual.

6. NFe/CTe Downloader — solução paga para consulta/download em lote e Excel fiscal:
   - `https://www.nfecte-downloader.com.br/`
   - Oferta observada: R$89,90/mês.

7. NuvDFe — gestão de XML fiscal em nuvem:
   - `https://nuvdfe.com.br/`
   - Oferta observada a partir de R$119/mês.

8. TribAPI — validação gratuita de XML individual e serviço pago de auditoria em lote/RTC:
   - `https://tribapi.com.br/`
   - Evidência de que empresas pagam por diagnóstico/auditoria fiscal em escala; escopo muito mais profundo que o FiscalSafe e não deve ser imitado sem implementação técnica correspondente.

Conclusão da validação: **há demanda real e dinheiro circulando em tarefas de XML fiscal em lote.** O FiscalSafe não compete como ERP/consulta SEFAZ; a hipótese é monetizar a utilidade simples e privada de pré-conferência local.

## 5. Evidências de mercado — LPC FitLab

Fontes:

- Sprite Sheet Importer, Godot Asset Library: `https://godotengine.org/asset-library/asset/5205`
- Batch Sheet Importer: `https://godotengine.org/asset-library/asset/4981`
- Importality: `https://godotengine.org/asset-library/asset/2025`
- Pergunta recente no Godot Forum sobre AnimatedSprite2D/spritesheet: `https://forum.godotengine.org/t/how-do-you-create-an-animated-sprite/135404`

Conclusão: dor real, mas oferta gratuita abundante e uma versão paga exigiria construção adicional. **Arquivado.**

## 6. Ranking

Escala 0–10, priorizando menor distância até dinheiro.

| Oportunidade | Demanda | Intenção de pagar | Urgência | Operação anônima | Distribuição | Trabalho restante | Distância até dinheiro | Nota final |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| FiscalSafe XML Lite | 9 | 8 | 8 | 10 | 7 | 9 | 9 | **8,6** |
| LPC FitLab | 7 | 4 | 4 | 10 | 7 | 4 | 4 | **5,7** |
| Apoio genérico | 2 | 2 | 1 | 10 | 3 | 10 | 5 | **4,1** |

`Trabalho restante` e `Distância até dinheiro`: nota maior = situação melhor/mais curta.

## 7. Auditoria técnica do FiscalSafe

Estado confirmado no repositório:

- lê vários XMLs e seleção de pasta no navegador;
- usa `DOMParser` local;
- reconhece `infNFe`;
- extrai modelo, número, série, data, emitente, valor, chave, protocolo e `cStat`;
- marca XML malformado;
- alerta ausência de campos básicos;
- identifica chaves duplicadas dentro do lote;
- filtra resultados;
- exporta CSV;
- demo sintética contém 4 XMLs, sendo 1 OK básico, 1 sem protocolo e 2 duplicados;
- CTA de apoio leva ao Mercado Pago;
- disclaimer delimita corretamente que não é validador fiscal oficial.

Limitações deliberadas:

- não valida XSD oficial;
- não consulta SEFAZ;
- não valida assinatura digital;
- não determina correção tributária IBS/CBS;
- não faz escrituração;
- não envia XML ao servidor.

### Reforma Tributária 2026

O Portal NF-e publicou atualizações de leiaute/regras e schemas em 2026. Isso aumenta a relevância do tema XML, mas **não autoriza o FiscalSafe a prometer validação da RTC**. Qualquer recurso desse tipo só será criado após implementação contra documentação oficial + suíte de testes.

## 8. Monetização escolhida

Modelo: **donationware**.

Motivo:

- entrega já existe;
- custo marginal ~zero;
- não exige conta, licença, suporte ou entrega manual;
- permite validar disposição real de pagamento antes de construir Pro;
- cumpre a meta de primeiro R$1 sem inventar um produto.

Não criar assinatura neste estágio.

## 9. Implementação mínima

Estado inicial já existente:

- oferta gratuita funcional;
- Mercado Pago conectado;
- CTA visível;
- prompt contextual de apoio após ação de valor;
- página em sitemap e guia relacionado já publicado.

Mudanças deste ciclo:

- `OPERACAO_PARALELA.md` criado como fonte de sincronização da Operação B;
- tracking de apoio/ação de valor será reforçado sem coletar conteúdo dos XMLs;
- documentação do FiscalSafe será ajustada para distribuição/uso real, sem ampliar promessa técnica.

## 10. Distribuição

Canais permitidos para esta operação:

1. **GitHub**
   - documentação pública do FiscalSafe;
   - link direto para ferramenta;
   - canal público de feedback no próprio repositório.

2. **Busca orgânica da própria ferramenta**
   - rota já presente no sitemap;
   - guia existente: `/guias/como-conferir-xml-nfe-em-lote/`;
   - deploy na `main` aciona o fluxo já existente de IndexNow.

3. **Comunidades fiscais/contábeis**
   - somente quando houver canal acessível e regras permitirem divulgação útil/transparente;
   - não fazer spam e não entrar em discussão apenas para inserir link.

Canais de Compras/TikTok/prospecção comercial da Operação A não serão usados.

## 11. Medição

Ordem dos sinais:

1. **Pagamento no Mercado Pago**.
2. **Clique de apoio** originado no FiscalSafe.
3. **Ação de valor concluída** — por exemplo exportação do CSV após processamento.
4. **Visita ao `/fiscalsafe/`** com origem/referrer.

Não registrar nomes de arquivos, XML, CNPJ, chave, valor de nota ou conteúdo fiscal na telemetria.

### Regra de decisão

- Vitória imediata: qualquer pagamento atribuível ao FiscalSafe.
- Sinal forte sem venda: 3+ cliques de apoio vindos do FiscalSafe.
- Revisar oferta uma única vez se houver 30+ ações de valor e zero clique de apoio.
- Abandonar a monetização donationware se, após uma revisão de oferta, houver 100+ ações de valor e zero clique de apoio/pagamento.
- Só considerar versão paga/Pro se uso real e intenção de pagamento aparecerem antes.

## 12. Pagamentos

Até o momento deste registro:

**nenhum pagamento novo confirmado pela Operação B.**

Nunca inferir venda por clique.

## 13. Próximos gatilhos

1. Instrumentar apoio e ação de valor de forma identificável como FiscalSafe.
2. Melhorar documentação pública mínima e disparar novo deploy/indexação.
3. Abrir canal de feedback no GitHub sem spam.
4. Observar pagamento → clique → uso → visita nessa ordem.
5. Não construir FiscalSafe Pro antes de sinal real.

## 14. Regra de sincronização

A Operação A deve consultar este arquivo para saber o que a Operação B está executando.

A Operação B deve atualizar este arquivo quando ocorrer:

- mudança da oportunidade vencedora;
- alteração relevante de monetização;
- novo canal de distribuição;
- clique/uso relevante que mude decisão;
- pagamento;
- decisão de continuar, revisar ou abandonar.
