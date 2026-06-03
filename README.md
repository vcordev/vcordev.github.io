# Dueto Extra — Website de Tours Privados em Lisboa

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen?logo=github)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![GDPR](https://img.shields.io/badge/RGPD-compliant-blue)
![Languages](https://img.shields.io/badge/idiomas-PT%20%7C%20EN%20%7C%20RU%20%7C%20RO-orange)

**Website de produção:** [duetoextra.pt](https://duetoextra.pt)

---

## Descrição do Projecto

Website estático de apresentação e reserva de tours privados na região de Lisboa, desenvolvido como projecto de final de curso. O site representa um serviço real de transporte turístico privado com motorista multilingue (Português, Inglês, Russo e Romeno), cobrindo 6 destinos: Lisboa, Sintra, Cascais, Arrábida, Mafra e Óbidos.

O projecto foi desenvolvido **sem frameworks** — HTML, CSS e JavaScript puros — com foco em performance, acessibilidade, conformidade RGPD e SEO técnico avançado.

---

## Funcionalidades Implementadas

### Interface e UX
- **Slideshow hero** com efeito Ken Burns (animação CSS pura) e navegação por pontos
- **Galeria fullscreen** com crossfade suave ao navegar entre imagens
- **Menu hamburger** responsivo com overlay animado
- **Header fixo** com efeito de scroll e logótipo com glow dinâmico
- **Formulário de contacto** com validação E.164 para números de telefone internacionais
- **Modal de sucesso** com auto-fecho após 3 segundos
- Detecção automática do país por IP (lazy — só activa quando o utilizador toca no formulário)

### Internacionalização (i18n)
- **4 idiomas**: Português, Inglês, Russo, Romeno
- Sistema de traduções via ficheiros JSON (`translations/`)
- Troca de idioma sem recarregar a página
- Persistência do idioma escolhido em `localStorage`
- Detecção automática do idioma preferido do browser

### Performance
- Imagens em formato **WebP** comprimidas com `sharp` (Node.js)
- Estratégia de **preload** para imagens críticas (LCP)
- **Lazy loading** nativo (`loading="lazy"`) para imagens fora do viewport
- Pré-carregamento inteligente da galeria: imagens adjacentes (N±1, N±2) e todas as restantes 800ms após o load
- `will-change: transform` aplicado apenas nos slides activos (GPU compositing controlado)
- `fetchpriority="high"` e `decoding="async"` nas imagens LCP
- Scroll suave nativo via CSS (`scroll-behavior: smooth` + `scroll-padding-top`)

### SEO Técnico
- **Schema.org** (`TravelAgency` + `TouristTrip`) em todas as páginas
- **Open Graph** e **Twitter Cards** com imagens e dimensões correctas
- **Sitemap XML** com hreflang para 4 idiomas
- `robots.txt` configurado
- Tags canonical e hreflang em todas as páginas
- Meta descriptions dinâmicas por idioma

### Rastreio e Analytics (RGPD Compliant)
- **Google Analytics 4** com **Consent Mode v2** — `analytics_storage: denied` por defeito
- **Meta Pixel** (Facebook) inicializado **dinamicamente** apenas após consentimento explícito
- Banner de cookies multilingue com opções Aceitar / Rejeitar
- 5 eventos GA4 personalizados: `package_view`, `language_change`, `contact_form_submit`, `whatsapp_click`, `phone_click`
- Consentimento persistido em `localStorage`
- Nenhum pedido a servidores de terceiros antes do consentimento

### Acessibilidade
- `aria-label` em todos os botões de navegação e controles interactivos
- `aria-expanded` no hamburger e `aria-controls` para o menu mobile
- `role="tablist"` e `role="tab"` nos pontos de navegação do slideshow
- `aria-live="off"` no slideshow (evita anúncios em loop)
- Foco visível com outline dourado em todos os elementos interactivos
- Suporte a `prefers-reduced-motion` (desactiva animações Ken Burns)

---

## Stack Técnica

| Camada | Tecnologia | Notas |
|--------|-----------|-------|
| Hosting | GitHub Pages | Deploy automático via push para `main` |
| DNS / Domínio | CNAME `duetoextra.pt` | Domínio próprio apontado para GitHub Pages |
| HTML | HTML5 semântico | Sem frameworks |
| CSS | CSS3 puro | `clamp()`, Grid, Flexbox, Custom Properties |
| JavaScript | ES6+ vanilla | Sem dependências externas em runtime |
| Imagens | WebP | Comprimidas com `sharp` (Node.js, qualidade 80) |
| i18n | JSON + fetch API | 4 ficheiros de tradução, ~190 chaves cada |
| Analytics | Google Analytics 4 | Consent Mode v2 |
| Formulário | Formspree | Processamento sem servidor próprio |
| Schema.org | JSON-LD | `TravelAgency` + `TouristTrip` |

---

## Métricas de Performance

### Compressão de Imagens

| Imagem | Antes | Depois | Redução |
|--------|-------|--------|---------|
| `s2.webp` | 6 565 KB | 393 KB | **-94%** |
| `s1.webp` | 2 822 KB | 460 KB | -84% |
| `p2.webp` | 2 622 KB | 276 KB | -89% |
| `l2.webp` | 2 135 KB | 396 KB | -81% |
| `l4.webp` | 2 144 KB | 368 KB | -83% |
| `l8.webp` | 2 192 KB | 444 KB | -80% |
| **Total** | **~25 MB** | **~3,8 MB** | **-85%** |
| `favicon-logo.png` | 1 156 KB | 63 KB | -94% |

---

## Estrutura do Projecto

```
vcordev.github.io/
│
├── index.html                  # Página principal
├── privacidade.html            # Política de privacidade (RGPD)
├── styles.css                  # Estilos globais (responsivo, clamp())
├── scripts.js                  # Lógica JS (i18n, galeria, RGPD, GA4)
├── scripts.min.js              # Cópia de scripts.js (servida em produção)
│
├── pacotes/                    # 6 páginas de destinos
│   ├── lisboa.html
│   ├── sintra.html
│   ├── cascais.html
│   ├── arrabida.html
│   ├── mafra.html
│   ├── obidos.html
│   └── pacote-detalhes.css     # Estilos específicos das páginas de pacote
│
├── translations/               # Sistema i18n
│   ├── pt.json                 # Português (189 chaves)
│   ├── en.json                 # Inglês
│   ├── ru.json                 # Russo
│   └── ro.json                 # Romeno
│
├── images/                     # Assets optimizados (WebP + PNG)
│   ├── l1–l8.webp              # Imagens Lisboa
│   ├── s1–s3.webp              # Imagens Sintra / Arrábida
│   ├── c1.webp                 # Imagem Cascais
│   ├── p2.webp                 # Imagem pacote
│   ├── logo-dueto-trans.png    # Logótipo (PNG transparente)
│   ├── favicon-logo.png        # Favicon (192×192, 63 KB)
│   └── *-flag.{png,svg}        # Bandeiras de idioma
│
├── sitemap.xml                 # Sitemap com hreflang (4 idiomas)
├── robots.txt                  # Regras de indexação
└── CNAME                       # Domínio personalizado
```

---

## Arquitectura do Sistema i18n

```
DOMContentLoaded
      │
      ▼
changeLanguage(lang)
      │
      ├── fetch translations/{lang}.json
      ├── fetch translations/pt.json (fallback, uma vez)
      │
      ▼
[data-key="chave"] → element.textContent = traducao
[data-key] em <meta> → element.setAttribute('content', ...)
[data-key] em <input> → element.setAttribute('placeholder', ...)
      │
      ▼
localStorage.setItem('language', lang)
      │
      ▼
Se sem consentimento → mostrarBannerCookies()
```

---

## Fluxo RGPD / Consent Mode v2

```
Primeira visita
      │
      ▼
GA4 inicializado com analytics_storage: 'denied'
(pageview não enviado, dados não recolhidos)
      │
      ▼
Banner de cookies (após tradução estar carregada)
      │
      ├── [Aceitar] → initGA4() + initMetaPixel()
      │               SDK Facebook carregado dinamicamente
      │               analytics_storage: 'granted'
      │               localStorage: 'accepted'
      │
      └── [Rejeitar] → localStorage: 'rejected'
                        Nenhum SDK de terceiros carregado
```

---

## Executar Localmente

O projecto é um site estático — não requer servidor de aplicação.

```bash
# Clonar o repositório
git clone https://github.com/vcordev/vcordev.github.io.git
cd vcordev.github.io

# Opção 1 — Python (disponível em qualquer sistema)
python -m http.server 8000

# Opção 2 — Node.js
npx serve .

# Opção 3 — VS Code
# Extensão "Live Server" → botão "Go Live"
```

Abrir no browser: `http://localhost:8000`

> **Nota:** As traduções usam `fetch()` para carregar os ficheiros JSON — é necessário um servidor HTTP local (não funciona com `file://`).

---

## Compressão de Imagens (manutenção futura)

```bash
# Instalar sharp (uma vez)
npm install sharp

# Executar script de compressão
node compress.js

# Substituir originais
Copy-Item images-compressed\* images\ -Force  # Windows
# ou
cp images-compressed/* images/                # Linux/Mac
```

---

## Decisões de Arquitectura

**Por que sem framework?**
O projecto é um site de apresentação com conteúdo estático. A ausência de React/Vue elimina o JavaScript de bootstrap (~100 KB+), reduz o Time to Interactive e simplifica o deploy para GitHub Pages sem build step.

**Por que WebP?**
WebP oferece ~30% melhor compressão que JPEG a qualidade equivalente, com suporte em >97% dos browsers modernos. As imagens originais (4K, sem compressão) foram reduzidas de 25 MB para 3,8 MB sem perda de qualidade visual perceptível.

**Por que CSS `clamp()` em vez de media queries?**
`clamp(min, preferred, max)` permite valores verdadeiramente responsivos sem breakpoints discretos — o header, fontes e espaçamentos adaptam-se a qualquer resolução entre 320px e 1920px com uma única regra CSS.

**Por que Consent Mode v2?**
O GA4 sem Consent Mode v2 viola o RGPD na UE. Com Consent Mode v2, o GA4 inicia em modo `denied` e só activa após consentimento explícito. O Meta Pixel SDK não é sequer descarregado antes do consentimento.

---

## Autor

Desenvolvido por **vcordev** — Projecto de Final de Curso, 2026.
