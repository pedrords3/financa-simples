// Painel principal: abas, filtros e lista de lançamentos ou de contas fixas

import { app } from '../estado.js';
import { $, $$ } from '../utils/dom.js';
import { esc, moeda, normalizarTexto, plural } from '../utils/formato.js';
import { formatarData, hoje, nomeMes, nomeMesCurto } from '../utils/datas.js';
import { lista, novoMes } from '../dados/meses.js';
import { categoria, opcoesCategorias } from '../dados/categorias.js';
import { htmlVazio } from './componentes.js';

export function tipoDaAba() {
    return app.abaAtiva === 'receitas' ? 'receita' : 'despesa';
}

export function renderAbas() {
    const { abaAtiva, filtros } = app;
    const mes = app.dados.meses[app.mesVisivel] || novoMes();
    $$('#abas [data-aba]').forEach(b => {
        const ativa = b.dataset.aba === abaAtiva;
        b.classList.toggle('ativo', ativa);
        b.setAttribute('aria-selected', ativa);
    });
    $('#cont-despesas').textContent = mes.despesas.length;
    $('#cont-receitas').textContent = mes.receitas.length;
    $('#cont-recorrentes').textContent = app.dados.recorrentes.length;

    const textoBotao = { despesas: 'Despesa', receitas: 'Receita', recorrentes: 'Conta fixa' }[abaAtiva];
    $('#btn-adicionar-aba span').textContent = textoBotao;

    $('#filtros').classList.toggle('d-none', abaAtiva === 'recorrentes');
    if (abaAtiva !== 'recorrentes') {
        const tipo = tipoDaAba();
        $('#filtro-categoria').innerHTML = '<option value="">Todas as categorias</option>' + opcoesCategorias(tipo, filtros.categoria);
        $('#status-pago-label').textContent = tipo === 'receita' ? 'Recebidos' : 'Pagos';
        $$('#filtro-status [data-valor]').forEach(b => b.classList.toggle('ativo', b.dataset.valor === filtros.status));
        if ($('#filtro-busca').value !== filtros.busca) $('#filtro-busca').value = filtros.busca;
    }
}

function htmlItem(item, tipo) {
    const cat = categoria(item.categoria);
    const dataHoje = hoje();
    const ehDespesa = tipo === 'despesa';
    const vencida = ehDespesa && !item.pago && item.data < dataHoje;
    const venceHoje = ehDespesa && !item.pago && item.data === dataHoje;

    const tags = [];
    if (item.recorrenteId) tags.push('<span class="tag" title="Repete todo mês"><i class="bi bi-arrow-repeat"></i> Fixa</span>');
    if (item.parcela) tags.push(`<span class="tag" title="Parcela">${item.parcela.numero}/${item.parcela.total}</span>`);
    if (item.objetivoId) tags.push('<span class="tag"><i class="bi bi-bullseye"></i> Objetivo</span>');
    if (vencida) tags.push('<span class="tag tag-perigo">Vencida</span>');
    else if (venceHoje) tags.push('<span class="tag tag-aviso">Vence hoje</span>');

    const status = item.pago ? (ehDespesa ? 'Pago' : 'Recebido') : (ehDespesa ? 'A pagar' : 'A receber');
    const tituloCheck = item.pago ? 'Marcar como pendente' : (ehDespesa ? 'Marcar como pago' : 'Marcar como recebido');

    return `
        <div class="item ${item.pago ? 'is-pago' : ''} ${vencida ? 'is-vencida' : ''}" role="button" tabindex="0"
             data-acao="editar-lancamento" data-tipo="${tipo}" data-id="${esc(item.id)}">
            <button class="check" data-acao="alternar-pago" data-tipo="${tipo}" data-id="${esc(item.id)}"
                    title="${tituloCheck}" aria-label="${tituloCheck}" aria-pressed="${item.pago}"><i class="bi bi-check-lg"></i></button>
            <span class="item-icone" style="--cor:${esc(cat.cor)}"><i class="bi ${esc(cat.icone)}"></i></span>
            <div class="item-info">
                <div class="item-titulo">${esc(item.descricao)}</div>
                <div class="item-meta"><span>${esc(cat.nome)}</span><span aria-hidden="true">·</span><span>${formatarData(item.data)}</span>${tags.join('')}</div>
            </div>
            <div class="item-valor ${ehDespesa ? '' : 'positivo'}">${ehDespesa ? '' : '+'}${moeda(item.valor)}<small>${status}</small></div>
            <div class="item-acoes">
                <button class="btn-icone" data-acao="excluir-lancamento" data-tipo="${tipo}" data-id="${esc(item.id)}" title="Excluir" aria-label="Excluir"><i class="bi bi-trash3"></i></button>
            </div>
        </div>`;
}

export function renderLista() {
    if (app.abaAtiva === 'recorrentes') {
        renderRecorrentes();
        return;
    }

    const { filtros, mesVisivel } = app;
    const tipo = tipoDaAba();
    const mes = app.dados.meses[mesVisivel] || novoMes();
    const todos = lista(mes, tipo);
    const busca = normalizarTexto(filtros.busca);

    const itens = todos
        .filter(i => !filtros.categoria || i.categoria === filtros.categoria)
        .filter(i => !filtros.status || (filtros.status === 'pago' ? i.pago : !i.pago))
        .filter(i => !busca || normalizarTexto(`${i.descricao} ${categoria(i.categoria).nome}`).includes(busca))
        .sort((a, b) => a.data.localeCompare(b.data) || a.descricao.localeCompare(b.descricao));

    const container = $('#lista');
    const rodape = $('#lista-rodape');

    if (!todos.length) {
        container.innerHTML = tipo === 'despesa'
            ? htmlVazio('bi-receipt', `Nenhuma despesa em ${nomeMes(mesVisivel)}. Lance os gastos do dia a dia ou cadastre suas <strong>contas fixas</strong> (aluguel, internet, assinaturas) para entrarem sozinhas todo mês.`,
                `<div class="d-flex gap-2 justify-content-center flex-wrap">
                    <button class="btn btn-primary btn-sm" data-acao="novo-lancamento" data-tipo="despesa"><i class="bi bi-plus-lg"></i> Adicionar despesa</button>
                    <button class="btn btn-light btn-sm" data-acao="nova-recorrente" data-tipo="despesa"><i class="bi bi-arrow-repeat"></i> Cadastrar conta fixa</button>
                </div>`)
            : htmlVazio('bi-cash-coin', `Nenhuma receita em ${nomeMes(mesVisivel)}. Cadastre seu <strong>salário como receita fixa</strong> e ele entra automaticamente todo mês.`,
                `<div class="d-flex gap-2 justify-content-center flex-wrap">
                    <button class="btn btn-primary btn-sm" data-acao="novo-lancamento" data-tipo="receita"><i class="bi bi-plus-lg"></i> Adicionar receita</button>
                    <button class="btn btn-light btn-sm" data-acao="nova-recorrente" data-tipo="receita"><i class="bi bi-arrow-repeat"></i> Salário fixo</button>
                </div>`);
        rodape.innerHTML = '';
        return;
    }

    if (!itens.length) {
        container.innerHTML = htmlVazio('bi-funnel', 'Nenhum lançamento encontrado com esses filtros.',
            '<button class="btn btn-light btn-sm" data-acao="limpar-filtros">Limpar filtros</button>');
        rodape.innerHTML = '';
        return;
    }

    container.innerHTML = itens.map(i => htmlItem(i, tipo)).join('');

    const total = itens.reduce((t, i) => t + i.valor, 0);
    const feito = itens.filter(i => i.pago).reduce((t, i) => t + i.valor, 0);
    const filtrando = itens.length !== todos.length;
    rodape.innerHTML = `
        <span>${plural(itens.length, 'lançamento', 'lançamentos')}${filtrando ? ' (filtrado)' : ''}</span>
        <span>${tipo === 'despesa' ? 'Pago' : 'Recebido'}: <strong>${moeda(feito)}</strong></span>
        <span>Pendente: <strong>${moeda(total - feito)}</strong></span>
        <span>Total: <strong>${moeda(total)}</strong></span>`;
}

function renderRecorrentes() {
    const container = $('#lista');
    $('#lista-rodape').innerHTML = '';

    if (!app.dados.recorrentes.length) {
        container.innerHTML = htmlVazio('bi-arrow-repeat',
            'Cadastre aqui o que se repete todo mês: <strong>salário, aluguel, condomínio, internet, academia, assinaturas</strong>... Eles entram automaticamente em cada mês como pendentes — você só marca como pago.',
            `<div class="d-flex gap-2 justify-content-center flex-wrap">
                <button class="btn btn-primary btn-sm" data-acao="nova-recorrente" data-tipo="despesa"><i class="bi bi-plus-lg"></i> Conta fixa</button>
                <button class="btn btn-light btn-sm" data-acao="nova-recorrente" data-tipo="receita"><i class="bi bi-plus-lg"></i> Receita fixa</button>
            </div>`);
        return;
    }

    const ordenadas = [...app.dados.recorrentes].sort((a, b) => b.tipo.localeCompare(a.tipo) || a.dia - b.dia);
    const totalReceitas = ordenadas.filter(r => r.tipo === 'receita').reduce((t, r) => t + r.valor, 0);
    const totalDespesas = ordenadas.filter(r => r.tipo === 'despesa').reduce((t, r) => t + r.valor, 0);
    const sobra = totalReceitas - totalDespesas;

    const linhas = ordenadas.map(rec => {
        const cat = categoria(rec.categoria);
        const ehReceita = rec.tipo === 'receita';
        return `
            <div class="item item-fixa" role="button" tabindex="0" data-acao="editar-recorrente" data-id="${esc(rec.id)}">
                <span class="item-icone" style="--cor:${esc(cat.cor)}"><i class="bi ${esc(cat.icone)}"></i></span>
                <div class="item-info">
                    <div class="item-titulo">${esc(rec.descricao)}</div>
                    <div class="item-meta">
                        <span>Todo dia ${rec.dia}</span><span aria-hidden="true">·</span><span>${esc(cat.nome)}</span>
                        <span class="tag">${ehReceita ? 'Receita' : 'Despesa'}</span>
                        <span class="d-none d-sm-inline">desde ${nomeMesCurto(rec.inicio)}</span>
                    </div>
                </div>
                <div class="item-valor ${ehReceita ? 'positivo' : ''}">${ehReceita ? '+' : ''}${moeda(rec.valor)}<small>por mês</small></div>
                <div class="item-acoes">
                    <button class="btn-icone" data-acao="excluir-recorrente" data-id="${esc(rec.id)}" title="Encerrar" aria-label="Encerrar"><i class="bi bi-x-circle"></i></button>
                </div>
            </div>`;
    });

    container.innerHTML = `
        <div class="resumo-fixas">
            <div><small>Receitas fixas</small><strong class="positivo">${moeda(totalReceitas)}</strong></div>
            <div><small>Despesas fixas</small><strong>${moeda(totalDespesas)}</strong></div>
            <div><small>Sobra para o resto</small><strong class="${sobra < 0 ? 'negativo' : ''}">${moeda(sobra)}</strong></div>
        </div>
        ${linhas.join('')}`;
}
