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
  ".reveal, .reveal-stagger, .cases-visual"
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
