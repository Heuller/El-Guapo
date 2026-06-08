/**
 * ═══════════════════════════════════════════════════════════════════
 * EL GUAPO — SCRIPT PRINCIPAL v5.1
 * Refatoração para UI/UX, Mobile Drawer e Interações
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    /* ── 1. ELEMENTOS DO DOM ── */
    const nav = document.getElementById('nav');
    const hamburger = document.getElementById('nav-hamburger');
    const drawer = document.getElementById('nav-drawer');
    const drawerOverlay = document.getElementById('nav-drawer-overlay');
    const drawerClose = document.getElementById('nav-drawer-close');
    const drawerLinks = document.querySelectorAll('.nav-drawer-links a');
    
    const kitchenOverlay = document.getElementById('kitchen-mode-overlay');
    const kitchenClose = document.getElementById('kitchen-mode-close');
    const kitchenPrev = document.getElementById('kitchen-mode-prev');
    const kitchenNext = document.getElementById('kitchen-mode-next');
    const kitchenStepNum = document.getElementById('kitchen-mode-step-number');
    const kitchenStepText = document.getElementById('kitchen-mode-step-text');
    const kitchenRecipeName = document.getElementById('kitchen-mode-recipe-name');
    const kitchenProgress = document.getElementById('kitchen-mode-progress');

    let currentRecipeSteps = [];
    let currentStepIndex = 0;
    let wakeLock = null;

    /* ── 2. NAVEGAÇÃO & MOBILE DRAWER ── */
    function toggleDrawer(open) {
        drawer.classList.toggle('active', open);
        drawerOverlay.classList.toggle('active', open);
        document.body.style.overflow = open ? 'hidden' : '';
    }

    if (hamburger) hamburger.addEventListener('click', () => toggleDrawer(true));
    if (drawerClose) drawerClose.addEventListener('click', () => toggleDrawer(false));
    if (drawerOverlay) drawerOverlay.addEventListener('click', () => toggleDrawer(false));
    drawerLinks.forEach(link => link.addEventListener('click', () => toggleDrawer(false)));

    window.addEventListener('scroll', () => {
        if (nav) nav.classList.toggle('solid', window.scrollY > 50);
    }, { passive: true });

    /* ── 3. ACCORDION (CARDS DE RECEITA) ── */
    document.addEventListener('click', e => {
        const head = e.target.closest('.rc-head');
        if (!head || e.target.closest('button')) return;

        const card = head.closest('.recipe-card');
        const isOpen = card.classList.toggle('open');
        
        if (isOpen) {
            // Injetar botões de timer se ainda não existirem
            injectTimerButtons(card);
        }
    });

    /* ── 4. MODO COZINHA ── */
    function startKitchenMode(card) {
        const name = card.querySelector('.rc-name').textContent;
        const steps = Array.from(card.querySelectorAll('.rc-step-text')).map(s => s.innerHTML);
        
        if (steps.length === 0) return;

        currentRecipeSteps = steps;
        currentStepIndex = 0;
        kitchenRecipeName.textContent = name;
        
        updateKitchenDisplay();
        kitchenOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        requestWakeLock();
    }

    function updateKitchenDisplay() {
        kitchenStepNum.textContent = `Passo ${currentStepIndex + 1}`;
        kitchenStepText.innerHTML = currentRecipeSteps[currentStepIndex];
        kitchenProgress.textContent = `${currentStepIndex + 1} de ${currentRecipeSteps.length}`;
        
        kitchenPrev.disabled = currentStepIndex === 0;
        kitchenNext.disabled = currentStepIndex === currentRecipeSteps.length - 1;
        
        // Re-injetar timers no texto do passo atual
        injectTimerButtons(kitchenStepText);
    }

    if (kitchenPrev) kitchenPrev.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            updateKitchenDisplay();
        }
    });

    if (kitchenNext) kitchenNext.addEventListener('click', () => {
        if (currentStepIndex < currentRecipeSteps.length - 1) {
            currentStepIndex++;
            updateKitchenDisplay();
        }
    });

    if (kitchenClose) kitchenClose.addEventListener('click', () => {
        kitchenOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (wakeLock) wakeLock.release();
    });

    // Injetar botão 👨‍🍳 nos cards
    function initKitchenButtons() {
        document.querySelectorAll('.recipe-card').forEach(card => {
            const head = card.querySelector('.rc-head');
            if (head && !head.querySelector('.kitchen-btn')) {
                const btn = document.createElement('button');
                btn.className = 'kitchen-btn';
                btn.innerHTML = '👨‍🍳';
                btn.title = 'Modo Foco na Cozinha';
                btn.style.cssText = 'background:none; border:1px solid var(--line); padding:0.4rem; cursor:pointer; margin-left:1rem; border-radius:4px;';
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    startKitchenMode(card);
                });
                head.querySelector('.rc-head-main').appendChild(btn);
            }
        });
    }

    /* ── 5. TIMERS CONTEXTUAIS ── */
    function injectTimerButtons(container) {
        const steps = container.querySelectorAll('.rc-step-text');
        const targetSteps = steps.length > 0 ? steps : [container];

        targetSteps.forEach(step => {
            if (step.dataset.timersDone) return;
            
            const text = step.textContent;
            const match = text.match(/(\d+)\s*(minutos?|min|horas?|h)/i);
            
            if (match) {
                let seconds = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                if (unit.startsWith('h')) seconds *= 3600;
                else seconds *= 60;

                const btn = document.createElement('button');
                btn.className = 'timer-btn';
                btn.innerHTML = `⏱ Iniciar Timer (${match[0]})`;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    launchTimer(seconds, match[0]);
                });
                step.appendChild(btn);
            }
            step.dataset.timersDone = 'true';
        });
    }

    function launchTimer(seconds, label) {
        const dock = document.getElementById('timer-dock');
        const timerId = 't' + Date.now();
        const el = document.createElement('div');
        el.className = 'timer-card';
        el.id = timerId;
        el.style.cssText = 'background:var(--dark); color:white; padding:1rem; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center; border-left:4px solid var(--terra);';
        
        let remaining = seconds;
        
        const update = () => {
            const m = Math.floor(remaining / 60);
            const s = remaining % 60;
            el.innerHTML = `<div><strong>${label}</strong>: ${m}:${s < 10 ? '0' : ''}${s}</div> <button onclick="this.parentElement.remove()" style="background:none; border:none; color:white; cursor:pointer;">✕</button>`;
            if (remaining <= 0) {
                clearInterval(interval);
                el.style.background = 'var(--terra)';
                el.innerHTML = `<div><strong>${label}</strong>: PRONTO!</div> <button onclick="this.parentElement.remove()" style="background:none; border:none; color:white; cursor:pointer;">✕</button>`;
                playBell();
            }
            remaining--;
        };

        const interval = setInterval(update, 1000);
        update();
        dock.appendChild(el);
    }

    function playBell() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 440;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
            osc.stop(ctx.currentTime + 1);
        } catch(e) {}
    }

    /* ── 6. WAKE LOCK ── */
    async function requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.warn('Wake Lock failed');
            }
        }
    }

    /* ── 7. TRILHA SONORA & LUZ DE VELA ── */
    // (Mantendo a lógica anterior simplificada para o novo sistema)
    function initExtras() {
        const candleBtn = document.querySelector('.candle-toggle');
        if (candleBtn) {
            candleBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle('candlelight');
            });
        }

        const soundToggle = document.querySelector('.sound-toggle');
        const soundMenu = document.querySelector('.sound-menu');
        if (soundToggle && soundMenu) {
            soundToggle.addEventListener('click', () => soundMenu.classList.toggle('open'));
        }
    }

    /* ── 8. BUSCA ── */
    function initSearch() {
        const input = document.getElementById('recipe-search');
        const clear = document.getElementById('search-clear');
        const cards = document.querySelectorAll('.recipe-card');

        if (!input) return;

        input.addEventListener('input', () => {
            const q = input.value.toLowerCase().trim();
            if (clear) clear.style.display = q ? 'block' : 'none';

            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(q) ? '' : 'none';
            });
        });

        if (clear) {
            clear.addEventListener('click', () => {
                input.value = '';
                input.dispatchEvent(new Event('input'));
                input.focus();
            });
        }
    }

    /* ── 9. INICIALIZAÇÃO ── */
    document.addEventListener('DOMContentLoaded', () => {
        initKitchenButtons();
        initExtras();
        initSearch();
        
        // Fade in observer
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.js-fade').forEach(el => observer.observe(el));
    });

})();
