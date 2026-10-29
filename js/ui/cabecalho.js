// Barra superior: nome do mês e seletor de mês/ano

import { app } from '../estado.js';
import { $ } from '../utils/dom.js';
import { chaveHoje, nomeMes, nomeMesAbrev, pad } from '../utils/datas.js';

let anoSeletor = Number(app.mesVisivel.slice(0, 4));

export function renderCabecalho() {
    $('#mes-label').textContent = nomeMes(app.mesVisivel);
    $('#btn-hoje').classList.toggle('d-none', app.mesVisivel === chaveHoje());
    document.title = `${nomeMes(app.mesVisivel)} · Finança Simples`;
}

function renderSeletorMes() {
    const atual = chaveHoje();
    const botoes = Array.from({ length: 12 }, (_, i) => {
        const chave = `${anoSeletor}-${pad(i + 1)}`;
        const mes = app.dados.meses[chave];
        const temDados = mes && (mes.receitas.length || mes.despesas.length);
        const classes = [chave === app.mesVisivel ? 'ativo' : '', chave === atual ? 'atual' : ''].join(' ');
        return `<button class="${classes}" data-acao="seletor-mes" data-chave="${chave}">${nomeMesAbrev(chave)}${temDados ? '<i class="ponto-dados"></i>' : ''}</button>`;
    });
    $('#seletor-mes').innerHTML = `
        <div class="seletor-topo">
            <button class="btn-icone" data-acao="seletor-ano" data-delta="-1" aria-label="Ano anterior"><i class="bi bi-chevron-left"></i></button>
            <strong>${anoSeletor}</strong>
            <button class="btn-icone" data-acao="seletor-ano" data-delta="1" aria-label="Próximo ano"><i class="bi bi-chevron-right"></i></button>
        </div>
        <div class="seletor-grade">${botoes.join('')}</div>`;
}

// Ao abrir o seletor, ele começa no ano do mês exibido
export function abrirSeletorMes() {
    anoSeletor = Number(app.mesVisivel.slice(0, 4));
    renderSeletorMes();
}

export function mudarAnoSeletor(delta) {
    anoSeletor += delta;
    renderSeletorMes();
}
