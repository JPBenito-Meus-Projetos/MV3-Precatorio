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

function closeMobileMenu() {
  if (!nav || !menuToggle) return;
  nav.classList.remove("open");
  menuToggle.classList.remove("active");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.focus();
}

function openMobileMenu() {
  if (!nav || !menuToggle) return;
  nav.classList.add("open");
  menuToggle.classList.add("active");
  menuToggle.setAttribute("aria-expanded", "true");
  nav.querySelector("a")?.focus();
}

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    if (nav.classList.contains("open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  nav.addEventListener("keydown", (e) => {
    if (!nav.classList.contains("open") || e.key !== "Tab") return;
    const focusable = [...nav.querySelectorAll("a[href]")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      closeMobileMenu();
    }
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
  ".reveal, .reveal-stagger, .reveal-img"
);

if (prefersReducedMotion) {
  revealElements.forEach((el) => el.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
}

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

function getFieldErrorEl(field) {
  if (!field?.name && !field?.id) return null;
  if (field.type === "checkbox") return null;

  const id = `${field.name || field.id}-error`;
  let el = document.getElementById(id);
  if (!el && field.parentElement) {
    el = document.createElement("span");
    el.id = id;
    el.className = "field-error";
    el.setAttribute("role", "alert");
    field.parentElement.appendChild(el);
    const describedBy = field.getAttribute("aria-describedby");
    field.setAttribute("aria-describedby", describedBy ? `${describedBy} ${id}` : id);
  }
  return el;
}

const consentError = document.getElementById("consent-error");
const consentGroup = document.getElementById("consent-group");

function setConsentInvalid(message) {
  const consentField = document.getElementById("consent");
  consentField?.setAttribute("aria-invalid", "true");
  consentGroup?.classList.add("is-invalid");
  if (consentError) {
    consentError.textContent = message;
    consentError.hidden = false;
  }
}

function clearConsentError() {
  const consentField = document.getElementById("consent");
  consentField?.removeAttribute("aria-invalid");
  consentGroup?.classList.remove("is-invalid");
  if (consentError) {
    consentError.textContent = "";
    consentError.hidden = true;
  }
}

function setFieldInvalid(field, group, message) {
  field?.setAttribute("aria-invalid", "true");
  group?.classList.add("is-invalid");
  const err = getFieldErrorEl(field);
  if (err) {
    err.textContent = message;
    err.hidden = false;
  }
}

function clearFormErrors(form) {
  form.querySelectorAll(".form-group.is-invalid").forEach((group) => {
    group.classList.remove("is-invalid");
  });
  form.querySelectorAll("[aria-invalid]").forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
  form.querySelectorAll(".field-error").forEach((err) => {
    err.textContent = "";
    err.hidden = true;
  });
  clearConsentError();
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
      name: "perfil",
      test: (v) => ["empresa", "advogado", "pessoa_fisica", "servidor_publico", "outro"].includes(v),
      message: "Selecione seu perfil.",
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
      setFieldInvalid(field, group, rule.message);
      return { valid: false, message: rule.message, field };
    }
  }

  const perfilField = form.elements.perfil;
  const perfilOutroField = form.elements.perfil_outro;
  const perfilOutroGroup = document.getElementById("perfil-outro-group");

  if (perfilField?.value === "outro") {
    const outroVal = String(perfilOutroField?.value ?? "").trim();
    if (!outroVal || outroVal.length < 2) {
      setFieldInvalid(
        perfilOutroField,
        perfilOutroGroup,
        "Especifique seu perfil — campo obrigatório."
      );
      return {
        valid: false,
        message: "Especifique seu perfil — campo obrigatório.",
        field: perfilOutroField,
      };
    }
  }

  const consentField = form.elements.consent;
  if (!consentField?.checked) {
    setConsentInvalid("Marque a caixa para aceitar a Política de Privacidade.");
    return {
      valid: false,
      message: "Marque a caixa para aceitar a Política de Privacidade.",
      field: consentField,
      consentOnly: true,
    };
  }

  return { valid: true };
}

const perfilSelect = document.getElementById("perfil");
const perfilOutroGroup = document.getElementById("perfil-outro-group");
const perfilOutroInput = document.getElementById("perfil_outro");

function isPerfilOutroValid(value) {
  return String(value ?? "").trim().length >= 2;
}

function togglePerfilOutro() {
  if (!perfilSelect || !perfilOutroGroup || !perfilOutroInput) return;

  const isOutro = perfilSelect.value === "outro";
  perfilOutroGroup.hidden = !isOutro;
  perfilOutroInput.required = isOutro;
  perfilOutroInput.setAttribute("aria-required", String(isOutro));

  if (!isOutro) {
    perfilOutroInput.value = "";
    perfilOutroInput.removeAttribute("aria-invalid");
    perfilOutroGroup.classList.remove("is-invalid");
    const err = perfilOutroGroup.querySelector(".field-error");
    if (err) {
      err.textContent = "";
      err.hidden = true;
    }
  } else {
    requestAnimationFrame(() => perfilOutroInput.focus());
  }
}

function validatePerfilOutroField(showError = true) {
  if (!perfilSelect || !perfilOutroInput || perfilSelect.value !== "outro") return true;

  const valid = isPerfilOutroValid(perfilOutroInput.value);
  if (!valid && showError) {
    setFieldInvalid(
      perfilOutroInput,
      perfilOutroGroup,
      "Especifique seu perfil — campo obrigatório."
    );
  }
  return valid;
}

if (perfilSelect) {
  perfilSelect.addEventListener("change", togglePerfilOutro);
  togglePerfilOutro();
}

if (perfilOutroInput) {
  perfilOutroInput.addEventListener("blur", () => validatePerfilOutroField(true));
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

  contatoForm.querySelectorAll("input, select, textarea").forEach((field) => {
    const clearError = () => {
      const group = field.closest(".form-group");
      group?.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
      const err = group?.querySelector(".field-error");
      if (err) {
        err.textContent = "";
        err.hidden = true;
      }
      if (field.name === "consent" || field.id === "consent") {
        clearConsentError();
      }
      hideFormFeedback();
    };
    field.addEventListener("input", clearError);
    field.addEventListener("change", clearError);
  });

  contatoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const honeypot = contatoForm.elements.website?.value?.trim();
    if (honeypot) return;

    const validation = validatePropostaForm(contatoForm);
    if (!validation.valid) {
      if (validation.consentOnly) {
        hideFormFeedback();
      } else {
        showFormFeedback(validation.message, "error");
      }
      validation.field?.focus();
      return;
    }

    const data = new FormData(contatoForm);
    const perfil = String(data.get("perfil") ?? "").trim();
    const perfilOutro =
      perfil === "outro" ? String(data.get("perfil_outro") ?? "").trim() : "";

    if (perfil === "outro" && !isPerfilOutroValid(perfilOutro)) {
      validatePerfilOutroField(true);
      showFormFeedback("Especifique seu perfil — campo obrigatório.", "error");
      perfilOutroInput?.focus();
      return;
    }

    const payload = {
      nome: String(data.get("nome") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      perfil,
      perfil_outro: perfilOutro,
      telefone: String(data.get("telefone") ?? "").trim(),
      processo: String(data.get("processo") ?? "").trim(),
      valor: String(data.get("valor") ?? "").trim(),
      observacao: String(data.get("observacao") ?? "").trim(),
      consent: contatoForm.elements.consent?.checked === true,
      website: "",
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
      togglePerfilOutro();
    } catch {
      const isLocal =
        location.hostname === "localhost" || location.hostname === "127.0.0.1";
      showFormFeedback(
        isLocal
          ? "Erro de conexão. Inicie o servidor com npm start e acesse http://localhost:3000"
          : "Erro de conexão. Tente novamente em alguns instantes.",
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
