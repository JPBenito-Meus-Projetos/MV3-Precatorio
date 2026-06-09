const header = document.getElementById("header");
const menuToggle = document.getElementById("menu-toggle");
const nav = document.getElementById("nav");
const heroContent = document.querySelector(".hero-content");

const HEADER_SCROLL_THRESHOLD = 50;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function onScroll() {
  if (header) {
    header.classList.toggle("scrolled", window.scrollY > HEADER_SCROLL_THRESHOLD);
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initHeroEntrance() {
  if (!heroContent) return;

  if (prefersReducedMotion) {
    heroContent.classList.add("hero-loaded");
    heroContent.querySelectorAll(".hero-animate").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  requestAnimationFrame(() => {
    heroContent.classList.add("hero-loaded");
  });
}

initHeroEntrance();

const revealElements = document.querySelectorAll(
  ".reveal, .reveal-stagger, .processo-visual"
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
);

revealElements.forEach((el) => revealObserver.observe(el));

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = header ? header.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  });
});

const PROPOSTA_EMAIL = "joao.benito@mv3.com.br";

const contatoForm = document.getElementById("contato-form");
const formFeedback = document.getElementById("form-feedback");
const telefoneInput = document.getElementById("telefone");

function formatTelefone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatValor(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const number = Number(digits) / 100;
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function showFormFeedback(message, type) {
  if (!formFeedback) return;
  formFeedback.textContent = message;
  formFeedback.hidden = false;
  formFeedback.className = `form-feedback is-${type}`;
}

if (telefoneInput) {
  telefoneInput.addEventListener("input", (e) => {
    e.target.value = formatTelefone(e.target.value);
  });
}

const valorInput = document.getElementById("valor");
if (valorInput) {
  valorInput.addEventListener("input", (e) => {
    e.target.value = formatValor(e.target.value);
  });
}

function formatProcesso(value) {
  const digits = value.replace(/\D/g, "").slice(0, 20);
  let result = digits.slice(0, 7);
  if (digits.length > 7) result += `-${digits.slice(7, 9)}`;
  if (digits.length > 9) result += `.${digits.slice(9, 13)}`;
  if (digits.length > 13) result += `.${digits.slice(13, 14)}`;
  if (digits.length > 14) result += `.${digits.slice(14, 16)}`;
  if (digits.length > 16) result += `.${digits.slice(16, 20)}`;
  return result;
}

const processoInput = document.getElementById("processo");
if (processoInput) {
  processoInput.addEventListener("input", (e) => {
    e.target.value = formatProcesso(e.target.value);
  });
}

if (contatoForm) {
  const submitBtn = contatoForm.querySelector('button[type="submit"]');
  const submitBtnText = submitBtn?.textContent?.trim() || "Enviar proposta";

  contatoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!contatoForm.checkValidity()) {
      contatoForm.reportValidity();
      showFormFeedback("Preencha todos os campos obrigatórios.", "error");
      return;
    }

    const data = new FormData(contatoForm);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
    }
    showFormFeedback("Enviando sua proposta...", "success");

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${PROPOSTA_EMAIL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: "Venda de Precatório — MNPR Capital",
          _template: "table",
          _captcha: "false",
          name: data.get("nome"),
          email: data.get("email"),
          telefone: data.get("telefone"),
          processo: data.get("processo"),
          valor: data.get("valor"),
          observacao: data.get("observacao") || "—",
        }),
      });

      const result = await response.json();
      const isSuccess = result.success === true || result.success === "true";

      if (!response.ok || !isSuccess) {
        throw new Error(result.message || "Não foi possível enviar a proposta.");
      }

      showFormFeedback("Proposta enviada com sucesso! Entraremos em contato em breve.", "success");
      contatoForm.reset();
    } catch (error) {
      const isLocalFile = window.location.protocol === "file:";
      const message = isLocalFile
        ? "Para testar o envio, abra o site por um servidor local (ex.: Live Server)."
        : error.message?.includes("web server")
          ? "Abra o site por um servidor local para enviar o formulário."
          : "Não foi possível enviar. Tente novamente em instantes.";
      showFormFeedback(message, "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtnText;
      }
    }
  });
}
