// Componentes reutilizáveis: modais, confirmação, toasts e estado vazio

import { $, $$ } from '../utils/dom.js';
import { esc } from '../utils/formato.js';

export function modal(id) {
    return bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
}

// Fecha os modais abertos e espera a animação terminar (antes de abrir uma confirmação)
export function fecharModais() {
    const abertos = $$('.modal.show');
    return Promise.all(abertos.map(el => new Promise(resolve => {
        el.addEventListener('hidden.bs.modal', resolve, { once: true });
        bootstrap.Modal.getInstance(el)?.hide();
    })));
}

// Abre o modal de confirmação e resolve com o valor do botão escolhido (ou null se cancelar)
export function confirmar({ titulo, mensagem, botoes }) {
    return new Promise(resolve => {
        const el = $('#modal-confirmar');
        let resultado = null;
        $('#confirmar-titulo').textContent = titulo;
        $('#confirmar-mensagem').innerHTML = mensagem;

        const rodape = $('#confirmar-botoes');
        rodape.innerHTML = '<button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>';
        botoes.forEach(b => {
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = `btn ${b.classe}`;
            botao.textContent = b.texto;
            botao.addEventListener('click', () => {
                resultado = b.valor;
                modal('modal-confirmar').hide();
            });
            rodape.appendChild(botao);
        });

        el.addEventListener('hidden.bs.modal', () => resolve(resultado), { once: true });
        modal('modal-confirmar').show();
    });
}

export function toast(mensagem, tipo = 'sucesso') {
    if (typeof bootstrap === 'undefined') return;
    const el = document.createElement('div');
    el.className = `toast toast-${tipo} border-0`;
    el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${esc(mensagem)}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>`;
    $('#toasts').appendChild(el);
    el.addEventListener('hidden.bs.toast', () => el.remove());
    new bootstrap.Toast(el, { delay: tipo === 'erro' ? 6000 : 3000 }).show();
}

export function htmlVazio(icone, texto, botoes = '') {
    return `<div class="vazio"><i class="bi ${icone}"></i><p>${texto}</p>${botoes}</div>`;
}

// Limpa o estado de validação de um formulário antes de reabri-lo
export function resetarFormulario(form) {
    form.reset();
    form.classList.remove('was-validated');
    $$('input', form).forEach(el => el.setCustomValidity(''));
}
