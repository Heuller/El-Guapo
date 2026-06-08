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
    let activeTimerId = null;
    let activeTimerPaused = false;
    let activeTimerRemaining = 0;

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

    /* ── 2. NAVEGAÇÃO & UI BÁSICA ── */
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
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const head = e.target.closest('.rc-head');
        if (!head) return;
        e.preventDefault();
        head.click();
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

        if (steps.length === 0) {
            alert('Esta receita não possui passos detalhados.');
            return;
        }

        currentRecipeSteps = steps.map(step => step.innerHTML);
        currentStepIndex = 0;

        if (kitchenModeRecipeName) kitchenModeRecipeName.textContent = recipeName;
        displayKitchenStep();
        if (kitchenModeOverlay) {
            kitchenModeOverlay.classList.add('active');
            kitchenModeOverlay.setAttribute('aria-hidden', 'false');
        }
        document.body.style.overflow = 'hidden';
        requestWakeLock();
    }

    function displayKitchenStep() {
        if (currentStepIndex < 0 || currentStepIndex >= currentRecipeSteps.length) return;

        const stepNum = currentStepIndex + 1;
        const stepText = currentRecipeSteps[currentStepIndex];

        if (kitchenModeStepNumber) kitchenModeStepNumber.textContent = `Passo ${stepNum}`;
        if (kitchenModeStepText) kitchenModeStepText.innerHTML = stepText;
        if (kitchenModeProgress) kitchenModeProgress.textContent = `${stepNum} de ${currentRecipeSteps.length}`;

        if (kitchenModePrev) kitchenModePrev.disabled = currentStepIndex === 0;
        if (kitchenModeNext) kitchenModeNext.disabled = currentStepIndex === currentRecipeSteps.length - 1;
        
        setTimeout(() => {
            if (kitchenModeStepText) injectTimerButtons(kitchenModeStepText);
        }, 50);
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
        document.body.style.overflow = '';
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
        // Se há um timer ativo, pausar/retomar ou substituir
        if (activeTimerId) {
            const activeCard = document.getElementById(activeTimerId);
            if (activeCard) {
                const tObj = timerMap.get(activeTimerId);
                if (tObj) {
                    if (activeTimerPaused) {
                        activeTimerPaused = false;
                        resumeTimer(activeTimerId);
                        return;
                    } else {
                        activeTimerPaused = true;
                        pauseTimer(activeTimerId);
                        return;
                    }
                }
            }
        }

        // Parar timer anterior
        if (activeTimerId) {
            const prevCard = document.getElementById(activeTimerId);
            if (prevCard) {
                const tObj = timerMap.get(activeTimerId);
                if (tObj) clearInterval(tObj.interval);
                prevCard.classList.add('timer-removing');
                setTimeout(() => prevCard.remove(), 340);
                timerMap.delete(activeTimerId);
            }
        }

        // Criar novo timer
        const id = `t${Date.now()}`;
        activeTimerId = id;
        activeTimerPaused = false;
        activeTimerRemaining = seconds;
        const circumference = 2 * Math.PI * 17;

        const card = document.createElement('div');
        card.className = 'timer-card';
        card.id = id;
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
                <span class="timer-status">${fmtTime(seconds)}</span>
            </div>
            <button class="timer-cancel" aria-label="Cancelar timer" title="Cancelar">×</button>`;

        if (timerDock) timerDock.appendChild(card);

        const progressEl = card.querySelector('.timer-ring-progress');
        const timeEl = card.querySelector('.timer-ring-time');
        const statusEl = card.querySelector('.timer-status');
        const cancelBtn = card.querySelector('.timer-cancel');

        let remaining = seconds;

        function removeCard() {
            card.classList.add('timer-removing');
            setTimeout(() => card.remove(), 340);
            const tObj = timerMap.get(id);
            if (tObj) clearInterval(tObj.interval);
            timerMap.delete(id);
            if (activeTimerId === id) activeTimerId = null;
        }

        cancelBtn.addEventListener('click', removeCard);

        const interval = setInterval(() => {
            remaining--;
            activeTimerRemaining = remaining;
            const progress = remaining / seconds;
            const offset = circumference * (1 - progress);

            if (progressEl) progressEl.style.strokeDashoffset = offset.toFixed(2);
            if (timeEl) timeEl.textContent = fmtTime(remaining);
            if (statusEl) statusEl.textContent = fmtTime(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                timerMap.delete(id);
                activeTimerId = null;
                card.classList.add('timer-done');
                if (timeEl) timeEl.textContent = '✓';
                if (statusEl) statusEl.textContent = 'Pronto!';
                playBell();
                if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
                setTimeout(removeCard, 6000);
            }
        }, 1000);

        timerMap.set(id, { interval, totalSeconds: seconds });
    }

    function pauseTimer(id) {
        const tObj = timerMap.get(id);
        if (tObj) {
            clearInterval(tObj.interval);
            tObj.paused = true;
        }
    }

    function resumeTimer(id) {
        const tObj = timerMap.get(id);
        if (!tObj || !tObj.paused) return;

        const card = document.getElementById(id);
        if (!card) return;

        const progressEl = card.querySelector('.timer-ring-progress');
        const timeEl = card.querySelector('.timer-ring-time');
        const statusEl = card.querySelector('.timer-status');
        const circumference = 2 * Math.PI * 17;
        let remaining = activeTimerRemaining;
        const totalSeconds = tObj.totalSeconds;

        const interval = setInterval(() => {
            remaining--;
            activeTimerRemaining = remaining;
            const progress = remaining / totalSeconds;
            const offset = circumference * (1 - progress);

            if (progressEl) progressEl.style.strokeDashoffset = offset.toFixed(2);
            if (timeEl) timeEl.textContent = fmtTime(remaining);
            if (statusEl) statusEl.textContent = fmtTime(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                timerMap.delete(id);
                activeTimerId = null;
                card.classList.add('timer-done');
                if (timeEl) timeEl.textContent = '✓';
                if (statusEl) statusEl.textContent = 'Pronto!';
                playBell();
                if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
                setTimeout(() => {
                    card.classList.add('timer-removing');
                    setTimeout(() => card.remove(), 340);
                }, 6000);
            }
        }, 1000);

        tObj.interval = interval;
        tObj.paused = false;
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
            targets = scope.querySelectorAll('.rc-step-text, #kitchen-mode-step-text');
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
                btn.innerHTML = `<span class="timer-btn-icon">⏱</span> <span>ativar timer: ${timeLabel}</span>`;
                
                stepEl.after(btn);
                
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    launchTimer(parseInt(btn.dataset.seconds, 10), btn.dataset.label);
                });
            }
        });
    }

    /* ── 8. ESCALONADOR & NOTAS ── */
    function initRecipeCards() {
        document.querySelectorAll('.recipe-card').forEach(card => {
            const head = card.querySelector('.rc-head');
            const rcBody = card.querySelector('.rc-body');
            const ingCol = card.querySelector('.rc-ingredients');

            if (head && !head.querySelector('.kitchen-btn')) {
                const kitchenBtn = document.createElement('button');
                kitchenBtn.className = 'kitchen-btn';
                kitchenBtn.textContent = '👨‍🍳';
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
                            <span class="rc-user-notes-saved">salvo ✦</span>
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

        initSoundtrack();
        initCandlelightMode();
    });

})();

/* ── 10. TRILHA SONORA GASTRONÔMICA ── */
const sounds = [
    { id: 'fire', name: 'Forno a Lenha', url: 'https://www.soundjay.com/nature/fire-1.mp3' },
    { id: 'rain', name: 'Chuva Suave', url: 'https://www.soundjay.com/nature/rain-01.mp3' },
    { id: 'jazz', name: 'Jazz Instrumental', url: 'https://www.soundjay.com/misc/sounds/coffee-shop-1.mp3' },
    { id: 'bossa', name: 'Bossa Nova & MPB', url: 'https://live.mgradio.com.br/8002/stream' }
];

let currentAudio = null;

function initSoundtrack() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    const soundControl = document.createElement('div');
    soundControl.className = 'sound-control';
    soundControl.innerHTML = `
        <button class="sound-toggle" title="Trilha Sonora Gastronômica">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
        </button>
        <div class="sound-menu">
            ${sounds.map(s => `<button class="sound-item" data-id="${s.id}">${s.name}</button>`).join('')}
            <button class="sound-item sound-stop">Parar</button>
        </div>
    `;
    
    const navLinks = nav.querySelector('.nav-links');
    if (navLinks) navLinks.before(soundControl);

    const toggle = soundControl.querySelector('.sound-toggle');
    const menu = soundControl.querySelector('.sound-menu');

    toggle.addEventListener('click', () => menu.classList.toggle('open'));

    soundControl.querySelectorAll('.sound-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.src = '';
                currentAudio = null;
            }

            if (id) {
                const sound = sounds.find(s => s.id === id);
                currentAudio = new Audio(sound.url);
                currentAudio.crossOrigin = 'anonymous';
                currentAudio.loop = true;
                currentAudio.play().catch(err => {
                    console.error("Erro ao tocar áudio:", err);
                    toggleBtn.classList.remove('playing');
                    if (sound.id === 'bossa') {
                        alert("Não foi possível carregar a rádio Bossa Nova no momento. Tente as opções offline (Chuva ou Jazz).");
                    }
                });
                toggle.classList.add('playing');
            } else {
                toggle.classList.remove('playing');
            }
            menu.classList.remove('open');
        });
    });
}

/* ── 11. MODO LUZ DE VELA (DARK MODE ORGÂNICO) ── */
function initCandlelightMode() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    const candleBtn = document.createElement('button');
    candleBtn.className = 'candle-toggle';
    candleBtn.title = 'Modo Luz de Vela';
    candleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle></svg>`;
    
    const soundControl = nav.querySelector('.sound-control');
    if (soundControl) soundControl.after(candleBtn);

    const isDark = localStorage.getItem('eg-candlelight') === 'true';
    if (isDark) document.documentElement.classList.add('candlelight');

    candleBtn.addEventListener('click', () => {
        const active = document.documentElement.classList.toggle('candlelight');
        localStorage.setItem('eg-candlelight', active);
    });
}
