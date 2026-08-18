# FiscalSafe XML Lite

Pré-conferência **local e gratuita** de lotes XML de NF-e/NFC-e pela CRS Digital.

**Usar online:** https://crs-digital-factory.vercel.app/fiscalsafe/?utm_source=github&utm_medium=fiscalsafe_readme&utm_campaign=fiscalsafe

O foco é simples: antes de importar ou revisar uma pasta de XML manualmente, separar rapidamente arquivos básicos OK de itens que merecem atenção — sem enviar os XMLs para um servidor da CRS Digital.

## O que faz

- lê vários XMLs no navegador;
- aceita seleção de pasta;
- processa tudo localmente;
- identifica XML malformado;
- extrai dados básicos de NF-e/NFC-e;
- alerta ausência de chave, protocolo, número, emitente e data;
- identifica chaves duplicadas dentro do lote analisado;
- separa visualmente itens OK e itens com atenção;
- filtra resultados;
- gera CSV de conferência;
- inclui demo sintética para teste sem dados reais.

## Para quem pode ser útil

- profissionais fiscais que recebem pastas de XML;
- escritórios contábeis e BPOs;
- pequenas empresas que precisam conferir um lote antes de encaminhá-lo/importá-lo;
- equipes administrativas que querem transformar uma pasta de NF-e/NFC-e em uma visão rápida de conferência.

## Privacidade

O XML é lido no navegador. A ferramenta não precisa fazer upload do conteúdo fiscal para realizar a análise.

A telemetria operacional da CRS Digital não deve registrar nome de arquivo, XML, CNPJ, chave de NF-e, valor da nota ou conteúdo fiscal. Ela mede somente sinais de funil como visita, ação de valor e clique de apoio.

## Limites importantes

O FiscalSafe é uma **pré-auditoria estrutural**, não um validador fiscal oficial.

Ele não substitui:

- schema XSD oficial vigente;
- consulta de situação na SEFAZ;
- validação de assinatura digital;
- escrituração;
- revisão contábil/fiscal;
- análise de conformidade da Reforma Tributária/IBS/CBS.

Em 2026 os leiautes e schemas oficiais da NF-e/NFC-e continuam recebendo atualizações. Recursos tributários novos só devem entrar aqui quando houver implementação baseada em documentação oficial e testes correspondentes.

## Como testar

Abra a ferramenta e clique em **Carregar demo**.

Resultado esperado da demo atual:

- Arquivos: 4
- NF-e/NFC-e lidas: 4
- OK básico: 1
- Com atenção: 3
- Duplicidades: 2

## Apoio opcional

A ferramenta Lite permanece gratuita.

Se ela economizou trabalho real, existe um apoio voluntário pela CRS Digital:

https://link.mercadopago.com.br/crsdigital

O apoio não libera produto premium nem cria promessa de recompensa.

## Feedback e bugs

Use a issue pública abaixo, **sem anexar XML fiscal real ou dados sensíveis**:

https://github.com/cristiansembarski2-ship-it/crs-digital-factory/issues/14

Para reproduzir bugs, prefira XML sintético ou dados anonimizados.
