// Meses, lançamentos e contas fixas (recorrentes)

import { app } from '../estado.js';
import { gerarId } from '../utils/formato.js';
import { chaveHoje, dataNoMes, hoje } from '../utils/datas.js';

export function novoMes() {
    return { receitas: [], despesas: [], recorrentesAplicadas: [] };
}

export function lista(mes, tipo) {
    return tipo === 'receita' ? mes.receitas : mes.despesas;
}

export function itemDeRecorrente(rec, chave) {
    return {
        id: gerarId(),
        descricao: rec.descricao,
        valor: rec.valor,
        categoria: rec.categoria,
        data: dataNoMes(chave, rec.dia),
        pago: false,
        recorrenteId: rec.id
    };
}

// Lança no mês as contas fixas que ainda não foram lançadas nele
function aplicarRecorrentes(chave) {
    const mes = app.dados.meses[chave];
    if (!mes) return;
    app.dados.recorrentes.forEach(rec => {
        if (rec.inicio > chave || mes.recorrentesAplicadas.includes(rec.id)) return;
        lista(mes, rec.tipo).push(itemDeRecorrente(rec, chave));
        mes.recorrentesAplicadas.push(rec.id);
    });
}

export function aplicarRecorrenteNosMeses(rec) {
    Object.keys(app.dados.meses).filter(k => k >= rec.inicio).forEach(aplicarRecorrentes);
}

// Retorna o mês, criando-o (e lançando as fixas) se necessário
export function obterMes(chave) {
    if (!app.dados.meses[chave]) app.dados.meses[chave] = novoMes();
    aplicarRecorrentes(chave);
    return app.dados.meses[chave];
}

// Ao navegar, só cria o mês se houver contas fixas para ele
export function prepararMes(chave) {
    if (app.dados.meses[chave] || app.dados.recorrentes.some(r => r.inicio <= chave)) obterMes(chave);
}

// Procura primeiro no mês visível e depois nos demais
export function encontrarItem(tipo, id) {
    const { meses } = app.dados;
    const chaves = [app.mesVisivel, ...Object.keys(meses).filter(k => k !== app.mesVisivel)];
    for (const chave of chaves) {
        const mes = meses[chave];
        if (!mes) continue;
        const itens = lista(mes, tipo);
        const item = itens.find(i => i.id === id);
        if (item) return { item, chave, itens };
    }
    return null;
}

export function removerDaLista(itens, item) {
    const indice = itens.indexOf(item);
    if (indice >= 0) itens.splice(indice, 1);
}

// Data sugerida para novos lançamentos: hoje, se estiver no mês atual; senão, dia 1 do mês visível
export function dataPadraoNoMes() {
    return app.mesVisivel === chaveHoje() ? hoje() : `${app.mesVisivel}-01`;
}
