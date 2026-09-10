# Relatório de Otimização SEO, Performance e CRO — Tenant Flow

**Site:** https://tenantflow.com.br
**Repositório:** `diegoasmar/tenantflow-site` (GitHub Pages, branch `main`)
**Data:** 8 de setembro de 2026
**Escopo:** auditoria técnica + implementação direta no código

---

## 1. Diagnóstico do ponto de partida

O site era uma **landing page única** (`index.html`) mais uma página legal (`seguranca-e-privacidade.html`). Do ponto de vista de busca orgânica, isso significava:

| Problema | Impacto |
|---|---|
| Uma só URL indexável de conteúdo | Impossível ranquear para mais de um tema; toda intenção de busca competia pela mesma página |
| Sem `robots.txt` e sem `sitemap.xml` | Rastreamento dependia só de descoberta por links; nada declarado ao Google |
| Sem `<link rel="canonical">` | Risco de duplicação (com/sem `www`, com parâmetros de campanha) |
| Sem dados estruturados (Schema.org) | Nenhuma chance de rich results, painel de conhecimento ou citação por buscas com IA |
| Sem Open Graph / Twitter Card | Compartilhamento em WhatsApp, LinkedIn e Slack sem título, descrição ou imagem |
| Sem Google Analytics e sem Search Console | Zero medição: impossível saber o que traz lead |
| `<title>` genérico ("Infraestrutura de TI & Microsoft 365") | Não continha os termos comerciais que o cliente digita |
| Folha de fontes bloqueando a renderização | Atraso direto em FCP/LCP |
| Um link quebrado no rodapé (`href="#"` em "Termos de Uso") | Sinal de qualidade negativo e link desperdiçado |
| CTA genérico ("Falar com um especialista") | Menos específico, menos conversão |

**Observação sobre imagens:** o site **não usa nenhuma imagem raster** — todos os ícones e o logotipo são SVG inline, com `width`/`height` explícitos. Não há, portanto, nada a converter para WebP nem `loading="lazy"` a aplicar: em termos de CLS e peso de imagem, o site já estava no melhor cenário possível. Esse item da auditoria foi verificado e não exigiu mudança. As páginas novas seguem a mesma regra (SVG inline dimensionado) e a folha compartilhada aplica `img,svg,video{max-width:100%;height:auto;display:block}` como salvaguarda para qualquer imagem futura.

---

## 2. Arquitetura de páginas criada

Saímos de **2 URLs** para **10 URLs indexáveis**, organizadas em uma hierarquia que o Google consegue interpretar:

```
/                                              (home — comercial, topo)
├── /migracao-microsoft-365/                   (serviço)
├── /suporte-exchange-online/                  (serviço)
├── /sharepoint-e-teams/                       (serviço)
├── /seguranca-e-licenciamento-microsoft-365/  (serviço)
├── /blog/                                     (hub de conteúdo)
│   ├── /blog/migrar-google-workspace-para-microsoft-365/
│   ├── /blog/quanto-custa-microsoft-365-para-empresas/
│   └── /blog/email-caindo-no-spam-spf-dkim-dmarc/
└── /seguranca-e-privacidade.html              (legal)
```

URLs em formato de diretório (`/migracao-microsoft-365/`), sem extensão, curtas e com a palavra-chave principal no slug.

### 2.1 Páginas de serviço (fundo de funil)

Cada uma tem estrutura idêntica de conversão e um H1 único:

| Rota | H1 | Palavras-chave alvo |
|---|---|---|
| `/migracao-microsoft-365/` | Migração para o Microsoft 365 sem parar a sua empresa | migração microsoft 365, migrar e-mail para microsoft 365, empresa de migração m365 |
| `/suporte-exchange-online/` | Suporte e administração de Exchange Online | suporte exchange online, e-mail corporativo caindo no spam, administração de e-mail empresarial |
| `/sharepoint-e-teams/` | SharePoint e Teams organizados para a empresa inteira achar o arquivo | gestão sharepoint, consultoria microsoft teams, migrar servidor de arquivos para sharepoint |
| `/seguranca-e-licenciamento-microsoft-365/` | Menos risco de invasão, menos licença paga à toa | segurança microsoft 365, mfa empresa, revisão de licenças microsoft 365 |

Cada página segue o mesmo padrão de hierarquia semântica:

- **H1** — promessa única, com a palavra-chave em linguagem de dor, não de catálogo
- **H2** — blocos de "quando faz sentido / problemas que resolvemos / diagnóstico"
- **H2 + H3 numerados** — as etapas do projeto (formato que o Google gosta de extrair em snippets de passo a passo)
- **H2** — escopo detalhado em cards ou checklist
- **H2 + FAQ em `<details>`** — 5 perguntas reais por página, com `FAQPage` correspondente
- **H2 "Continue lendo"** — links contextuais internos
- **CTA final** — bloco destacado com "Solicitar Diagnóstico M365"

### 2.2 Blog (topo e meio de funil)

Três artigos completos, escritos para intenção informacional que antecede a compra:

1. **Como migrar do Google Workspace para o Microsoft 365 sem perder e-mail** — captura quem já decidiu trocar e está pesquisando "como fazer". Inclui tabela de prazos por porte de empresa e os cinco erros mais comuns.
2. **Quanto custa o Microsoft 365 para empresas (e onde o dinheiro escapa)** — a busca por preço é a de maior intenção comercial no tema. O artigo compara a lógica dos planos, lista os seis desperdícios de licença mais comuns em tabela e ensina uma auto-auditoria em seis passos.
3. **Por que o e-mail da sua empresa cai no spam (SPF, DKIM e DMARC)** — o problema técnico mais buscado por PMEs brasileiras. Explica cada registro, tabela de políticas DMARC e a ordem segura de correção.

Cada artigo tem `BlogPosting` com `datePublished`/`dateModified`, breadcrumb, FAQ estruturada, bloco "Leia também" e CTA para o serviço correspondente. Os posts foram escritos como **modelo replicável**: para publicar um novo artigo, basta copiar a estrutura de um existente, trocar o conteúdo e adicionar a URL ao `sitemap.xml` e ao índice do blog.

---

## 3. SEO técnico implementado

### 3.1 Title e meta description

Todas as 10 páginas receberam `<title>` e `<meta name="description">` únicos, dentro dos limites de exibição do Google (título ≤ 70 caracteres, descrição ≤ 160), escritos com palavra-chave + benefício + gancho ("Diagnóstico gratuito").

Exemplo da mudança na home:

- **Antes:** `Tenant Flow — Infraestrutura de TI & Microsoft 365`
- **Depois:** `Consultoria e Suporte Microsoft 365 para Empresas | Tenant Flow`

O termo "Infraestrutura de TI" tem volume baixo e intenção difusa; "consultoria/suporte Microsoft 365 para empresas" é exatamente o que um decisor digita quando tem orçamento.

### 3.2 Metadados de indexação e compartilhamento

Adicionados em **todas** as páginas:

- `<link rel="canonical">` absoluto — elimina duplicação por `www`, `http` ou parâmetros de campanha
- `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">` — libera snippet longo e preview grande, o que aumenta CTR na SERP
- Open Graph completo (`og:type`, `og:locale`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`)
- Twitter Card `summary_large_image`
- `<meta name="theme-color">` e `<meta name="author">`

> **Pendência de 1 arquivo:** as tags apontam para `/assets/og-tenant-flow.png` (1200×630) como imagem de compartilhamento. O editor web do GitHub só aceita arquivos de texto, então essa imagem binária precisa ser enviada uma vez pela interface "Add file → Upload files" do repositório. Até lá, o compartilhamento funciona com título e descrição, apenas sem miniatura.

### 3.3 Dados estruturados (Schema.org / JSON-LD)

| Tipo | Onde | Para quê |
|---|---|---|
| `Organization` | todas as páginas | Identidade da marca, logo, e-mail, `knowsAbout` com as tecnologias — base do painel de conhecimento |
| `ProfessionalService` | home | Classifica a empresa como prestadora de serviço, com `areaServed`, `priceRange` e `hasOfferCatalog` listando os 4 serviços |
| `WebSite` | home | Entidade raiz do site |
| `Service` | home + 4 páginas de serviço | Cada serviço com `serviceType`, `provider`, `audience` (BusinessAudience) e `offers` explicando o diagnóstico gratuito |
| `BreadcrumbList` | todas as internas | Faz o Google exibir a trilha em vez da URL crua na SERP |
| `FAQPage` | 4 serviços + 3 artigos | Elegível a rich result de perguntas; também é o formato que motores de busca com IA mais citam |
| `Blog` + `BlogPosting` | índice e artigos | Datas de publicação/atualização, autor, seção e imagem |

Todos os blocos usam `@id` consistente (`https://tenantflow.com.br/#organization`) para que as entidades se referenciem entre si em vez de se duplicarem — é o que permite ao Google montar um grafo único da marca.

### 3.4 robots.txt

Criado do zero, com três decisões deliberadas:

1. **Rastreamento geral liberado** e `Sitemap:` declarado.
2. **Bots de IA explicitamente liberados** (`GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`). Aparecer nas respostas geradas por assistentes hoje vale tanto quanto aparecer na primeira página — e o padrão de muitos sites é bloquear por inércia, o que remove a empresa dessas respostas.
3. **URLs com parâmetro de campanha bloqueadas** (`?utm_`, `?gclid=`, `?fbclid=`) para não gerar versões duplicadas da mesma página no índice.

### 3.5 sitemap.xml

As 10 URLs, com `lastmod`, `changefreq` e `priority` coerentes com a hierarquia (home 1.0 → serviços 0.9 → blog 0.7 → artigos 0.6 → legal 0.3).

### 3.6 favicon.svg

O logotipo passou a existir também como arquivo SVG independente (`/favicon.svg`), usado como ícone pelas páginas internas e referenciado no `logo` do `Organization`. A home mantém os ícones em data-URI já validados anteriormente.

---

## 4. Performance e Core Web Vitals

### 4.1 Fontes deixaram de bloquear a renderização

Antes, em todas as páginas:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:..." rel="stylesheet">
```

Isso é um recurso bloqueante: o navegador não pinta nada até baixar esse CSS de um terceiro. Substituído pelo padrão assíncrono:

```html
<link rel="preload" as="style" href="...">
<link rel="stylesheet" href="..." media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="..."></noscript>
```

O CSS entra como `print` (não bloqueia), vira `all` assim que carrega, e o `<noscript>` garante o fallback. Somado ao `preconnect` que já existia para `fonts.googleapis.com` e `fonts.gstatic.com`, isso remove um bloqueio de render de terceiro do caminho crítico — ganho direto em **FCP** e, na maioria dos casos, em **LCP**.

O parâmetro `&display=swap` já presente evita o "texto invisível" (FOIT) enquanto a fonte carrega, o que protege o LCP quando o elemento maior da tela é o H1 — que é o caso aqui.

### 4.2 CSS: inline na home, compartilhado nas internas

Decisão deliberada, não descuido:

- A **home** mantém o CSS embutido no HTML. Para uma página que é o destino de campanhas pagas e do tráfego de marca, zero requisições extras no caminho crítico é o melhor resultado possível.
- As **páginas internas** compartilham `/assets/tf.css` (≈12 KB). No primeiro acesso é uma requisição a mais; a partir do segundo, o arquivo vem do cache do navegador e a navegação entre serviços e artigos fica praticamente instantânea. Como a proposta é justamente que o visitante navegue entre várias páginas (é assim que a linkagem interna funciona), o cache compensa muito rápido.

### 4.3 CLS (deslocamento de layout)

- Nenhuma imagem raster: nada que carregue depois e empurre o conteúdo.
- Todos os SVG têm `width` e `height` no atributo.
- A folha compartilhada define `img,svg,video{max-width:100%;height:auto;display:block}`.
- A troca de fonte usa `display=swap` com fallback declarado na mesma família métrica (`system-ui`, `-apple-system`, `Segoe UI`), o que reduz o salto na troca.

### 4.4 Scripts

- O GA4 entra com `async` e o `gtag('config')` roda em bloco inline mínimo — não bloqueia parsing.
- O JavaScript próprio das páginas internas é um único bloco de ~15 linhas no fim do `<body>` (só o menu mobile). Nada de framework, nada de dependência externa.
- Nenhuma biblioteca de terceiros foi adicionada.

### 4.5 Acessibilidade (que também é sinal de qualidade)

- `skip-link` ("Pular para o conteúdo") em todas as páginas internas
- `aria-label` em navegações, `aria-current="page"` no item ativo, `aria-expanded`/`aria-controls` no botão do menu
- `:focus-visible` com contorno visível
- `@media (prefers-reduced-motion: reduce)` desligando animações
- Tabelas dos artigos dentro de `.table-wrap` com rolagem horizontal própria — verificado que nenhuma página gera rolagem lateral no corpo em 390 px de largura

---

## 5. Linkagem interna

A arquitetura de links foi montada para que a autoridade da home flua para as páginas de serviço, e para que cada artigo empurre o leitor para o serviço correspondente.

**Menu principal** (home, serviços, blog, artigos e página legal — todas):
Microsoft 365 · Exchange Online · SharePoint & Teams · Blog + CTA "Solicitar Diagnóstico M365"

**Menu mobile:** os quatro acima + Segurança & Licenciamento + Contato.

**Rodapé** (reescrito em todas as páginas), com quatro colunas:
- *Serviços* — as 4 páginas de serviço
- *Conteúdo* — blog + os 3 artigos
- *Empresa* — Soluções, Contato, Segurança e Privacidade
- Blurb institucional com as palavras-chave da marca

**No corpo da home:** cada um dos 6 cards de serviço ganhou um link contextual ("Suporte Exchange Online", "Migração para Microsoft 365", "Gestão de SharePoint e Teams", "Revisão de licenciamento", "Segurança no Microsoft 365"), e foi criada uma **nova seção "Serviços em detalhe"** antes do rodapé, com 6 cards apontando para as 4 páginas de serviço, o blog e o formulário.

**Entre páginas internas:** todo serviço linka para pelo menos dois outros serviços e um artigo; todo artigo linka para o serviço correspondente e para os outros dois artigos. Isso cria um grafo fechado, sem página órfã.

**Link quebrado removido:** o item "Termos de Uso" com `href="#"` saiu do rodapé — era um link morto que desperdiçava crawl e sinalizava descuido.

---

## 6. Conversão (CRO)

### 6.1 CTA unificado e específico

Todas as chamadas principais passaram a usar **"Solicitar Diagnóstico M365"** — no botão da navbar, no menu mobile, no hero, nos blocos de CTA das 8 páginas novas e no botão de envio do formulário.

O CTA antigo ("Falar com um especialista" / "Solicitar diagnóstico gratuito") pedia uma conversa; o novo nomeia um **entregável**. Isso reduz a percepção de risco: o visitante não está aceitando uma ligação de vendas, está pedindo um diagnóstico com nome próprio. A repetição do mesmo rótulo em todos os pontos de contato também reforça memória e facilita a leitura de eventos no GA4.

O título da seção de contato acompanhou: "Solicite o seu Diagnóstico M365 gratuito."

### 6.2 Formulário mais rápido no celular

O formulário de lead recebeu os atributos que reduzem digitação e erro em mobile:

| Campo | Adicionado |
|---|---|
| Nome | `autocomplete="name"`, `enterkeyhint="next"` |
| Empresa | `autocomplete="organization"`, `enterkeyhint="next"` |
| E-mail | `autocomplete="email"`, `inputmode="email"`, `spellcheck="false"`, `enterkeyhint="next"` |
| Telefone | `autocomplete="tel"`, `inputmode="tel"`, `enterkeyhint="next"` |
| Mensagem | `rows="4"`, `enterkeyhint="send"`, rótulo marcado como **(opcional)** |

`autocomplete` faz o navegador preencher sozinho; `inputmode` abre o teclado certo (arroba visível para e-mail, numérico para telefone); `enterkeyhint` transforma a tecla Enter em "próximo"/"enviar". São ganhos pequenos individualmente e grandes somados: a maior parte do abandono de formulário em mobile acontece na digitação.

Marcar "Mensagem" como opcional reduz a percepção de esforço — é o campo mais caro de preencher e o menos necessário para qualificar o lead.

### 6.3 Redução de atrito e prova de segurança

A nota abaixo do botão passou de *"Respondemos em até 1 dia útil. Nenhum dado é compartilhado com terceiros."* para:

> "Leva menos de 1 minuto. Respondemos em até 1 dia útil e nenhum dado é compartilhado com terceiros — veja a política de privacidade."

Três mudanças: promessa de tempo (mata a objeção "vou demorar"), a garantia mantida, e o link para a política — que serve ao mesmo tempo como sinal de confiança (LGPD) e como link interno.

### 6.4 Estrutura de conversão nas páginas novas

Cada página de serviço tem **três oportunidades de conversão**: CTA duplo no hero (primário + âncora para o conteúdo), links contextuais ao longo do texto e bloco de CTA destacado antes do rodapé — além do botão fixo na navbar. As FAQ em `<details>` respondem as objeções mais comuns *antes* do CTA final, que é onde a maioria das dúvidas mata a conversão.

O envio continua no FormSubmit.co com `_cc` para `diego.asmar@gmail.com` — nada foi alterado no fluxo de recebimento de leads.

---

## 7. Analytics e Search Console

Inseridos no `<head>` de **todas as 10 páginas**:

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- Google Search Console -->
<meta name="google-site-verification" content="COLE_AQUI_O_TOKEN_DO_SEARCH_CONSOLE" />
```

### O que falta você fazer (2 substituições, 5 minutos)

1. **GA4** — crie a propriedade em analytics.google.com, copie o ID de medição (formato `G-XXXXXXXXXX`) e substitua as **duas** ocorrências do placeholder em cada página.
2. **Search Console** — em search.google.com/search-console, adicione a propriedade `tenantflow.com.br`, escolha a verificação por tag HTML, copie o valor do `content` e substitua `COLE_AQUI_O_TOKEN_DO_SEARCH_CONSOLE`.
3. **Envie o sitemap** — no Search Console, em *Sitemaps*, informe `sitemap.xml`.

### Eventos que valem configurar depois

No GA4, marque como conversão: o clique em qualquer botão com o texto "Solicitar Diagnóstico M365" e o envio bem-sucedido do formulário. Com o mesmo rótulo em todos os CTAs, dá para medir **qual página gera o clique** e, com isso, saber se o lead veio do artigo de spam, da página de migração ou da home — que é exatamente o dado que hoje não existe.

---

## 8. Impacto esperado

Nada aqui é garantia: SEO orgânico depende de concorrência, autoridade de domínio e tempo. O que muda é a **capacidade estrutural** do site de competir.

**Semanas 1–2 (indexação)**
Com robots.txt, sitemap e canonicals no ar, o Google descobre as 10 URLs em poucos dias em vez de depender de rastreamento incidental. Espere ver as páginas aparecendo na cobertura do Search Console nesse período.

**Semanas 3–8 (cauda longa)**
As FAQ estruturadas e os artigos começam a captar buscas de cauda longa — "spf dkim dmarc microsoft 365", "quanto custa microsoft 365 empresa", "migrar google workspace para outlook". São buscas de volume individual baixo, mas somadas costumam representar a maior parte do tráfego qualificado de um site desse porte. É também o tipo de conteúdo mais citado por buscas com IA, o que o robots.txt libera explicitamente.

**Meses 2–6 (termos comerciais)**
As páginas de serviço passam a disputar termos de fundo de funil ("suporte exchange online", "empresa migração microsoft 365"). Aqui a variável é concorrência: sem backlinks, a subida é gradual. O ganho estrutural é que agora **existe uma página certa para o Google ranquear** em cada tema — antes, não existia.

**Imediato (CRO e compartilhamento)**
Os ganhos de conversão não dependem de indexação: valem desde o primeiro visitante. Formulário mais rápido no mobile, CTA nomeado e FAQ respondendo objeções antes do botão afetam a taxa de conversão do tráfego que já chega hoje. E o Open Graph faz cada link compartilhado no WhatsApp ou LinkedIn passar a exibir título e descrição em vez de uma URL crua.

**Performance**
A remoção do CSS de fontes do caminho crítico reduz o tempo até o primeiro pixel pintado. Em conexões móveis brasileiras, esse tipo de mudança costuma valer algumas centenas de milissegundos de FCP — e o Google usa Core Web Vitals como fator de classificação.

---

## 9. Próximos passos recomendados

Em ordem de retorno sobre esforço:

1. **Preencher GA4 e Search Console** (5 min) — sem medição, nada disso é otimizável.
2. **Subir `/assets/og-tenant-flow.png`** (1200×630) pela interface do GitHub — completa o compartilhamento social.
3. **Publicar 1 artigo a cada 15 dias** usando um dos três como modelo. Temas com demanda clara: "checklist de desligamento de funcionário no Microsoft 365", "Teams vs. WhatsApp para empresas", "backup do Microsoft 365: o que a Microsoft cobre e o que não cobre", "como escolher entre Business Basic e Standard".
4. **Adicionar `LocalBusiness` com endereço real** se a empresa atende presencialmente alguma região — desbloqueia busca local, que tem intenção altíssima. Hoje o schema declara `areaServed: Brasil` sem endereço, que é o correto para atendimento remoto.
5. **Buscar os primeiros backlinks** — parceiros, clientes, associações comerciais, diretórios de TI. É o fator em que o site está mais descoberto e o que mais limita a velocidade de subida.
6. **Prova social** — depoimentos reais de clientes com nome e empresa, e um ou dois casos com número ("reduzimos X licenças", "migramos Y caixas em Z dias"). É o que falta na página para converter quem chega pesquisando fornecedor.

---

## 10. Arquivos criados e modificados

**Criados (12)**

| Arquivo | Descrição |
|---|---|
| `robots.txt` | Diretrizes de rastreamento + sitemap |
| `sitemap.xml` | 10 URLs com lastmod/changefreq/priority |
| `favicon.svg` | Logotipo em SVG, usado pelas internas e no schema |
| `assets/tf.css` | Folha compartilhada das páginas internas (~12 KB) |
| `migracao-microsoft-365/index.html` | Página de serviço |
| `suporte-exchange-online/index.html` | Página de serviço |
| `sharepoint-e-teams/index.html` | Página de serviço |
| `seguranca-e-licenciamento-microsoft-365/index.html` | Página de serviço |
| `blog/index.html` | Índice do blog |
| `blog/migrar-google-workspace-para-microsoft-365/index.html` | Artigo |
| `blog/quanto-custa-microsoft-365-para-empresas/index.html` | Artigo |
| `blog/email-caindo-no-spam-spf-dkim-dmarc/index.html` | Artigo |

**Modificados (2)**

| Arquivo | Mudanças |
|---|---|
| `index.html` | Title e description reescritos; canonical, robots, theme-color, author; Open Graph e Twitter Card; verificação do Search Console; 4 blocos JSON-LD (Organization, ProfessionalService, WebSite, Service); GA4; fontes não bloqueantes; navbar e menu mobile reescritos; rodapé reestruturado em 4 colunas; links contextuais nos 6 cards de serviço; nova seção "Serviços em detalhe"; CTAs unificados; formulário otimizado para mobile; nota de privacidade com link |
| `seguranca-e-privacidade.html` | Title e description reescritos; canonical, robots, theme-color; Open Graph e Twitter Card; verificação do Search Console; JSON-LD (Organization + BreadcrumbList); GA4; fontes não bloqueantes; navbar, menu mobile e rodapé alinhados ao resto do site |

**Verificação:** cada arquivo foi conferido por comparação de hash SHA-256 entre o conteúdo local e o conteúdo efetivamente gravado no repositório antes de cada commit. Antes da publicação, as páginas foram renderizadas localmente em 1280 px e 390 px para checar ausência de rolagem horizontal, integridade dos JSON-LD (todos os blocos parseiam), presença de exatamente um `<h1>` por página e inexistência de links internos quebrados.

---

## 11. Segunda rodada — reestruturação da home

A primeira rodada tratou de metadados, arquitetura de URLs e linkagem. Esta segunda
rodada tratou do que sobrou: **densidade, ritmo e ordem**. O diagnóstico honesto era
que a home tinha uma identidade visual boa executada com folga demais — 5.798 px de
altura no desktop com metade das seções pela metade vazias, e o formulário de
conversão posicionado no meio da página, com mais conteúdo depois dele.

### 11.1 Bug de navegação corrigido

A página usava `scroll-behavior: smooth` com uma navbar `position: fixed`, mas sem
`scroll-padding-top`. Resultado: **todo link ancorado** (`#contato`, `#servicos`)
parava com o título de destino escondido atrás da barra. Corrigido com
`scroll-padding-top: 5.5rem` no `html`. Verificado: o título do FAQ agora para a
222 px do topo, com folga sobre a navbar de ~68 px.

### 11.2 Acessibilidade — foco visível

Só os campos do formulário tinham indicação de foco. Quem navega por teclado ficava
sem referência em todos os links e botões da página. Adicionado `:focus-visible`
global (aparece só para teclado, o clique de mouse continua limpo) e um **skip link**
como primeiro elemento focável da página. Contraste medido: `--text-2` em 7,29:1 e
`--text-3` em 5,15:1 sobre o fundo — ambos acima do mínimo AA.

### 11.3 Ritmo vertical

| Antes | Depois |
|---|---|
| `.section{ padding-block: 6.5rem }` fixo | `clamp(3.75rem, 2.2rem + 5vw, 6rem)` |
| `.hero{ padding-top: 9.5rem }` fixo | `clamp(7rem, 5.4rem + 5vw, 9rem)` |
| `--fs-h1` com piso de 2.375rem | piso de 1.9rem (H1 no celular caiu de 6 para 4 linhas) |
| Título de seção sem controle de medida | `max-width: 20ch` + `text-wrap: balance` |
| Cabeçalho de seção só na coluna esquerda | `.section-head--split` em duas colunas |

O H1 também ganhou `max-width: 15ch`, o que segura a quebra em 2–3 linhas em
qualquer largura em vez das 5 linhas anteriores.

### 11.4 Navbar com estado de rolagem

A barra agora começa quase transparente sobre o hero e ganha fundo, borda e sombra
depois que a página rola, encolhendo de 4,25rem para 3,85rem. Implementado com
`IntersectionObserver` sobre uma sentinela de 1 px no topo do documento — **não** com
listener de `scroll`, que dispara centenas de vezes por segundo e trava a rolagem em
celular modesto.

### 11.5 Nova ordem das seções

```
ANTES   hero → integrações → serviços → como funciona → CONTATO → páginas de serviço
DEPOIS  hero → prova → integrações → serviços → como funciona → páginas de serviço
        → preço → FAQ → CONTATO
```

O formulário passou a **encerrar** a página. Antes havia conteúdo depois do ponto de
conversão, o que dilui a intenção de quem chegou até lá.

### 11.6 Seções novas

**Faixa de prova (`.proof`)** — logo abaixo do hero, no lugar onde sites B2B de
referência colocam prova social. Como não há logo de cliente autorizado nem
depoimento real, a faixa carrega quatro compromissos operacionais concretos
(30 minutos de diagnóstico, 0 paradas, retorno em menos de 1 dia útil, escopo por
escrito) em vez de número inventado. O mural de logos está **pronto e comentado** no
HTML, esperando autorização de uso de marca dos clientes.

**Preço (`#precos`)** — três cartões: Diagnóstico M365 (Gratuito, valor real),
Projeto pontual e Suporte mensal. Os dois últimos estão com `Sob consulta` e um
comentário `<!-- TROCAR -->` marcando exatamente onde entra o número. Nenhum valor
foi inventado. Captura busca de intenção comercial ("quanto custa migração
Microsoft 365") e filtra lead fora de faixa antes do formulário.

**FAQ (`#faq`)** — seis perguntas reais respondidas em `<details>` nativo (sem
JavaScript), com um cartão de conversão fixo (`position: sticky`) na coluna da
direita. O texto do **FAQPage do JSON-LD é gerado da mesma fonte** que o HTML
visível, então os dois nunca saem de sincronia — que é o erro mais comum nessa
implementação e o que faz o Google descartar o rich result.

### 11.7 Schema e linkagem

`FAQPage` adicionado ao grafo do `<head>`, ancorado em `#faq` e ligado ao
`#website` já existente por `isPartOf`. É o tipo que o Google usa para montar
resposta direta na busca e o que sistemas de IA leem com mais facilidade.

Menu, menu mobile e rodapé ganharam **Preços** e **Dúvidas frequentes**. Três das
seis respostas do FAQ têm link contextual para páginas de serviço e para o artigo do
blog sobre SPF/DKIM/DMARC — linkagem interna dentro de texto, que é a que mais pesa.

### 11.8 H1 com a palavra-chave

O H1 anterior — "Sua empresa não precisa entender de TI. Só precisa de TI que
funciona." — era boa copy mas **não continha a palavra-chave principal**. O elemento
mais importante da página estava sem o termo que se quer ranquear. Novo H1:
**"Microsoft 365 que funciona. Sem você precisar entender de TI."** — mantém o gancho,
põe o termo comercial nas três primeiras palavras, e é 20% mais curto.

### 11.9 Verificação automatizada

Executada em Chromium via Playwright a 1440 px e 390 px:

- 5 blocos JSON-LD parseiam (Organization, ProfessionalService, FAQPage, WebSite, Service)
- exatamente 1 `<h1>`; 28 cabeçalhos sem salto de nível
- 54 links, 6 âncoras internas, nenhuma quebrada
- sem rolagem horizontal em 1440 px nem em 390 px
- navbar entra e sai de `.is-scrolled` corretamente
- primeiro `Tab` cai no skip link com contorno de foco de 2 px
- 0 erros de balanceamento de tags no documento inteiro

