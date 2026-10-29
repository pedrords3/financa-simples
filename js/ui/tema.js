// Tema claro/escuro (o tema salvo é aplicado antes da pintura por um script no <head>)

import { STORAGE_TEMA } from '../config.js';
import { $ } from '../utils/dom.js';
import { renderGraficos } from './graficos.js';

export function atualizarIconeTema() {
    const escuro = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    $('#icone-tema').className = `bi ${escuro ? 'bi-sun' : 'bi-moon-stars'}`;
    $('meta[name="theme-color"]').setAttribute('content', escuro ? '#0b1120' : '#0f9d76');
}

export function alternarTema() {
    const novo = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', novo);
    try { localStorage.setItem(STORAGE_TEMA, novo); } catch (erro) { /* ignora */ }
    atualizarIconeTema();
    renderGraficos();
}
