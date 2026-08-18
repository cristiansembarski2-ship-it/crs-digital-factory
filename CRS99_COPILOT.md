# CRS 99 Copilot — especificação operacional e direção de produto

Atualizado em: 2026-08-17 21:45 BRT

## 1. Objetivo

Reduzir ao máximo a barreira humana entre encontrar uma oportunidade no 99Freelas e enviar uma proposta de qualidade, sem criar um robô de spam e sem assumir o clique final de envio.

O Copilot não deve responder apenas:

> “Consigo fazer?”

A pergunta principal passa a ser:

> **“Vale gastar uma candidatura aqui?”**

Fluxo-alvo:

**encontrar projeto → analisar → estimar chance comercial → precificar → gerar proposta → preencher → humano revisa e clica Enviar → acompanhar resultado → aprender com os dados.**

Regra permanente:

**Nunca clicar em “Enviar proposta” sozinho.**

## 2. Estado de versões

A versão atualmente instalada no navegador do proprietário ainda apresenta comportamento simples de aderência única semelhante à linha v0.1.x.

O repositório já contém uma **v0.4.0 experimental**, com análise local, geração de proposta e autopreenchimento por regras. Essa versão não deve ser considerada solução final nem confundida com uma conexão real ao modelo do ChatGPT.

A próxima versão estável deve incorporar a lógica estratégica desta especificação antes de ser tratada como versão de produção.

## 3. Aprendizados de projetos reais

### Busca ativa e candidatura a vagas — Campo Grande/RJ

Leitura operacional:
- boa oportunidade operacional;
- pouca concorrência em um dos anúncios;
- teste de 7 dias com limite de candidaturas pode reduzir risco;
- foram observados anúncios praticamente idênticos publicados por clientes diferentes.

Aprendizado de produto:
- detectar projetos duplicados ou muito semelhantes;
- similaridade alta pode indicar agência, republicação, spam ou demanda recorrente;
- isso não deve bloquear automaticamente, mas precisa virar sinal de risco.

### Excel para gestão/automação de estoque

Leitura operacional:
- aderência técnica alta;
- capacidade para revisar fórmulas, PROCX/PROCV, ÍNDICE/CORRESP, SOMASES, validações, estoque, automações e dependências entre abas;
- concorrência observada: 25 propostas, inclusive perfis Top Freelancer.

Aprendizado de produto:
- capacidade técnica alta não implica chance comercial alta;
- “25 propostas” sozinho é insuficiente: é preciso entender a qualidade competitiva.

### Correção/revisão de textos em português

Leitura operacional:
- execução muito fácil;
- baixo custo operacional;
- 21 concorrentes;
- volume não informado.

Aprendizado de produto:
- bom candidato oportunista, mas não prioridade;
- volume ausente deve impedir preço fechado definitivo.

### Copywriter para VSLs de 10–15 minutos

Leitura operacional:
- apenas 4 concorrentes;
- possibilidade de recorrência de 3–4 VSLs por semana;
- capacidade técnica boa;
- cliente exige portfólio comprovado com resultados.

Aprendizado de produto:
- risco comercial de credibilidade pode ser maior que o risco técnico;
- nunca inventar cases, clientes ou resultados;
- é permitido criar peças demonstrativas/spec e identificá-las explicitamente como demonstração, nunca como trabalho real.

### Formatação APA para dissertação ESPM

Leitura operacional:
- aderência alta;
- quantidade de páginas e estado do arquivo não informados;
- modelo/regras específicas da ESPM podem afetar trabalho.

Aprendizado de produto:
- não recomendar preço fechado antes de visualizar o documento e o padrão aplicável;
- marcar escopo incompleto e sugerir proposta condicionada à inspeção do arquivo.

## 4. Problema do score atual

Uma única linha como:

> “Aderência local estimada: 3,5/10”

mistura dimensões diferentes e induz decisões ruins.

A próxima versão deve separar, no mínimo:

1. **Aderência técnica** — quanto conseguimos realmente executar com qualidade.
2. **Chance comercial** — probabilidade estimada de ganhar considerando concorrência, idade, qualidade dos concorrentes, propostas promovidas e velocidade de entrada.
3. **Potencial financeiro** — ticket plausível + possibilidade de recorrência.
4. **Esforço estimado** — baixo / médio / alto.
5. **Risco de escopo** — informações faltantes, dependências desconhecidas, chance de o trabalho crescer.
6. **Risco de credibilidade** — experiência, portfólio, localização, histórico ou prova exigida e não comprovável.
7. **Risco/suspeita** — anúncio duplicado, descrição copiada, comportamento estranho ou sinais de baixa confiabilidade.
8. **Automatização possível** — quanto da entrega pode ser executado por IA/código/automação.
9. **Prioridade final** — candidatura prioritária / oportunista / ignorar.

Exemplo de saída desejada:

> Aderência técnica: 9,1/10  
> Chance comercial: 4,3/10  
> Potencial financeiro: 7,5/10  
> Esforço: médio  
> Automação possível: alta  
> Concorrência: 25 propostas  
> Risco: volume não informado  
> **Decisão: candidatura oportunista**

## 5. Fórmula de prioridade

A prioridade não deve ser apenas média aritmética das notas.

Modelo conceitual:

**Prioridade = capacidade de execução × chance de fechamento × valor potencial × recorrência ÷ esforço e risco**

Implementação sugerida para o próximo motor:

- normalizar dimensões positivas em 0–10;
- converter esforço e riscos em penalidades;
- aplicar pesos configuráveis;
- preservar explicabilidade: sempre mostrar por que o projeto subiu ou caiu.

Uma fórmula inicial aceitável para teste:

`priorityRaw = technicalFit * 0.30 + commercialChance * 0.25 + financialPotential * 0.15 + recurrence * 0.10 + automationPotential * 0.10 + recency * 0.10 - scopeRiskPenalty - credibilityRiskPenalty - suspicionPenalty`

A fórmula é provisória e deverá ser calibrada com resultados reais da fila.

## 6. Detecção de projetos duplicados ou semelhantes

Registrar os projetos vistos recentemente e comparar:
- título normalizado;
- descrição normalizada;
- cliente;
- data;
- categoria.

Quando similaridade ultrapassar um limiar alto, mostrar:

> ⚠️ Possível projeto duplicado: 96% semelhante a outro anúncio, publicado por cliente diferente.

A primeira implementação pode combinar:
- similaridade lexical do título;
- similaridade da descrição;
- palavras-chave comuns;
- comprimento relativo do texto.

Não bloquear automaticamente. Apenas elevar `suspicionRisk` e mostrar o anúncio relacionado.

## 7. Análise real de concorrência

Não usar apenas a quantidade total de propostas.

Quando a página permitir leitura, considerar:
- número de propostas;
- Top Freelancer;
- Top Freelancer Plus;
- proposta promovida;
- freelancers novos;
- quantidade de interessados;
- tempo desde publicação;
- velocidade de chegada das propostas.

Exemplo:

25 propostas com vários Top Freelancers deve resultar em chance comercial menor que 25 propostas predominantemente novas/sem destaque.

Registrar um `competitionScore` separado do `commercialChance`.

## 8. Escopo incompleto e preço condicionado

Detectar automaticamente informações ausentes que mudam custo/prazo.

Exemplos:
- revisão: palavras/páginas ausentes;
- APA/ABNT: páginas e estado do arquivo ausentes;
- Excel: arquivo/base atual não fornecida;
- programação: especificação técnica insuficiente;
- vídeo: duração, quantidade ou material bruto ausentes;
- pesquisa/listas: quantidade ou critérios não definidos;
- integração/API: credenciais, endpoints ou documentação ausentes.

Saída esperada:

> ⚠️ Escopo incompleto — não recomendar preço fechado definitivo.

Nesses casos, usar uma destas estratégias:
- faixa de preço;
- preço inicial condicionado à inspeção;
- piloto/primeira etapa;
- pergunta objetiva ao cliente antes de preço definitivo.

## 9. Precificação e prazo automáticos

Ao abrir um projeto, gerar:

- **Faixa recomendada:** R$ X–Y
- **Oferta sugerida:** R$ X
- **Prazo:** X dias úteis
- **Estratégia:** agressiva / normal / premium
- **Preço fechado?:** sim / não
- **Condição:** se houver informação faltante

Prioridade comercial atual:
- conseguir os primeiros trabalhos e avaliações;
- não trabalhar por valor inviável;
- não reduzir preço apenas por ansiedade;
- usar taxa vigente do plano da plataforma quando disponível na configuração.

## 10. Geração automática de proposta

Fluxo desejado:

**abrir projeto → Copilot analisar → mostrar decisão → gerar proposta → abrir formulário → preencher texto + valor + prazo → humano revisa → humano envia.**

A proposta deve:
- citar o problema específico do anúncio;
- explicar brevemente como será entregue;
- delimitar escopo;
- mencionar informação faltante quando afeta preço;
- evitar texto genérico de freelancer;
- evitar contato externo;
- não inventar experiência, clientes, números ou resultados;
- evitar promessas que não conseguimos provar.

O clique final permanece humano.

## 11. Regra permanente de honestidade

Nunca inventar:
- experiência local;
- histórico profissional;
- clientes;
- faturamento;
- resultados de VSL/campanha;
- avaliações;
- certificações;
- cases.

Se o cliente exigir prova que não temos, transformar a fraqueza em abordagem segura:
- teste pequeno;
- amostra curta;
- primeira etapa paga;
- peça demonstrativa/spec;
- transparência sobre o que é demonstração e o que é experiência real.

## 12. Portfólio estratégico

Construir gradualmente ativos demonstrativos para as categorias que aparecem com frequência:

- Excel/planilhas;
- dashboards;
- automações;
- VSL/copywriting;
- revisão textual;
- formatação documental.

Todo ativo criado sem cliente real deve ser rotulado internamente e, quando exibido, como:

**projeto demonstrativo / spec / exemplo técnico**

Nunca atribuir resultados comerciais fictícios.

## 13. Memória e fila de oportunidades

O Copilot deve registrar, por oportunidade:

- URL;
- projectKey/slug;
- título;
- cliente quando visível;
- data/hora de publicação;
- data/hora em que foi visto;
- número de propostas;
- sinais de qualidade da concorrência;
- aderência técnica;
- chance comercial;
- potencial financeiro;
- recorrência;
- esforço;
- risco de escopo;
- risco de credibilidade;
- risco de suspeita;
- automatização possível;
- prioridade final;
- faixa/preço sugerido;
- prazo sugerido;
- estratégia de preço;
- texto de proposta;
- enviada/não enviada;
- promovida ou não;
- aceita/rejeitada/sem resposta;
- valor contratado;
- motivo de perda/ganho quando conhecido.

Objetivo:

Depois de dezenas de candidaturas, descobrir empiricamente quais categorias, preços, horários, concorrências e formatos convertem melhor para a CRS.

## 14. Estados de decisão

### Candidatura prioritária

Usar quando:
- capacidade técnica alta;
- boa automação possível;
- concorrência/recência favoráveis;
- preço viável;
- escopo razoavelmente claro;
- sem risco forte de credibilidade.

### Candidatura oportunista

Usar quando:
- conseguimos executar;
- custo operacional baixo;
- mas concorrência, ticket, escopo ou prova exigida reduz chance/retorno.

### Ignorar

Usar quando:
- trabalho humano contínuo incompatível;
- risco técnico alto;
- escopo explode facilmente;
- credencial obrigatória ausente;
- preço inviável;
- anúncio suspeito em nível relevante;
- chance comercial muito baixa para o esforço.

## 15. Segurança operacional

- não automatizar CAPTCHA;
- não usar credenciais/cookies do 99Freelas fora do navegador;
- não enviar proposta em massa;
- não inserir contato/link externo antes da contratação quando proibido;
- não tirar pagamento da plataforma;
- não enviar automaticamente;
- não inventar qualificações;
- evitar scraping abusivo;
- usar somente dados que a sessão autenticada expõe legitimamente ao usuário.

## 16. Autoridade do status da vaga

Busca pública serve para encontrar candidatos.

A sessão autenticada do 99Freelas é a fonte operacional para disponibilidade real.

Estados como:
- aberto;
- exclusivo;
- fechado;
- em andamento;
- proposta já enviada

devem ser lidos/validados no navegador autenticado sempre que possível.

Com plano Premium ativo, projetos exclusivos deixam de ser bloqueio automático e passam a ser oportunidades potencialmente prioritárias, desde que a conta realmente possa enviar proposta.

## 17. Arquitetura desejada

Curto prazo sem custo adicional:
- extensão local;
- heurísticas transparentes;
- fila local/remota;
- histórico de oportunidades;
- geração e preenchimento automáticos por regras;
- clique final humano.

Evolução posterior, somente se custo adicional for autorizado:

`Extensão → serviço CRS → modelo de IA → análise estruturada → extensão → formulário`

Isso permitiria usar um modelo de linguagem para a análise completa sem depender de screenshot/manual, mas não deve ser ativado com custo pago sem autorização explícita do proprietário.

## 18. Métrica principal do Copilot

Não medir sucesso por:
- número de projetos lidos;
- número de páginas abertas;
- quantidade de propostas geradas.

Medir por funil:

**oportunidades vistas → candidaturas prioritárias identificadas → propostas enviadas → respostas → conversas → contratos → receita líquida → tempo/esforço por contrato.**

Meta do aprendizado:

> descobrir quais tipos de projeto convertem mais para nós e usar esses dados para melhorar o score e reduzir candidaturas desperdiçadas.

## 19. Próxima implementação recomendada

Antes de adicionar mais automações de clique, implementar o motor de decisão vNext nesta ordem:

1. separar os scores;
2. detectar escopo incompleto;
3. classificar risco de credibilidade;
4. melhorar análise de concorrência;
5. memória de oportunidades;
6. detecção de duplicados/similares;
7. faixa/preço/prazo/estratégia;
8. proposta automática baseada na análise;
9. autopreenchimento;
10. aprendizado com aceita/rejeita/perda/ganho.

A extensão deve continuar sendo um **copiloto de decisão e execução**, não um disparador automático de propostas.
