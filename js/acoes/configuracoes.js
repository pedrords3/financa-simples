// Modal "Categorias e orçamentos": cores, nomes, grupos 50-30-20, limites e saldo acumulado

import { GRUPOS } from '../config.js';
import { app } from '../estado.js';
import { $ } from '../utils/dom.js';
import { esc, gerarId, parseValor, valorParaInput } from '../utils/formato.js';
import { salvar } from '../dados/armazenamento.js';
import { categoria, categoriaPadrao, categoriasDo } from '../dados/categorias.js';
import { confirmar, fecharModais, modal, toast } from '../ui/componentes.js';
import { render } from '../ui/render.js';

function renderConfig() {
    const cabecalho = `
        <div class="config-cat config-cabecalho d-none d-md-grid">
            <span>Cor</span><span>Nome</span><span>Grupo (50-30-20)</span><span>Limite mensal</span><span></span>
        </div>`;

    ['despesa', 'receita'].forEach(tipo => {
        const linhas = categoriasDo(tipo).map(c => `
            <div class="config-cat ${tipo}">
                <input type="color" class="form-control form-control-color" value="${esc(c.cor)}" data-cat="${esc(c.id)}" data-campo="cor" aria-label="Cor de ${esc(c.nome)}">
                <input type="text" class="form-control" value="${esc(c.nome)}" maxlength="30" data-cat="${esc(c.id)}" data-campo="nome" aria-label="Nome da categoria">
                ${tipo === 'despesa' ? `
                    <select class="form-select config-grupo" data-cat="${esc(c.id)}" data-campo="grupo" aria-label="Grupo de ${esc(c.nome)}">
                        ${Object.entries(GRUPOS).map(([v, n]) => `<option value="${v}"${c.grupo === v ? ' selected' : ''}>${n}</option>`).join('')}
                    </select>
                    <div class="input-group config-orcamento">
                        <span class="input-group-text">R$</span>
                        <input type="text" inputmode="numeric" data-moeda class="form-control" placeholder="Sem limite" value="${valorParaInput(c.orcamento)}" data-cat="${esc(c.id)}" data-campo="orcamento" aria-label="Limite mensal de ${esc(c.nome)}">
                    </div>` : ''}
                ${c.personalizada
                    ? `<button class="btn-icone" data-acao="excluir-categoria" data-id="${esc(c.id)}" title="Excluir categoria" aria-label="Excluir categoria ${esc(c.nome)}"><i class="bi bi-trash3"></i></button>`
                    : '<span></span>'}
            </div>`).join('');
        $(`#config-cat-${tipo}`).innerHTML = (tipo === 'despesa' ? cabecalho : '') + linhas;
    });
    $('#config-transportar').checked = !!app.dados.config.transportarSaldo;
}

export function abrirConfiguracoes() {
    renderConfig();
    modal('modal-config').show();
}

// Cada alteração é salva na hora
function alterarCategoria(campo) {
    const cat = app.dados.categorias.find(c => c.id === campo.dataset.cat);
    if (!cat) return;
    switch (campo.dataset.campo) {
        case 'cor':
            cat.cor = campo.value;
            break;
        case 'nome':
            if (campo.value.trim()) cat.nome = campo.value.trim();
            campo.value = cat.nome;
            break;
        case 'grupo':
            cat.grupo = campo.value;
            break;
        case 'orcamento': {
            const valor = parseValor(campo.value);
            cat.orcamento = valor > 0 ? valor : 0;
            campo.value = valorParaInput(cat.orcamento);
            break;
        }
    }
    salvar();
    render();
}

function adicionarCategoria(evento) {
    evento.preventDefault();
    const nome = $('#nova-cat-nome').value.trim();
    if (!nome) return;
    const tipo = $('#nova-cat-tipo').value;
    app.dados.categorias.push({
        id: `cat-${gerarId()}`,
        nome,
        tipo,
        icone: 'bi-tag',
        cor: $('#nova-cat-cor').value,
        grupo: 'desejo',
        orcamento: 0,
        personalizada: true
    });
    salvar();
    renderConfig();
    render();
    $('#nova-cat-nome').value = '';
    toast(`Categoria "${nome}" criada`);
}

// Os lançamentos da categoria excluída passam para "Outros" / "Outras receitas"
export async function excluirCategoria(id) {
    const cat = app.dados.categorias.find(c => c.id === id);
    if (!cat || !cat.personalizada) return;
    const destino = categoria(categoriaPadrao(cat.tipo));
    await fecharModais();
    const ok = await confirmar({
        titulo: 'Excluir categoria',
        mensagem: `<p class="mb-0">Excluir <strong>${esc(cat.nome)}</strong>? Os lançamentos dela passam para <strong>${esc(destino.nome)}</strong>.</p>`,
        botoes: [{ texto: 'Excluir', classe: 'btn-danger', valor: true }]
    });
    if (ok) {
        Object.values(app.dados.meses).forEach(m => {
            [...m.receitas, ...m.despesas].forEach(i => { if (i.categoria === id) i.categoria = destino.id; });
        });
        app.dados.recorrentes.forEach(r => { if (r.categoria === id) r.categoria = destino.id; });
        app.dados.categorias = app.dados.categorias.filter(c => c.id !== id);
        salvar();
        render();
    }
    abrirConfiguracoes();
}

export function configurarConfiguracoes() {
    $('#modal-config').addEventListener('change', e => {
        if (e.target.matches('[data-campo]')) alterarCategoria(e.target);
    });
    $('#config-transportar').addEventListener('change', e => {
        app.dados.config.transportarSaldo = e.target.checked;
        salvar();
        render();
    });
    $('#form-nova-categoria').addEventListener('submit', adicionarCategoria);
}
