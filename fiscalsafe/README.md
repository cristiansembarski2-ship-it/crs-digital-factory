# FiscalSafe XML Lite V1.0

Ferramenta estática da CRS Digital para pré-auditoria local de lotes XML de NF-e/NFC-e.

## O que faz
- lê vários XMLs no navegador;
- aceita seleção de pasta;
- processa tudo localmente, sem enviar XMLs ao servidor;
- identifica XML malformado;
- extrai dados básicos de NF-e/NFC-e;
- alerta ausência de chave, protocolo, número, emitente e data;
- identifica chaves duplicadas no lote;
- separa visualmente itens OK e itens com atenção;
- permite filtrar por status;
- gera CSV de conferência;
- inclui demo sintética com 4 XMLs:
  - 1 OK;
  - 1 sem protocolo;
  - 2 duplicados.

## Limites
Não é um validador fiscal oficial e não substitui schema XSD oficial, consulta à SEFAZ,
validação de assinatura digital, escrituração ou revisão contábil/fiscal.

## Como testar
Abra `index.html` e clique em **Carregar demo**.

Resultado esperado:
- Arquivos: 4
- NF-e/NFC-e lidas: 4
- OK básico: 1
- Com atenção: 3
- Duplicidades: 2


## Monetização V1.1
- Valor sugerido para uso profissional/apoio: R$ 29,90.
- Checkout: https://link.mercadopago.com.br/crsdigital
- Taxa operacional considerada: 5%.
