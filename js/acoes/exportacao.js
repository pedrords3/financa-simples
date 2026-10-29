// Exportação para Excel (SheetJS): planilha do mês e do ano

import { app } from '../estado.js';
import { arredondar } from '../utils/formato.js';
import { dataBR, nomeMes, nomeMesAbrev, pad } from '../utils/datas.js';
import { categoria, categoriasDo } from '../dados/categorias.js';
import { resumoMes, saldoAnterior } from '../dados/calculos.js';
import { toast } from '../ui/componentes.js';

const FORMATO_MOEDA = '"R$" #,##0.00;[Red]-"R$" #,##0.00';

function bibliotecaPlanilhaDisponivel() {
    if (typeof XLSX !== 'undefined') return true;
    toast('Não foi possível carregar o gerador de planilhas. Verifique sua conexão com a internet.', 'erro');
    return false;
}

function formatarPlanilha(ws, colunasMoeda, larguras, colunasPercentual = []) {
    const faixa = XLSX.utils.decode_range(ws['!ref']);
    for (let lin = faixa.s.r; lin <= faixa.e.r; lin++) {
        colunasMoeda.forEach(col => {
            const cel = ws[XLSX.utils.encode_cell({ r: lin, c: col })];
            if (cel && cel.t === 'n') cel.z = FORMATO_MOEDA;
        });
        colunasPercentual.forEach(col => {
            const cel = ws[XLSX.utils.encode_cell({ r: lin, c: col })];
            if (cel && cel.t === 'n') cel.z = '0.0%';
        });
    }
    ws['!cols'] = larguras.map(wch => ({ wch }));
}

function linhasLancamentos(chave, incluirMes) {
    const mes = app.dados.meses[chave];
    if (!mes) return [];
    const linhas = [];
    [['receita', mes.receitas], ['despesa', mes.despesas]].forEach(([tipo, itens]) => {
        [...itens].sort((a, b) => a.data.localeCompare(b.data)).forEach(i => {
            const observacoes = [
                i.recorrenteId ? 'Fixa' : '',
                i.parcela ? `Parcela ${i.parcela.numero}/${i.parcela.total}` : '',
                i.objetivoId ? 'Objetivo' : ''
            ].filter(Boolean).join(', ');
            linhas.push([
                ...(incluirMes ? [nomeMes(chave)] : []),
                tipo === 'receita' ? 'Receita' : 'Despesa',
                dataBR(i.data),
                i.descricao,
                categoria(i.categoria).nome,
                tipo === 'receita' ? i.valor : -i.valor,
                i.pago ? (tipo === 'receita' ? 'Recebido' : 'Pago') : 'Pendente',
                observacoes
            ]);
        });
    });
    return linhas;
}

export function exportarExcelMes() {
    if (!bibliotecaPlanilhaDisponivel()) return;
    const { mesVisivel } = app;
    const r = resumoMes(mesVisivel);
    const wb = XLSX.utils.book_new();

    const resumo = [
        [`Finança Simples — ${nomeMes(mesVisivel)}`],
        [],
        ['Receitas', r.receitas],
        ['   Recebido', r.recebido],
        ['   A receber', r.aReceber],
        ['Despesas', r.despesas],
        ['   Pago', r.pago],
        ['   A pagar', r.aPagar],
        ['Saldo do mês', r.saldo]
    ];
    if (app.dados.config.transportarSaldo) {
        const anterior = saldoAnterior(mesVisivel);
        resumo.push(['Saldo dos meses anteriores', anterior], ['Saldo acumulado', arredondar(anterior + r.saldo)]);
    }
    resumo.push([], ['Despesas por categoria', 'Valor', '% das despesas', 'Limite mensal']);
    categoriasDo('despesa')
        .map(c => ({ c, valor: r.porCategoria[c.id] || 0 }))
        .filter(x => x.valor > 0)
        .sort((a, b) => b.valor - a.valor)
        .forEach(({ c, valor }) => resumo.push([c.nome, arredondar(valor), r.despesas ? valor / r.despesas : 0, c.orcamento || '']));

    const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
    formatarPlanilha(wsResumo, [1, 3], [30, 16, 16, 16], [2]);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    const wsLanc = XLSX.utils.aoa_to_sheet([
        ['Tipo', 'Data', 'Descrição', 'Categoria', 'Valor', 'Situação', 'Observação'],
        ...linhasLancamentos(mesVisivel, false)
    ]);
    formatarPlanilha(wsLanc, [4], [10, 12, 32, 24, 14, 12, 20]);
    XLSX.utils.book_append_sheet(wb, wsLanc, 'Lançamentos');

    XLSX.writeFile(wb, `financas-${mesVisivel}.xlsx`);
    toast('Planilha do mês exportada');
}

export function exportarExcelAno() {
    if (!bibliotecaPlanilhaDisponivel()) return;
    const ano = app.mesVisivel.slice(0, 4);
    const chaves = Array.from({ length: 12 }, (_, i) => `${ano}-${pad(i + 1)}`);
    const wb = XLSX.utils.book_new();

    const resumo = [['Mês', 'Receitas', 'Despesas', 'Saldo']];
    const totais = [0, 0, 0];
    chaves.forEach(k => {
        const r = resumoMes(k);
        resumo.push([nomeMes(k), r.receitas, r.despesas, r.saldo]);
        totais[0] += r.receitas;
        totais[1] += r.despesas;
        totais[2] += r.saldo;
    });
    resumo.push(['Total do ano', ...totais.map(arredondar)]);
    const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
    formatarPlanilha(wsResumo, [1, 2, 3], [22, 16, 16, 16]);
    XLSX.utils.book_append_sheet(wb, wsResumo, `Resumo ${ano}`);

    const resumos = chaves.map(resumoMes);
    const porCategoria = [['Categoria', ...chaves.map(nomeMesAbrev), 'Total']];
    categoriasDo('despesa').forEach(c => {
        const valores = resumos.map(r => arredondar(r.porCategoria[c.id] || 0));
        const total = arredondar(valores.reduce((t, v) => t + v, 0));
        if (total > 0) porCategoria.push([c.nome, ...valores, total]);
    });
    const wsCat = XLSX.utils.aoa_to_sheet(porCategoria);
    formatarPlanilha(wsCat, Array.from({ length: 13 }, (_, i) => i + 1), [26, ...Array(13).fill(13)]);
    XLSX.utils.book_append_sheet(wb, wsCat, 'Por categoria');

    const wsLanc = XLSX.utils.aoa_to_sheet([
        ['Mês', 'Tipo', 'Data', 'Descrição', 'Categoria', 'Valor', 'Situação', 'Observação'],
        ...chaves.flatMap(k => linhasLancamentos(k, true))
    ]);
    formatarPlanilha(wsLanc, [5], [20, 10, 12, 32, 24, 14, 12, 20]);
    XLSX.utils.book_append_sheet(wb, wsLanc, 'Lançamentos');

    XLSX.writeFile(wb, `financas-${ano}.xlsx`);
    toast(`Planilha de ${ano} exportada`);
}
