// Consulta às categorias cadastradas

import { app } from '../estado.js';
import { esc } from '../utils/formato.js';

export function categoria(id) {
    return app.dados.categorias.find(c => c.id === id)
        || { id, nome: 'Sem categoria', tipo: 'despesa', icone: 'bi-tag', cor: '#94a3b8', grupo: 'desejo', orcamento: 0 };
}

export function categoriasDo(tipo) {
    return app.dados.categorias.filter(c => c.tipo === tipo);
}

export function categoriaPadrao(tipo) {
    return tipo === 'receita' ? 'outras-receitas' : 'outros';
}

export function opcoesCategorias(tipo, selecionada) {
    return categoriasDo(tipo)
        .map(c => `<option value="${esc(c.id)}"${c.id === selecionada ? ' selected' : ''}>${esc(c.nome)}</option>`)
        .join('');
}
