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
    modalOverlay.querySelector(".modal-content").classList.toggle("kitchen-picker-modal", content.classList.contains("kitchen-recipe-picker"));
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
  function trapControls(container) {
    return [...container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
      .filter(el => !el.disabled && el.tabIndex >= 0 && !el.closest('[hidden], [inert], [aria-hidden="true"]') && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");
  }
  function enableFocusTrap(container) {
    if (!container) return;
    _prevFocus = document.activeElement;
    _trapContainer = container;
    trapControls(container)[0]?.focus();
    document.addEventListener("focus", _keepFocus, true);
    document.addEventListener("keydown", _trapTab);
  }
  function disableFocusTrap() {
    document.removeEventListener("focus", _keepFocus, true);
    document.removeEventListener("keydown", _trapTab);
    const previous = _prevFocus;
    _prevFocus = null;
    _trapContainer = null;
    if (previous?.isConnected) previous.focus();
  }
  function _keepFocus(e) {
    if (!_trapContainer || _trapContainer.contains(e.target)) return;
    e.stopPropagation();
    trapControls(_trapContainer)[0]?.focus();
  }
  function _trapTab(e) {
    if (e.key !== "Tab" || !_trapContainer) return;
    const controls = trapControls(_trapContainer);
    if (!controls.length) { e.preventDefault(); return; }
    const index = controls.indexOf(document.activeElement);
    if (index === -1 || (e.shiftKey && index === 0) || (!e.shiftKey && index === controls.length - 1)) {
      e.preventDefault();
      controls[e.shiftKey ? controls.length - 1 : 0].focus();
    }
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
      } else if (timerCard && !e.target.closest("button")) {
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
  let currentKitchenRecipeId = null;
  function startKitchenMode(card) {
    currentKitchenRecipeId = card.id;
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
        kitchenModeStepText.dataset.recipeId=currentKitchenRecipeId;
        kitchenModeStepText.dataset.stepId=`${currentKitchenRecipeId}-step-${currentStepIndex}`;
        delete kitchenModeStepText.dataset.timerButtonsInjected;
        injectTimerButtons(kitchenModeStepText);
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
    const n = Math.max(0, Math.ceil(secs));
    const parts = [Math.floor(n / 60) % 60, n % 60].map(v => String(v).padStart(2, "0"));
    if (n >= 3600) parts.unshift(String(Math.floor(n / 3600)).padStart(2, "0"));
    return parts.join(":");
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

  const TIMER_KEY = "eg-timers-v1";
  function saveTimers() {
    try { localStorage.setItem(TIMER_KEY, JSON.stringify([...timerMap.values()].map(t => ({id:t.id,label:t.label,totalSeconds:t.totalSeconds,remaining:t.remaining,paused:t.paused,deadline:t.deadline,done:t.done,sourceKey:t.sourceKey,recipeId:t.recipeId,stepId:t.stepId,durationId:t.durationId})))); } catch (_) {}
  }
  function launchTimer(seconds, label, saved = null, source = null) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    const sourceKey = source ? `${source.recipeId}:${source.stepId}:${source.durationId}` : saved?.sourceKey || null;
    for (const [id,t] of timerMap) if (sourceKey && t.sourceKey === sourceKey && !saved && !t.done) {
      const card=document.getElementById(id);card?.scrollIntoView({block:'nearest'});card?.querySelector('.timer-pause').focus();card?.classList.add('timer-highlight');setTimeout(()=>card?.classList.remove('timer-highlight'),1200);
      return {id,existing:true};
    }
    const id = saved?.id || `t${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const card = document.createElement("div");
    card.className = "timer-card"; card.id = id;
    card.setAttribute("role", "group"); card.setAttribute("aria-label", `Temporizador: ${label}`);
    card.innerHTML = `<img class="timer-clock" src="assets/icons/clock.svg" alt="" width="18" height="18" />
      <div class="timer-info"><span class="timer-label"></span><span class="timer-time" role="timer" aria-live="off"></span><span class="timer-status" role="status" aria-live="polite"></span></div>
      <button type="button" class="timer-pause" aria-label="Pausar temporizador"><img src="assets/icons/pause.svg" alt="" width="20" height="20" /></button>
      <button type="button" class="timer-cancel" aria-label="Encerrar temporizador"><img src="assets/icons/x.svg" alt="" width="20" height="20" /></button>
      <progress class="timer-progress" max="1" value="1" aria-label="Tempo restante"></progress>`;
    card.querySelector('.timer-label').textContent = label;
    timerDock?.append(card);
    const t = {id,label,sourceKey,recipeId:source?.recipeId||saved?.recipeId||null,stepId:source?.stepId||saved?.stepId||null,durationId:source?.durationId||saved?.durationId||null,totalSeconds:seconds,remaining:saved?.remaining ?? seconds,paused:saved?.paused ?? false,deadline:saved?.deadline ?? Date.now()+seconds*1000,done:saved?.done ?? false,interval:null};
    timerMap.set(id,t);
    card.querySelector('.timer-pause').addEventListener('click',()=>t.paused?resumeTimer(id):pauseTimer(id));
    card.querySelector('.timer-cancel').addEventListener('click',()=>removeTimer(id));
    if (t.done) { updateTimerUI(id); setTimeout(()=>removeTimer(id),30000); }
    else startTimerInterval(id);
    saveTimers();
  }
  function tickTimer(id) {
    const t = timerMap.get(id); if (!t || t.done) return;
    if (!t.paused) t.remaining = Math.max(0, Math.ceil((t.deadline-Date.now())/1000));
    if (t.remaining === 0) {
      t.done = true; clearInterval(t.interval);
      updateTimerUI(id); saveTimers(); playBell();
      setTimeout(()=>removeTimer(id),30000);
    } else updateTimerUI(id);
  }
  function startTimerInterval(id) {
    const t = timerMap.get(id); if (!t) return;
    clearInterval(t.interval); tickTimer(id);
    if (!t.done) t.interval = setInterval(()=>tickTimer(id),250);
  }
  function updateTimerUI(id) {
    const t = timerMap.get(id), card = document.getElementById(id); if (!t || !card) return;
    card.querySelector('.timer-time').textContent = fmtTime(t.remaining);
    const status = t.done ? 'Concluído!' : t.paused ? 'Pausado' : 'Em andamento';
    const statusEl = card.querySelector('.timer-status');
    if (statusEl.textContent !== status) statusEl.textContent = status;
    card.querySelector('.timer-progress').value = Math.max(0,Math.min(1,t.remaining/t.totalSeconds));
    const button = card.querySelector('.timer-pause'); button.disabled = t.done;
    button.setAttribute('aria-label',t.paused?'Retomar temporizador':'Pausar temporizador');
    button.querySelector('img').src = `assets/icons/${t.paused?'play':'pause'}.svg`;
    card.classList.toggle('paused',t.paused); card.classList.toggle('timer-done',t.done);
  }
  function pauseTimer(id) {
    const t = timerMap.get(id); if (!t || t.done) return;
    tickTimer(id); if(t.done) return;
    t.paused = true; updateTimerUI(id); saveTimers();
  }
  function resumeTimer(id) {
    const t = timerMap.get(id); if (!t || t.done) return;
    t.deadline = Date.now()+t.remaining*1000; t.paused = false;
    updateTimerUI(id); saveTimers();
  }
  function removeTimer(id) {
    const t=timerMap.get(id); if(!t)return;
    clearInterval(t.interval); document.getElementById(id)?.remove(); timerMap.delete(id); saveTimers();
  }
  function restoreTimers() {
    try {
      const items = JSON.parse(localStorage.getItem(TIMER_KEY)||'[]');
      if (Array.isArray(items)) items.slice(0,30).forEach(t=>{
        if(t && typeof t.id==='string' && /^t[\w-]+$/.test(t.id) && typeof t.label==='string' && Number.isFinite(t.totalSeconds) && t.totalSeconds>0 && t.totalSeconds<=604800 && Number.isFinite(t.remaining) && t.remaining>=0 && t.remaining<=t.totalSeconds && typeof t.paused==='boolean' && typeof t.done==='boolean' && !timerMap.has(t.id) && Number.isFinite(t.deadline)) launchTimer(t.totalSeconds,t.label,t);
      });
    } catch (_) {}
    const layout = () => {
      const nav=document.querySelector('.mobile-nav'), kitchen=document.querySelector('.kitchen-mode-footer');
      const offset=Math.max(nav?.getBoundingClientRect().height||0,kitchen?.getBoundingClientRect().height||0);
      document.documentElement.style.setProperty('--timer-bottom', `${offset?offset+10:24}px`);
      document.documentElement.style.setProperty('--timer-height', `${timerDock?.getBoundingClientRect().height||0}px`);
    };
    const observer = new ResizeObserver(layout);
    [timerDock,document.querySelector('.mobile-nav'),document.querySelector('.kitchen-mode-footer')].filter(Boolean).forEach(e=>observer.observe(e));
    window.addEventListener('resize',layout); layout();
  }
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden)timerMap.forEach(t=>tickTimer(t.id)); });

  function injectTimerButtons(root) {
    const scope = root || document;
    const targets = scope.matches?.('.rc-step-text, #kitchen-mode-step-text') ? [scope] : [...scope.querySelectorAll('.rc-step-text')];
    for (const step of targets) {
      if (step.dataset.timerButtonsInjected) continue;
      const durations = window.ElGuapoDurations.parse(step.textContent);
      if (!durations.length) continue;
      const card = step.closest('.recipe-card');
      const recipeId = step.dataset.recipeId || card?.id;
      const stepId = step.dataset.stepId;
      if (!recipeId || !stepId) continue;
      step.dataset.timerButtonsInjected = '1';
      const btn = document.createElement('button');btn.type='button';btn.className='timer-btn';
      btn.dataset.recipeId=recipeId;btn.dataset.stepId=stepId;
      btn.dataset.durations=JSON.stringify(durations);
      btn.dataset.seconds=String(Math.round((durations[0].min+durations[0].max)/2));
      btn.dataset.label=`Etapa ${Number(stepId.split('-').at(-1))+1}`;
      const title = durations.length>1 ? `${durations.length} tempos nesta etapa` : durations[0].raw;
      btn.textContent=`${durations.length>1||durations[0].min!==durations[0].max?'Escolher tempo':'Iniciar timer'}: ${title}`;
      if(step.id==='kitchen-mode-step-text')step.append(btn);else step.after(btn);
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const options=JSON.parse(btn.dataset.durations);
        const run=(durationIndex,seconds)=>{
          const name=document.getElementById(btn.dataset.recipeId)?.querySelector('.rc-name')?.textContent.trim()||'';
          return launchTimer(seconds,`${name} · ${btn.dataset.label} · ${options[durationIndex].raw}`,null,{recipeId:btn.dataset.recipeId,stepId:btn.dataset.stepId,durationId:String(durationIndex)});
        };
        if(options.length===1&&options[0].min===options[0].max){run(0,options[0].min);return;}
        if(btn.nextElementSibling?.classList.contains('timer-choice')){btn.nextElementSibling.remove();return;}
        showTimerChoice(btn,options,run);
      });
    }
  }
  function showTimerChoice(button,options,run) {
    const form=document.createElement('form');form.className='timer-choice';form.noValidate=true;
    const field=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent='Escolha o tempo desta etapa';field.append(legend);form.append(field);
    const labelSelect=document.createElement('label');labelSelect.textContent='Duração mencionada';const select=document.createElement('select');select.className='timer-duration-select';
    options.forEach((o,i)=>{const option=document.createElement('option');option.value=i;option.textContent=options.length>1?`${o.raw} — ${o.context||o.raw}`:o.raw;select.append(option)});labelSelect.append(select);field.append(labelSelect);
    const labelPreset=document.createElement('label');labelPreset.textContent='Tempo do temporizador';const preset=document.createElement('select');preset.className='timer-range-select';labelPreset.append(preset);field.append(labelPreset);
    const labelCustom=document.createElement('label');labelCustom.textContent='Outro valor, em minutos';const custom=document.createElement('input');custom.type='number';custom.step='any';custom.className='timer-custom-minutes';labelCustom.append(custom);field.append(labelCustom);
    const error=document.createElement('p');error.setAttribute('role','alert');error.className='timer-choice-error';field.append(error);
    const start=document.createElement('button');start.type='submit';start.className='timer-choice-start';start.textContent='Iniciar temporizador';field.append(start);
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar';cancel.addEventListener('click',()=>{form.remove();button.focus()});field.append(cancel);
    const update=()=>{
      const o=options[Number(select.value)];preset.replaceChildren();
      const choices=o.min===o.max?[['min','Tempo indicado',o.min]]:[['min','Mínimo',o.min],['middle','Intermediário',Math.round((o.min+o.max)/2)],['max','Máximo',o.max],['custom','Outro valor',null]];
      choices.forEach(([v,label,time])=>{const op=document.createElement('option');op.value=v;op.textContent=time===null?label:`${label}: ${fmtTime(time)}`;preset.append(op)});
      preset.value=o.min===o.max?'min':'middle';custom.min=o.min/60;custom.max=o.max/60;custom.value=String((o.min+o.max)/120);labelCustom.hidden=true;custom.disabled=true;error.textContent='';
    };
    select.addEventListener('change',update);preset.addEventListener('change',()=>{labelCustom.hidden=preset.value!=='custom';custom.disabled=preset.value!=='custom';error.textContent='';});update();
    form.addEventListener('submit',e=>{
      e.preventDefault();const index=Number(select.value),o=options[index];const seconds=preset.value==='min'?o.min:preset.value==='max'?o.max:preset.value==='custom'?Math.round(Number(custom.value)*60):Math.round((o.min+o.max)/2);
      if(!Number.isFinite(seconds)||seconds<o.min||seconds>o.max){error.textContent=`Escolha um tempo entre ${fmtTime(o.min)} e ${fmtTime(o.max)}.`;return;}
      const result=run(index,seconds);form.remove();if(result?.existing)document.getElementById(result.id)?.querySelector('.timer-pause').focus();else button.focus();
    });
    button.after(form);select.focus();
  }

  /* ── 8. LISTA DE COMPRAS & MISE EN PLACE ── */
  function getRecipeIngredients(card) {
    const ingredients = [];
    card.querySelectorAll(".rc-ing-group").forEach((group, groupIndex) => {
      if (group.hidden) return;
      const groupName =
        group.querySelector(".rc-ing-group-name")?.textContent || "";
      group.querySelectorAll(".rc-ing-item").forEach((item, itemIndex) => {
        const displayName = item.querySelector(".rc-ing-row span:first-child")?.childNodes[0]?.textContent.trim();
        const name = item.dataset.baseName || displayName;
        const qty = item.querySelector(".rc-ing-qty")?.textContent.trim();
        if (name) {
          ingredients.push({ group: groupName, name, displayName, qty,
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
      const label = document.createElement("label");
      label.className = "mise-label";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "mise-checkbox";
      const info = document.createElement("span");
      info.className = "mise-info";
      const name = document.createElement("span");
      name.className = "mise-name";
      name.textContent = ing.displayName || ing.name;
      const qty = document.createElement("span");
      qty.className = "mise-qty";
      qty.textContent = ing.qty;
      info.append(name, qty);
      label.append(checkbox, info);
      li.append(label);
      checkbox.addEventListener("change", () => {
        li.classList.toggle("checked", checkbox.checked);
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
      card.querySelectorAll('.rc-ing-item').forEach(item=>{item.dataset.baseName=item.querySelector('.rc-ing-row span:first-child')?.childNodes[0]?.textContent.trim()||''});
      card.querySelectorAll('.rc-step-text').forEach((step,i)=>{step.dataset.recipeId=card.id;step.dataset.stepId=`${card.id}-step-${i}`});
      const missing=window.ElGuapoScaling.init(card);
      if(missing.length)console.warn('Referências de escala não localizadas',card.id,missing);
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
        const scaleNote=document.createElement('p');scaleNote.className='recipe-scale-note';scaleNote.hidden=true;
        scaleNote.textContent='Rendimento proporcional. Mantenha o tamanho das porções/formas e distribua o volume em recipientes suficientes. Tempos e temperaturas continuam como referências da receita base; confirme o ponto. Para frações de ovo, pese o ovo batido.';
        scaler.after(scaleNote);

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
            window.ElGuapoScaling.apply(card,mult);
            scaleNote.hidden=mult===1;
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
    return orig ? window.ElGuapoScaling.quantity(orig, mult) : el.textContent.trim();
  }

  /* ── 10. MODO LUZ DE VELA (DARK MODE ORGÂNICO) ── */
  function initCandlelightMode() {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    // Adapted from Uiverse.io by RiccardoRapelli: jolly-chicken-91 (MIT).
    const candleBtn = document.createElement("input");
    candleBtn.type = "checkbox";
    candleBtn.id = "el-guapo-theme-input";
    candleBtn.className = "candle-toggle eg-ts-input";
    candleBtn.setAttribute("role", "switch");
    candleBtn.setAttribute("aria-label", "Alternar tema claro e escuro");
    const switchLabel = document.createElement("label");
    switchLabel.className = "el-guapo-theme-switch";
    switchLabel.htmlFor = candleBtn.id;
    const decoration = document.createElement("span");
    decoration.className = "eg-ts-slider";
    decoration.setAttribute("aria-hidden", "true");
    decoration.innerHTML = `<span class="eg-ts-sun-moon"><svg class="eg-ts-moon-dot" style="left:10px;top:3px;width:6px;height:6px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-moon-dot" style="left:2px;top:10px;width:10px;height:10px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-moon-dot" style="left:16px;top:18px;width:3px;height:3px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-light-ray" style="left:-8px;top:-8px;width:43px;height:43px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-light-ray" style="left:-14px;top:-14px;width:55px;height:55px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-light-ray" style="left:-18px;top:-18px;width:60px;height:60px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-cloud-dark" style="left:30px;top:15px;width:40px;height:40px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-cloud-dark" style="left:44px;top:10px;width:20px;height:20px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-cloud-dark" style="left:18px;top:24px;width:30px;height:30px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-cloud-light" style="left:36px;top:18px;width:40px;height:40px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-cloud-light" style="left:48px;top:14px;width:20px;height:20px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg><svg class="eg-ts-cloud-light" style="left:22px;top:26px;width:30px;height:30px" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg></span><span class="eg-ts-stars"><svg class="eg-ts-star" style="left:3px;top:2px;width:20px;height:20px;animation-delay:0.3s" viewBox="0 0 20 20"><path d="M0 10 C10 10 10 10 0 10 C10 10 10 10 10 20 C10 10 10 10 20 10 C10 10 10 10 10 0 C10 10 10 10 0 10Z"/></svg><svg class="eg-ts-star" style="left:3px;top:16px;width:6px;height:6px;animation-delay:0s" viewBox="0 0 20 20"><path d="M0 10 C10 10 10 10 0 10 C10 10 10 10 10 20 C10 10 10 10 20 10 C10 10 10 10 10 0 C10 10 10 10 0 10Z"/></svg><svg class="eg-ts-star" style="left:10px;top:20px;width:12px;height:12px;animation-delay:0.6s" viewBox="0 0 20 20"><path d="M0 10 C10 10 10 10 0 10 C10 10 10 10 10 20 C10 10 10 10 20 10 C10 10 10 10 10 0 C10 10 10 10 0 10Z"/></svg><svg class="eg-ts-star" style="left:18px;top:0px;width:18px;height:18px;animation-delay:1.3s" viewBox="0 0 20 20"><path d="M0 10 C10 10 10 10 0 10 C10 10 10 10 10 20 C10 10 10 10 20 10 C10 10 10 10 10 0 C10 10 10 10 0 10Z"/></svg></span>`;
    switchLabel.append(candleBtn, decoration);

    // Insere o botão no nav, antes dos links ou no final se não houver links
    const navLinks = nav.querySelector(".nav-links");
    if (navLinks) {
      navLinks.before(switchLabel);
    } else {
      nav.appendChild(switchLabel);
    }

    let isDark = document.documentElement.classList.contains("candlelight");
    try { isDark = localStorage.getItem("eg-candlelight") === "true"; } catch {}
    const applyTheme = active => {
      document.documentElement.classList.toggle("candlelight", active);
      candleBtn.checked = active;
      document.querySelector('meta[name="theme-color"]').content = active ? "#241B20" : "#FFFDF8";
    };
    applyTheme(isDark);
    candleBtn.checked = isDark;

    candleBtn.addEventListener("change", () => {
      const active = candleBtn.checked;
      applyTheme(active);
      try { localStorage.setItem("eg-candlelight", String(active)); } catch {}
      if (navigator.vibrate) navigator.vibrate(10);
    });
    window.addEventListener("storage", event => {
      if (event.key === "eg-candlelight" || event.key === null) applyTheme(event.newValue === "true");
    });
  }

  /* ── 9. INICIALIZAÇÃO ── */
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

  function initLaunchShortcuts() {
    const params = new URLSearchParams(location.search);
    const kitchen = params.get("mode") === "kitchen";
    if (!kitchen && params.get("view") !== "index") return;
    const catalog = document.getElementById("catalogo");
    searchInput.value = "";
    document.querySelector('[data-category="all"]').click();
    catalog.scrollIntoView({block: "start"});
    if (kitchen) {
      const list = document.createElement("div");
      list.className = "kitchen-recipe-picker";
      document.querySelectorAll(".recipe-card").forEach(card => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "kitchen-recipe-option";
        const name = card.querySelector(".rc-name").textContent.trim();
        button.setAttribute("aria-label", `Preparar ${name}`);
        const image = document.createElement("img");
        image.src = card.querySelector(".rc-image img").getAttribute("src");
        image.alt = "";image.width = 72;image.height = 72;image.decoding = "async";
        const copy = document.createElement("span");copy.className = "kitchen-picker-copy";
        const title = document.createElement("span");title.className = "kitchen-picker-name";title.textContent = name;
        const detail = document.createElement("span");detail.className = "kitchen-picker-detail";
        detail.textContent = `${card.dataset.category === "savory" ? "Salgados" : "Doces"} · ${card.querySelectorAll(".rc-step-text").length} etapas`;
        copy.append(title, detail);
        const arrow = document.createElement("span");arrow.className = "kitchen-picker-arrow";arrow.setAttribute("aria-hidden", "true");
        arrow.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
        button.append(image, copy, arrow);
        button.addEventListener("click", () => {
          closeModal();
          if (!card.classList.contains("open")) card.querySelector(".rc-head").click();
          card.querySelector(".kitchen-btn").focus();
          startKitchenMode(card);
        });
        list.append(button);
      });
      openModal("Modo Foco", "Uma receita, um passo de cada vez.", list);
    } else {
      searchInput.focus({preventScroll: true});
    }
    // Consume supported launch parameters so a reload does not reopen the picker.
    if (kitchen) params.delete("mode");
    if (params.get("view") === "index") params.delete("view");
    const query = params.toString();
    history.replaceState(null, "", location.pathname + (query ? "?" + query : "") + location.hash);
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

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("sw.js", { updateViaCache: "none" })
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
    restoreTimers();
    initLaunchShortcuts();
  });
})();
