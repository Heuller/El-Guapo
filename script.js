/*
 * ═══════════════════════════════════════════════════════════════════
 * EL GUAPO — SCRIPT PRINCIPAL v5.1
 * Clean Code, Wake Lock, Kitchen Mode, Timers & PWA
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  "use strict";

  /* ── 1. VARIÁVEIS GLOBAIS & ESTADO ── */
  const nav = document.getElementById("nav");
  const idxBtn = document.getElementById("idx-btn");
  const heroEl = document.querySelector(".hero");
  const timerDock = document.getElementById("timer-dock");
  const timerMap = new Map();
  let wakeLock = null;

  // Estado do Modo Cozinha
  const kitchenModeOverlay = document.getElementById("kitchen-mode-overlay");
  const kitchenModeClose = document.getElementById("kitchen-mode-close");
  const kitchenModePrev = document.getElementById("kitchen-mode-prev");
  const kitchenModeNext = document.getElementById("kitchen-mode-next");
  const kitchenModeStepNumber = document.getElementById(
    "kitchen-mode-step-number",
  );
  const kitchenModeStepText = document.getElementById("kitchen-mode-step-text");
  const kitchenModeRecipeName = document.getElementById(
    "kitchen-mode-recipe-name",
  );
  const kitchenModeProgress = document.getElementById("kitchen-mode-progress");

  let currentRecipeSteps = [];
  let currentStepIndex = 0;

  // Estado do Modal (Mise en Place / Lista de Compras)
  const modalOverlay = document.getElementById("modal-overlay");
  const modalClose = document.getElementById("modal-close");
  const modalTitle = document.getElementById("modal-title");
  const modalSubtitle = document.getElementById("modal-subtitle");
  const modalBody = document.getElementById("modal-body");

  function openModal(title, subtitle, content) {
    if (!modalOverlay) return;
    modalTitle.textContent = title;
    modalSubtitle.textContent = subtitle;
    modalBody.innerHTML = "";
    modalBody.appendChild(content);
    modalOverlay.classList.add("active");
    modalOverlay.setAttribute("aria-hidden", "false");
    if (modalClose) modalClose.focus();
    enableFocusTrap(modalOverlay);
    toggleScroll(false);
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("active");
    modalOverlay.setAttribute("aria-hidden", "true");
    disableFocusTrap();
    toggleScroll(true);
  }

  function toggleScroll(enable) {
    document.body.style.overflow = enable ? "" : "hidden";
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  /* ── 2. NAVEGAÇÃO & UI BÁSICA ── */
  const hamburger = document.getElementById("nav-hamburger");
  const drawer = document.getElementById("nav-drawer");
  const drawerOverlay = document.getElementById("nav-drawer-overlay");
  const drawerClose = document.getElementById("nav-drawer-close");
  const drawerLinks = document.querySelectorAll(".nav-drawer-links a");

  const toggleDrawer = (isOpen) => {
    if (!drawer || !hamburger) return;
    drawer.classList.toggle("open", isOpen);
    drawer.setAttribute("aria-hidden", String(!isOpen));
    hamburger.setAttribute("aria-expanded", String(isOpen));
    if (drawerOverlay) {
      drawerOverlay.classList.toggle("open", isOpen);
      drawerOverlay.setAttribute("aria-hidden", String(!isOpen));
    }
    toggleScroll(!isOpen);
    if (isOpen) {
      enableFocusTrap(drawer);
    } else {
      disableFocusTrap();
    }
  };

  function syncRecipeAccessibility(card, open) {
    const head = card.querySelector(".rc-head");
    const body = card.querySelector(".rc-body");
    if (!head || !body) return;
    if (!body.id) body.id = `${card.id || "recipe"}-body`;
    head.setAttribute("aria-controls", body.id);
    body.setAttribute("aria-hidden", String(!open));
  }

  /* Focus trap utilities for drawer/modal */
  let _prevFocus = null;
  let _trapContainer = null;
  function enableFocusTrap(container) {
    if (!container) return;
    _prevFocus = document.activeElement;
    _trapContainer = container;
    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length) focusable[0].focus();
    document.addEventListener("focus", _keepFocus, true);
  }

  function disableFocusTrap() {
    document.removeEventListener("focus", _keepFocus, true);
    if (_prevFocus && typeof _prevFocus.focus === "function")
      _prevFocus.focus();
    _prevFocus = null;
    _trapContainer = null;
  }

  function _keepFocus(e) {
    if (!_trapContainer) return;
    if (_trapContainer.contains(e.target)) return;
    e.stopPropagation();
    const focusable = _trapContainer.querySelectorAll(
      'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length) focusable[0].focus();
  }

  if (hamburger) hamburger.addEventListener("click", () => toggleDrawer(true));
  if (drawerClose)
    drawerClose.addEventListener("click", () => toggleDrawer(false));
  if (drawerOverlay)
    drawerOverlay.addEventListener("click", () => toggleDrawer(false));
  drawerLinks.forEach((link) =>
    link.addEventListener("click", () => toggleDrawer(false)),
  );

  window.addEventListener(
    "scroll",
    () => {
      const scrolled = window.scrollY;
      if (nav) nav.classList.toggle("solid", scrolled > 50);
      if (idxBtn && heroEl) {
        idxBtn.classList.toggle(
          "visible",
          scrolled > heroEl.offsetHeight * 0.75,
        );
      }
    },
    { passive: true },
  );

  // Intersection Observer para fade-in
  const fadeObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          fadeObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.06 },
  );
  document
    .querySelectorAll(".js-fade, .recipe-card")
    .forEach((el) => fadeObs.observe(el));

  // Nav Link Ativa
  const navLinks = document.querySelectorAll(".nav-links a");
  const secObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.getAttribute("id");
          navLinks.forEach((a) =>
            a.classList.toggle(
              "nav-active",
              a.getAttribute("href") === `#${id}`,
            ),
          );
        }
      });
    },
    { rootMargin: "-38% 0px -55% 0px" },
  );
  document.querySelectorAll("section[id]").forEach((s) => secObs.observe(s));

  /* ── 3. ACCORDION & INJEÇÃO DE COMPONENTES ── */
  document.addEventListener("click", (e) => {
    if (
      e.target.closest(
        ".kitchen-btn, .rc-user-notes-head, .rc-user-notes-save, .rc-scale-btn, .search-clear, .timer-btn, .timer-cancel",
      )
    )
      return;

    const head = e.target.closest(".rc-head");
    if (!head) return;

    const card = head.closest(".recipe-card");
    const wasOpen = card.classList.contains("open");
    if (!wasOpen) {
      document.querySelectorAll(".recipe-card.open").forEach((other) => {
        if (other !== card) {
          other.classList.remove("open");
          syncRecipeAccessibility(other, false);
        }
      });
    }
    const isOpen = card.classList.toggle("open");
    syncRecipeAccessibility(card, isOpen);
    head.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      setTimeout(() => injectTimerButtons(card), 60);
      requestWakeLock();
    }
  });

  document.addEventListener("keydown", (e) => {
    const head = e.target.closest(".rc-head");
    const timerCard = e.target.closest(".timer-card");

    if (e.key === "Enter" || e.key === " ") {
      if (head) {
        e.preventDefault();
        head.click();
      } else if (timerCard) {
        e.preventDefault();
        timerCard.click();
      }
    }
    if (e.key === "Escape") {
      if (drawer && drawer.classList.contains("open")) {
        toggleDrawer(false);
        return;
      }
      if (modalOverlay && modalOverlay.classList.contains("active")) {
        closeModal();
        return;
      }
      if (
        kitchenModeOverlay &&
        kitchenModeOverlay.classList.contains("active") &&
        kitchenModeClose
      ) {
        kitchenModeClose.click();
        return;
      }
    }
  });

  /* ── 4. BUSCA ── */
  const searchInput = document.getElementById("recipe-search");
  const searchClear = document.getElementById("search-clear");

  if (searchInput) {
    const doSearch = () => {
      const q = searchInput.value.trim().toLowerCase();
      if (searchClear) searchClear.style.display = q ? "block" : "none";

      document.querySelectorAll(".recipe-card").forEach((card) => {
        card.classList.toggle(
          "search-hidden",
          q.length > 0 && !card.textContent.toLowerCase().includes(q),
        );
      });

      document.querySelectorAll("section[id]").forEach((sec) => {
        const wrap = sec.querySelector(".recipe-wrap");
        if (!wrap) return;
        const cards = wrap.querySelectorAll(".recipe-card");
        const visible = [...cards].filter(
          (c) => !c.classList.contains("search-hidden"),
        );
        let msg = wrap.querySelector(".search-no-results");

        if (q && visible.length === 0 && cards.length > 0) {
          if (!msg) {
            msg = document.createElement("div");
            msg.className = "section-empty search-no-results";
            msg.innerHTML = `<span class="section-empty-line"></span><span class="section-empty-text">Nenhuma receita encontrada</span><span class="section-empty-line"></span>`;
            wrap.appendChild(msg);
          }
          msg.style.display = "flex";
        } else if (msg) {
          msg.style.display = "none";
        }
      });
    };

    const debounce = (fn, wait = 120) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    };

    const debouncedSearch = debounce(doSearch, 120);
    searchInput.addEventListener("input", debouncedSearch);

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        searchInput.value = "";
        searchInput.dispatchEvent(new Event("input"));
        searchInput.focus();
      });
    }
  }

  /* ── 5. WAKE LOCK API ── */
  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLock = await navigator.wakeLock.request("screen");
      }
    } catch (err) {
      console.warn(`Wake Lock indisponível: ${err.name}`);
    }
  }

  document.addEventListener("visibilitychange", async () => {
    if (document.hidden && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  });

  /* ── 6. MODO COZINHA (OVERLAY) ── */
  function startKitchenMode(card) {
    const recipeName = card.querySelector(".rc-name")?.textContent || "Receita";
    const steps = Array.from(card.querySelectorAll(".rc-step-text"));

    if (steps.length === 0)
      return alert("Esta receita não possui passos detalhados.");

    currentRecipeSteps = steps.map((step) => step.innerHTML);
    currentStepIndex = 0;

    if (kitchenModeRecipeName) kitchenModeRecipeName.textContent = recipeName;
    displayKitchenStep();

    if (kitchenModeOverlay) {
      kitchenModeOverlay.classList.add("active");
      kitchenModeOverlay.setAttribute("aria-hidden", "false");
      enableFocusTrap(kitchenModeOverlay);
    }
    toggleScroll(false);
    requestWakeLock();
  }

  function displayKitchenStep(direction = "next") {
    if (currentStepIndex < 0 || currentStepIndex >= currentRecipeSteps.length)
      return;

    const stepNum = currentStepIndex + 1;
    const stepText = currentRecipeSteps[currentStepIndex];

    if (kitchenModeStepText) {
      // Animação de saída
      kitchenModeStepText.classList.add(
        direction === "next" ? "page-exit" : "page-enter",
      );

      setTimeout(() => {
        if (kitchenModeStepNumber)
          kitchenModeStepNumber.textContent = `Passo ${stepNum}`;
        kitchenModeStepText.innerHTML = stepText;
        delete kitchenModeStepText.dataset.timerButtonsInjected;
        injectTimerButtons(kitchenModeStepText);
        // leitura por voz do passo (se ativada)
        try {
          const plain = kitchenModeStepText.textContent || stepText;
          speak(`Passo ${stepNum}. ${plain}`);
        } catch (_) {}

        // Animação de entrada
        kitchenModeStepText.classList.remove("page-exit", "page-enter");
        kitchenModeStepText.style.opacity = "0";
        kitchenModeStepText.style.transform =
          direction === "next" ? "translateX(20px)" : "translateX(-20px)";

        requestAnimationFrame(() => {
          kitchenModeStepText.style.transition = "all 0.4s var(--ease-out)";
          kitchenModeStepText.style.opacity = "1";
          kitchenModeStepText.style.transform = "translateX(0)";
        });
      }, 250);
    }

    if (kitchenModeProgress)
      kitchenModeProgress.textContent = `${stepNum} de ${currentRecipeSteps.length}`;
    if (kitchenModePrev) kitchenModePrev.disabled = currentStepIndex === 0;
    if (kitchenModeNext) {
      kitchenModeNext.textContent =
        currentStepIndex === currentRecipeSteps.length - 1
          ? "Concluir"
          : "Próximo";
    }
  }

  if (kitchenModePrev)
    kitchenModePrev.addEventListener("click", () => {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        displayKitchenStep("prev");
      }
    });

  if (kitchenModeNext)
    kitchenModeNext.addEventListener("click", () => {
      if (currentStepIndex < currentRecipeSteps.length - 1) {
        currentStepIndex++;
        displayKitchenStep("next");
      } else {
        kitchenModeClose.click();
      }
    });

  if (kitchenModeClose)
    kitchenModeClose.addEventListener("click", () => {
      if (kitchenModeOverlay) {
        kitchenModeOverlay.classList.remove("active");
        kitchenModeOverlay.setAttribute("aria-hidden", "true");
      }
      disableFocusTrap();
      toggleScroll(true);
    });

  /* ── 7. TIMERS CONTEXTUAIS ── */
  function fmtTime(secs) {
    if (secs <= 0) return "0s";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h${m > 0 ? " " + m + "min" : ""}`;
    if (m > 0) return `${m}min${s > 0 ? " " + s + "s" : ""}`;
    return `${s}s`;
  }

  function playBell() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t0 = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.22, t0 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.4);
        osc.start(t0);
        osc.stop(t0 + 1.5);
      });
    } catch (_) {}
  }

  function launchTimer(seconds, label) {
    // Se o usuário clicar em um timer que já existe com o mesmo label, pausar/retomar
    for (const [tid, tObj] of timerMap.entries()) {
      if (tObj.label === label) {
        if (tObj.paused) {
          resumeTimer(tid);
        } else {
          pauseTimer(tid);
        }
        return;
      }
    }

    // Criar novo timer (suporta múltiplos agora)
    const id = `t${Date.now()}`;
    const circumference = 2 * Math.PI * 17;

    const card = document.createElement("div");
    card.className = "timer-card";
    card.id = id;
    card.setAttribute("role", "status");
    card.setAttribute("aria-live", "polite");
    card.setAttribute("tabindex", "0");
    card.innerHTML = `
            <div class="timer-ring-wrap" aria-hidden="true">
                <svg class="timer-ring-svg" viewBox="0 0 42 42">
                    <circle class="timer-ring-bg" cx="21" cy="21" r="17"/>
                    <circle class="timer-ring-progress" cx="21" cy="21" r="17"
                        stroke-dasharray="${circumference.toFixed(2)}"
                        stroke-dashoffset="0"/>
                </svg>
                <span class="timer-ring-time">${fmtTime(seconds)}</span>
            </div>
            <div class="timer-info">
                <span class="timer-label">${label}</span>
                <span class="timer-status" aria-label="Tempo restante">${fmtTime(seconds)}</span>
            </div>
            <button class="timer-cancel" aria-label="Cancelar timer ${label}" title="Cancelar">×</button>`;

    if (timerDock) timerDock.appendChild(card);

    // Ao clicar no card, pausa/retoma
    card.addEventListener("click", (e) => {
      if (e.target.closest(".timer-cancel")) return;
      const tObj = timerMap.get(id);
      if (tObj) {
        if (tObj.paused) resumeTimer(id);
        else pauseTimer(id);
      }
    });

    const timerObj = {
      id,
      label,
      totalSeconds: seconds,
      remaining: seconds,
      paused: false,
      interval: null,
      circumference,
    };

    timerMap.set(id, timerObj);
    startTimerInterval(id);

    const cancelBtn = card.querySelector(".timer-cancel");
    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeTimer(id);
    });
  }

  function startTimerInterval(id) {
    const tObj = timerMap.get(id);
    if (!tObj) return;

    tObj.interval = setInterval(() => {
      if (tObj.paused) return;

      tObj.remaining--;
      updateTimerUI(id);

      if (tObj.remaining <= 0) {
        clearInterval(tObj.interval);
        const card = document.getElementById(id);
        if (card) {
          card.classList.add("timer-done");
          card.querySelector(".timer-status").textContent = "Concluído!";
        }
        playBell();
        // Remove automaticamente após 30s se concluído
        setTimeout(() => removeTimer(id), 30000);
      }
    }, 1000);
  }

  function updateTimerUI(id) {
    const tObj = timerMap.get(id);
    const card = document.getElementById(id);
    if (!tObj || !card) return;

    const progressEl = card.querySelector(".timer-ring-progress");
    const timeEl = card.querySelector(".timer-ring-time");
    const statusEl = card.querySelector(".timer-status");

    const progress = tObj.remaining / tObj.totalSeconds;
    const offset = tObj.circumference * (1 - progress);

    if (progressEl) progressEl.style.strokeDashoffset = offset.toFixed(2);
    if (timeEl) timeEl.textContent = fmtTime(tObj.remaining);
    if (statusEl)
      statusEl.textContent = tObj.paused ? "Pausado" : fmtTime(tObj.remaining);
  }

  function pauseTimer(id) {
    const tObj = timerMap.get(id);
    if (!tObj) return;
    tObj.paused = true;
    const card = document.getElementById(id);
    if (card) card.classList.add("paused");
    updateTimerUI(id);
  }

  function resumeTimer(id) {
    const tObj = timerMap.get(id);
    if (!tObj) return;
    tObj.paused = false;
    const card = document.getElementById(id);
    if (card) card.classList.remove("paused");
    updateTimerUI(id);
  }

  function removeTimer(id) {
    const tObj = timerMap.get(id);
    if (!tObj) return;

    clearInterval(tObj.interval);
    const card = document.getElementById(id);
    if (card) {
      card.classList.add("timer-removing");
      setTimeout(() => card.remove(), 340);
    }
    timerMap.delete(id);
  }

  function injectTimerButtons(root) {
    const scope = root || document;
    const MAX_SECONDS = 3 * 60 * 60;
    const MIN_SECONDS = 10;

    let targets = [];
    if (scope.id === "kitchen-mode-step-text") {
      if (scope.parentElement) {
        scope.parentElement
          .querySelectorAll(".timer-btn")
          .forEach((btn) => btn.remove());
      }
      targets = [scope];
    } else if (scope.classList && scope.classList.contains("rc-step-text")) {
      targets = [scope];
    } else {
      // Garante que pegamos tanto as receitas quanto o modo cozinha
      targets = Array.from(scope.querySelectorAll(".rc-step-text"));
      const kmText = document.getElementById("kitchen-mode-step-text");
      if (kmText) targets.push(kmText);
    }

    targets.forEach((stepEl) => {
      if (stepEl.dataset.timerButtonsInjected) return;

      const timePatterns = [
        { regex: /(\d+)\s*(?:a\s*)?(\d+)?\s*(?:h|horas?|hr)/gi, type: "h" },
        { regex: /(\d+)\s*(?:a\s*)?(\d+)?\s*(?:min|minutos?)/gi, type: "m" },
        { regex: /(\d+)\s*(?:a\s*)?(\d+)?\s*(?:seg|segundos?)/gi, type: "s" },
      ];

      let foundTime = null;
      let timeLabel = "";

      for (const patternObj of timePatterns) {
        const match = patternObj.regex.exec(stepEl.textContent);
        if (match) {
          const val1 = parseInt(match[1], 10);
          const val2 = match[2] ? parseInt(match[2], 10) : val1;
          const avgVal = Math.round((val1 + val2) / 2);

          let seconds = 0;
          if (patternObj.type === "h") {
            seconds = avgVal * 3600;
            timeLabel = `${avgVal}h`;
          } else if (patternObj.type === "m") {
            seconds = avgVal * 60;
            timeLabel = `${avgVal}min`;
          } else if (patternObj.type === "s") {
            seconds = avgVal;
            timeLabel = `${avgVal}s`;
          }

          if (seconds >= MIN_SECONDS && seconds <= MAX_SECONDS) {
            foundTime = seconds;
            break;
          }
        }
      }

      if (foundTime) {
        stepEl.dataset.timerButtonsInjected = "1";
        const btn = document.createElement("button");
        btn.className = "timer-btn";
        btn.setAttribute("data-seconds", foundTime);
        btn.setAttribute("data-label", timeLabel);
        btn.innerHTML = `<svg class="timer-btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> <span>ativar timer: ${timeLabel}</span>`;

        if (stepEl.id === "kitchen-mode-step-text") {
          stepEl.appendChild(btn);
        } else {
          stepEl.after(btn);
        }

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          launchTimer(parseInt(btn.dataset.seconds, 10), btn.dataset.label);
        });
      }
    });
  }

  /* ── 8. LISTA DE COMPRAS & MISE EN PLACE ── */
  function getRecipeIngredients(card) {
    const ingredients = [];
    card.querySelectorAll(".rc-ing-group").forEach((group) => {
      const groupName =
        group.querySelector(".rc-ing-group-name")?.textContent || "";
      group.querySelectorAll(".rc-ing-item").forEach((item) => {
        const name = item
          .querySelector(".rc-ing-row span:first-child")
          ?.childNodes[0]?.textContent.trim();
        const qty = item.querySelector(".rc-ing-qty")?.textContent.trim();
        if (name) {
          ingredients.push({ group: groupName, name, qty });
        }
      });
    });
    return ingredients;
  }

  function generateShoppingList(card) {
    const recipeName = card.querySelector(".rc-name")?.textContent || "Receita";
    const ingredients = getRecipeIngredients(card);

    // Helpers para despensa e categorias
    const pantry = getPantry();
    const normalize = (s) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();

    function categorizeIngredient(name) {
      const n = name.toLowerCase();
      if (/leite|manteiga|iogurte|creme|queijo|nata|ricota/.test(n))
        return "Laticínios";
      if (/farinha|trigo|fermento|ovo|gema|clara/.test(n))
        return "Padaria & Panificação";
      if (/açúcar|mel|glucose|xarope|açucar|demerara/.test(n))
        return "Açúcares & Doces";
      if (
        /sal|pimenta|canela|baunilha|essência|tempero|ervas|temperos?/.test(n)
      )
        return "Temperos";
      if (/banana|laranja|limão|fruta|maçã|manga|uva|abacaxi/.test(n))
        return "Frutas";
      if (/noz|pecã|amêndra|castanha|amendoim|nozes|castanhas?/.test(n))
        return "Oleaginosas";
      if (/óleo|azeite|azeite|óleo|manteiga|gordura/.test(n))
        return "Óleos & Gorduras";
      if (/chocolate|cacau|cacau em pó/.test(n)) return "Chocolates & Cacau";
      return "Outros";
    }

    const substitutions = {
      "fermento biológico seco": [
        {
          name: "Fermento biológico fresco",
          note: "Use 3× a massa: 1g seco ≈ 3g fresco",
        },
      ],
      "fermento seco": [{ name: "Fermento fresco", note: "Use 3×" }],
      "açúcar refinado": [
        { name: "Açúcar demerara", note: "Sabor mais caramelado" },
      ],
      "leite integral": [
        {
          name: "Leite",
          note: "Se tiver apenas vegetal, ajuste expectativa de sabor",
        },
      ],
    };

    function compareAvailability(reqQty, pantryItem) {
      if (!pantryItem) return { available: false, label: "faltando" };
      if (!reqQty || pantryItem.amount == null || !pantryItem.unit) {
        return { available: true, label: "na despensa" };
      }

      const pantryValue = pantryItem.amount;
      const pantryUnit = pantryItem.unit;
      if (pantryUnit === reqQty.unit) {
        if (pantryValue >= reqQty.value) {
          return { available: true, label: "suficiente" };
        }
        return {
          available: false,
          label: `falta ${reqQty.value - pantryValue}${reqQty.unit}`,
        };
      }

      if (
        (pantryUnit === "g" && reqQty.unit === "kg") ||
        (pantryUnit === "kg" && reqQty.unit === "g") ||
        (pantryUnit === "ml" && reqQty.unit === "l") ||
        (pantryUnit === "l" && reqQty.unit === "ml")
      ) {
        const normalizedReq =
          reqQty.unit === "kg" ? reqQty.value * 1000 : reqQty.value;
        const normalizedPantry =
          pantryUnit === "kg" ? pantryValue * 1000 : pantryValue;
        if (normalizedPantry >= normalizedReq) {
          return { available: true, label: "suficiente" };
        }
        return {
          available: false,
          label: `falta ${Math.abs(normalizedReq - normalizedPantry)}g`,
        };
      }

      return { available: true, label: "na despensa" };
    }

    // Construir estrutura por categorias
    const buckets = {};
    const missing = [];

    ingredients.forEach((ing) => {
      const cat = categorizeIngredient(ing.name);
      buckets[cat] = buckets[cat] || [];
      const nName = normalize(ing.name);
      const reqQty = ing.qty ? parseQuantity(ing.qty) : null;
      // Verifica na despensa por substring
      const found = pantry.find(
        (p) =>
          normalize(p.name).includes(nName) ||
          nName.includes(normalize(p.name)),
      );
      const availability = compareAvailability(reqQty, found);
      const item = {
        name: ing.name,
        qty: ing.qty,
        available: availability.available,
        statusLabel: availability.label,
      };
      if (!availability.available) missing.push(item);
      // Sugestões
      const subKey = Object.keys(substitutions).find((k) => nName.includes(k));
      if (subKey) item.suggestions = substitutions[subKey];
      buckets[cat].push(item);
    });

    const container = document.createElement("div");
    container.className = "shop-actions shop-actions--full";

    const overview = document.createElement("div");
    overview.className = "shop-overview";
    overview.innerHTML = `<strong>${ingredients.length} item${ingredients.length === 1 ? "" : "s"}</strong> · ${missing.length} faltante${missing.length === 1 ? "" : "s"}`;

    const listHtml = document.createElement("div");
    listHtml.className = "shop-html-list shop-html-list--categorized";

    Object.keys(buckets).forEach((cat) => {
      const items = buckets[cat];
      const catEl = document.createElement("div");
      catEl.className = "shop-cat";
      const head = document.createElement("div");
      head.className = "shop-cat-head";
      head.innerHTML = `<strong>${cat}</strong> <span style="color:var(--ink-soft); font-size:0.9rem">(${items.length})</span>`;
      catEl.appendChild(head);

      items.forEach((it) => {
        const itEl = document.createElement("div");
        itEl.className = `shop-item ${it.available ? "shop-item--available" : "shop-item--missing"}`;

        const left = document.createElement("div");
        left.className = "shop-item-meta";
        left.innerHTML = `
          <div class="shop-item-name">${it.name}</div>
          ${it.suggestions ? `<div class="shop-item-suggestions">${it.suggestions.map((s) => `${s.name} (${s.note})`).join("<br>")}</div>` : ""}
        `;

        const right = document.createElement("div");
        right.className = "shop-item-status-block";
        right.innerHTML = `
          <div class="shop-item-qty">${it.qty}</div>
          <div class="shop-item-status">${it.statusLabel || (it.available ? "na despensa" : "faltando")}</div>
        `;

        itEl.appendChild(left);
        itEl.appendChild(right);
        catEl.appendChild(itEl);
      });

      listHtml.appendChild(catEl);
    });

    container.appendChild(overview);
    container.appendChild(listHtml);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "0.6rem";
    actions.style.marginTop = "1rem";

    const copyBtn = document.createElement("button");
    copyBtn.className = "shop-copy-btn";
    copyBtn.textContent = "Copiar lista";
    copyBtn.addEventListener("click", () => {
      const text =
        `${recipeName} - Lista:\n` +
        ingredients.map((i) => `- ${i.name}: ${i.qty}`).join("\n");
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = "✓ Copiado";
        setTimeout(() => (copyBtn.textContent = "Copiar lista"), 1500);
      });
    });

    const addMissingBtn = document.createElement("button");
    addMissingBtn.className = "shop-add-missing";
    addMissingBtn.textContent =
      missing.length > 0
        ? `Adicionar ${missing.length} faltantes à despensa`
        : "Todos os ingredientes estão na despensa";
    addMissingBtn.disabled = missing.length === 0;
    addMissingBtn.addEventListener("click", () => {
      missing.forEach((it) => {
        const qty = parseQuantity(it.qty);
        addPantryItem({
          name: it.name,
          amount: qty?.value || null,
          unit: qty?.unit || "",
        });
      });
      addMissingBtn.textContent = "Adicionados ✓";
      addMissingBtn.disabled = true;
      setTimeout(
        () =>
          (addMissingBtn.textContent =
            missing.length > 0
              ? `Adicionar ${missing.length} faltantes à despensa`
              : "Todos os ingredientes estão na despensa"),
        1500,
      );
    });

    const shareBtn = document.createElement("button");
    shareBtn.className = "shop-share-btn";
    shareBtn.textContent = "Compartilhar";
    shareBtn.addEventListener("click", async () => {
      const text =
        `${recipeName} - Lista:\n` +
        ingredients.map((i) => `- ${i.name}: ${i.qty}`).join("\n");
      if (navigator.share) {
        try {
          await navigator.share({ title: `Lista: ${recipeName}`, text });
        } catch (_) {}
      } else {
        navigator.clipboard.writeText(text).then(() => {
          shareBtn.textContent = "Copiado para área de transferência";
          setTimeout(() => (shareBtn.textContent = "Compartilhar"), 1500);
        });
      }
    });

    actions.appendChild(copyBtn);
    actions.appendChild(addMissingBtn);
    actions.appendChild(shareBtn);
    container.appendChild(actions);

    openModal("Lista de Compras", recipeName.toUpperCase(), container);
  }

  function startMiseEnPlace(card) {
    const recipeName = card.querySelector(".rc-name")?.textContent || "Receita";
    const ingredients = getRecipeIngredients(card);

    const list = document.createElement("ul");
    list.className = "mise-list";

    ingredients.forEach((ing) => {
      const li = document.createElement("li");
      li.className = "mise-item";
      li.innerHTML = `
                <div class="mise-checkbox"></div>
                <div class="mise-info">
                    <span class="mise-name" style="display:block; font-weight:600; font-size:0.95rem">${ing.name}</span>
                    <span class="mise-qty" style="display:block; font-size:0.8rem; color:var(--terra)">${ing.qty}</span>
                </div>
            `;
      li.addEventListener("click", () => {
        li.classList.toggle("checked");
        // Haptic feedback se disponível
        if (window.navigator.vibrate) window.navigator.vibrate(10);
      });
      list.appendChild(li);
    });

    openModal("Mise en Place", "Organize sua bancada", list);
  }

  /* ── 9. ESCALONADOR & NOTAS ── */
  function initRecipeCards() {
    document.querySelectorAll(".recipe-card").forEach((card) => {
      const head = card.querySelector(".rc-head");
      const rcBody = card.querySelector(".rc-body");
      const ingCol = card.querySelector(".rc-ingredients");

      if (head && !head.querySelector(".kitchen-btn")) {
        const kitchenBtn = document.createElement("button");
        kitchenBtn.className = "kitchen-btn";
        kitchenBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="kitchen-icon-svg"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/><path d="M12 18V2"/></svg>`;
        kitchenBtn.title = "Modo Foco na Cozinha";
        kitchenBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          startKitchenMode(card);
        });
        head.appendChild(kitchenBtn);
      }

      if (ingCol) {
        const colLabel = ingCol.querySelector(".rc-col-label");
        const qtyEls = ingCol.querySelectorAll(".rc-ing-qty");
        qtyEls.forEach((el) => {
          el.setAttribute("data-orig", el.textContent.trim());
          const ingredientName =
            el
              .closest(".rc-ing-item")
              .querySelector(".rc-ing-row span:first-child")
              ?.childNodes[0]?.textContent.trim() || "";
          el.dataset.ingredientName = ingredientName;
        });

        const scaler = document.createElement("div");
        scaler.className = "rc-scaler";
        scaler.innerHTML = `
                    <span class="rc-scaler-label">Escalar receita</span>
                    <div class="rc-scaler-controls">
                        <button class="rc-scale-btn" data-mult="0.5">½×</button>
                        <button class="rc-scale-btn rc-scale-btn--active" data-mult="1">1×</button>
                        <button class="rc-scale-btn" data-mult="1.5">1,5×</button>
                        <button class="rc-scale-btn" data-mult="2">2×</button>
                        <button class="rc-scale-btn" data-mult="3">3×</button>
                    </div>`;

        const unitSwitcher = document.createElement("div");
        unitSwitcher.className = "rc-unit-switcher";
        unitSwitcher.innerHTML = `
                    <span class="rc-unit-label">Unidades</span>
                    <div class="rc-unit-controls">
                        <button class="rc-unit-btn rc-unit-btn--active" data-unit="gramas">g</button>
                        <button class="rc-unit-btn" data-unit="caseiro">caseiro</button>
                    </div>`;

        if (colLabel) {
          colLabel.after(scaler);
          scaler.after(unitSwitcher);
        }

        // Injeção de Ações Rápidas (Lista de Compras & Mise en Place)
        if (!ingCol.querySelector(".rc-quick-actions")) {
          const quickActions = document.createElement("div");
          quickActions.className = "rc-quick-actions";
          quickActions.innerHTML = `
                        <button class="rc-action-btn rc-shop-btn" title="Gerar Lista de Compras">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            Lista de Compras
                        </button>
                        <button class="rc-action-btn rc-mise-btn" title="Mise en Place">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
                            Mise en Place
                        </button>
                    `;
          scaler.after(quickActions);

          quickActions
            .querySelector(".rc-shop-btn")
            .addEventListener("click", (e) => {
              e.stopPropagation();
              generateShoppingList(card);
            });

          quickActions
            .querySelector(".rc-mise-btn")
            .addEventListener("click", (e) => {
              e.stopPropagation();
              startMiseEnPlace(card);
            });
        }

        const unitButtons = unitSwitcher.querySelectorAll(".rc-unit-btn");
        const getCurrentUnit = () =>
          unitSwitcher.querySelector(".rc-unit-btn--active")?.dataset.unit ||
          "gramas";

        const getCurrentScale = () => {
          const activeBtn = scaler.querySelector(".rc-scale-btn--active");
          return activeBtn ? parseFloat(activeBtn.dataset.mult) : 1;
        };

        const applyUnitMode = (unit) => {
          unitButtons.forEach((btn) =>
            btn.classList.toggle(
              "rc-unit-btn--active",
              btn.dataset.unit === unit,
            ),
          );
          if (card.id) {
            localStorage.setItem(`eg-unit-mode-${card.id}`, unit);
          }
          const scale = getCurrentScale();
          qtyEls.forEach((el) => {
            el.textContent = renderIngredientQty(el, unit, scale);
          });
        };

        unitButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const unit = btn.dataset.unit;
            applyUnitMode(unit);
          });
        });

        if (card.id) {
          const savedUnit = localStorage.getItem(`eg-unit-mode-${card.id}`);
          if (savedUnit === "caseiro") {
            applyUnitMode("caseiro");
          }
        }

        scaler.querySelectorAll(".rc-scale-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const mult = parseFloat(btn.dataset.mult);
            scaler
              .querySelectorAll(".rc-scale-btn")
              .forEach((b) =>
                b.classList.toggle("rc-scale-btn--active", b === btn),
              );
            const unit = getCurrentUnit();
            qtyEls.forEach((el) => {
              el.textContent = renderIngredientQty(el, unit, mult);
            });
          });
        });
      }

      if (rcBody) {
        const noteKey = `eg-note-${card.id}`;
        const savedNote = localStorage.getItem(noteKey) || "";
        const notesSection = document.createElement("div");
        notesSection.className = "rc-user-notes";
        notesSection.innerHTML = `
                    <div class="rc-user-notes-head" role="button" tabindex="0" aria-expanded="false">
                        <span class="rc-user-notes-label">Anotações Pessoais</span>
                        <span class="rc-user-notes-toggle">${savedNote ? "editar" : "adicionar nota"}</span>
                    </div>
                    <div class="rc-user-notes-body${savedNote ? " open" : ""}">
                        <textarea class="rc-user-notes-area" placeholder="Ajustes, variações...">${savedNote}</textarea>
                        <div class="rc-user-notes-actions">
                            <span class="rc-user-notes-saved">salvo</span>
                            <button class="rc-user-notes-save">salvar</button>
                        </div>
                    </div>`;
        rcBody.appendChild(notesSection);

        const nHead = notesSection.querySelector(".rc-user-notes-head");
        const nBody = notesSection.querySelector(".rc-user-notes-body");
        const nArea = notesSection.querySelector(".rc-user-notes-area");
        const nSave = notesSection.querySelector(".rc-user-notes-save");
        const nSaved = notesSection.querySelector(".rc-user-notes-saved");
        const nToggle = notesSection.querySelector(".rc-user-notes-toggle");

        nHead.addEventListener("click", () => {
          const open = nBody.classList.toggle("open");
          nHead.setAttribute("aria-expanded", String(open));
        });

        nSave.addEventListener("click", (e) => {
          e.stopPropagation();
          localStorage.setItem(noteKey, nArea.value);
          nToggle.textContent = nArea.value.trim()
            ? "editar"
            : "adicionar nota";
          nSaved.classList.add("flash");
          setTimeout(() => nSaved.classList.remove("flash"), 1800);
        });
      }
    });
  }

  function renderIngredientQty(el, unit, mult) {
    const orig = el.getAttribute("data-orig");
    if (!orig) return el.textContent.trim();
    const ingredientName = el.dataset.ingredientName || "";
    const scaled = scaleText(orig, mult);
    return unit === "caseiro"
      ? convertToHousehold(scaled, ingredientName)
      : scaled;
  }

  function convertToHousehold(text, ingredientName) {
    if (!text || /q\.b\.|a gosto|opcional|%/i.test(text)) return text;
    const parsed = parseIngredientAmount(text);
    if (!parsed) return text;
    const { amount, unit, rest } = parsed;
    const lowerName = ingredientName.toLowerCase();

    const scale = (grams, divisor) => {
      const qty = smartRound(grams / divisor);
      if (qty >= 1.5)
        return `${qty} ${divisor === 15 ? "colheres de sopa" : "xícaras"}`;
      if (qty === 1)
        return `${qty} ${divisor === 15 ? "colher de sopa" : "xícara"}`;
      return `${smartRound((grams / divisor) * 2) / 2} ${divisor === 15 ? "colher de sopa" : "xícara"}`;
    };

    if (unit === "g" || unit === "kg") {
      const grams = amount * (unit === "kg" ? 1000 : 1);
      if (/farinha|trigo|trigo sarraceno|amido|aveia/.test(lowerName)) {
        return `${scale(grams, 120)} de ${rest}`.trim();
      }
      if (/açúcar|cacau|cacau em pó|chocolate|açucar/.test(lowerName)) {
        return `${scale(grams, 200)} de ${rest}`.trim();
      }
      if (/manteiga|margarina/.test(lowerName)) {
        const tbsp = smartRound(grams / 14);
        return `${tbsp} colher${tbsp === 1 ? "" : "es"} de sopa de ${rest}`.trim();
      }
      if (/fermento/.test(lowerName)) {
        const tbsp = smartRound(grams / 12);
        return `${tbsp} colher${tbsp === 1 ? "" : "es"} de sopa de ${rest}`.trim();
      }
      return `${scale(grams, 120)} de ${rest}`.trim();
    }

    if (unit === "ml" || unit === "l") {
      const milliliters = amount * (unit === "l" ? 1000 : 1);
      if (/leite|água|óleo|azeite|creme|licor/.test(lowerName)) {
        const tbsp = smartRound(milliliters / 15);
        return `${tbsp} colher${tbsp === 1 ? "" : "es"} de sopa de ${rest}`.trim();
      }
      const cups = smartRound(milliliters / 240);
      return `${cups} xícara${cups === 1 ? "" : "s"} de ${rest}`.trim();
    }

    return text;
  }

  function parseIngredientAmount(text) {
    const match = text.match(
      /^(~?)([\d]+(?:[.,][\d]+)?)(?:\s*)(g|gr|gramas|kg|ml|l|xícara|xicaras|xícaras|colheres|colher|col\.|coluna)?(?:\s*)(.*)$/i,
    );
    if (!match) return null;
    let amount = parseFloat(match[2].replace(",", "."));
    let unit = (match[3] || "").toLowerCase();
    const rest = match[4] ? match[4].trim() : "";
    if (unit === "g" || unit === "gr" || unit === "gramas") unit = "g";
    if (unit === "kg") unit = "kg";
    if (unit === "ml") unit = "ml";
    if (unit === "l") unit = "l";
    return { amount, unit, rest };
  }

  function scaleText(orig, mult) {
    if (!orig || /q\.b\.|a gosto|opcional|%/i.test(orig)) return orig;
    const rng = orig.match(
      /^(~?)([\d]+(?:[.,]\d+)?)\s*[–—-]\s*([\d]+(?:[.,]\d+)?)\s*([a-zA-Z.]*.*)?$/,
    );
    if (rng) {
      const lo = smartRound(parseFloat(rng[2].replace(",", ".")) * mult);
      const hi = smartRound(parseFloat(rng[3].replace(",", ".")) * mult);
      return `${rng[1]}${lo}–${hi}${rng[4] || ""}`.trim();
    }
    const sim = orig.match(/^(~?)(\d+(?:[.,]\d+)?)\s*(.*)?$/);
    if (sim) {
      const num = parseFloat(sim[2].replace(",", "."));
      const scaled = smartRound(num * mult);
      const formatted = Number.isInteger(scaled)
        ? String(scaled)
        : scaled.toFixed(1).replace(".", ",");
      return `${sim[1]}${formatted}${sim[3] ? " " + sim[3].trim() : ""}`.trim();
    }
    return orig;
  }

  function smartRound(n) {
    if (n >= 100) return Math.round(n);
    if (n >= 10) return Math.round(n * 2) / 2;
    return Math.round(n * 10) / 10;
  }

  /* ── 10. MODO LUZ DE VELA (DARK MODE ORGÂNICO) ── */
  function initCandlelightMode() {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    const candleBtn = document.createElement("button");
    candleBtn.className = "candle-toggle";
    candleBtn.title = "Modo Luz de Vela";
    candleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle></svg>`;

    // Insere o botão no nav, antes dos links ou no final se não houver links
    const navLinks = nav.querySelector(".nav-links");
    if (navLinks) {
      navLinks.before(candleBtn);
    } else {
      nav.appendChild(candleBtn);
    }

    const isDark = localStorage.getItem("eg-candlelight") === "true";
    if (isDark) document.documentElement.classList.add("candlelight");

    candleBtn.addEventListener("click", () => {
      const active = document.documentElement.classList.toggle("candlelight");
      localStorage.setItem("eg-candlelight", active);
      if (navigator.vibrate) navigator.vibrate(10);
    });
  }

  /* ── 9. INICIALIZAÇÃO ── */
  // Despensa: persistência simples
  const PANTRY_KEY = "eg-pantry-v1";
  function getPantry() {
    try {
      return JSON.parse(localStorage.getItem(PANTRY_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function savePantry(arr) {
    localStorage.setItem(PANTRY_KEY, JSON.stringify(arr));
  }
  function parseQuantity(qty) {
    if (!qty || typeof qty !== "string") return null;
    const normalized = qty.replace(/[,·]/g, ".").trim();
    const match = normalized.match(
      /^([0-9]+(?:\.[0-9]+)?)\s*(g|kg|ml|l|un|unidade|unidades|colh(?:a|es)|x)?/i,
    );
    if (!match) return null;
    let value = parseFloat(match[1]);
    let unit = (match[2] || "").toLowerCase();
    if (unit === "kg") {
      value *= 1000;
      unit = "g";
    }
    if (unit === "l") unit = "ml";
    if (unit === "un" || unit === "unidade" || unit === "unidades") unit = "un";
    if (unit === "colh" || unit.startsWith("colh")) unit = "colher";
    return { value, unit: unit || "" };
  }
  function makePantryKey(item) {
    const name = typeof item === "string" ? item : item?.name;
    return String(name || "")
      .trim()
      .toLowerCase();
  }
  function addPantryItem(item) {
    const p = getPantry();
    const key = makePantryKey(item);
    const existing = p.find((x) => makePantryKey(x) === key);
    if (existing) {
      if (item.amount && item.unit && existing.unit === item.unit) {
        existing.amount = (existing.amount || 0) + item.amount;
      }
      if (item.amount && item.unit && !existing.unit) {
        existing.amount = item.amount;
        existing.unit = item.unit;
      }
      if (item.note) existing.note = item.note;
    } else {
      p.push({
        name: item.name,
        amount: item.amount || null,
        unit: item.unit || "",
        note: item.note || "",
      });
    }
    savePantry(p);
  }
  function removePantryItem(name) {
    const p = getPantry().filter(
      (i) => makePantryKey(i.name) !== makePantryKey({ name }),
    );
    savePantry(p);
  }

  function openPantryModal() {
    const container = document.createElement("div");
    container.className = "pantry-modal";

    const list = document.createElement("div");
    list.className = "pantry-list";

    const topbar = document.createElement("div");
    topbar.className = "pantry-topbar";

    const summary = document.createElement("div");
    summary.className = "pantry-summary";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "pantry-clear";
    clearBtn.textContent = "Limpar despensa";
    clearBtn.addEventListener("click", () => {
      if (!confirm("Tem certeza que deseja limpar todos os itens da despensa?"))
        return;
      savePantry([]);
      render();
    });

    topbar.append(summary, clearBtn);

    function formatItem(item) {
      const amount =
        item.amount != null
          ? `${item.amount}${item.unit ? item.unit : ""}`
          : "Quantidade não informada";
      return `<div><strong>${item.name}</strong><div class="pantry-meta">${amount}${item.note ? ` · ${item.note}` : ""}</div></div>`;
    }

    function render() {
      const pantryItems = getPantry();
      list.innerHTML = "";
      if (pantryItems.length === 0) {
        list.innerHTML = `<div class="pantry-empty">Sua despensa está vazia. Adicione ingredientes para começar a acompanhar o estoque e comparar com suas receitas.</div>`;
        clearBtn.disabled = true;
        clearBtn.style.opacity = "0.6";
      } else {
        clearBtn.disabled = false;
        clearBtn.style.opacity = "1";
        pantryItems.forEach((item) => {
          const row = document.createElement("div");
          row.className = "pantry-row";
          row.innerHTML = `<div class="pantry-item-info">${formatItem(item)}</div><div class="pantry-actions"><button type="button" class="pantry-remove">Remover</button></div>`;
          row.querySelector(".pantry-remove").addEventListener("click", () => {
            removePantryItem(item.name);
            render();
          });
          list.appendChild(row);
        });
      }
      summary.textContent = `Despensa — ${pantryItems.length} item${pantryItems.length === 1 ? "" : "s"}`;
    }

    const form = document.createElement("div");
    form.className = "pantry-form";
    form.innerHTML = `
      <div class="pantry-field">
        <label class="sr-only" for="pantry-name">Ingrediente</label>
        <input id="pantry-name" class="pantry-input" type="text" placeholder="Ingrediente" aria-label="Ingrediente" />
        <label class="sr-only" for="pantry-amount">Quantidade</label>
        <input id="pantry-amount" class="pantry-input" type="text" placeholder="Quantidade" aria-label="Quantidade" />
        <select id="pantry-unit" class="pantry-unit" aria-label="Unidade">
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="l">l</option>
          <option value="un">un</option>
          <option value="colher">colher</option>
        </select>
      </div>
      <button type="button" class="pantry-add btn--primary">Adicionar à despensa</button>
    `;
    const input = form.querySelector(".pantry-input#pantry-name");
    const qtyInput = form.querySelector(".pantry-input#pantry-amount");
    const unitSelect = form.querySelector(".pantry-unit");
    const addBtn = form.querySelector(".pantry-add");

    addBtn.addEventListener("click", () => {
      const name = input.value.trim();
      const unit = unitSelect.value;
      const parsed = parseQuantity(qtyInput.value);
      if (!name) return;
      const payload = { name };
      if (parsed && parsed.value > 0) {
        payload.amount = parsed.value;
        payload.unit = parsed.unit || unit;
      } else if (qtyInput.value.trim() !== "") {
        payload.amount = parseFloat(qtyInput.value.replace(",", ".")) || null;
        payload.unit = unit;
      }
      addPantryItem(payload);
      input.value = "";
      qtyInput.value = "";
      unitSelect.value = "g";
      render();
      input.focus();
    });

    render();
    container.appendChild(topbar);
    container.appendChild(list);
    container.appendChild(form);
    openModal("Despensa", "Itens salvos localmente", container);
  }

  // Observador de timers para falar quando concluídos
  function initTimerSpeechObserver() {
    const dock = document.getElementById("timer-dock");
    if (!dock) return;
    const obs = new MutationObserver((muts) => {
      muts.forEach((m) => {
        if (m.type === "attributes" && m.attributeName === "class") {
          const node = m.target;
          if (node.classList && node.classList.contains("timer-done")) {
            const label =
              node.querySelector(".timer-label")?.textContent || "Timer";
            speak(`${label} concluído`);
          }
        }
        if (m.type === "childList") {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === 1) {
              // monitorar classe changes
              const mo = new MutationObserver((ms) =>
                ms.forEach((mm) => {
                  if (
                    mm.attributeName === "class" &&
                    n.classList.contains("timer-done")
                  ) {
                    const label =
                      n.querySelector(".timer-label")?.textContent || "Timer";
                    speak(`${label} concluído`);
                  }
                }),
              );
              mo.observe(n, { attributes: true });
            }
          });
        }
      });
    });
    obs.observe(dock, { childList: true, subtree: true, attributes: true });
  }

  // Voz: leitura segura via SpeechSynthesis
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    if (localStorage.getItem("eg-voice-enabled") !== "true") return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function initPantryButton() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const existing = nav.querySelector(".nav-btn-pantry");
    const makeInner = () => `
      <span class="nav-btn-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="currentColor" d="M3 7h18M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
          <path stroke="currentColor" d="M9 7v-2a3 3 0 0 1 6 0v2" />
        </svg>
      </span>
      <span class="nav-btn-label">Despensa</span>`;

    if (existing) {
      existing.className = "nav-btn-pantry btn btn--pill";
      existing.setAttribute("aria-label", "Abrir despensa");
      existing.innerHTML = makeInner();
      existing.style.marginLeft = "";
      // remove any inline styles by rebuilding style attribute
      existing.removeAttribute("style");
      // remove old click handlers by cloning
      const clone = existing.cloneNode(true);
      clone.addEventListener("click", () => openPantryModal());
      existing.parentNode.replaceChild(clone, existing);
      return;
    }

    const btn = document.createElement("button");
    btn.className = "nav-btn-pantry btn btn--pill";
    btn.setAttribute("aria-label", "Abrir despensa");
    btn.innerHTML = makeInner();
    btn.addEventListener("click", () => openPantryModal());
    const navLinks = nav.querySelector(".nav-links");
    if (navLinks) navLinks.after(btn);
    else nav.appendChild(btn);
  }

  // Botão de voz no modo cozinha
  function ensureKitchenVoiceToggle() {
    const kmHeader = document.querySelector(".kitchen-mode-header");
    if (!kmHeader) return;
    if (kmHeader.querySelector(".kitchen-voice-toggle")) return;
    const btn = document.createElement("button");
    btn.className = "kitchen-voice-toggle btn";
    btn.style.marginLeft = "0.6rem";
    const enabled = localStorage.getItem("eg-voice-enabled") === "true";
    btn.textContent = enabled ? "Voz: ON" : "Voz: OFF";
    btn.addEventListener("click", () => {
      const cur = localStorage.getItem("eg-voice-enabled") === "true";
      localStorage.setItem("eg-voice-enabled", cur ? "false" : "true");
      btn.textContent = cur ? "Voz: OFF" : "Voz: ON";
    });
    kmHeader.appendChild(btn);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initRecipeCards();
    initCandlelightMode();
    initPantryButton();
    initTimerSpeechObserver();
    ensureKitchenVoiceToggle();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("sw.js")
        .catch((err) => console.warn("PWA falhou:", err));
    }

    const splash = document.getElementById("splash");
    if (splash) {
      document.body.style.overflow = "hidden";
      splash.classList.add("animate");
      setTimeout(() => {
        splash.classList.add("exiting");
        setTimeout(() => {
          document.body.style.overflow = "";
          splash.remove();
        }, 730);
      }, 2800);
    }

    const footerDate = document.getElementById("footer-date");
    if (footerDate) {
      const d = new Date(document.lastModified);
      if (!isNaN(d)) {
        footerDate.textContent = `atualizado em ${d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`;
      }
    }

    // Garante que os botões de timer sejam injetados em todas as receitas no início
    injectTimerButtons();
  });
})();
