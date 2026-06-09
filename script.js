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

let formFeedbackTimeout;

function hideFormFeedback() {
  if (!formFeedback) return;
  formFeedback.hidden = true;
  formFeedback.textContent = "";
  formFeedback.className = "form-feedback";
}

function showFormFeedback(message, type, autoHideMs = type === "success" ? 5000 : 6000) {
  if (!formFeedback) return;

  if (formFeedbackTimeout) {
    clearTimeout(formFeedbackTimeout);
  }

  formFeedback.textContent = message;
  formFeedback.hidden = false;
  formFeedback.className = `form-feedback is-${type}`;

  if (autoHideMs > 0) {
    formFeedbackTimeout = setTimeout(hideFormFeedback, autoHideMs);
  }
}

function clearFormErrors(form) {
  form.querySelectorAll(".form-group.is-invalid").forEach((group) => {
    group.classList.remove("is-invalid");
  });
}

function validatePropostaForm(form) {
  const rules = [
    {
      name: "nome",
      test: (v) => v.trim().length >= 2,
      message: "Informe seu nome completo.",
    },
    {
      name: "email",
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: "Informe um e-mail válido.",
    },
    {
      name: "telefone",
      test: (v) => v.replace(/\D/g, "").length >= 10,
      message: "Informe um telefone válido com DDD.",
    },
    {
      name: "processo",
      test: (v) => v.replace(/\D/g, "").length >= 7,
      message: "Informe o número do processo.",
    },
    {
      name: "valor",
      test: (v) => {
        const digits = v.replace(/\D/g, "");
        return digits.length > 0 && Number(digits) > 0;
      },
      message: "Informe o valor do precatório.",
    },
  ];

  clearFormErrors(form);

  for (const rule of rules) {
    const field = form.elements[rule.name];
    if (!field) continue;

    const isValid = rule.test(field.value);
    const group = field.closest(".form-group");

    if (!isValid) {
      group?.classList.add("is-invalid");
      return { valid: false, message: rule.message };
    }
  }

  return { valid: true };
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
  const defaultBtnText = submitBtn?.textContent ?? "Enviar proposta";

  contatoForm.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      field.closest(".form-group")?.classList.remove("is-invalid");
      hideFormFeedback();
    });
  });

  contatoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const validation = validatePropostaForm(contatoForm);
    if (!validation.valid) {
      showFormFeedback(validation.message, "error");
      contatoForm.querySelector(".form-group.is-invalid input, .form-group.is-invalid textarea")?.focus();
      return;
    }

    const data = new FormData(contatoForm);
    const payload = {
      nome: data.get("nome"),
      email: data.get("email"),
      telefone: data.get("telefone"),
      processo: data.get("processo"),
      valor: data.get("valor"),
      observacao: data.get("observacao") || "",
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
    }

    try {
      const response = await fetch("/api/enviar-proposta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        showFormFeedback(result.message || "Não foi possível enviar a proposta.", "error");
        return;
      }

      showFormFeedback(result.message, "success");
      contatoForm.reset();
    } catch {
      showFormFeedback(
        "Erro de conexão. Inicie o servidor com npm start e acesse http://localhost:3000",
        "error"
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = defaultBtnText;
      }
    }
  });
}
