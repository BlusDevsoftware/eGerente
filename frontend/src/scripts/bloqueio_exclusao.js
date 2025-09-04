// Utilitário de bloqueio de exclusão por dependências
// Requer window.api disponível

(function() {
    const skipDependenciesFor = new Set(['perfis']);
    function showMessage(message, type) {
        try {
            if (typeof window.mostrarToast === 'function') {
                window.mostrarToast(message, type || 'info');
            } else {
                alert(message);
            }
        } catch (_) {
            alert(message);
        }
    }

    async function checkDependencies(entity, id) {
        if (skipDependenciesFor.has(String(entity))) {
            return { hasDependencies: false };
        }
        try {
            const resp = await window.api.get(`/${entity}/${id}/dependencies`);
            return resp || { hasDependencies: false };
        } catch (error) {
            // 404 (rota não existe) => tratar como sem dependências e seguir fluxo
            const status = (error && error.status) ?? (error && error.response && error.response.status);
            if (status === 404) {
                return { hasDependencies: false };
            }
            // Outras falhas => bloquear por segurança
            const data = (error && error.data) ?? (error && error.response && error.response.data) ?? {};
            const message = (data && (data.message || data.error)) || 'Não foi possível validar vínculos.';
            showMessage(message, 'error');
            return { hasDependencies: true, error: true };
        }
    }

    function ensureDependencyModal() {
        let modal = document.getElementById('dependencyBlockModal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'dependencyBlockModal';
        modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.18); z-index:5000; align-items:center; justify-content:center;';
        modal.innerHTML = `
            <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="dependencyBlockTitle" style="background:#fff; border-radius:16px; max-width:520px; width:96%; box-shadow:0 8px 32px rgba(33,150,243,0.13); padding:0;">
                <div class="modal-header" style="padding:24px 36px 0 36px; border-bottom:1px solid #eee; display:flex; align-items:center; justify-content:space-between;">
                    <h2 id="dependencyBlockTitle" style="margin:0; font-size:1.2em; color:#dc3545; display:flex; align-items:center; gap:10px; font-weight:700;">
                        <i class="fas fa-ban"></i> Ação não permitida
                    </h2>
                    <button id="dependencyBlockCloseBtn" style="background:none; border:none; font-size:1.5em; color:#666; cursor:pointer; padding:5px;">&times;</button>
                </div>
                <div class="modal-body" style="padding:24px 36px;">
                    <div style="text-align:center; margin-bottom:12px;">
                        <i class="fas fa-link" style="font-size:42px; color:#dc3545;"></i>
                    </div>
                    <div id="dependencyBlockMessage" style="font-size:1.05em; color:#333; margin-bottom:14px; text-align:center;"></div>
                    <div id="dependencyBlockDetails" style="background:#fff7f7; border:1px solid #f8d7da; border-radius:8px; padding:12px; display:none;"></div>
                    <div style="display:flex; justify-content:center; gap:12px; margin-top:16px;">
                        <button id="dependencyBlockOkBtn" class="btn-secondary" style="padding:10px 24px; border-radius:6px; font-size:14px; font-weight:500; cursor:pointer; background-color:#f5f5f5; color:#333; border:1px solid #ddd;">Entendi</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        const close = () => {
            modal.classList.remove('show');
            setTimeout(() => { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }, 300);
        };
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
        modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
        modal.querySelector('#dependencyBlockCloseBtn').addEventListener('click', close);
        modal.querySelector('#dependencyBlockOkBtn').addEventListener('click', close);
        return modal;
    }

    function openDependencyBlockModal(message, details) {
        const modal = ensureDependencyModal();
        const msgEl = modal.querySelector('#dependencyBlockMessage');
        const detEl = modal.querySelector('#dependencyBlockDetails');
        msgEl.textContent = message || 'Não é possível concluir esta ação pois há vínculos.';

        const counts = details && details.counts;
        const titles = details && details.titles;
        if (counts && typeof counts === 'object' && Object.keys(counts).length) {
            detEl.style.display = 'block';
            const countItems = Object.entries(counts)
                .filter(([_, v]) => typeof v === 'number' && v > 0)
                .map(([k, v]) => `<div style="margin:4px 0; color:#842029;"><strong>${v}</strong> vínculo(s) em: ${k}</div>`)
                .join('');
            const titlesList = Array.isArray(titles) && titles.length
                ? `<div style="margin-top:8px; color:#842029;">
                        <div><strong>Títulos relacionados:</strong></div>
                        <div style="max-height:140px; overflow:auto; padding:6px 0 0 0;">
                            ${titles.map(t => `<div style=\"margin:2px 0;\">#${t.id} ${t.numero_titulo || ''}</div>`).join('')}
                        </div>
                   </div>`
                : '';
            const items = `${countItems}${titlesList}`;
            detEl.innerHTML = items || '<div style="color:#842029;">Há vínculos associados.</div>';
        } else {
            detEl.style.display = 'none';
            detEl.innerHTML = '';
        }

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
        // Foco no botão de ação
        try { modal.querySelector('#dependencyBlockOkBtn').focus(); } catch (_) {}
    }

    async function deleteWithCheck(entity, id, onSuccess, onBlocked) {
        // 1) checagem opcional
        const deps = await checkDependencies(entity, id);
        if (deps && deps.hasDependencies) {
            const msg = deps.message || 'Não é possível excluir: há vínculos associados a este registro.';
            if (typeof onBlocked === 'function') {
                onBlocked(deps);
            } else if (typeof window.openDependencyBlockModal === 'function') {
                window.openDependencyBlockModal(msg, deps);
            } else {
                showMessage(msg, 'error');
            }
            return { ok: false, blocked: true, details: deps };
        }

        // 2) tentativa de exclusão
        try {
            const safeEntity = encodeURIComponent(String(entity || '').trim());
            const safeId = encodeURIComponent(String(id || '').trim());
            await window.api.delete(`/${safeEntity}/${safeId}`);
            if (typeof onSuccess === 'function') onSuccess();
            return { ok: true };
        } catch (error) {
            const status = (error && error.status) ?? (error && error.response && error.response.status);
            const data = (error && error.data) ?? (error && error.response && error.response.data) ?? {};
            const detailsStr = String(data.details || data.error || '');
            const isFk500 = status === 500 && /foreign key|chave estrangeira/i.test(detailsStr);
            if (status === 409 || status === 400 || isFk500 || data.code === 'FOREIGN_KEY_VIOLATION') {
                const details = data || {};
                const msg = details.message || 'Não é possível excluir: existem vínculos.';
                if (typeof onBlocked === 'function') {
                    onBlocked(details);
                } else {
                    openDependencyBlockModal(msg, details);
                }
                return { ok: false, blocked: true, details };
            }
            showMessage('Erro ao excluir. Tente novamente.', 'error');
            return { ok: false, error };
        }
    }

    // Exportar para escopo global
    window.bloqueioExclusao = {
        checkDependencies,
        deleteWithCheck,
        openDependencyBlockModal,
    };
})();


