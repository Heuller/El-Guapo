/* ═══════════════════════════════════════════════════════════
 * EL GUAPO — FORM SUBMISSION SYSTEM v1.0
 * Multi-step forms, progressive disclosure, inline validation,
 * smart defaults, and rating micro-interactions
 * ═══════════════════════════════════════════════════════════ */

/* Supabase client is loaded via supabase-loader.js as window._supabase */
const supabase = window._supabase;

/* ── 1. RATING MICRO-INTERACTIONS ── */
function initRecipeRatings() {
    document.querySelectorAll('.recipe-card').forEach(card => {
        const recipeId = card.id || '';
        if (!recipeId) return;

        const cardBody = card.querySelector('.rc-body');
        if (!cardBody || cardBody.querySelector('.rc-rating')) return;

        const ratingWrap = document.createElement('div');
        ratingWrap.className = 'rc-rating';
        ratingWrap.innerHTML = `
            <div class="rc-rating-label">Avalie esta receita:</div>
            <div class="rc-rating-stars" role="radiogroup" aria-label="Avaliar receita" data-recipe="${recipeId}">
                ${[1,2,3,4,5].map(n => `
                    <button class="rc-star" data-val="${n}" aria-label="${n} estrela${n>1?'s':''}" type="button">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                `).join('')}
            </div>
            <span class="rc-rating-msg"></span>
        `;
        cardBody.appendChild(ratingWrap);

        const stars = ratingWrap.querySelectorAll('.rc-star');
        const msg = ratingWrap.querySelector('.rc-rating-msg');
        let currentVal = 0;

        stars.forEach((star, i) => {
            star.addEventListener('mouseenter', () => {
                stars.forEach((s, j) => s.classList.toggle('hover', j <= i));
            });
            star.addEventListener('mouseleave', () => {
                stars.forEach(s => s.classList.remove('hover'));
            });
            star.addEventListener('click', async () => {
                const val = parseInt(star.dataset.val, 10);
                currentVal = val;
                stars.forEach((s, j) => s.classList.toggle('selected', j < val));
                stars.forEach(s => s.disabled = true);
                msg.textContent = 'Obrigado!';
                msg.className = 'rc-rating-msg success';

                try {
                    if (supabase) {
                        await supabase.from('ratings').insert({ recipe_id: recipeId, rating: val });
                    }
                } catch (e) {
                    console.warn('rating save failed', e);
                }
            });
        });
    });
}

/* ── 2. MULTI-STEP RECIPE SUBMISSION FORM ── */
const STEPS = ['Essenciais', 'Ingredientes', 'Modo de Preparo'];
const STEP_FIELDS = {
    0: ['sub-name', 'sub-category', 'sub-difficulty', 'sub-time', 'sub-yield'],
    1: ['sub-ingredients'],
    2: ['sub-steps', 'sub-description']
};

let currentStep = 0;
let formData = {};
let formErrors = {};

function loadFormState() {
    try {
        const saved = localStorage.getItem('eg-form-draft');
        if (saved) formData = JSON.parse(saved);
    } catch (_) {}
}

function saveFormState() {
    localStorage.setItem('eg-form-draft', JSON.stringify(formData));
}

function clearFormState() {
    localStorage.removeItem('eg-form-draft');
}

function setField(name, value) {
    formData[name] = value;
    saveFormState();
}

function setError(name, message) {
    if (message) formErrors[name] = message;
    else delete formErrors[name];
    renderFieldError(name);
}

function validateField(name, value) {
    if (name === 'sub-name') {
        if (!value || value.trim().length < 3) return 'O nome da receita precisa de pelo menos 3 caracteres.';
        if (value.trim().length > 80) return 'O nome não pode ter mais de 80 caracteres.';
    }
    if (name === 'sub-category') {
        if (!value) return 'Selecione uma categoria.';
    }
    if (name === 'sub-time') {
        if (value && value.length > 30) return 'Tempo muito longo.';
    }
    if (name === 'sub-yield') {
        if (value && value.length > 30) return 'Rendimento muito longo.';
    }
    if (name === 'sub-ingredients') {
        const lines = value.split('\n').filter(l => l.trim());
        if (lines.length === 0) return 'Adicione pelo menos 1 ingrediente.';
        if (lines.length > 50) return 'Máximo de 50 ingredientes.';
    }
    if (name === 'sub-steps') {
        const lines = value.split('\n').filter(l => l.trim());
        if (lines.length === 0) return 'Adicione pelo menos 1 passo.';
        if (lines.length > 30) return 'Máximo de 30 passos.';
    }
    if (name === 'sub-description') {
        if (value && value.length > 500) return 'Descrição muito longa.';
    }
    return null;
}

function renderFieldError(name) {
    const el = document.getElementById(name);
    if (!el) return;
    const err = formErrors[name];
    const wrap = el.closest('.form-group') || el.parentElement;
    let msgEl = wrap.querySelector('.field-error');
    if (!msgEl) {
        msgEl = document.createElement('span');
        msgEl.className = 'field-error';
        wrap.appendChild(msgEl);
    }
    msgEl.textContent = err || '';
    msgEl.classList.toggle('visible', !!err);
    el.classList.toggle('invalid', !!err);
    el.setAttribute('aria-invalid', String(!!err));
}

function renderStep() {
    document.querySelectorAll('.form-step').forEach((el, i) => {
        el.classList.toggle('active', i === currentStep);
    });

    const dots = document.querySelectorAll('.form-step-dot');
    dots.forEach((d, i) => {
        d.classList.toggle('done', i < currentStep);
        d.classList.toggle('current', i === currentStep);
    });

    const prev = document.getElementById('form-prev');
    const next = document.getElementById('form-next');
    const submit = document.getElementById('form-submit');
    if (prev) prev.style.display = currentStep === 0 ? 'none' : 'inline-flex';
    if (next) next.style.display = currentStep === STEPS.length - 1 ? 'none' : 'inline-flex';
    if (submit) submit.style.display = currentStep === STEPS.length - 1 ? 'inline-flex' : 'none';

    // Progressive: hide hydration field unless bread
    const cat = formData['sub-category'] || '';
    const hydrationWrap = document.getElementById('sub-hydration-wrap');
    if (hydrationWrap) {
        const isBread = ['Massas e Grelados', 'Brotformas', 'Panes de Panadera'].includes(cat);
        hydrationWrap.style.display = isBread ? 'flex' : 'none';
    }
}

function stepIsValid(stepIndex) {
    const fields = STEP_FIELDS[stepIndex] || [];
    for (const name of fields) {
        const val = formData[name] || '';
        const err = validateField(name, val);
        if (err) return false;
    }
    return true;
}

function showStepError(stepIndex) {
    const fields = STEP_FIELDS[stepIndex] || [];
    for (const name of fields) {
        const val = formData[name] || '';
        const err = validateField(name, val);
        setError(name, err);
    }
}

function initForm() {
    const form = document.getElementById('recipe-form');
    if (!form) return;

    loadFormState();

    // Populate fields from saved state
    Object.entries(formData).forEach(([name, value]) => {
        const el = document.getElementById(name);
        if (el) el.value = value;
    });

    // Progressive hydration toggle
    const catEl = document.getElementById('sub-category');
    if (catEl) {
        catEl.addEventListener('change', () => {
            setField('sub-category', catEl.value);
            renderStep();
        });
    }

    // Inline validation on blur
    form.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('blur', () => {
            const val = el.value;
            setField(el.id, val);
            const err = validateField(el.id, val);
            setError(el.id, err);
        });
        el.addEventListener('input', () => {
            // Clear error immediately while user types
            if (formErrors[el.id]) {
                setError(el.id, null);
            }
        });
    });

    // Navigation
    const prevBtn = document.getElementById('form-prev');
    const nextBtn = document.getElementById('form-next');
    const submitBtn = document.getElementById('form-submit');

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!stepIsValid(currentStep)) {
                showStepError(currentStep);
                return;
            }
            if (currentStep < STEPS.length - 1) {
                currentStep++;
                renderStep();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                renderStep();
            }
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            if (!stepIsValid(currentStep)) {
                showStepError(currentStep);
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            const ingredients = (formData['sub-ingredients'] || '').split('\n').map(l => l.trim()).filter(Boolean);
            const steps = (formData['sub-steps'] || '').split('\n').map(l => l.trim()).filter(Boolean);

            const payload = {
                name: formData['sub-name']?.trim(),
                category: formData['sub-category'] || 'Especiais',
                difficulty: formData['sub-difficulty'] || 'Média',
                prep_time: formData['sub-time']?.trim() || null,
                yield: formData['sub-yield']?.trim() || null,
                hydration_pct: formData['sub-hydration'] ? parseInt(formData['sub-hydration'], 10) || null : null,
                description: formData['sub-description']?.trim() || null,
                ingredients,
                steps,
                notes: formData['sub-notes']?.trim() || null,
                status: 'pending'
            };

            try {
                if (supabase) {
                    const { error } = await supabase.from('recipes_submitted').insert(payload);
                    if (error) throw error;
                }

                showFormSuccess();
                clearFormState();
                formData = {};
                currentStep = 0;
                form.querySelectorAll('input, select, textarea').forEach(el => el.value = '');
                renderStep();
            } catch (e) {
                showFormError('Não foi possível enviar. Tente novamente.');
                console.error(e);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Receita';
            }
        });
    }

    renderStep();
}

function showFormSuccess() {
    const overlay = document.getElementById('form-success-overlay');
    if (overlay) {
        overlay.classList.add('active');
        setTimeout(() => overlay.classList.remove('active'), 4000);
    }
}

function showFormError(msg) {
    const el = document.getElementById('form-global-error');
    if (el) {
        el.textContent = msg;
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 5000);
    }
}

/* ── 3. FEEDBACK FORM ── */
function initFeedbackForm() {
    const form = document.getElementById('feedback-form');
    if (!form) return;

    const msg = form.querySelector('#feedback-msg');
    const btn = form.querySelector('button[type="submit"]');
    const err = form.querySelector('.field-error');

    if (msg) {
        msg.addEventListener('blur', () => {
            if (!msg.value.trim()) {
                msg.classList.add('invalid');
                if (err) { err.textContent = 'Escreva sua mensagem.'; err.classList.add('visible'); }
            }
        });
        msg.addEventListener('input', () => {
            msg.classList.remove('invalid');
            if (err) err.classList.remove('visible');
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = msg ? msg.value.trim() : '';
        if (!text) {
            if (msg) msg.classList.add('invalid');
            if (err) { err.textContent = 'Escreva sua mensagem.'; err.classList.add('visible'); }
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Enviando...';
        }

        try {
            if (supabase) {
                await supabase.from('feedback').insert({
                    message: text,
                    name: form.querySelector('#feedback-name')?.value?.trim() || null,
                    email: form.querySelector('#feedback-email')?.value?.trim() || null,
                    type: 'general'
                });
            }

            if (btn) {
                btn.textContent = 'Enviado!';
                btn.style.background = 'var(--success)';
            }
            if (msg) msg.value = '';
            setTimeout(() => {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Enviar';
                    btn.style.background = '';
                }
            }, 2500);
        } catch (e) {
            if (btn) {
                btn.textContent = 'Erro';
                btn.disabled = false;
            }
            console.error(e);
        }
    });
}

/* ── 4. EXPORT ── */
export function initForms() {
    // initRecipeCards() runs on DOMContentLoaded in script.js;
    // defer rating injection so it sees the dynamically created rc-body.
    setTimeout(() => initRecipeRatings(), 50);
    initForm();
    initFeedbackForm();
}

// Standalone for direct import
initForms();
