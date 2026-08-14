# CRS Digital Factory

Repositório central das ferramentas digitais da **CRS Digital**.

**Produção:** https://crs-digital-factory.vercel.app/

## Produtos publicados

| Produto | Rota | Finalidade |
|---|---|---|
| LPC FitLab for Godot 4 | `/LPC_FitLab_V1_Completo_GitHub/` | Análise local de spritesheets e exportação base para Godot 4 |
| FiscalSafe XML | `/fiscalsafe/` | Pré-auditoria estrutural local de XML NF-e/NFC-e |
| Plantão.ics | `/Plantao_ICS_V1/` | Geração de calendários de escalas recorrentes |
| Mapa 3 Cotações | `/mapa-3-cotacoes/` | Comparação local de três propostas e exportação CSV |

## Estrutura

- `/`: home e catálogo da fábrica;
- `/apoie/`: página transparente de apoio opcional;
- `/shared/config.js`: marca, contato, apoio e catálogo central;
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
- apoio pelo Mercado Pago é opcional e não libera produto premium automaticamente.

## Publicação

A branch de produção é `main`. Cada commit na `main` inicia um deploy automático na Vercel. O workflow `indexnow.yml` lê o sitemap após o deploy e notifica os buscadores participantes sobre todas as URLs.

## Fila operacional

Novos produtos são selecionados por demanda, possibilidade de automação, custo de manutenção e potencial de monetização.
