// Converte os dados da versão anterior (um único "mês" sem data) para o formato atual

import { CATEGORIAS_PADRAO, STORAGE_ANTIGO, STORAGE_HISTORICO_ANTIGO } from '../config.js';
import { gerarId } from '../utils/formato.js';
import { chaveHoje, hoje, pad } from '../utils/datas.js';
import { itemDeRecorrente, novoMes } from './meses.js';

export function migrarDadosAntigos(destino) {
    let antigo;
    try {
        antigo = JSON.parse(localStorage.getItem(STORAGE_ANTIGO));
    } catch (erro) {
        return;
    }
    if (!antigo || typeof antigo !== 'object') return;

    const chaveAtual = chaveHoje();
    const converterData = texto => {
        const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto || '');
        return m ? `${m[3]}-${pad(m[2])}-${pad(m[1])}` : hoje();
    };
    const mesDe = chave => (destino.meses[chave] ||= novoMes());
    const categoriaValida = id => CATEGORIAS_PADRAO.some(c => c.id === id && c.tipo === 'despesa') ? id : 'outros';

    if (Number(antigo.salario) > 0) {
        const rec = { id: gerarId(), tipo: 'receita', descricao: 'Salário', valor: Number(antigo.salario), categoria: 'salario', dia: 5, inicio: chaveAtual };
        destino.recorrentes.push(rec);
        const mes = mesDe(chaveAtual);
        mes.receitas.push({ ...itemDeRecorrente(rec, chaveAtual), pago: true });
        mes.recorrentesAplicadas.push(rec.id);
    }
    (antigo.entradas || []).forEach(e => {
        const data = converterData(e.data);
        mesDe(data.slice(0, 7)).receitas.push({ id: gerarId(), descricao: e.descricao || 'Entrada', valor: Number(e.valor) || 0, categoria: 'extra', data, pago: true });
    });
    (antigo.gastos || []).forEach(g => {
        const data = converterData(g.data);
        mesDe(data.slice(0, 7)).despesas.push({ id: gerarId(), descricao: g.descricao || 'Gasto', valor: Number(g.valor) || 0, categoria: categoriaValida(g.categoria), data, pago: true });
    });
    (antigo.objetivos || []).forEach(o => {
        destino.objetivos.push({ id: gerarId(), nome: o.nome || 'Objetivo', valorMeta: Number(o.valorNecessario) || 0, valorAtual: Number(o.valorAtual) || 0, prazo: '' });
    });

    // O histórico antigo era gravado a cada clique e não tem utilidade
    try { localStorage.removeItem(STORAGE_HISTORICO_ANTIGO); } catch (erro) { /* ignora */ }
}
