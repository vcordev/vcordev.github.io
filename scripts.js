
// ==================================================
// 1. Troca de Idioma
// ==================================================
/**
 * Função para trocar o idioma da página.
 * @param {string} lang - O idioma para o qual a página será traduzida (ex: 'pt', 'ru', 'ro').
 */

// Estado i18n simples e função t()
window.__i18n = {
  lang: localStorage.getItem('language') || 'pt',
  translations: {}, // será preenchido pelo changeLanguage
  pt: null          // opcional: cache de PT para fallback
};

function t(key, fallback = "") {
  const dict = window.__i18n.translations || {};
  if (key in dict) return String(dict[key]);
  // Fallback: devolve o valor de reserva ou a própria chave
  return fallback || key;
}

async function changeLanguage(lang) {
  try {
    // Caminho robusto (funciona na raiz e em subpastas como /pacotes/...)
    const isNested = location.pathname.split("/").filter(Boolean).length > 1;
    const primaryUrl  = `${isNested ? "../" : ""}translations/${lang}.json`;
    const fallbackUrl = `/translations/${lang}.json`;

    let response = await fetch(primaryUrl, { cache: "no-store" });
    if (!response.ok) {
      response = await fetch(fallbackUrl, { cache: "no-store" });
    }
    if (!response.ok) throw new Error(`Erro ao carregar traduções: ${response.status} ${response.statusText}`);

    const translations = await response.json();
    console.log("Traduções carregadas:", translations);

    // Guarda idioma e dicionário para t()
    window.__i18n.lang = lang;
    window.__i18n.translations = translations;

    // (Opcional) carrega PT uma vez para fallback futuro
    if (!window.__i18n.pt) {
      const ptRes = await fetch(`${isNested ? "../" : ""}translations/pt.json`, { cache: "no-store" })
        .catch(() => fetch(`/translations/pt.json`, { cache: "no-store" }));
      if (ptRes?.ok) window.__i18n.pt = await ptRes.json();
    }

    // Atualiza o conteúdo dos elementos com o atributo data-key
    document.querySelectorAll("[data-key]").forEach(element => {
      const key = element.getAttribute("data-key");
      const val = translations[key];

      if (val === undefined || val === null) {
        console.warn(`Chave de tradução não encontrada: ${key}`);
        return;
      }

      const tag = element.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        // Campos de formulário: usar placeholder
        element.setAttribute("placeholder", String(val));
        console.log(`Elemento atualizado (placeholder): ${key} -> ${val}`);
      } else if (tag === "OPTION") {
        // Opções do <select>: traduz o texto visível
        element.textContent = String(val);
        console.log(`Elemento atualizado (option): ${key} -> ${val}`);
      } else {
        // Outros elementos: texto normal
        element.textContent = String(val);
        console.log(`Elemento atualizado: ${key} -> ${val}`);
      }
    });

    // Persistir idioma e atualizar atributo lang do HTML
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    console.log(`Idioma trocado para: ${lang}`);
  } catch (error) {
    console.error("Erro ao carregar traduções:", error);
  }
}

// Carrega o idioma salvo ao iniciar a página
window.addEventListener('load', () => {
  const savedLanguage = localStorage.getItem('language') || 'pt';
  changeLanguage(savedLanguage);
});


// ==================================================
// 2. Validação do Formulário de Contato
// ==================================================
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  const result = document.getElementById("lead-result");
  const button = form.querySelector("button[type='submit']");
  const pais = document.getElementById("pais");
  const prefixo = document.getElementById("prefixo");
  const telemovel = document.getElementById("telemovel");
  const successModal = document.getElementById("success-modal");
  const successBox = successModal?.querySelector(".success-box");

  /* ================================
     1. DETETAR PAÍS AUTOMATICAMENTE
  ================================ */
  async function autoDetectCountry() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      if (data.country_calling_code) {
        prefixo.value = data.country_calling_code;

        // Seleciona opção correspondente se existir
        const option = [...pais.options].find(o => o.value === data.country_calling_code);
        if (option) pais.value = option.value;
      }
    } catch (e) {
      prefixo.value = "+";
    }
  }
  autoDetectCountry();

  /* ==================================
     2. QUANDO O UTILIZADOR MUDA O PAÍS
  ================================== */
  pais.addEventListener("change", () => {
    if (pais.value === "other") {
      prefixo.value = "+";
      prefixo.removeAttribute("readonly");
      prefixo.placeholder = t("prefixo_placeholder", "+XXX");
    } else {
      prefixo.value = pais.value;
      prefixo.setAttribute("readonly", true);
    }
  });

  /* ==================================
     3. INPUT TELEFONE: higienização leve
  ================================== */
  telemovel.addEventListener("input", () => {
    // Permite apenas dígitos, espaço, traço, parênteses (para não bloquear colagens comuns)
    telemovel.value = telemovel.value.replace(/[^\d\s\-()]/g, "");
  });

  /* =====================
     4. SUBMISSÃO DO FORM
  ===================== */
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    limparErros();
    clearMessage();

    const nome = document.getElementById("nome");
    const email = document.getElementById("email");
    const mensagem = document.getElementById("mensagem");

    let erro = false;

    if (!nome.value.trim()) { marcarErro(nome); erro = true; }
    if (!email.value.trim()) { marcarErro(email); erro = true; }
    if (!telemovel.value.trim()) { marcarErro(telemovel); erro = true; }
    if (!mensagem.value.trim()) { marcarErro(mensagem); erro = true; }

    if (erro) {
      mostrarErro(t("erro_campos_obrigatorios", "Por favor, preencha todos os campos."));
      return;
    }

    // Validação de email
    if (!validarEmail(email.value.trim())) {
      marcarErro(email);
      mostrarErro(t("erro_email_invalido", "Por favor, insira um email válido (ex.: nome@dominio.com)."));
      return;
    }

    // Telefone completo (prefixo + número)
    const numeroFinal = (prefixo.value || "") + (telemovel.value || "");
    if (!validarTelemovelCompleto(numeroFinal)) {
      marcarErro(telemovel);
      mostrarErro(t("erro_telemovel_invalido", "Por favor, insira um número de telemóvel válido com indicativo."));
      return;
    }

    // Construir FormData ANTES de usar .set()
    const formData = new FormData(form);

    // --- Normalização para submissão ---
    // 1) telemovel completo (ex.: +351 912345678)
    formData.set("telemovel", numeroFinal.replace(/\s+/g, " ").trim());

    // 2) Enviar 'pais' como iniciais ISO (ex.: PT), e 'prefixo' separado
    const isoPorPrefixo = {
      "+351": "PT", "+373": "MD", "+40": "RO", "+7": "RU", "+375": "BY", "+380": "UA",
      "+992": "TJ", "+993": "TM", "+996": "KG", "+998": "UZ", "+995": "GE", "+374": "AM",
      "+994": "AZ", "+34": "ES", "+33": "FR", "+49": "DE", "+39": "IT", "+44": "GB",
      "+1": "US", "+55": "BR", "+61": "AU", "+81": "JP", "other": "OT"
    };
    const prefixoSelecionado = pais.value;
    formData.set("pais", isoPorPrefixo[prefixoSelecionado] || "INT");

    let prefixoParaEnviar = prefixoSelecionado === "other" ? (prefixo.value || "") : prefixoSelecionado;
    if (prefixoParaEnviar && !prefixoParaEnviar.trim().startsWith("+")) {
      prefixoParaEnviar = "+" + prefixoParaEnviar.replace(/[^\d]/g, "");
    }
    formData.set("prefixo", prefixoParaEnviar);

    // Botão loading
    button.classList.add("loading");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });

      if (response.ok) {
        mostrarSucesso(t("sucesso_envio", "Mensagem enviada com sucesso!"));
        form.reset();
        // Reset do prefixo após reset (para não ficar vazio se país=other)
        if (pais.value === "other") {
          prefixo.value = "+";
          prefixo.removeAttribute("readonly");
          prefixo.placeholder = t("prefixo_placeholder", "+XXX");
        } else {
          prefixo.value = pais.value || "";
          prefixo.setAttribute("readonly", true);
        }
      } else {
        // Tentar obter detalhes do Formspree
        let msg = t("erro_submit_generico", "Ocorreu um erro ao enviar. Tente novamente.");
        try {
          const data = await response.json();
          if (data?.errors?.length) {
            msg = data.errors.map(e => e.message).join(" | ");
          }
        } catch (_) {}
        mostrarErro(msg);
      }
    } catch (error) {
      mostrarErro(t("erro_conexao", "Erro de conexão. Verifique a internet e tente novamente."));
    } finally {
      button.classList.remove("loading");
    }
  });

  /* ======================
     5. FUNÇÕES AUXILIARES
  ====================== */
  function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Validação E.164: começa por +, 7–15 dígitos no total
  function validarTelemovelCompleto(num) {
    // Normaliza: remove espaços/traços/parênteses, garante + no início
    let cleaned = num.replace(/[\s\-()]/g, "");
    if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;

    const re = /^\+[0-9]{7,15}$/;
    return re.test(cleaned);
  }

  function marcarErro(campo) {
    campo.classList.add("input-error");
    campo.setAttribute("aria-invalid", "true");
  }

  function limparErros() {
    document.querySelectorAll(".input-error").forEach(e => {
      e.classList.remove("input-error");
      e.removeAttribute("aria-invalid");
    });
  }

  function showMessage(text, isError = false) {
    result.textContent = text;
    result.style.color = isError ? "#b00020" : "#006400";
    result.classList.add("show");
  }
  function clearMessage() {
    result.textContent = "";
    result.classList.remove("show");
  }
  function mostrarErro(msg) { showMessage(msg, true); }

  function mostrarSucesso(msg) {
  // Se não existir modal nesta página, mostra só a mensagem de estado e sai
  if (!successModal) {
    console.warn("[contactForm] success-modal não encontrado. A mostrar apenas mensagem.");
    showMessage(msg, false);
    return;
  }

  // Atualiza texto do modal (só se existir o <p id="enviado">)
  const enviadoEl = successModal.querySelector("p#enviado");
  if (enviadoEl) enviadoEl.textContent = msg;

  // Mostra modal
  successModal.classList.add("show");

  // Handlers locais com checagens defensivas
  const handleClickOutside = (e) => { if (e.target === successModal) fecharModal(); };
  const handleEsc = (e) => { if (e.key === "Escape") fecharModal(); };
  const handleClickBox = () => fecharModal();

  // successBox pode ser null — usa optional chaining
  const localSuccessBox = successModal.querySelector(".success-box");

  successModal.addEventListener("click", handleClickOutside, { once: true });
  document.addEventListener("keydown", handleEsc, { once: true });
  localSuccessBox?.addEventListener("click", handleClickBox, { once: true });

  // Oculta automaticamente após 3 segundos (opcional)
  setTimeout(() => { fecharModal(); }, 3000);

  // Mensagem de estado por baixo do formulário
  showMessage(msg, false);
	}

	function fecharModal() {
  // Se não existir modal nesta página, não faz nada (evita erro)
  successModal?.classList.remove("show");
	}		

});

// ==================================================
// 3. Fixação do Cabeçalho ao Rolar
// ==================================================
window.addEventListener("scroll", function() {
  const header = document.querySelector(".fixed-header");
  if (!header) return;
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// ==================================================
// 4. Slideshow de Imagens
// ==================================================
document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".slide");
  if (slides.length === 0) return;

  let currentIndex = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    showSlide(currentIndex);
  }

  showSlide(currentIndex);
  setInterval(nextSlide, 10000); // Altera o slide a cada 10 segundos
});

// ==================================================
// 5. Navegação Suave
// ==================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offset = 80; // Ajuste para compensar a altura do cabeçalho fixo
      const targetPosition = target.offsetTop - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ==================================================
// 6. Menu Mobile
// ==================================================
function toggleMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('show');
}
function closeMenu() {
  document.getElementById('mobileMenu')?.classList.remove('show');
}
// Fechar o menu ao clicar em um link
document.querySelectorAll('.mobile-menu a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// ==================================================
// 7. Galeria consolidada (fullscreen + setas + miniaturas)
// ==================================================
let imagens = [
  "../images/torre-de-belem-1.jpg",
  "../images/torre-de-belem-2.jpg",
  "../images/jeronimos.jpg",
  "../images/alfama.jpg"
];
let indiceAtual = 0;

function mudarImagem(direcao) {
  indiceAtual += direcao;
  if (indiceAtual >= imagens.length) {
    indiceAtual = 0;
  } else if (indiceAtual < 0) {
    indiceAtual = imagens.length - 1;
  }
  const imagemPrincipal = document.getElementById('imagemPrincipal');
  if (imagemPrincipal) imagemPrincipal.src = imagens[indiceAtual];
}

function abrirImagem(miniatura) {
  const imagemPrincipal = document.getElementById('imagemPrincipal');
  if (!imagemPrincipal) return;
  imagemPrincipal.src = miniatura.src;
  imagemPrincipal.parentElement?.classList.add('tela-cheia');
}

function fecharImagem() {
  const imagemPrincipal = document.getElementById('imagemPrincipal');
  imagemPrincipal?.parentElement?.classList.remove('tela-cheia');
}

// Atualiza a lista de imagens ao carregar a página
window.addEventListener('load', () => {
  const miniaturas = document.querySelectorAll('.miniaturas img');
  imagens = Array.from(miniaturas).map(img => img.src);
});

// Galeria consolidada (encapsulada)
(function () {
  function syncImagensFromThumbs() {
    const thumbs = document.querySelectorAll('.miniaturas img');
    if (thumbs.length) {
      imagens = Array.from(thumbs).map(img => img.src);
      const principal = document.getElementById('imagemPrincipal');
      const idx = imagens.indexOf(principal?.src);
      indiceAtual = idx >= 0 ? idx : 0;
    }
  }

  function mudarImagemLocal(direcao) {
    if (!imagens.length) syncImagensFromThumbs();
    indiceAtual += direcao;
    if (indiceAtual >= imagens.length) indiceAtual = 0;
    if (indiceAtual < 0) indiceAtual = imagens.length - 1;
    const img = document.getElementById('imagemPrincipal');
    if (img) img.src = imagens[indiceAtual];
  }

  function openFullscreen(wrapper) {
    if (!wrapper) return;
    wrapper.classList.add('tela-cheia');
    const btnClose = wrapper.querySelector('.fechar');
    if (btnClose) btnClose.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeFullscreen(wrapper) {
    if (!wrapper) return;
    wrapper.classList.remove('tela-cheia');
    const btnClose = wrapper.querySelector('.fechar');
    if (btnClose) btnClose.style.display = 'none';
    document.body.style.overflow = '';
  }

  window.addEventListener('load', () => {
    syncImagensFromThumbs();
    const wrapper = document.getElementById('galeriaPrincipal'); // div.imagem-principal
    const img = document.getElementById('imagemPrincipal');
    if (!wrapper || !img) return;

    // 1) Clicar na área da imagem abre/fecha fullscreen
    wrapper.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('fechar')) return;
      const clicouNoWrapper = e.currentTarget === e.target;
      if (wrapper.classList.contains('tela-cheia') && clicouNoWrapper) {
        closeFullscreen(wrapper);
        return;
      }
      if (!wrapper.classList.contains('tela-cheia')) {
        openFullscreen(wrapper);
      }
    });

    // 2) Impedir que clicar na própria imagem ou setas feche por engano
    img.addEventListener('click', (e) => {
      if (wrapper.classList.contains('tela-cheia')) e.stopPropagation();
    });
    wrapper.querySelectorAll('.seta-esquerda, .seta-direita, .fechar').forEach((btn) => {
      btn.addEventListener('click', (e) => e.stopPropagation());
    });

    // 3) Fechar com tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wrapper.classList.contains('tela-cheia')) {
        closeFullscreen(wrapper);
      }
    });
  });

  // expõe funções globais para os onclick do HTML
  window.mudarImagem = function (direcao) { mudarImagemLocal(direcao); };
  window.abrirImagem = function (miniatura) {
    const img = document.getElementById('imagemPrincipal');
    const wrapper = img?.parentElement;
    if (!img || !wrapper) return;
    img.src = miniatura.src;
    openFullscreen(wrapper);
  };
  window.fecharImagem = function () {
    const img = document.getElementById('imagemPrincipal');
    const wrapper = img?.parentElement;
    if (!wrapper) return;
    closeFullscreen(wrapper);
  };
})();
