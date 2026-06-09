/*
 * ═══════════════════════════════════════════════════════════════════
 * EL GUAPO — SCRIPT PRINCIPAL v5.1
 * Clean Code, Wake Lock, Kitchen Mode, Timers & PWA
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    /* ── 1. VARIÁVEIS GLOBAIS & ESTADO ── */
    const nav = document.getElementById('nav');
    const idxBtn = document.getElementById('idx-btn');
    const heroEl = document.querySelector('.hero');
    const timerDock = document.getElementById('timer-dock');
    const timerMap = new Map();
    let wakeLock = null;

    // Estado do Modo Cozinha
    const kitchenModeOverlay = document.getElementById('kitchen-mode-overlay');
    const kitchenModeClose = document.getElementById('kitchen-mode-close');
    const kitchenModePrev = document.getElementById('kitchen-mode-prev');
    const kitchenModeNext = document.getElementById('kitchen-mode-next');
    const kitchenModeStepNumber = document.getElementById('kitchen-mode-step-number');
    const kitchenModeStepText = document.getElementById('kitchen-mode-step-text');
    const kitchenModeRecipeName = document.getElementById('kitchen-mode-recipe-name');
    const kitchenModeProgress = document.getElementById('kitchen-mode-progress');

    let currentRecipeSteps = [];
    let currentStepIndex = 0;

    // Estado do Modal (Mise en Place / Lista de Compras)
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalBody = document.getElementById('modal-body');

    function openModal(title, subtitle, content) {
        if (!modalOverlay) return;
        modalTitle.textContent = title;
        modalSubtitle.textContent = subtitle;
        modalBody.innerHTML = '';
        modalBody.appendChild(content);
        modalOverlay.classList.add('active');
        modalOverlay.setAttribute('aria-hidden', 'false');
        toggleScroll(false);
    }

    function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('active');
        modalOverlay.setAttribute('aria-hidden', 'true');
        toggleScroll(true);
    }

    function toggleScroll(enable) {
        document.body.style.overflow = enable ? '' : 'hidden';
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    /* ── 2. NAVEGAÇÃO & UI BÁSICA ── */
    const hamburger = document.getElementById('nav-hamburger');
    const drawer = document.getElementById('nav-drawer');
    const drawerClose = document.getElementById('nav-drawer-close');
    const drawerLinks = document.querySelectorAll('.nav-drawer-links a');

    const toggleDrawer = (isOpen) => {
        if (!drawer) return;
        drawer.classList.toggle('open', isOpen);
        drawer.setAttribute('aria-hidden', !isOpen);
        toggleScroll(!isOpen);
    };

    if (hamburger) hamburger.addEventListener('click', () => toggleDrawer(true));
    if (drawerClose) drawerClose.addEventListener('click', () => toggleDrawer(false));
    drawerLinks.forEach(link => link.addEventListener('click', () => toggleDrawer(false)));

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (nav) nav.classList.toggle('solid', scrolled > 50);
        if (idxBtn && heroEl) {
            idxBtn.classList.toggle('visible', scrolled > heroEl.offsetHeight * 0.75);
        }
    }, { passive: true });

    // Intersection Observer para fade-in
    const fadeObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                fadeObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.06 });
    document.querySelectorAll('.js-fade, .recipe-card').forEach(el => fadeObs.observe(el));

    // Nav Link Ativa
    const navLinks = document.querySelectorAll('.nav-links a');
    const secObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const id = e.target.getAttribute('id');
                navLinks.forEach(a => a.classList.toggle('nav-active', a.getAttribute('href') === `#${id}`));
            }
        });
    }, { rootMargin: '-38% 0px -55% 0px' });
    document.querySelectorAll('section[id]').forEach(s => secObs.observe(s));

    /* ── 3. ACCORDION & INJEÇÃO DE COMPONENTES ── */
    document.addEventListener('click', e => {
        if (e.target.closest('.kitchen-btn, .rc-user-notes-head, .rc-user-notes-save, .rc-scale-btn, .search-clear, .timer-btn, .timer-cancel')) return;
        
        const head = e.target.closest('.rc-head');
        if (!head) return;
        
        const card = head.closest('.recipe-card');
        const isOpen = card.classList.toggle('open');
        head.setAttribute('aria-expanded', String(isOpen));
        
        if (isOpen) {
            setTimeout(() => injectTimerButtons(card), 60);
            requestWakeLock();
        }
    });

    document.addEventListener('keydown', e => {
        const head = e.target.closest('.rc-head');
        const timerCard = e.target.closest('.timer-card');
        
        if (e.key === 'Enter' || e.key === ' ') {
            if (head) {
                e.preventDefault();
                head.click();
            } else if (timerCard) {
                e.preventDefault();
                timerCard.click();
            }
        }
    });

    /* ── 4. BUSCA ── */
    const searchInput = document.getElementById('recipe-search');
    const searchClear = document.getElementById('search-clear');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            if (searchClear) searchClear.style.display = q ? 'block' : 'none';

            document.querySelectorAll('.recipe-card').forEach(card => {
                card.classList.toggle('search-hidden', q.length > 0 && !card.textContent.toLowerCase().includes(q));
            });

            document.querySelectorAll('section[id]').forEach(sec => {
                const wrap = sec.querySelector('.recipe-wrap');
                if (!wrap) return;
                const cards = wrap.querySelectorAll('.recipe-card');
                const visible = [...cards].filter(c => !c.classList.contains('search-hidden'));
                let msg = wrap.querySelector('.search-no-results');

                if (q && visible.length === 0 && cards.length > 0) {
                    if (!msg) {
                        msg = document.createElement('div');
                        msg.className = 'section-empty search-no-results';
                        msg.innerHTML = `<span class="section-empty-line"></span><span class="section-empty-text">Nenhuma receita encontrada</span><span class="section-empty-line"></span>`;
                        wrap.appendChild(msg);
                    }
                    msg.style.display = 'flex';
                } else if (msg) {
                    msg.style.display = 'none';
                }
            });
        });

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                searchInput.focus();
            });
        }
    }

    /* ── 5. WAKE LOCK API ── */
    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('✓ Wake Lock ativo: Tela permanecerá acesa.');
            }
        } catch (err) {
            console.warn(`Wake Lock indisponível: ${err.name}`);
        }
    }

    document.addEventListener('visibilitychange', async () => {
        if (document.hidden && wakeLock) {
            await wakeLock.release();
            wakeLock = null;
        }
    });

    /* ── 6. MODO COZINHA (OVERLAY) ── */
    function startKitchenMode(card) {
        const recipeName = card.querySelector('.rc-name')?.textContent || 'Receita';
        const steps = Array.from(card.querySelectorAll('.rc-step-text'));

        if (steps.length === 0) return alert('Esta receita não possui passos detalhados.');

        currentRecipeSteps = steps.map(step => step.innerHTML);
        currentStepIndex = 0;

        if (kitchenModeRecipeName) kitchenModeRecipeName.textContent = recipeName;
        displayKitchenStep();
        
        if (kitchenModeOverlay) {
            kitchenModeOverlay.classList.add('active');
            kitchenModeOverlay.setAttribute('aria-hidden', 'false');
        }
        toggleScroll(false);
        requestWakeLock();
    }

    function displayKitchenStep() {
        if (currentStepIndex < 0 || currentStepIndex >= currentRecipeSteps.length) return;

        const stepNum = currentStepIndex + 1;
        const stepText = currentRecipeSteps[currentStepIndex];

        if (kitchenModeStepNumber) kitchenModeStepNumber.textContent = `Passo ${stepNum}`;
        if (kitchenModeStepText) {
            kitchenModeStepText.innerHTML = stepText;
            // Limpa o dataset para forçar a reinjeção dos botões de timer
            delete kitchenModeStepText.dataset.timerButtonsInjected;
            injectTimerButtons(kitchenModeStepText);
        }
        if (kitchenModeProgress) kitchenModeProgress.textContent = `${stepNum} de ${currentRecipeSteps.length}`;

        if (kitchenModePrev) kitchenModePrev.disabled = currentStepIndex === 0;
        if (kitchenModeNext) {
            kitchenModeNext.textContent = currentStepIndex === currentRecipeSteps.length - 1 ? 'Concluir' : 'Próximo';
            kitchenModeNext.disabled = false;
        }
    }

    if (kitchenModePrev) kitchenModePrev.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            displayKitchenStep();
        }
    });

    if (kitchenModeNext) kitchenModeNext.addEventListener('click', () => {
        if (currentStepIndex < currentRecipeSteps.length - 1) {
            currentStepIndex++;
            displayKitchenStep();
        }
    });

    if (kitchenModeClose) kitchenModeClose.addEventListener('click', () => {
        if (kitchenModeOverlay) {
            kitchenModeOverlay.classList.remove('active');
            kitchenModeOverlay.setAttribute('aria-hidden', 'true');
        }
        toggleScroll(true);
    });

    /* ── 7. TIMERS CONTEXTUAIS ── */
    function fmtTime(secs) {
        if (secs <= 0) return '0s';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}h${m > 0 ? ' ' + m + 'min' : ''}`;
        if (m > 0) return `${m}min${s > 0 ? ' ' + s + 's' : ''}`;
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
                osc.type = 'sine';
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

        const card = document.createElement('div');
        card.className = 'timer-card';
        card.id = id;
        card.setAttribute('role', 'status');
        card.setAttribute('aria-live', 'polite');
        card.setAttribute('tabindex', '0');
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
        card.addEventListener('click', (e) => {
            if (e.target.closest('.timer-cancel')) return;
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
            circumference
        };

        timerMap.set(id, timerObj);
        startTimerInterval(id);

        const cancelBtn = card.querySelector('.timer-cancel');
        cancelBtn.addEventListener('click', (e) => {
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
                    card.classList.add('timer-done');
                    card.querySelector('.timer-status').textContent = 'Concluído!';
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

        const progressEl = card.querySelector('.timer-ring-progress');
        const timeEl = card.querySelector('.timer-ring-time');
        const statusEl = card.querySelector('.timer-status');

        const progress = tObj.remaining / tObj.totalSeconds;
        const offset = tObj.circumference * (1 - progress);

        if (progressEl) progressEl.style.strokeDashoffset = offset.toFixed(2);
        if (timeEl) timeEl.textContent = fmtTime(tObj.remaining);
        if (statusEl) statusEl.textContent = tObj.paused ? 'Pausado' : fmtTime(tObj.remaining);
    }

    function pauseTimer(id) {
        const tObj = timerMap.get(id);
        if (!tObj) return;
        tObj.paused = true;
        const card = document.getElementById(id);
        if (card) card.classList.add('paused');
        updateTimerUI(id);
    }

    function resumeTimer(id) {
        const tObj = timerMap.get(id);
        if (!tObj) return;
        tObj.paused = false;
        const card = document.getElementById(id);
        if (card) card.classList.remove('paused');
        updateTimerUI(id);
    }

    function removeTimer(id) {
        const tObj = timerMap.get(id);
        if (!tObj) return;
        
        clearInterval(tObj.interval);
        const card = document.getElementById(id);
        if (card) {
            card.classList.add('timer-removing');
            setTimeout(() => card.remove(), 340);
        }
        timerMap.delete(id);
    }



    function injectTimerButtons(root) {
        const scope = root || document;
        const MAX_SECONDS = 3 * 60 * 60;
        const MIN_SECONDS = 10;
        
        let targets = [];
        if (scope.id === 'kitchen-mode-step-text') {
            targets = [scope];
        } else if (scope.classList && scope.classList.contains('rc-step-text')) {
            targets = [scope];
        } else {
            // Garante que pegamos tanto as receitas quanto o modo cozinha
            targets = Array.from(scope.querySelectorAll('.rc-step-text'));
            const kmText = document.getElementById('kitchen-mode-step-text');
            if (kmText) targets.push(kmText);
        }

        targets.forEach(stepEl => {
            if (stepEl.dataset.timerButtonsInjected) return;
            
            const timePatterns = [
                { regex: /(\d+)\s*(?:a\s*)?(\d+)?\s*(?:h|horas?|hr)/gi, type: 'h' },
                { regex: /(\d+)\s*(?:a\s*)?(\d+)?\s*(?:min|minutos?)/gi, type: 'm' },
                { regex: /(\d+)\s*(?:a\s*)?(\d+)?\s*(?:seg|segundos?)/gi, type: 's' }
            ];
            
            let foundTime = null;
            let timeLabel = '';
            
            for (const patternObj of timePatterns) {
                const match = patternObj.regex.exec(stepEl.textContent);
                if (match) {
                    const val1 = parseInt(match[1], 10);
                    const val2 = match[2] ? parseInt(match[2], 10) : val1;
                    const avgVal = Math.round((val1 + val2) / 2);
                    
                    let seconds = 0;
                    if (patternObj.type === 'h') {
                        seconds = avgVal * 3600;
                        timeLabel = `${avgVal}h`;
                    } else if (patternObj.type === 'm') {
                        seconds = avgVal * 60;
                        timeLabel = `${avgVal}min`;
                    } else if (patternObj.type === 's') {
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
                stepEl.dataset.timerButtonsInjected = '1';
                const btn = document.createElement('button');
                btn.className = 'timer-btn';
                btn.setAttribute('data-seconds', foundTime);
                btn.setAttribute('data-label', timeLabel);
                btn.innerHTML = `<svg class="timer-btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> <span>ativar timer: ${timeLabel}</span>`;
                
                stepEl.after(btn);
                
                btn.addEventListener('click', (e) => {
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
        card.querySelectorAll('.rc-ing-group').forEach(group => {
            const groupName = group.querySelector('.rc-ing-group-name')?.textContent || '';
            group.querySelectorAll('.rc-ing-item').forEach(item => {
                const name = item.querySelector('.rc-ing-row span:first-child')?.childNodes[0]?.textContent.trim();
                const qty = item.querySelector('.rc-ing-qty')?.textContent.trim();
                if (name) {
                    ingredients.push({ group: groupName, name, qty });
                }
            });
        });
        return ingredients;
    }

    function generateShoppingList(card) {
        const recipeName = card.querySelector('.rc-name')?.textContent || 'Receita';
        const ingredients = getRecipeIngredients(card);
        const listText = `🛒 *Lista de Compras: ${recipeName}*\n\n` + ingredients.map(i => `• ${i.name}: ${i.qty}`).join('\n');
        
        const container = document.createElement('div');
        container.className = 'shop-actions';
        container.innerHTML = `
            <div class="shop-html-list">
                ${ingredients.map(ing => `
                    <div class="shop-item" style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--line-faint)">
                        <span style="font-weight:500">${ing.name}</span>
                        <span style="color:var(--terra); font-weight:600">${ing.qty}</span>
                    </div>`).join('')}
            </div>
            <button class="shop-copy-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                Copiar para WhatsApp / Notas
            </button>`;

        container.querySelector('.shop-copy-btn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            navigator.clipboard.writeText(listText).then(() => {
                const oldHTML = btn.innerHTML;
                btn.innerHTML = '✓ Copiado!';
                btn.style.background = '#27ae60';
                setTimeout(() => { btn.innerHTML = oldHTML; btn.style.background = ''; }, 2000);
            });
        });

        openModal('Lista de Compras', recipeName.toUpperCase(), container);
    }

    function startMiseEnPlace(card) {
        const recipeName = card.querySelector('.rc-name')?.textContent || 'Receita';
        const ingredients = getRecipeIngredients(card);
        
        const list = document.createElement('ul');
        list.className = 'mise-list';
        
        ingredients.forEach(ing => {
            const li = document.createElement('li');
            li.className = 'mise-item';
            li.innerHTML = `
                <div class="mise-checkbox"></div>
                <div class="mise-info">
                    <span class="mise-name" style="display:block; font-weight:600; font-size:0.95rem">${ing.name}</span>
                    <span class="mise-qty" style="display:block; font-size:0.8rem; color:var(--terra)">${ing.qty}</span>
                </div>
            `;
            li.addEventListener('click', () => {
                li.classList.toggle('checked');
                // Haptic feedback se disponível
                if (window.navigator.vibrate) window.navigator.vibrate(10);
            });
            list.appendChild(li);
        });

        openModal('Mise en Place', 'Organize sua bancada', list);
    }

    /* ── 9. ESCALONADOR & NOTAS ── */
    function initRecipeCards() {
        document.querySelectorAll('.recipe-card').forEach(card => {
            const head = card.querySelector('.rc-head');
            const rcBody = card.querySelector('.rc-body');
            const ingCol = card.querySelector('.rc-ingredients');

            if (head && !head.querySelector('.kitchen-btn')) {
                const kitchenBtn = document.createElement('button');
                kitchenBtn.className = 'kitchen-btn';
                kitchenBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="kitchen-icon-svg"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/><path d="M12 18V2"/></svg>`;
                kitchenBtn.title = 'Modo Foco na Cozinha';
                kitchenBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    startKitchenMode(card);
                });
                head.appendChild(kitchenBtn);
            }

            if (ingCol) {
                const colLabel = ingCol.querySelector('.rc-col-label');
                const qtyEls = ingCol.querySelectorAll('.rc-ing-qty');
                qtyEls.forEach(el => el.setAttribute('data-orig', el.textContent.trim()));

                const scaler = document.createElement('div');
                scaler.className = 'rc-scaler';
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
                if (!ingCol.querySelector('.rc-quick-actions')) {
                    const quickActions = document.createElement('div');
                    quickActions.className = 'rc-quick-actions';
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

                    quickActions.querySelector('.rc-shop-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        generateShoppingList(card);
                    });

                    quickActions.querySelector('.rc-mise-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        startMiseEnPlace(card);
                    });
                }

                scaler.querySelectorAll('.rc-scale-btn').forEach(btn => {
                    btn.addEventListener('click', e => {
                        e.stopPropagation();
                        const mult = parseFloat(btn.dataset.mult);
                        scaler.querySelectorAll('.rc-scale-btn').forEach(b => b.classList.toggle('rc-scale-btn--active', b === btn));
                        qtyEls.forEach(el => {
                            el.textContent = scaleText(el.getAttribute('data-orig'), mult);
                        });
                    });
                });
            }

            if (rcBody) {
                const noteKey = `eg-note-${card.id}`;
                const savedNote = localStorage.getItem(noteKey) || '';
                const notesSection = document.createElement('div');
                notesSection.className = 'rc-user-notes';
                notesSection.innerHTML = `
                    <div class="rc-user-notes-head" role="button" tabindex="0" aria-expanded="false">
                        <span class="rc-user-notes-label">Anotações Pessoais</span>
                        <span class="rc-user-notes-toggle">${savedNote ? 'editar' : 'adicionar nota'}</span>
                    </div>
                    <div class="rc-user-notes-body${savedNote ? ' open' : ''}">
                        <textarea class="rc-user-notes-area" placeholder="Ajustes, variações...">${savedNote}</textarea>
                        <div class="rc-user-notes-actions">
                            <span class="rc-user-notes-saved">salvo</span>
                            <button class="rc-user-notes-save">salvar</button>
                        </div>
                    </div>`;
                rcBody.appendChild(notesSection);

                const nHead = notesSection.querySelector('.rc-user-notes-head');
                const nBody = notesSection.querySelector('.rc-user-notes-body');
                const nArea = notesSection.querySelector('.rc-user-notes-area');
                const nSave = notesSection.querySelector('.rc-user-notes-save');
                const nSaved = notesSection.querySelector('.rc-user-notes-saved');
                const nToggle = notesSection.querySelector('.rc-user-notes-toggle');

                nHead.addEventListener('click', () => {
                    const open = nBody.classList.toggle('open');
                    nHead.setAttribute('aria-expanded', String(open));
                });

                nSave.addEventListener('click', e => {
                    e.stopPropagation();
                    localStorage.setItem(noteKey, nArea.value);
                    nToggle.textContent = nArea.value.trim() ? 'editar' : 'adicionar nota';
                    nSaved.classList.add('flash');
                    setTimeout(() => nSaved.classList.remove('flash'), 1800);
                });
            }
        });
    }

    function scaleText(orig, mult) {
        if (!orig || /q\.b\.|a gosto|opcional|%/i.test(orig)) return orig;
        const rng = orig.match(/^(~?)([\d]+(?:[.,]\d+)?)\s*[–—-]\s*([\d]+(?:[.,]\d+)?)\s*([a-zA-Z.]*.*)?$/);
        if (rng) {
            const lo = smartRound(parseFloat(rng[2].replace(',', '.')) * mult);
            const hi = smartRound(parseFloat(rng[3].replace(',', '.')) * mult);
            return `${rng[1]}${lo}–${hi}${rng[4] || ''}`.trim();
        }
        const sim = orig.match(/^(~?)(\d+(?:[.,]\d+)?)\s*(.*)?$/);
        if (sim) {
            const num = parseFloat(sim[2].replace(',', '.'));
            const scaled = smartRound(num * mult);
            const formatted = Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1).replace('.', ',');
            return `${sim[1]}${formatted}${sim[3] ? ' ' + sim[3].trim() : ''}`.trim();
        }
        return orig;
    }

    function smartRound(n) {
        if (n >= 100) return Math.round(n);
        if (n >= 10) return Math.round(n * 2) / 2;
        return Math.round(n * 10) / 10;
    }

    /* ── 9. INICIALIZAÇÃO ── */
    document.addEventListener('DOMContentLoaded', () => {
        initRecipeCards();
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('✓ PWA Ativo'))
                .catch(err => console.warn('PWA falhou:', err));
        }

        const splash = document.getElementById('splash');
        if (splash) {
            document.body.style.overflow = 'hidden';
            splash.classList.add('animate');
            setTimeout(() => {
                splash.classList.add('exiting');
                setTimeout(() => {
                    document.body.style.overflow = '';
                    splash.remove();
                }, 730);
            }, 2800);
        }

        const footerDate = document.getElementById('footer-date');
        if (footerDate) {
            const d = new Date(document.lastModified);
            if (!isNaN(d)) {
                footerDate.textContent = `atualizado em ${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
            }
        }

        // Restaura as funcionalidades principais
        initCandlelightMode();
        
        // Garante que os botões de timer sejam injetados em todas as receitas no início
        injectTimerButtons();
    });

})();



/* ── 11. MODO LUZ DE VELA (DARK MODE ORGÂNICO) ── */
    function initCandlelightMode() {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        const candleBtn = document.createElement('button');
        candleBtn.className = 'candle-toggle';
        candleBtn.title = 'Modo Luz de Vela';
        candleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle></svg>`;
        
        // Insere o botão no nav, antes dos links ou no final se não houver links
        const navLinks = nav.querySelector('.nav-links');
        if (navLinks) {
            navLinks.before(candleBtn);
        } else {
            nav.appendChild(candleBtn);
        }

        const isDark = localStorage.getItem('eg-candlelight') === 'true';
        if (isDark) document.documentElement.classList.add('candlelight');

        candleBtn.addEventListener('click', () => {
            const active = document.documentElement.classList.toggle('candlelight');
            localStorage.setItem('eg-candlelight', active);
            // Feedback tátil se disponível
            if (navigator.vibrate) navigator.vibrate(10);
        });
    }
