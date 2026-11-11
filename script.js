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
    if (_prevFocus?.isConnected && typeof _prevFocus.focus === "function")
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
    let activeCategory = "all";
    const normalizeSearch = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const doSearch = () => {
      const q = normalizeSearch(searchInput.value.trim());
      if (searchClear) searchClear.style.display = q ? "block" : "none";
      let count = 0;
      document.querySelectorAll(".recipe-card").forEach((card) => {
        const matches = (!q || normalizeSearch(card.textContent).includes(q)) &&
          (activeCategory === "all" || card.dataset.category === activeCategory);
        card.classList.toggle("search-hidden", !matches);
        if (matches) count++;
      });
      const countEl = document.getElementById("catalog-count");
      if (countEl) countEl.textContent = `${count} ${count === 1 ? "receita" : "receitas"} no caderno`;
      const empty = document.querySelector(".catalog-empty");
      if (empty) empty.hidden = count > 0;
      const featured = document.querySelector(".featured-recipe");
      if (featured) featured.hidden = !!q || activeCategory !== "all";
    };
    document.querySelectorAll(".category-filter").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        document.querySelectorAll(".category-filter").forEach((item) => {
          item.classList.toggle("active", item === button);
          item.setAttribute("aria-pressed", String(item === button));
        });
        doSearch();
      });
    });

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
    card.querySelectorAll(".rc-ing-group").forEach((group, groupIndex) => {
      if (group.hidden) return;
      const groupName =
        group.querySelector(".rc-ing-group-name")?.textContent || "";
      group.querySelectorAll(".rc-ing-item").forEach((item, itemIndex) => {
        const name = item
          .querySelector(".rc-ing-row span:first-child")
          ?.childNodes[0]?.textContent.trim();
        const qty = item.querySelector(".rc-ing-qty")?.textContent.trim();
        if (name) {
          ingredients.push({ group: groupName, name, qty,
            baseQty: item.querySelector(".rc-ing-qty")?.getAttribute("data-orig") || qty,
            scale: Number(card.querySelector(".rc-scale-btn--active")?.dataset.mult || 1),
            sourceKey: `${groupIndex}-${itemIndex}`,
            prepared: item.dataset.prepared === "true",
          });
        }
      });
    });
    return ingredients;
  }

  let shoppingList;
  function generateShoppingList(card) {
    shoppingList.addRecipe(getRecipeIngredients(card), { recipeId: card.id, recipeTitle: card.querySelector(".rc-name")?.textContent || card.id, replacesRecipeIds: (card.dataset.replacesRecipes || "").split(" ").filter(Boolean) });
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
      card.querySelectorAll('.rc-inclusion-options input[type="radio"]').forEach((input) => {
        input.addEventListener("change", () => {
          card.querySelectorAll(".rc-ing-group[data-variant]").forEach((group) => {
            group.hidden = group.dataset.variant !== input.value;
          });
        });
      });

      if (head && !head.querySelector(".kitchen-btn")) {
        const kitchenBtn = document.createElement("button");
        kitchenBtn.className = "kitchen-btn";
        kitchenBtn.innerHTML = `<img src="assets/icons/chef-hat.svg" alt="" width="19" height="19" /> Mãos à massa!`;
        kitchenBtn.title = "Modo Foco na Cozinha";
        kitchenBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          startKitchenMode(card);
        });
        // Keep the kitchen action next to the introduction without nesting a
        // native button inside the accordion's button role.
        const cover = document.createElement("div");
        cover.className = "rc-cover";
        head.before(cover);
        cover.append(head, kitchenBtn);
      }

      if (ingCol) {
        const colLabel = ingCol.querySelector(".rc-col-label");
        const qtyEls = ingCol.querySelectorAll(".rc-ing-qty");
        qtyEls.forEach((el) => {
          el.setAttribute("data-orig", el.textContent.trim());
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

        if (colLabel) colLabel.after(scaler);

        // Injeção de Ações Rápidas (Lista de Compras & Mise en Place)
        if (!ingCol.querySelector(".rc-quick-actions")) {
          const quickActions = document.createElement("div");
          quickActions.className = "rc-quick-actions";
          quickActions.innerHTML = `
                        <button class="rc-action-btn rc-shop-btn" title="Adicionar todos os ingredientes à lista de compras">
                            <img src="assets/icons/shopping-bag.svg" alt="" width="16" height="16" />
                            Adicionar todos à lista de compras
                        </button>
                        <button class="rc-action-btn rc-mise-btn" title="Mise en Place">
                            <img src="assets/icons/chef-hat.svg" alt="" width="16" height="16" />
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

        scaler.querySelectorAll(".rc-scale-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const mult = parseFloat(btn.dataset.mult);
            scaler
              .querySelectorAll(".rc-scale-btn")
              .forEach((b) =>
                b.classList.toggle("rc-scale-btn--active", b === btn),
              );
            qtyEls.forEach((el) => {
              el.textContent = renderIngredientQty(el, mult);
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
                        <textarea class="rc-user-notes-area" placeholder="Ajustes, variações..."></textarea>
                        <div class="rc-user-notes-actions">
                            <span class="rc-user-notes-saved">salvo</span>
                            <button class="rc-user-notes-save">salvar</button>
                        </div>
                    </div>`;
        rcBody.appendChild(notesSection);

        const nHead = notesSection.querySelector(".rc-user-notes-head");
        const nBody = notesSection.querySelector(".rc-user-notes-body");
        const nArea = notesSection.querySelector(".rc-user-notes-area");
        nArea.value = savedNote;
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

  function renderIngredientQty(el, mult) {
    const orig = el.getAttribute("data-orig");
    return orig ? scaleText(orig, mult) : el.textContent.trim();
  }

  function scaleText(orig, mult) {
    if (!orig || /q\.b\.|a gosto|opcional|%/i.test(orig)) return orig;
    // Kitchen fractions are used by the homemade essence (¼ citrus, ½ vanilla).
    orig = orig.replace(/^(\d*)([¼½¾])/, (_, whole, fraction) =>
      String(Number(whole || 0) + ({ "¼": 0.25, "½": 0.5, "¾": 0.75 })[fraction]),
    );
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
    candleBtn.innerHTML = `<img src="assets/icons/sun.svg" alt="" width="19" height="19" />`;
    candleBtn.setAttribute("aria-label", "Alternar modo luz de vela");

    // Insere o botão no nav, antes dos links ou no final se não houver links
    const navLinks = nav.querySelector(".nav-links");
    if (navLinks) {
      navLinks.before(candleBtn);
    } else {
      nav.appendChild(candleBtn);
    }

    const isDark = localStorage.getItem("eg-candlelight") === "true";
    if (isDark) document.documentElement.classList.add("candlelight");
    candleBtn.setAttribute("aria-pressed", String(isDark));

    candleBtn.addEventListener("click", () => {
      const active = document.documentElement.classList.toggle("candlelight");
      localStorage.setItem("eg-candlelight", active);
      candleBtn.setAttribute("aria-pressed", String(active));
      if (navigator.vibrate) navigator.vibrate(10);
    });
  }

  /* ── 9. INICIALIZAÇÃO ── */
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

  function initShoppingButton() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const existing = nav.querySelector(".nav-btn-shopping");
    const makeInner = () => `<span class="nav-btn-icon" aria-hidden="true"><img src="assets/icons/shopping-bag.svg" alt="" width="19" height="19" /></span><span class="nav-btn-label">Compras</span>`;

    if (existing) {
      existing.className = "nav-btn-shopping btn btn--pill";
      existing.setAttribute("aria-label", "Abrir lista de compras");
      existing.innerHTML = makeInner();
      existing.style.marginLeft = "";
      // remove any inline styles by rebuilding style attribute
      existing.removeAttribute("style");
      // remove old click handlers by cloning
      const clone = existing.cloneNode(true);
      clone.addEventListener("click", () => shoppingList.open());
      existing.parentNode.replaceChild(clone, existing);
      return;
    }

    const btn = document.createElement("button");
    btn.className = "nav-btn-shopping btn btn--pill";
    btn.setAttribute("aria-label", "Abrir lista de compras");
    btn.innerHTML = makeInner();
    btn.addEventListener("click", () => shoppingList.open());
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
    shoppingList = window.ElGuapoShopping.createUI(openModal);
    initRecipeCards();
    initCandlelightMode();
    initShoppingButton();
    document.querySelectorAll("[data-open-shopping]").forEach(button => button.addEventListener("click", () => shoppingList.open()));
    document.querySelectorAll("[data-open-recipe]").forEach(link => link.addEventListener("click", () => {
      const card = document.getElementById(link.dataset.openRecipe);
      // Keep the hero link usable even after a previous search or category selection.
      searchInput.value = "";
      document.querySelector('[data-category="all"]').click();
      if (!card.classList.contains("open")) card.querySelector(".rc-head").click();
      requestAnimationFrame(() => { card.scrollIntoView({block:"start"}); card.querySelector(".rc-head").focus({preventScroll:true}); });
    }));
    document.querySelectorAll(".recipe-card").forEach(card => syncRecipeAccessibility(card, false));
    const mobileLinks = document.querySelectorAll('.mobile-nav a, .nav-links a');
    const updateMobileNav = () => {
      const inCatalog = document.getElementById("catalogo").getBoundingClientRect().top < 180;
      mobileLinks.forEach(link => {
        if (link.hash === (inCatalog ? "#catalogo" : "#top")) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    window.addEventListener("scroll", updateMobileNav, {passive:true});
    updateMobileNav();
    const openLinkedRecipe = () => {
      const card = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (!card?.classList.contains("recipe-card")) return;
      searchInput.value = "";
      document.querySelector('[data-category="all"]').click();
      if (!card.classList.contains("open")) card.querySelector(".rc-head").click();
      requestAnimationFrame(() => card.scrollIntoView({block:"start"}));
    };
    window.addEventListener("hashchange", openLinkedRecipe);
    openLinkedRecipe();
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
