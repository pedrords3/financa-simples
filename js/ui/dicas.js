// Dicas personalizadas e análise 50-30-20

import { DICAS_GERAIS } from '../config.js';
import { app } from '../estado.js';
import { $ } from '../utils/dom.js';
import { esc, moeda, normalizarTexto } from '../utils/formato.js';
import { chaveHoje, nomeMesCurto, partes, somarMeses } from '../utils/datas.js';
import { novoMes } from '../dados/meses.js';
import { categoria, categoriasDo } from '../dados/categorias.js';
import { resumoMes } from '../dados/calculos.js';

function htmlDica(icone, cor, titulo, texto) {
    return `
        <div class="dica">
            <span class="dica-icone" style="--cor:${cor}"><i class="bi ${icone}"></i></span>
            <div><strong class="dica-titulo">${titulo}</strong><p>${texto}</p></div>
        </div>`;
}

function htmlRegra502030(r) {
    const grupos = { necessidade: 0, desejo: 0, poupanca: 0 };
    (app.dados.meses[app.mesVisivel] || novoMes()).despesas.forEach(d => {
        const grupo = categoria(d.categoria).grupo || 'desejo';
        grupos[grupo] = (grupos[grupo] || 0) + d.valor;
    });
    grupos.poupanca += Math.max(0, r.saldo);

    const linhas = [['necessidade', 'Necessidades', 50], ['desejo', 'Desejos', 30], ['poupanca', 'Poupança e sobra', 20]]
        .map(([grupo, nome, ideal]) => {
            const pct = (grupos[grupo] / r.receitas) * 100;
            const fora = grupo === 'poupanca' ? pct < ideal : pct > ideal;
            const cor = fora ? 'var(--app-warning)' : 'var(--app-success)';
            return `
                <div class="regra-linha">
                    <div class="rotulo"><span>${nome} <span class="opacity-75">· ideal ${ideal}%</span></span><strong>${pct.toFixed(0)}%</strong></div>
                    <div class="barra"><span style="width:${Math.min(100, pct)}%;--cor:${cor}"></span><i class="meta" style="left:${ideal}%"></i></div>
                </div>`;
        });

    return `
        <div class="regra">
            <div class="regra-titulo">Regra 50-30-20 <i class="bi bi-info-circle text-muted" title="Uma referência: 50% da renda para necessidades, 30% para desejos e 20% para poupança. O grupo de cada categoria pode ser alterado em Categorias e orçamentos."></i></div>
            ${linhas.join('')}
        </div>`;
}

export function renderDicas() {
    const { dados, mesVisivel } = app;
    const container = $('#dicas');
    const mes = dados.meses[mesVisivel];
    const r = resumoMes(mesVisivel);

    if (!mes || (!mes.receitas.length && !mes.despesas.length)) {
        container.innerHTML = htmlDica('bi-rocket-takeoff', 'var(--app-info)', 'Comece por aqui',
            '1. Cadastre salário e contas fixas na aba <strong>Fixas</strong> — elas entram sozinhas todo mês.<br>2. Lance os gastos do dia a dia.<br>3. Marque como pago conforme for pagando.');
        return;
    }

    const dicas = [];

    if (r.saldo < 0) {
        dicas.push(htmlDica('bi-exclamation-triangle', 'var(--app-danger)', 'Gastos acima da renda',
            `As despesas passaram as receitas em ${moeda(-r.saldo)}. Veja as categorias que mais pesaram e corte o que não é essencial.`));
    }

    const estouradas = categoriasDo('despesa').filter(c => c.orcamento > 0 && (r.porCategoria[c.id] || 0) > c.orcamento);
    if (estouradas.length) {
        dicas.push(htmlDica('bi-speedometer', 'var(--app-warning)', 'Limite estourado',
            `${estouradas.map(c => `<strong>${esc(c.nome)}</strong>`).join(', ')} já ${estouradas.length === 1 ? 'passou' : 'passaram'} do limite definido para o mês.`));
    }

    const chaveAnterior = somarMeses(mesVisivel, -1);
    if (dados.meses[chaveAnterior]) {
        const ant = resumoMes(chaveAnterior);
        let maior = null;
        Object.entries(r.porCategoria).forEach(([id, valor]) => {
            const antes = ant.porCategoria[id] || 0;
            const diff = valor - antes;
            if (antes > 0 && diff > 50 && diff / antes > 0.2 && (!maior || diff > maior.diff)) maior = { id, valor, antes, diff };
        });
        if (maior) {
            dicas.push(htmlDica('bi-graph-up-arrow', 'var(--app-warning)', `${esc(categoria(maior.id).nome)} subiu`,
                `${moeda(maior.valor)} neste mês contra ${moeda(maior.antes)} em ${nomeMesCurto(chaveAnterior)} (+${moeda(maior.diff)}).`));
        } else if (mesVisivel < chaveHoje() && ant.despesas > 0 && r.despesas < ant.despesas) {
            dicas.push(htmlDica('bi-graph-down-arrow', 'var(--app-success)', 'Gastou menos',
                `Você gastou ${moeda(ant.despesas - r.despesas)} a menos que em ${nomeMesCurto(chaveAnterior)}. Ótimo!`));
        }
    }

    if (r.receitas > 0 && r.saldo / r.receitas >= 0.2) {
        dicas.push(htmlDica('bi-trophy', 'var(--app-success)', 'Mandou bem!',
            `Você está guardando ${((r.saldo / r.receitas) * 100).toFixed(0)}% da renda. Que tal direcionar parte disso para seus objetivos?`));
    }

    const temReserva = dados.objetivos.some(o => /reserva|emergencia/.test(normalizarTexto(o.nome)));
    if (!temReserva && r.saldo > 0 && r.despesas > 0) {
        dicas.push(htmlDica('bi-shield-check', 'var(--app-info)', 'Reserva de emergência',
            `O ideal é ter guardado cerca de 6 meses de despesas (${moeda(r.despesas * 6)}). <button class="btn btn-link btn-sm p-0 align-baseline" data-acao="criar-reserva">Criar esse objetivo</button>`));
    }

    if (dicas.length < 2) {
        const [titulo, texto] = DICAS_GERAIS[partes(mesVisivel)[1] % DICAS_GERAIS.length];
        dicas.push(htmlDica('bi-lightbulb', 'var(--app-warning)', titulo, texto));
    }

    container.innerHTML = (r.receitas > 0 ? htmlRegra502030(r) : '') + dicas.slice(0, 3).join('');
}
