// Cartões de resumo do mês: receitas, despesas, saldo e renda comprometida

import { app } from '../estado.js';
import { $ } from '../utils/dom.js';
import { arredondar, moeda } from '../utils/formato.js';
import { nomeMes, somarMeses } from '../utils/datas.js';
import { resumoMes, saldoAnterior } from '../dados/calculos.js';

function htmlKpi({ rotulo, icone, cor, valor, classeValor = '', sub = '', extra = '' }) {
    return `
        <div class="col-6 col-xl-3">
            <div class="kpi">
                <div class="kpi-rotulo"><span class="kpi-icone" style="--cor:${cor}"><i class="bi ${icone}"></i></span>${rotulo}</div>
                <div class="kpi-valor ${classeValor}">${valor}</div>
                ${extra}
                <div class="kpi-sub">${sub}</div>
            </div>
        </div>`;
}

export function renderKPIs() {
    const { mesVisivel } = app;
    const r = resumoMes(mesVisivel);
    const chaveAnterior = somarMeses(mesVisivel, -1);
    const anterior = resumoMes(chaveAnterior);
    const transportar = app.dados.config.transportarSaldo;
    const saldoAnt = transportar ? saldoAnterior(mesVisivel) : 0;
    const saldoFinal = arredondar(r.saldo + saldoAnt);

    let subReceitas = 'Nenhuma receita lançada';
    if (r.aReceber > 0) subReceitas = `Recebido <strong>${moeda(r.recebido)}</strong> · falta ${moeda(r.aReceber)}`;
    else if (r.receitas > 0) subReceitas = '<i class="bi bi-check2-circle positivo"></i> Tudo recebido';

    let subDespesas = 'Nenhuma despesa lançada';
    if (r.aPagar > 0) subDespesas = `Pago <strong>${moeda(r.pago)}</strong> · falta <strong>${moeda(r.aPagar)}</strong>`;
    else if (r.despesas > 0) subDespesas = '<i class="bi bi-check2-circle positivo"></i> Tudo pago';
    if (anterior.despesas > 0 && r.despesas > 0) {
        const variacao = ((r.despesas - anterior.despesas) / anterior.despesas) * 100;
        if (Math.abs(variacao) >= 1) {
            subDespesas = `<span class="variacao ${variacao > 0 ? 'sobe' : 'desce'}" title="Em relação a ${nomeMes(chaveAnterior)}">
                <i class="bi bi-arrow-${variacao > 0 ? 'up' : 'down'}-short"></i>${Math.abs(variacao).toFixed(0)}%</span> ${subDespesas}`;
        }
    }

    let subSaldo = `Realizado até agora: <strong>${moeda(r.emConta + saldoAnt)}</strong>`;
    if (transportar && saldoAnt !== 0) subSaldo += `<br>Inclui ${moeda(saldoAnt)} dos meses anteriores`;

    const usoRenda = r.receitas > 0 ? (r.despesas / r.receitas) * 100 : (r.despesas > 0 ? 100 : 0);
    const corUso = usoRenda < 75 ? 'var(--app-primary)' : usoRenda <= 100 ? 'var(--app-warning)' : 'var(--app-danger)';
    let subUso = 'Lance suas receitas para comparar';
    if (r.receitas > 0) {
        subUso = r.saldo >= 0
            ? `Sobram <strong>${(100 - usoRenda).toFixed(0)}%</strong> da renda`
            : `<span class="negativo">Passou ${moeda(-r.saldo)} da renda</span>`;
    }

    $('#kpis').innerHTML = [
        htmlKpi({ rotulo: 'Receitas', icone: 'bi-arrow-up-circle', cor: 'var(--app-success)', valor: moeda(r.receitas), sub: subReceitas }),
        htmlKpi({ rotulo: 'Despesas', icone: 'bi-arrow-down-circle', cor: 'var(--app-danger)', valor: moeda(r.despesas), sub: subDespesas }),
        htmlKpi({
            rotulo: transportar ? 'Saldo acumulado' : 'Saldo previsto',
            icone: 'bi-wallet2',
            cor: 'var(--app-info)',
            valor: moeda(saldoFinal),
            classeValor: saldoFinal < 0 ? 'negativo' : '',
            sub: subSaldo
        }),
        htmlKpi({
            rotulo: 'Renda comprometida',
            icone: 'bi-speedometer2',
            cor: 'var(--app-warning)',
            valor: `${usoRenda.toFixed(0)}%`,
            extra: `<div class="barra" role="progressbar" aria-valuenow="${usoRenda.toFixed(0)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(100, usoRenda)}%;--cor:${corUso}"></span></div>`,
            sub: subUso
        })
    ].join('');
}
