# OPERACAO_PARALELA — Operação B / Novas Fontes de Receita

Atualizado em: 2026-08-16 03:52 BRT

## 1. Objetivo e fronteira

Meta:

**R$0 → primeiro R$1 recebido de uma fonte independente da Operação A → identificar origem → repetir → automatizar → escalar.**

Ficam fora desta operação: Compra Sem Achismo, Mapa 3 Cotações, Painel de Savings, TikTok `@compra121`, prospecção/Gmail de Compras, parceiros/compradores, Plantão.ics, checkouts Kiwify e automações já administradas pela Operação A.

O proprietário não deve precisar copiar histórico entre chats: este arquivo é a fonte de sincronização da Operação B.

## 2. Oportunidade vencedora

**FiscalSafe XML Lite**

- Ferramenta: `https://crs-digital-factory.vercel.app/fiscalsafe/`
- Problema: pré-conferir lotes de XML NF-e/NFC-e antes de importação, arquivamento ou revisão manual.
- Público: fiscal, contabilidade, BPO fiscal/financeiro, pequenas empresas e equipes administrativas que recebem lotes de XML.
- Operação: processamento local no navegador; o XML não é enviado ao servidor da CRS Digital para a análise.
- Monetização inicial: **donationware / apoio opcional**.
- Pagamento: `https://link.mercadopago.com.br/crsdigital`
- Marca pública: CRS Digital.
- Nenhum nome pessoal deve ser usado publicamente.

### Caminho até receita

**pessoa com lote de XML → usa FiscalSafe → encontra exceções/gera CSV → CTA contextual de apoio → Mercado Pago → pagamento.**

Não foi criado produto novo e não existe promessa de benefício premium após o apoio.

## 3. Ranking e oportunidades arquivadas

Escala 0–10, dando peso alto à menor distância até dinheiro.

| Oportunidade | Demanda | Intenção de pagar | Urgência | Anônima | Distribuição | Pouco trabalho restante | Caminho curto até dinheiro | Nota |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| FiscalSafe XML Lite | 9 | 8 | 8 | 10 | 7 | 9 | 9 | **8,6** |
| LPC FitLab for Godot 4 | 7 | 4 | 4 | 10 | 7 | 4 | 4 | **5,7** |
| Apoio genérico `/apoie/` | 2 | 2 | 1 | 10 | 3 | 10 | 5 | **4,1** |

### LPC FitLab — arquivado

- Dor real entre desenvolvedores Godot/2D.
- Há vários importadores e ferramentas gratuitas atuais no ecossistema Godot.
- A versão Pro ainda não existe.
- `product.json` informa pagamento não conectado e proíbe cobrança antes de existir entrega Pro automática/testada.
- Exigiria construção adicional antes de uma venda legítima.
- Decisão: **não desenvolver agora**.

### `/apoie/` genérico — rejeitado como oportunidade independente

Tem pagamento, mas não resolve uma dor própria nem cria aquisição específica. Continua sendo infraestrutura de apoio, não uma nova frente de receita validável.

### Plantão.ics e ecossistema de Compras — excluídos

Pertencem à Operação A.

## 4. Evidências de mercado — FiscalSafe

Pesquisa realizada em 2026-08-16.

### Evidência oficial

Portal NF-e:

- `https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=6WfrpZYE4Ik%3D`
- `https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=BMPFMBoln3w%3D`

O ecossistema NF-e continua massivo e recebeu múltiplas atualizações técnicas em 2026, inclusive notas técnicas/schemas relacionados a RTC/IBS-CBS e CNPJ alfanumérico.

### Evidência de rotina real

- Fórum Contábeis, discussão de 2026 sobre extração XML/Excel em lote: `https://www.contabeis.com.br/forum/tributos-estaduais-municipais/412495/como-extrair-arquivo-xml-e-excel-em-lote-no-emissor-nacional/`
- SIGE Cloud, download XML em lote para rotina contábil: `https://ajuda.sigecloud.com.br/como-baixar-xml-em-lote-de-nf-e-emitidas-no-sige-cloud/`
- eNotas, exportação em lote XML/CSV na visão do contador: `https://atendimento.enotas.com.br/hc/pt-br/articles/35773346958221--Menu-Empresa-Como-baixar-o-PDF-XML-ou-CSV-das-notas-fiscais-na-eNotas-pela-Vis%C3%A3o-do-Contador`

### Evidência de disposição a pagar

Concorrentes/soluções pagas encontrados:

- Programador Fiscal — importação XML NF-e em lote/Excel: `https://programadorfiscal.com.br/importe-xml-nfe/` — oferta observada de R$97/mês.
- NFe/CTe Downloader — lote/consulta/Excel: `https://www.nfecte-downloader.com.br/` — oferta observada de R$89,90/mês.
- NuvDFe — gestão de XML fiscal: `https://nuvdfe.com.br/` — oferta observada a partir de R$119/mês.
- TribAPI — validação/auditoria fiscal mais profunda: `https://tribapi.com.br/` — produto/serviço pago em faixa superior.

Conclusão: **há mercado pago em torno de processamento, organização, validação e auditoria de XML fiscal em escala.** O FiscalSafe não tentará substituir essas plataformas; a hipótese é monetizar uma utilidade simples, local e sem cadastro.

## 5. Auditoria técnica do FiscalSafe

Estado confirmado no código:

- lê vários XMLs e seleção de pasta;
- usa `DOMParser` no navegador;
- reconhece `infNFe`;
- extrai modelo, número, série, emissão, emitente, valor, chave, protocolo e `cStat`;
- detecta XML malformado;
- alerta ausência de campos estruturais básicos;
- identifica chave duplicada dentro do lote;
- filtra resultados;
- exporta CSV;
- demo sintética com 4 XMLs: 1 OK básico, 1 sem protocolo e 2 duplicados;
- CTA de apoio já aponta ao Mercado Pago;
- disclaimer delimita o escopo.

### Promessa permitida

**Pré-auditoria/conferência estrutural local de XML NF-e/NFC-e em lote.**

### Promessas proibidas sem nova implementação/testes

- validação fiscal oficial;
- conformidade tributária;
- validação contra XSD oficial vigente;
- consulta SEFAZ;
- validação de assinatura/certificado;
- decisão de escrituração;
- conformidade IBS/CBS/RTC;
- substituição de contador ou software fiscal.

As mudanças técnicas oficiais de 2026 tornam o tema relevante, mas também aumentam o risco de prometer demais. Nenhuma regra de RTC foi adicionada neste ciclo.

## 6. Monetização escolhida

Modelo: **donationware**.

Motivos:

- a entrega útil já existe;
- custo marginal próximo de zero;
- nenhum cadastro/licença/suporte manual é necessário;
- permite testar pagamento real antes de construir Pro;
- atende diretamente ao critério de primeiro R$1.

Não criar assinatura nem FiscalSafe Pro antes de sinal real de uso/intenção de pagamento.

## 7. Implementação mínima concluída

### Código

1. `shared/support.js`
   - passou a registrar `Support Click` por produto/superfície (`inline`, `dialog`, `chip`);
   - passou a registrar `Tool Value Completed` em ações de valor;
   - envia somente rota, UTMs, hostname do referrer e identificador simples produto/superfície;
   - preserva contagem local;
   - não envia conteúdo do XML.
   - commit: `22a9e797c0374d814f4499f5a65397c201379b48`.

2. `api/track.js`
   - adicionados eventos permitidos `Support Click` e `Tool Value Completed`;
   - sanitização existente preservada;
   - commit: `f63daaf950f117415f50ae10e4a715d0fff04c97`.

3. Teste estático
   - `node --check` executado sobre o JavaScript alterado: sem erro de sintaxe.

### Documentação e oferta

4. `fiscalsafe/README.md`
   - posicionamento focado na dor real;
   - link direto para uso;
   - limites e privacidade reforçados;
   - canal de feedback adicionado;
   - commit: `72d5367b4c1c469312c800f01b7f8808a4bc4515`.

5. `OPERACAO_PARALELA.md`
   - criado no commit `17517353ebe9cfb775f14f243b1cf90f45d482e7`;
   - atualizado neste ciclo para refletir o estado executado.

Nenhum redesign amplo foi feito. A página do produto já tinha ferramenta, CTA, pagamento e disclaimer suficientes para o teste de receita.

## 8. Distribuição colocada em operação

### GitHub

Issue pública criada:

`https://github.com/cristiansembarski2-ship-it/crs-digital-factory/issues/14`

Finalidade: feedback, bugs e casos de uso do FiscalSafe. A issue proíbe anexar XML fiscal real, certificados, CNPJ, chave NF-e ou dados sensíveis e pede reprodução sintética/anonimizada.

### Busca orgânica

Já existiam e foram preservados:

- página `/fiscalsafe/` no sitemap;
- guia `/guias/como-conferir-xml-nfe-em-lote/`;
- CTA do guia para o FiscalSafe;
- workflow IndexNow na `main`.

Após o commit da documentação, o workflow **Notify IndexNow #134** terminou com `success` em 2026-08-16, confirmando execução do fluxo de notificação aos buscadores participantes.

Não foi feito spam em fóruns/comunidades. Publicação externa só ocorrerá quando houver um canal acessível em que a regra permita e a resposta seja realmente útil.

## 9. Medição

Hierarquia de sinais:

1. **pagamento confirmado no Mercado Pago**;
2. **Support Click** originado no FiscalSafe;
3. **Tool Value Completed**, especialmente exportação CSV após processamento;
4. **Page View** qualificada/origem.

Não contar página, commit ou impressão isolada como sucesso comercial.

### Privacidade da telemetria

Não enviar:

- XML;
- nome de arquivo;
- CNPJ/CPF;
- chave NF-e;
- valor de nota;
- emitente/destinatário;
- conteúdo fiscal.

### Regra de decisão

- qualquer pagamento atribuível ao FiscalSafe = primeira vitória;
- 3+ cliques de apoio sem pagamento = sinal forte para investigar checkout/oferta;
- 30+ ações de valor e zero clique de apoio = revisar a oferta **uma vez**;
- após essa revisão, 100+ ações de valor e zero clique/pagamento = abandonar donationware ou mudar modelo baseado em evidência;
- Pro só entra na fila se uso real + intenção de pagamento surgirem primeiro.

## 10. Estado de pagamento

**Nenhum pagamento novo confirmado pela Operação B até esta atualização.**

Nunca inferir pagamento por clique.

## 11. Limitações operacionais atuais

- O repositório confirma os commits na `main` e o workflow IndexNow concluiu com sucesso.
- A API de deployments do GitHub não retornou deployment associado ao commit mais recente.
- A leitura direta do domínio pela ferramenta web desta sessão não conseguiu buscar o site (cache miss), e o conector Vercel já estava documentado na Operação A como indisponível para leitura do projeto.
- Portanto, não registrar “deploy Vercel confirmado por esta operação” sem evidência adicional. A fonte técnica continua sendo a `main` do GitHub.
- Logs de `/api/track` também não estão automaticamente disponíveis nesta sessão; métricas só serão registradas neste arquivo quando houver leitura verificável.

## 12. Próximos gatilhos

1. **Pagamento** → registrar valor/origem em seguida e investigar o caminho que gerou a venda.
2. **Support Click** → identificar origem/campanha e repetir apenas o canal que trouxe intenção.
3. **Uso sem clique** → esperar limiar de 30 ações de valor antes de mexer na oferta.
4. **Feedback/bug real** → corrigir somente se afetar uso, confiança ou pagamento.
5. **Nenhum sinal suficiente** → não polir; manter distribuição de baixo custo e aplicar a regra de abandono.

## 13. Regra permanente de sincronização

A Operação A pode ler este arquivo para coordenar as duas frentes.

A Operação B deve atualizar `OPERACAO_PARALELA.md` quando ocorrer:

- mudança de oportunidade;
- mudança de monetização;
- canal novo realmente usado;
- métrica que altere decisão;
- pagamento;
- decisão de continuar, revisar ou abandonar.
