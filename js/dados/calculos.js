// Totais e saldos

import { app } from '../estado.js';
import { arredondar } from '../utils/formato.js';
import { novoMes } from './meses.js';

export function resumoMes(chave) {
    const mes = app.dados.meses[chave] || novoMes();
    const soma = (itens, filtro = () => true) => arredondar(itens.filter(filtro).reduce((t, i) => t + i.valor, 0));

    const receitas = soma(mes.receitas);
    const recebido = soma(mes.receitas, i => i.pago);
    const despesas = soma(mes.despesas);
    const pago = soma(mes.despesas, i => i.pago);

    const porCategoria = {};
    mes.despesas.forEach(d => {
        porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + d.valor;
    });

    return {
        receitas, recebido, despesas, pago, porCategoria,
        aReceber: arredondar(receitas - recebido),
        aPagar: arredondar(despesas - pago),
        saldo: arredondar(receitas - despesas),
        emConta: arredondar(recebido - pago)
    };
}

// Soma dos saldos de todos os meses anteriores (para a opção "transportar saldo")
export function saldoAnterior(chave) {
    return arredondar(Object.keys(app.dados.meses).filter(k => k < chave).reduce((t, k) => t + resumoMes(k).saldo, 0));
}

// modo "total": divide o valor em n parcelas (a última absorve os centavos); senão, repete o valor
export function calcularParcelas(valor, n, modo) {
    if (modo !== 'total') return Array(n).fill(valor);
    const parcela = Math.floor((valor / n) * 100) / 100;
    const valores = Array(n).fill(parcela);
    valores[n - 1] = arredondar(valor - parcela * (n - 1));
    return valores;
}
