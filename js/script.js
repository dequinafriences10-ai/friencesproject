/* ==========================================================================
   FRIENCES CAFÉ & PATISSERIE — interactions
   Vanilla JavaScript. No dependencies.
   ========================================================================== */

(function () {
  "use strict";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = qs("#site-header");
  const navToggle = qs("#nav-toggle");
  const mobileMenu = qs("#mobile-menu");
  const mainEl = qs("main");
  const footerEl = qs(".site-footer");
  const backToTop = qs("#back-to-top");
  const heroMedia = qs(".hero-media");

  /* ----------------------------------------------------------------------
     Header: scrolled state, active section, back-to-top visibility
     ---------------------------------------------------------------------- */
  const navLinks = qsa(".nav-link");
  const navSectionIds = ["home", "about", "menu", "cakes", "coffee", "our-space", "gallery", "contact"];
  const navSections = navSectionIds
    .map((id) => ({ id, el: document.getElementById(id) }))
    .filter((item) => item.el);

  let ticking = false;

  function updateOnScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    backToTop.classList.toggle("is-visible", y > 640);

    if (heroMedia && !prefersReducedMotion && window.innerWidth > 900 && y < window.innerHeight) {
      heroMedia.style.transform = `translate3d(0, ${Math.min(y * 0.1, 70)}px, 0)`;
    }

    let activeId = navSections.length ? navSections[0].id : "home";
    navSections.forEach((section) => {
      if (section.el.getBoundingClientRect().top <= 140) activeId = section.id;
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  updateOnScroll();

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    document.body.classList.add("menu-open");
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    navToggle.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
    if (mainEl) mainEl.inert = true;
    if (footerEl) footerEl.inert = true;
    const firstLink = qs("a", mobileMenu);
    if (firstLink) {
      window.requestAnimationFrame(() => {
        firstLink.focus({ preventScroll: true });
      });
    }
  }

  function closeMenu(returnFocus = true) {
    menuOpen = false;
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("menu-open");
    if (mainEl) mainEl.inert = false;
    if (footerEl) footerEl.inert = false;
    if (returnFocus) navToggle.focus({ preventScroll: true });
  }

  navToggle.addEventListener("click", () => {
    if (menuOpen) closeMenu();
    else openMenu();
  });

  qsa("a[href^='#']", mobileMenu).forEach((link) => {
    link.addEventListener("click", () => closeMenu(false));
  });

  qsa("a[href^='#']").forEach((link) => {
    if (mobileMenu.contains(link)) return;
    link.addEventListener("click", () => {
      if (menuOpen) closeMenu(false);
    });
  });

  window.addEventListener("resize", () => {
    if (menuOpen && window.innerWidth > 980) closeMenu(false);
  });

  /* ----------------------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------------------- */
  const revealEls = qsa(".reveal");

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ----------------------------------------------------------------------
     Filters (bakery, cakes, gallery)
     ---------------------------------------------------------------------- */
  qsa("[data-filter-group]").forEach((bar) => {
    const group = bar.dataset.filterGroup;
    const target =
      qs(`[data-filter-target="${group}"]`) ||
      (group === "gallery" ? qs("#gallery-grid") : null);

    if (!target) return;

    const buttons = qsa(".filter-btn", bar);
    const itemSelector = group === "gallery" ? ".gallery-item" : ".product-card";

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;

        buttons.forEach((btn) => {
          const isActive = btn === button;
          btn.classList.toggle("is-active", isActive);
          btn.setAttribute("aria-pressed", String(isActive));
        });

        qsa(itemSelector, target).forEach((item) => {
          const matches = filter === "all" || item.dataset.cat === filter;
          item.classList.toggle("is-filtered", !matches);
          if (matches) item.classList.add("is-visible");
        });
      });
    });
  });

  /* ----------------------------------------------------------------------
     Overlay helpers (focus trap + body lock)
     ---------------------------------------------------------------------- */
  const cakeModal = qs("#cake-modal");
  const beverageModal = qs("#beverage-modal");
  const lightbox = qs("#lightbox");
  let lastFocusedElement = null;

  function overlayOpen() {
    return [cakeModal, beverageModal, lightbox].some((el) => el && !el.hidden);
  }

  function syncBodyLock() {
    document.body.classList.toggle("modal-open", overlayOpen() || menuOpen);
  }

  function focusableIn(container) {
    return qsa(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);
  }

  function trapFocus(event, container) {
    if (event.key !== "Tab") return;
    const focusable = focusableIn(container);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ----------------------------------------------------------------------
     Cake details modal
     ---------------------------------------------------------------------- */
  let currentCakeName = "";

  function openCakeModal(trigger) {
    lastFocusedElement = trigger;

    const name = trigger.dataset.name || "Cake";
    currentCakeName = name;

    qs("#cake-modal-title").textContent = name;
    qs("#cake-modal-cat").textContent = trigger.dataset.cat || "Cake";
    qs("#cake-modal-price").textContent = trigger.dataset.price || "";
    qs("#cake-modal-desc").textContent = trigger.dataset.desc || "";
    qs("#cake-modal-size").textContent = trigger.dataset.size || "Please ask about available sizes.";

    const img = qs("#cake-modal-img");
    img.src = trigger.dataset.img || "";
    img.alt = `${name} — ${trigger.dataset.cat || "cake"}`;

    cakeModal.hidden = false;
    syncBodyLock();
    const closeBtn = qs(".modal-close", cakeModal);
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal, returnFocus = true) {
    if (!modal) return;
    modal.hidden = true;
    syncBodyLock();
    if (returnFocus && lastFocusedElement) {
      lastFocusedElement.focus({ preventScroll: true });
      lastFocusedElement = null;
    }
  }

  qsa("[data-cake]").forEach((button) => {
    button.addEventListener("click", () => openCakeModal(button));
  });

  qsa("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      closeModal(modal);
    });
  });

  [cakeModal, beverageModal].forEach((modal) => {
    if (!modal) return;
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });

  /* ----------------------------------------------------------------------
     Cake inquiry prefill from modal
     ---------------------------------------------------------------------- */
  const cakeEnquireBtn = qs("#cake-modal-enquire");

  if (cakeEnquireBtn) {
    cakeEnquireBtn.addEventListener("click", () => {
      closeModal(cakeModal, false);

      const typeSelect = qs("#ci-type");
      if (typeSelect) {
        const options = Array.from(typeSelect.options).map((option) => option.value);
        typeSelect.value = options.includes(currentCakeName) ? currentCakeName : "Custom / Other";
      }

      const inquiry = qs("#cake-inquiry");
      if (inquiry) {
        window.setTimeout(() => {
          inquiry.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "start",
          });
          const nameField = qs("#ci-name");
          if (nameField) nameField.focus({ preventScroll: true });
        }, 80);
      }
    });
  }

  /* ----------------------------------------------------------------------
     Beverage menu modal (built from the on-page menu)
     ---------------------------------------------------------------------- */
  const beverageModalGroups = qs("#beverage-modal-groups");
  const openBeverageBtn = qs("#open-beverage-menu");

  if (openBeverageBtn && beverageModalGroups) {
    openBeverageBtn.addEventListener("click", () => {
      beverageModalGroups.innerHTML = "";
      qsa(".coffee-menu .menu-group").forEach((group) => {
        beverageModalGroups.appendChild(group.cloneNode(true));
      });

      lastFocusedElement = openBeverageBtn;
      beverageModal.hidden = false;
      syncBodyLock();
      const closeBtn = qs(".modal-close", beverageModal);
      if (closeBtn) closeBtn.focus();
    });
  }

  /* ----------------------------------------------------------------------
     Forms: validation + demonstration confirmation
     ---------------------------------------------------------------------- */
  const requiredMessages = {
    name: "Please enter your name.",
    email: "Please enter your email address.",
    phone: "Please enter your contact number.",
    cakeType: "Please choose a cake type.",
    cakeSize: "Please choose a preferred size.",
    flavor: "Please choose a flavour.",
    subject: "Please add a subject.",
    message: "Please write a short message.",
  };

  function errorFor(input) {
    const value = input.value.trim();

    if (!value) {
      return requiredMessages[input.name] || "This field is required.";
    }
    if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return "Please enter a valid email address, like name@example.com.";
    }
    if (input.type === "tel") {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        return "Please enter a valid contact number.";
      }
    }
    if (input.name === "name" && value.length < 2) {
      return "Please enter your full name.";
    }
    if (input.name === "message" && value.length < 5) {
      return "Please write a little more so we can help.";
    }
    return "";
  }

  function showFieldError(input, message) {
    const errorEl = document.getElementById(`${input.id}-error`);
    if (message) {
      input.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
    } else {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.hidden = true;
      }
    }
  }

  function validateField(input) {
    const message = errorFor(input);
    showFieldError(input, message);
    return message === "";
  }

  function initForm(formId, successId, resetId) {
    const form = qs(`#${formId}`);
    const success = qs(`#${successId}`);
    const resetBtn = qs(`#${resetId}`);
    if (!form || !success) return;

    const fields = qsa("input[required], select[required], textarea[required]", form);

    fields.forEach((field) => {
      const liveValidate = () => {
        if (field.classList.contains("is-invalid")) validateField(field);
      };
      field.addEventListener("input", liveValidate);
      field.addEventListener("change", liveValidate);
      field.addEventListener("blur", () => {
        if (field.value.trim() !== "") validateField(field);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      let firstInvalid = null;
      fields.forEach((field) => {
        const valid = validateField(field);
        if (!valid && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        });
        return;
      }

      form.hidden = true;
      success.hidden = false;
      success.focus({ preventScroll: true });
      success.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
      form.reset();
      fields.forEach((field) => showFieldError(field, ""));
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        success.hidden = true;
        form.hidden = false;
        form.reset();
        fields.forEach((field) => showFieldError(field, ""));
        const firstField = qs("input, select, textarea", form);
        if (firstField) firstField.focus({ preventScroll: true });
      });
    }
  }

  initForm("cake-inquiry-form", "cake-success", "cake-reset");
  initForm("contact-form", "contact-success", "contact-reset");

  /* ----------------------------------------------------------------------
     Gallery lightbox
     ---------------------------------------------------------------------- */
  let visibleGalleryItems = [];
  let galleryIndex = 0;

  function renderLightbox() {
    if (!visibleGalleryItems.length) return;
    const item = visibleGalleryItems[galleryIndex];
    const sourceImg = qs("img", item);
    const lbImg = qs("#lb-img");

    lbImg.src = item.dataset.src || (sourceImg ? sourceImg.src : "");
    lbImg.alt = sourceImg ? sourceImg.alt : "";
    qs("#lb-caption").textContent = item.dataset.caption || "";
    qs("#lb-counter").textContent = `${galleryIndex + 1} / ${visibleGalleryItems.length}`;
  }

  function openLightbox(item) {
    visibleGalleryItems = qsa(".gallery-item").filter(
      (el) => !el.classList.contains("is-filtered")
    );
    galleryIndex = Math.max(0, visibleGalleryItems.indexOf(item));
    lastFocusedElement = item;
    renderLightbox();
    lightbox.hidden = false;
    syncBodyLock();
    qs("#lb-close").focus();
  }

  function showNextImage(direction) {
    if (!visibleGalleryItems.length) return;
    galleryIndex = (galleryIndex + direction + visibleGalleryItems.length) % visibleGalleryItems.length;
    renderLightbox();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    syncBodyLock();
    if (lastFocusedElement) {
      lastFocusedElement.focus({ preventScroll: true });
      lastFocusedElement = null;
    }
  }

  qsa(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => openLightbox(item));
  });

  qs("#lb-prev").addEventListener("click", () => showNextImage(-1));
  qs("#lb-next").addEventListener("click", () => showNextImage(1));
  qs("#lb-close").addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  /* ----------------------------------------------------------------------
     Global keyboard support
     ---------------------------------------------------------------------- */
  document.addEventListener("keydown", (event) => {
    if (lightbox && !lightbox.hidden) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showNextImage(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage(1);
      } else {
        trapFocus(event, lightbox);
      }
      return;
    }

    if (cakeModal && !cakeModal.hidden) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal(cakeModal);
      } else {
        trapFocus(event, cakeModal);
      }
      return;
    }

    if (beverageModal && !beverageModal.hidden) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal(beverageModal);
      } else {
        trapFocus(event, beverageModal);
      }
      return;
    }

    if (menuOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      } else {
        trapFocus(event, mobileMenu);
      }
    }
  });
})();
