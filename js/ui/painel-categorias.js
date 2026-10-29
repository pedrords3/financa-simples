// Despesas por categoria, com barra de limite mensal

import { app } from '../estado.js';
import { $ } from '../utils/dom.js';
import { arredondar, esc, moeda } from '../utils/formato.js';
import { resumoMes } from '../dados/calculos.js';
import { categoriasDo } from '../dados/categorias.js';
import { htmlVazio } from './componentes.js';

export function renderCategorias() {
    const r = resumoMes(app.mesVisivel);
    const linhas = categoriasDo('despesa')
        .map(c => ({ c, valor: arredondar(r.porCategoria[c.id] || 0) }))
        .filter(x => x.valor > 0 || x.c.orcamento > 0)
        .sort((a, b) => b.valor - a.valor || (b.c.orcamento || 0) - (a.c.orcamento || 0));

    $('#grafico-rosca-wrap').classList.toggle('d-none', r.despesas <= 0);
    $('#rosca-centro').innerHTML = `<small>Total</small><strong>${moeda(r.despesas)}</strong>`;

    if (!linhas.length) {
        $('#lista-categorias').innerHTML = htmlVazio('bi-pie-chart', 'Sem despesas neste mês ainda.');
        return;
    }

    $('#lista-categorias').innerHTML = linhas.map(({ c, valor }) => {
        const pct = r.despesas > 0 ? (valor / r.despesas) * 100 : 0;
        const ativa = app.abaAtiva === 'despesas' && app.filtros.categoria === c.id;
        let orcamento = '';
        if (c.orcamento > 0) {
            const uso = (valor / c.orcamento) * 100;
            const restante = c.orcamento - valor;
            const cor = uso > 100 ? 'var(--app-danger)' : uso >= 80 ? 'var(--app-warning)' : 'var(--app-primary)';
            orcamento = `
                <div class="barra"><span style="width:${Math.min(100, uso)}%;--cor:${cor}"></span></div>
                <div class="cat-orcamento">${restante >= 0
                    ? `Resta ${moeda(restante)} de ${moeda(c.orcamento)}`
                    : `<span class="negativo">Passou ${moeda(-restante)}</span> do limite de ${moeda(c.orcamento)}`}</div>`;
        }
        return `
            <button class="cat-linha ${ativa ? 'ativa' : ''}" data-acao="filtrar-categoria" data-id="${esc(c.id)}" title="Filtrar lançamentos desta categoria">
                <div class="cat-topo">
                    <span class="ponto" style="--cor:${esc(c.cor)}"></span>
                    <span class="nome">${esc(c.nome)}</span>
                    <span class="text-muted small">${pct.toFixed(0)}%</span>
                    <span class="valor">${moeda(valor)}</span>
                </div>
                ${orcamento}
            </button>`;
    }).join('');
}
