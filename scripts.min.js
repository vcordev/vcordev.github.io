// ==================================================
// GESTÃO DE CONSENTIMENTO DE COOKIES (RGPD)
// O Meta Pixel só é inicializado após consentimento
// ==================================================

const META_PIXEL_ID = '219798650101295';
const GA4_ID        = 'G-RB6QPB1VVW';

/** Inicializa o Meta Pixel — apenas após consentimento. Carrega o SDK dinamicamente. */
function initMetaPixel() {
  if (window.fbqInitialized) return;
  if (!window.fbq) {
    var n = window.fbq = function() { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
  }
  var t = document.createElement('script');
  t.async = true;
  t.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(t);
  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
  window.fbqInitialized = true;
}

/** Inicializa o GA4 — apenas após consentimento. */
function initGA4() {
  if (window.ga4Initialized || typeof gtag !== 'function') return;
  gtag('consent', 'update', { analytics_storage: 'granted' });
  gtag('config', GA4_ID, { send_page_view: true });
  window.ga4Initialized = true;
  if (window.__pendingPackageView) {
    gtagEvent('package_view', { package_name: window.__pendingPackageView });
    window.__pendingPackageView = null;
  }
}

/** Envia um evento GA4 — só após consentimento. */
function gtagEvent(name, params) {
  if (!window.ga4Initialized || typeof gtag !== 'function') return;
  gtag('event', name, Object.assign({ language: window.__i18n && window.__i18n.lang }, params || {}));
}

/** Cria e injeta o banner de consentimento de cookies (texto traduzido via t()). */
function mostrarBannerCookies() {
  if (document.getElementById('cookie-banner')) return;
  const nested = location.pathname.split('/').filter(Boolean).length > 1;
  const privUrl = nested ? '../privacidade.html' : 'privacidade.html';
  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Consentimento de cookies');
  banner.innerHTML =
    '<div class="cookie-banner-content">' +
    '<p>' + t('cookie_texto', 'Utilizamos cookies analíticos para melhorar a sua experiência. Ao aceitar, consente o uso do Meta Pixel (Facebook) e do Google Analytics.') +
    ' <a href="' + privUrl + '">' + t('cookie_privacidade', 'Política de Privacidade') + '</a></p>' +
    '<div class="cookie-banner-buttons">' +
    '<button class="btn-aceitar-cookies" onclick="aceitarCookies()">' + t('cookie_aceitar', 'Aceitar') + '</button>' +
    '<button class="btn-rejeitar-cookies" onclick="rejeitarCookies()">' + t('cookie_rejeitar', 'Rejeitar') + '</button>' +
    '</div></div>';
  document.body.appendChild(banner);
}

function aceitarCookies() {
  localStorage.setItem('cookieConsent', 'accepted');
  const b = document.getElementById('cookie-banner');
  if (b) b.remove();
  initMetaPixel();
  initGA4();
}

function rejeitarCookies() {
  localStorage.setItem('cookieConsent', 'rejected');
  const b = document.getElementById('cookie-banner');
  if (b) b.remove();
}

// Verificar consentimento ao iniciar
(function () {
  const consent = localStorage.getItem('cookieConsent');
  if (consent === 'accepted') {
    window.addEventListener('load', function() { initMetaPixel(); initGA4(); });
  }
  // Banner mostrado após changeLanguage() para garantir texto traduzido
  // Se 'rejected' — pixel não é inicializado
})();


// ==================================================
// 1. Troca de Idioma
// ==================================================

window.__i18n = {
  lang: localStorage.getItem('language') || 'pt',
  translations: {},
  pt: null
};

function t(key, fallback) {
  const dict = window.__i18n.translations || {};
  if (key in dict) return String(dict[key]);
  return fallback || key;
}

async function changeLanguage(lang) {
  const previousLang = window.__i18n.lang;
  try {
    const isNested = location.pathname.split('/').filter(Boolean).length > 1;
    const primaryUrl  = (isNested ? '../' : '') + 'translations/' + lang + '.json';
    const fallbackUrl = '/translations/' + lang + '.json';

    let response = await fetch(primaryUrl, { cache: 'default' });
    if (!response.ok) response = await fetch(fallbackUrl, { cache: 'default' });
    if (!response.ok) throw new Error('Erro ao carregar traduções: ' + response.status);

    const translations = await response.json();
    window.__i18n.lang = lang;
    window.__i18n.translations = translations;

    if (!window.__i18n.pt) {
      const ptRes = await fetch((isNested ? '../' : '') + 'translations/pt.json', { cache: 'default' })
        .catch(function() { return fetch('/translations/pt.json', { cache: 'default' }); });
      if (ptRes && ptRes.ok) window.__i18n.pt = await ptRes.json();
    }

    document.querySelectorAll('[data-key]').forEach(function(element) {
      const key = element.getAttribute('data-key');
      const val = translations[key];
      if (val === undefined || val === null) return;
      const tag = element.tagName;
      if (tag === 'META') {
        element.setAttribute('content', String(val));
      } else if (tag === 'INPUT' || tag === 'TEXTAREA') {
        element.setAttribute('placeholder', String(val));
      } else {
        element.textContent = String(val);
      }
    });

    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    if (previousLang !== lang) {
      gtagEvent('language_change', { from_language: previousLang, to_language: lang });
    }
    if (!localStorage.getItem('cookieConsent')) {
      mostrarBannerCookies();
    }
  } catch (error) {
    console.error('Erro ao carregar traduções:', error);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  changeLanguage(localStorage.getItem('language') || 'pt');
});


// ==================================================
// 2. Validação do Formulário de Contacto
// ==================================================

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contactForm');
  if (!form) return; // Formulário só existe na página principal

  const result    = document.getElementById('lead-result');
  const button    = form.querySelector("button[type='submit']");
  const pais      = document.getElementById('pais');
  const prefixo   = document.getElementById('prefixo');
  const telemovel = document.getElementById('telemovel');
  const successModal = document.getElementById('success-modal');

  // Deteção automática do país por IP
  async function autoDetectCountry() {
    try {
      const res  = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.country_calling_code) {
        prefixo.value = data.country_calling_code;
        const option = [...pais.options].find(function(o) { return o.value === data.country_calling_code; });
        if (option) pais.value = option.value;
      }
    } catch (e) {
      prefixo.value = '+';
    }
  }
  form.addEventListener('focusin', autoDetectCountry, { once: true });

  // Atualizar prefixo quando o país muda
  pais.addEventListener('change', function() {
    if (pais.value === 'other') {
      prefixo.value = '+';
      prefixo.removeAttribute('readonly');
      prefixo.placeholder = t('prefixo_placeholder', '+XXX');
    } else {
      prefixo.value = pais.value;
      prefixo.setAttribute('readonly', true);
    }
  });

  // Higienização do telemóvel — só dígitos e separadores comuns
  telemovel.addEventListener('input', function() {
    telemovel.value = telemovel.value.replace(/[^\d\s\-()]/g, '');
  });

  // Submissão do formulário
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    limparErros();
    clearMessage();

    const nome     = document.getElementById('nome');
    const email    = document.getElementById('email');
    const mensagem = document.getElementById('mensagem');
    let erro = false;

    if (!nome.value.trim())     { marcarErro(nome);     erro = true; }
    if (!email.value.trim())    { marcarErro(email);    erro = true; }
    if (!telemovel.value.trim()){ marcarErro(telemovel); erro = true; }
    if (!mensagem.value.trim()) { marcarErro(mensagem); erro = true; }

    if (erro) {
      mostrarErro(t('erro_campos_obrigatorios', 'Por favor, preencha todos os campos.'));
      return;
    }

    if (!validarEmail(email.value.trim())) {
      marcarErro(email);
      mostrarErro(t('erro_email_invalido', 'Por favor, insira um email válido.'));
      return;
    }

    const numeroFinal = (prefixo.value || '') + (telemovel.value || '');
    if (!validarTelemovelCompleto(numeroFinal)) {
      marcarErro(telemovel);
      mostrarErro(t('erro_telemovel_invalido', 'Por favor, insira um número válido com indicativo.'));
      return;
    }

    const formData = new FormData(form);
    formData.set('telemovel', numeroFinal.replace(/\s+/g, ' ').trim());

    const isoPorPrefixo = {
      '+351':'PT','+373':'MD','+40':'RO','+7':'RU','+375':'BY','+380':'UA',
      '+992':'TJ','+993':'TM','+996':'KG','+998':'UZ','+995':'GE','+374':'AM',
      '+994':'AZ','+34':'ES','+33':'FR','+49':'DE','+39':'IT','+44':'GB',
      '+1':'US','+55':'BR','+61':'AU','+81':'JP','other':'OT'
    };
    formData.set('pais', isoPorPrefixo[pais.value] || 'INT');

    let prefixoFinal = pais.value === 'other' ? (prefixo.value || '') : pais.value;
    if (prefixoFinal && !prefixoFinal.trim().startsWith('+')) {
      prefixoFinal = '+' + prefixoFinal.replace(/[^\d]/g, '');
    }
    formData.set('prefixo', prefixoFinal);

    button.classList.add('loading');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        // Tracking de Lead — só se o pixel foi consentido
        if (typeof fbq === 'function' && window.fbqInitialized) {
          fbq('track', 'Lead', { value: 0, currency: 'EUR' });
        }
        gtagEvent('contact_form_submit', { page_location: window.location.href });
        mostrarSucesso(t('sucesso_envio', 'Mensagem enviada com sucesso!'));
        form.reset();
        prefixo.value = pais.value || '';
        if (pais.value !== 'other') prefixo.setAttribute('readonly', true);
      } else {
        let msg = t('erro_submit_generico', 'Ocorreu um erro ao enviar. Tente novamente.');
        try {
          const data = await response.json();
          if (data && data.errors && data.errors.length) {
            msg = data.errors.map(function(e) { return e.message; }).join(' | ');
          }
        } catch (_) {}
        mostrarErro(msg);
      }
    } catch (error) {
      mostrarErro(t('erro_conexao', 'Erro de conexão. Verifique a internet e tente novamente.'));
    } finally {
      button.classList.remove('loading');
    }
  });

  // --- Funções auxiliares ---

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Validação E.164: começa por +, 7–15 dígitos
  function validarTelemovelCompleto(num) {
    var cleaned = num.replace(/[\s\-()]/g, '');
    if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
    return /^\+[0-9]{7,15}$/.test(cleaned);
  }

  function marcarErro(campo) {
    campo.classList.add('input-error');
    campo.setAttribute('aria-invalid', 'true');
  }

  function limparErros() {
    document.querySelectorAll('.input-error').forEach(function(e) {
      e.classList.remove('input-error');
      e.removeAttribute('aria-invalid');
    });
  }

  function showMessage(text, isError) {
    result.textContent = text;
    result.style.color = isError ? '#b00020' : '#006400';
    result.classList.add('show');
  }
  function clearMessage() {
    result.textContent = '';
    result.classList.remove('show');
  }
  function mostrarErro(msg)    { showMessage(msg, true);  }
  function mostrarSucesso(msg) {
    if (!successModal) { showMessage(msg, false); return; }
    var enviadoEl = successModal.querySelector('p#enviado');
    if (enviadoEl) enviadoEl.textContent = msg;
    successModal.classList.add('show');
    var fecharModal = function() { successModal.classList.remove('show'); };
    successModal.addEventListener('click', function(e) { if (e.target === successModal) fecharModal(); }, { once: true });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') fecharModal(); }, { once: true });
    var box = successModal.querySelector('.success-box');
    if (box) box.addEventListener('click', fecharModal, { once: true });
    setTimeout(fecharModal, 3000);
    showMessage(msg, false);
  }
});


// ==================================================
// 3. Cabeçalho — efeito de scroll
// ==================================================

(function() {
  var header = document.querySelector('.fixed-header');
  if (!header) return;
  window.addEventListener('scroll', function() {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
})();


// ==================================================
// 4. Slideshow — Ken Burns + crossfade + pontos
// ==================================================

document.addEventListener('DOMContentLoaded', function () {
  var slideshowEl = document.getElementById('slideshow');
  var slides      = document.querySelectorAll('.slide');
  if (!slideshowEl || !slides.length) return;

  var currentIndex = 0;
  var intervalId   = null;
  var INTERVAL_MS  = 8000; // milissegundos entre transições

  // --- Cria os pontos de navegação ---
  var dotsWrap = document.createElement('div');
  dotsWrap.className = 'slideshow-dots';
  dotsWrap.setAttribute('role', 'tablist');
  dotsWrap.setAttribute('aria-label', 'Navegação do slideshow');

  var dots = Array.from(slides).map(function(_, i) {
    var btn = document.createElement('button');
    btn.className = 'slideshow-dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', 'Imagem ' + (i + 1) + ' de ' + slides.length);
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.addEventListener('click', function() {
      goToSlide(i);
    });
    dotsWrap.appendChild(btn);
    return btn;
  });

  slideshowEl.appendChild(dotsWrap);

  // --- Mostra um slide e reinicia a animação Ken Burns ---
  function showSlide(index) {
    // 1. Desativa todos os slides
    slides.forEach(function(slide) {
      slide.classList.remove('active');
    });

    // 2. Prepara a animação no slide alvo (enquanto ainda está invisível)
    var newSlide = slides[index];
    var img = newSlide.querySelector('img');
    if (img) {
      img.style.animation = 'none';
      void img.offsetWidth; // trigger reflow — reseta a animação enquanto opacity=0
      img.style.animation = '';
    }

    // 3. Ativa o slide (inicia fade-in + animação KB desde o frame 0)
    newSlide.classList.add('active');

    // Actualiza pontos
    dots.forEach(function(dot, i) {
      var isActive = (i === index);
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function goToSlide(index) {
    currentIndex = index;
    showSlide(currentIndex);
    resetInterval();
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    showSlide(currentIndex);
  }

  function resetInterval() {
    clearInterval(intervalId);
    intervalId = setInterval(nextSlide, INTERVAL_MS);
  }

  // --- Pausa ao passar o rato ou receber foco ---
  slideshowEl.addEventListener('mouseenter', function() { clearInterval(intervalId); });
  slideshowEl.addEventListener('mouseleave', resetInterval);
  slideshowEl.addEventListener('focusin',    function() { clearInterval(intervalId); });
  slideshowEl.addEventListener('focusout',   resetInterval);

  // --- Navegação por teclado (←/→) ---
  slideshowEl.setAttribute('tabindex', '0');
  slideshowEl.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(currentIndex);
      resetInterval();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      resetInterval();
    }
  });

  // --- Inicia ---
  showSlide(0);
  intervalId = setInterval(nextSlide, INTERVAL_MS);
});


// ==================================================
// 5. Navegação sem hash na URL
// ==================================================

// Anchors na mesma página (#pacotes, #sobre, etc.) — scroll sem alterar a URL
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    var href = this.getAttribute('href');
    if (!href || href === '#' || href === '#home-anchor') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    var target = document.querySelector(href);
    if (!target) return;
    var headerH = (document.querySelector('.fixed-header') || {}).offsetHeight || 88;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerH, behavior: 'smooth' });
  });
});

// Ao chegar de outra página com hash (ex: /#contactos), limpa o hash da URL
// após o browser ter feito scroll ao elemento (via scroll-padding-top CSS)
if (window.location.hash) {
  window.addEventListener('load', function() {
    history.replaceState(null, '', location.pathname);
  });
}


// ==================================================
// 6. Menu Mobile
// ==================================================

var _menuScrollY = 0;

function toggleMenu() {
  var menu = document.getElementById('mobileMenu');
  if (!menu) return;
  var isOpen = menu.classList.toggle('show');
  document.body.classList.toggle('menu-open', isOpen);
  var hamburger = document.querySelector('.hamburger');
  if (hamburger) hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  if (isOpen) {
    _menuScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _menuScrollY + 'px';
    document.body.style.width = '100%';
  } else {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, _menuScrollY);
  }
}
function closeMenu() {
  var menu = document.getElementById('mobileMenu');
  if (!menu) return;
  menu.classList.remove('show');
  document.body.classList.remove('menu-open');
  var hamburger = document.querySelector('.hamburger');
  if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, _menuScrollY);
}

// Fechar menu ao clicar fora ou pressionar ESC
document.addEventListener('click', function(e) {
  var menu = document.getElementById('mobileMenu');
  var hamburger = document.querySelector('.hamburger');
  if (!menu || !menu.classList.contains('show')) return;
  if (!menu.contains(e.target) && (!hamburger || !hamburger.contains(e.target))) {
    closeMenu();
  }
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeMenu();
});


// ==================================================
// 7. Galeria de Imagens (fullscreen + setas)
// ==================================================

var imagens = [];
var indiceAtual = 0;
var _preloadCache = []; // mantém referências vivas para o browser cache

(function () {
  function atualizarMiniaturasAtivas(srcAtiva) {
    document.querySelectorAll('.miniaturas img').forEach(function(thumb) {
      thumb.classList.toggle('ativa', thumb.src === srcAtiva);
    });
  }

  function syncImagensFromThumbs() {
    var thumbs = document.querySelectorAll('.miniaturas img');
    if (thumbs.length) {
      imagens = Array.from(thumbs).map(function(img) { return img.src; });
      var principal = document.getElementById('imagemPrincipal');
      var idx = principal ? imagens.indexOf(principal.src) : -1;
      indiceAtual = idx >= 0 ? idx : 0;
      atualizarMiniaturasAtivas(imagens[indiceAtual]);
    }
  }

  // Pré-carrega todas as imagens da galeria em background
  function preloadGalleryImages() {
    imagens.forEach(function(src, i) {
      if (_preloadCache[i]) return;
      var pre = new Image();
      pre.src = src;
      _preloadCache[i] = pre;
    });
  }

  // Pré-carrega imagens adjacentes ao índice actual (N±1, N±2)
  function preloadAdjacent(index) {
    if (!imagens.length) return;
    [1, -1, 2, -2].forEach(function(offset) {
      var idx = (index + offset + imagens.length) % imagens.length;
      if (_preloadCache[idx]) return;
      var pre = new Image();
      pre.src = imagens[idx];
      _preloadCache[idx] = pre;
    });
  }

  // Troca imagem com crossfade (só em fullscreen para evitar flash no modo normal)
  function setGalleryImage(img, src) {
    var wrapper = img.parentElement;
    var isFullscreen = wrapper && wrapper.classList.contains('tela-cheia');
    var applied = false;

    function applyImage() {
      if (applied) return;
      applied = true;
      img.src = src;
      if (isFullscreen) img.style.opacity = '1';
    }

    if (isFullscreen) img.style.opacity = '0';

    var check = new Image();
    check.onload  = applyImage;
    check.onerror = applyImage;
    check.src = src;
    if (check.complete) applyImage(); // já em cache: aplica imediatamente
  }

  function mudarImagemLocal(direcao) {
    if (!imagens.length) syncImagensFromThumbs();
    indiceAtual = (indiceAtual + direcao + imagens.length) % imagens.length;
    var img = document.getElementById('imagemPrincipal');
    if (img) {
      setGalleryImage(img, imagens[indiceAtual]);
      atualizarMiniaturasAtivas(imagens[indiceAtual]);
      preloadAdjacent(indiceAtual);
    }
  }

  var _fsScrollY = 0;

  function openFullscreen(wrapper) {
    if (!wrapper) return;
    wrapper.classList.add('tela-cheia');
    var btn = wrapper.querySelector('.fechar');
    if (btn) btn.style.display = 'block';
    _fsScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _fsScrollY + 'px';
    document.body.style.width = '100%';
  }

  function closeFullscreen(wrapper) {
    if (!wrapper) return;
    wrapper.classList.remove('tela-cheia');
    var btn = wrapper.querySelector('.fechar');
    if (btn) btn.style.display = 'none';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, _fsScrollY);
  }

  // Devolve true apenas se o clique atingiu os pixels visíveis da imagem
  // (exclui as barras de letterbox do object-fit: contain)
  function isClickOnVisibleImage(e, img) {
    var rect = img.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return false;
    if (!img.naturalWidth || !img.naturalHeight) return true;
    var ratio    = img.naturalWidth / img.naturalHeight;
    var boxRatio = rect.width / rect.height;
    var rW, rH;
    if (ratio > boxRatio) { rW = rect.width;  rH = rect.width  / ratio; }
    else                  { rH = rect.height; rW = rect.height * ratio; }
    var rL = (rect.width  - rW) / 2;
    var rT = (rect.height - rH) / 2;
    return x >= rL && x <= rL + rW && y >= rT && y <= rT + rH;
  }

  window.addEventListener('load', function() {
    syncImagensFromThumbs();
    var wrapper = document.getElementById('galeriaPrincipal');
    var img     = document.getElementById('imagemPrincipal');

    // Pré-carregar imagens adjacentes imediatamente e todas as restantes após 800ms
    preloadAdjacent(indiceAtual);
    setTimeout(preloadGalleryImages, 800);

    if (!wrapper || !img) return;

    wrapper.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('fechar')) return;
      if (wrapper.classList.contains('tela-cheia')) {
        if (!isClickOnVisibleImage(e, img)) closeFullscreen(wrapper);
      } else {
        openFullscreen(wrapper);
      }
    });

    wrapper.querySelectorAll('.seta-esquerda, .seta-direita, .fechar').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation(); });
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && wrapper.classList.contains('tela-cheia')) closeFullscreen(wrapper);
    });
  });

  window.mudarImagem  = function(d) { mudarImagemLocal(d); };
  window.abrirImagem  = function(miniatura) {
    var img     = document.getElementById('imagemPrincipal');
    var wrapper = img && img.parentElement;
    if (!img || !wrapper) return;
    openFullscreen(wrapper); // abre primeiro para o crossfade funcionar
    setGalleryImage(img, miniatura.src);
    indiceAtual = imagens.indexOf(miniatura.src);
    if (indiceAtual < 0) indiceAtual = 0;
    atualizarMiniaturasAtivas(miniatura.src);
    preloadAdjacent(indiceAtual);
  };
  window.fecharImagem = function() {
    var img     = document.getElementById('imagemPrincipal');
    var wrapper = img && img.parentElement;
    if (wrapper) closeFullscreen(wrapper);
  };
})();


// ==================================================
// 8. Navegação por Teclado na Galeria (Desktop)
// Activa apenas nas páginas de pacotes (presença de .galeria)
// Apenas em desktop (≥ 769px) e sem foco em campos de texto
// ==================================================

(function () {
  if (!document.querySelector('.galeria')) return;

  document.addEventListener('keydown', function (e) {
    if (window.innerWidth < 769) return;
    var tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (typeof window.mudarImagem === 'function') window.mudarImagem(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (typeof window.mudarImagem === 'function') window.mudarImagem(1);
    }
  });
})();


// ==================================================
// 9. Tracking de Reservas (Meta Pixel — condicional)
// ==================================================

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a.cta-button, button.cta-button').forEach(function(btn) {
    var text = btn.textContent.toLowerCase();
    if (text.includes('reservar') || text.includes('agendar') || btn.id === 'reservar') {
      btn.addEventListener('click', function() {
        if (typeof fbq !== 'function' || !window.fbqInitialized) return;
        fbq('track', 'InitiateCheckout', {
          button_location: btn.closest('header') ? 'header' : 'page',
          page_url: window.location.pathname
        });
      });
    }
  });
});


// ==================================================
// 10. Google Analytics 4 — Eventos de Negócio
// ==================================================

// Cliques em WhatsApp e telefone via event delegation
document.addEventListener('click', function(e) {
  var link = e.target.closest('a[href]');
  if (!link) return;
  var href = link.getAttribute('href') || '';
  if (href.includes('wa.me')) {
    var h1 = document.querySelector('h1[id]');
    gtagEvent('whatsapp_click', {
      page_location: window.location.href,
      package_name: h1 ? h1.textContent.trim() : undefined
    });
  } else if (href.startsWith('tel:')) {
    gtagEvent('phone_click', { page_location: window.location.href });
  }
});

// Visualização de pacote — detectado por URL, enviado após consentimento
(function() {
  var match = window.location.pathname.match(/\/pacotes\/([^/.]+)\.html/);
  if (match) window.__pendingPackageView = match[1];
})();
