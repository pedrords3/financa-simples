// Estado compartilhado entre os módulos

import { chaveHoje } from './utils/datas.js';

export const app = {
    dados: null,                // tudo o que é salvo no navegador: meses, fixas, objetivos, categorias e config
    mesVisivel: chaveHoje(),    // mês exibido, no formato "AAAA-MM"
    abaAtiva: 'despesas',       // despesas | receitas | recorrentes
    filtros: { busca: '', categoria: '', status: '' }
};

export function limparFiltros() {
    Object.assign(app.filtros, { busca: '', categoria: '', status: '' });
}
