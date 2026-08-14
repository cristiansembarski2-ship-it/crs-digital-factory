# CRS Digital Factory — ferramentas gratuitas e planilhas para produtividade

Repositório central das ferramentas digitais da **CRS Digital**.

**Acesse a fábrica:** https://crs-digital-factory.vercel.app/

## Comece por aqui

- **Modelo Excel grátis (download sem cadastro):** https://crs-digital-factory.vercel.app/modelo-gratis-planilha-cotacao-excel/
- **Comparador de cotação no navegador:** https://crs-digital-factory.vercel.app/mapa-3-cotacoes/
- **Guia de equalização de propostas:** https://crs-digital-factory.vercel.app/guias/equalizacao-de-propostas-fornecedores/
- **Matriz de avaliação de fornecedores:** https://crs-digital-factory.vercel.app/guias/matriz-avaliacao-fornecedores/
- **Mapa 3 Cotações Pro:** https://crs-digital-factory.vercel.app/mapa-3-cotacoes-pro/
- **Painel de Savings de Compras Pro:** https://crs-digital-factory.vercel.app/painel-savings-compras-pro/
- **Guia para calcular savings em compras:** https://crs-digital-factory.vercel.app/guias/como-calcular-savings-em-compras/
- **Guia da planilha de savings no Excel:** https://crs-digital-factory.vercel.app/guias/planilha-de-savings-compras-excel/
- **Guia de dashboard de compras no Excel:** https://crs-digital-factory.vercel.app/guias/dashboard-de-compras-excel/

As ferramentas são voltadas a tarefas práticas: comparar fornecedores, gerar calendários de escala, conferir a estrutura de XML de NF-e/NFC-e e revisar spritesheets para Godot 4. Sempre que possível, o processamento ocorre no próprio navegador.

## Produtos publicados

| Produto | Rota | Finalidade |
|---|---|---|
| LPC FitLab for Godot 4 | `/LPC_FitLab_V1_Completo_GitHub/` | Análise local de spritesheets e exportação base para Godot 4 |
| FiscalSafe XML | `/fiscalsafe/` | Pré-auditoria estrutural local de XML NF-e/NFC-e |
| Plantão.ics | `/Plantao_ICS_V1/` | Geração de calendários de escalas recorrentes |
| Mapa 3 Cotações | `/mapa-3-cotacoes/` | Comparação local de três propostas e exportação CSV |
| Mapa 3 Cotações Pro | `/mapa-3-cotacoes-pro/` | Pacote profissional vendido e entregue automaticamente pela Kiwify |
| Painel de Savings de Compras Pro | `/painel-savings-compras-pro/` | Gestão de iniciativas, metas e savings com entrega automática pela Kiwify |

## Estrutura

- `/`: home e catálogo da fábrica;
- `/apoie/`: página transparente de apoio opcional;
- `/shared/config.js`: marca, contato, apoio, catálogo, checkout, preço e flags de observabilidade;
- `/shared/metrics.js`: carregamento central de Speed Insights e, quando habilitado, Web Analytics;
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

Os botões dos produtos profissionais adicionam apenas parâmetros de campanha aceitos pela Kiwify (`src`, UTMs, `s1` e `s2`). Isso permite identificar a página e o CTA que originaram uma venda sem coletar nome, CPF ou e-mail no site da CRS Digital.

## Fila operacional

Novos produtos são selecionados por demanda, possibilidade de automação, custo de manutenção e potencial de monetização.
