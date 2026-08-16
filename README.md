# CRS Digital Factory — ferramentas gratuitas e planilhas para produtividade

Repositório central das ferramentas digitais da **CRS Digital**.

**Acesse a fábrica:** https://crs-digital-factory.vercel.app/

## Ferramentas gratuitas para Compras

Se você trabalha com cotação, fornecedores, savings ou Procurement, comece pelo hub:

**https://crs-digital-factory.vercel.app/ferramentas-compras/**

Recursos principais:

- **Link de Cotação para Fornecedores:** crie uma RFQ em forma de link, envie o mesmo convite a vários fornecedores e reúna respostas padronizadas no navegador: https://crs-digital-factory.vercel.app/link-cotacao-fornecedores/
- **Biblioteca de modelos de RFQ:** comece por EPI, TI, frete, manutenção, uniformes, limpeza, MRO ou material de escritório e abra o pedido já pré-preenchido: https://crs-digital-factory.vercel.app/modelos-rfq/
- **Desafio 3 Cotações:** descubra se o menor preço realmente é o menor custo e gere um resultado compartilhável: https://crs-digital-factory.vercel.app/desafio-3-cotacoes/
- **Gerador de RFQ:** transforme uma necessidade em pedido de cotação padronizado: https://crs-digital-factory.vercel.app/gerador-rfq/
- **Calculadora de custo oculto:** some frete, retrabalho, atraso e outros custos estimáveis: https://crs-digital-factory.vercel.app/calculadora-custo-oculto-fornecedor/
- **Calculadora de savings:** estime saving absoluto e percentual: https://crs-digital-factory.vercel.app/calculadora-savings/
- **Diagnóstico de Savings:** avalie baseline, evidência, reconhecimento, metas e fechamento: https://crs-digital-factory.vercel.app/diagnostico-savings-compras/
- **Gerador de justificativa de fornecedor:** crie um texto-base para revisar e registrar a decisão: https://crs-digital-factory.vercel.app/gerador-justificativa-fornecedor/
- **Comparador para incorporar em outros sites:** https://crs-digital-factory.vercel.app/incorporar-comparador/
- **Calculadora de Savings para incorporar:** https://crs-digital-factory.vercel.app/incorporar-calculadora-savings/
- **Modo Creator:** exemplos fictícios, hooks, roteiros e legendas educativas: https://crs-digital-factory.vercel.app/creator-compras/
- **Modelo Excel grátis de cotação:** https://crs-digital-factory.vercel.app/modelo-gratis-planilha-cotacao-excel/

## Para criadores e afiliados

O **Mapa 3 Cotações Pro** é uma planilha profissional para comparação recorrente de fornecedores e possui programa de afiliados.

- **Produto:** https://crs-digital-factory.vercel.app/mapa-3-cotacoes-pro/
- **Kit com hooks, mensagens e roteiros:** https://crs-digital-factory.vercel.app/kit-afiliados-mapa-cotacoes/
- **Entrar no programa de afiliados:** https://dashboard.kiwify.com/join/affiliate/4z9Dnoz4

Os materiais devem ser revisados antes da publicação. Exemplos gerados são identificados como fictícios e não devem ser apresentados como cotações reais.

## Outros recursos em destaque

- **Central de Savings:** https://crs-digital-factory.vercel.app/savings-compras/
- **Painel de Savings de Compras Pro:** https://crs-digital-factory.vercel.app/painel-savings-compras-pro/
- **Guia de equalização de propostas:** https://crs-digital-factory.vercel.app/guias/equalizacao-de-propostas-fornecedores/
- **Matriz de avaliação de fornecedores:** https://crs-digital-factory.vercel.app/guias/matriz-avaliacao-fornecedores/
- **Guia para calcular savings em compras:** https://crs-digital-factory.vercel.app/guias/como-calcular-savings-em-compras/
- **Guia da planilha de savings no Excel:** https://crs-digital-factory.vercel.app/guias/planilha-de-savings-compras-excel/
- **Guia de dashboard de compras no Excel:** https://crs-digital-factory.vercel.app/guias/dashboard-de-compras-excel/

As ferramentas são voltadas a tarefas práticas. Sempre que possível, o processamento ocorre no próprio navegador.

## Produtos publicados

| Produto | Rota | Finalidade |
|---|---|---|
| LPC FitLab for Godot 4 | `/LPC_FitLab_V1_Completo_GitHub/` | Análise local de spritesheets e exportação base para Godot 4 |
| FiscalSafe XML | `/fiscalsafe/` | Pré-auditoria estrutural local de XML NF-e/NFC-e |
| Plantão.ics | `/Plantao_ICS_V1/` | Geração de calendários de escalas recorrentes |
| Link de Cotação para Fornecedores | `/link-cotacao-fornecedores/` | RFQ em link, resposta padronizada e comparação local de fornecedores |
| Modelos de RFQ | `/modelos-rfq/` | Biblioteca evergreen de pedidos de cotação pré-preenchidos por categoria |
| Desafio 3 Cotações | `/desafio-3-cotacoes/` | Comparação de três propostas com resultado compartilhável |
| Gerador de RFQ | `/gerador-rfq/` | Criação de pedido de cotação padronizado |
| Calculadora de custo oculto | `/calculadora-custo-oculto-fornecedor/` | Estimativa de custos adicionais ao preço do fornecedor |
| Mapa 3 Cotações | `/mapa-3-cotacoes/` | Comparação local de três propostas e exportação CSV |
| Calculadora de Savings | `/calculadora-savings/` | Estimativa local de saving total e percentual de uma negociação |
| Mapa 3 Cotações Pro | `/mapa-3-cotacoes-pro/` | Pacote profissional vendido e entregue automaticamente pela Kiwify |
| Painel de Savings de Compras Pro | `/painel-savings-compras-pro/` | Gestão de iniciativas, metas e savings com entrega automática pela Kiwify |

## Estrutura

- `/`: home e catálogo da fábrica;
- `/ferramentas-compras/`: hub de aquisição para ferramentas de Procurement e fornecedores;
- `/savings-compras/`: hub de aquisição para savings;
- `/link-cotacao-fornecedores/`: fluxo compartilhável comprador → fornecedores → comprador;
- `/modelos-rfq/`: biblioteca de modelos que inicia o fluxo de cotação já pré-preenchido;
- `/apoie/`: página transparente de apoio opcional;
- `/shared/config.js`: marca, contato, apoio, catálogo, checkout, preço e flags de observabilidade;
- `/shared/metrics.js`: carregamento central de Speed Insights, Web Analytics e eventos das ferramentas;
- `/shared/support.js` e `/shared/support.css`: módulo de apoio contextual reutilizável;
- `/guias/`: hub e guias práticos que conectam buscas às ferramentas;
- `/robots.txt` e `/sitemap.xml`: descoberta e indexação;
- pastas de produto: ferramentas estáticas e independentes.

## Princípios

- custo inicial e mensal próximo de zero;
- ferramentas pequenas, úteis e com manutenção leve;
- processamento local sempre que aplicável;
- nenhuma promessa de renda ou resultado garantido;
- nenhum segredo, token, certificado ou credencial no repositório;
- apoio pelo Mercado Pago é opcional e não libera produto premium automaticamente;
- arquivos pagos nunca são publicados neste repositório público.

## Publicação

A branch de produção é `main`. Cada commit na `main` inicia um deploy automático na Vercel. O workflow `indexnow.yml` lê o sitemap após o deploy e notifica os buscadores participantes sobre todas as URLs.

## Atribuição de vendas

Os botões dos produtos profissionais adicionam parâmetros de campanha aceitos pela Kiwify (`src`, UTMs, `s1` e `s2`). Isso permite identificar a página e o CTA que originaram uma venda sem coletar nome, CPF ou e-mail no site da CRS Digital.

## Fila operacional

Novos produtos são selecionados por demanda, possibilidade de automação, custo de manutenção e potencial de monetização.
