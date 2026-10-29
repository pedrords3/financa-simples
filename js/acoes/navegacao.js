// Troca de mês e atalhos para a lista de pendentes

import { app } from '../estado.js';
import { $ } from '../utils/dom.js';
import { salvar } from '../dados/armazenamento.js';
import { prepararMes } from '../dados/meses.js';
import { render } from '../ui/render.js';

export function irParaMes(chave) {
    app.mesVisivel = chave;
    prepararMes(chave);
    salvar();
    render();
}

export function rolarParaLista() {
    $('#abas').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function mostrarPendentes() {
    app.abaAtiva = 'despesas';
    Object.assign(app.filtros, { busca: '', categoria: '', status: 'pendente' });
    render();
    rolarParaLista();
}
