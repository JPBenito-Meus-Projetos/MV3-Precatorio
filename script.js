const menuToggle = document.getElementById("menu-toggle");
const navList = document.getElementById("nav-list");
const header = document.querySelector(".header");

if (menuToggle && navList) {
  menuToggle.addEventListener("click", () => {
    navList.classList.toggle("active");
  });

  navList.querySelectorAll("a").forEach((item) => {
    item.addEventListener("click", () => {
      navList.classList.remove("active");
    });
  });
}

window.addEventListener("scroll", () => {
  if (!header) {
    return;
  }

  if (window.scrollY > 14) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

const revealItems = document.querySelectorAll(".hero, .section, .footer");
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => {
  revealObserver.observe(item);
});

if (header && window.scrollY <= 14) {
  requestAnimationFrame(() => {
    const hero = document.querySelector(".hero");
    if (hero) {
      hero.classList.add("is-visible");
    }
  });
}

const copyButtons = document.querySelectorAll(".copy-contact");

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const textToCopy = button.getAttribute("data-copy");

    if (!textToCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalText = button.textContent;
      button.textContent = "Copiado!";
      button.classList.add("copied");

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, 1300);
    } catch (_error) {
      alert("Não foi possível copiar automaticamente.");
    }
  });
});
