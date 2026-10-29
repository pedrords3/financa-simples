// Avisos no topo: contas vencidas, a vencer, pendentes do mês anterior e lembrete de backup

import { app } from '../estado.js';
import { $ } from '../utils/dom.js';
import { esc, moeda, plural } from '../utils/formato.js';
import { chaveHoje, dataBR, hoje, nomeMes, somarDias, somarMeses } from '../utils/datas.js';

function htmlAlerta(classe, icone, texto, botao = '') {
    return `<div class="alerta ${classe}"><i class="bi ${icone}"></i><div class="alerta-texto">${texto}</div>${botao}</div>`;
}

function nomesResumidos(itens) {
    const nomes = itens.slice(0, 3).map(i => esc(i.descricao)).join(', ');
    return itens.length > 3 ? `${nomes} e mais ${itens.length - 3}` : nomes;
}

export function renderAlertas() {
    const { dados, mesVisivel } = app;
    const alertas = [];
    const mes = dados.meses[mesVisivel];
    const dataHoje = hoje();

    if (mes) {
        const pendentes = mes.despesas.filter(d => !d.pago);
        const vencidas = pendentes.filter(d => d.data < dataHoje);
        const proximas = pendentes.filter(d => d.data >= dataHoje && d.data <= somarDias(dataHoje, 5));
        const somaDe = itens => moeda(itens.reduce((t, i) => t + i.valor, 0));

        if (vencidas.length) {
            alertas.push(htmlAlerta('', 'bi-exclamation-octagon',
                `<strong>${plural(vencidas.length, 'conta vencida', 'contas vencidas')}</strong> (${somaDe(vencidas)}): ${nomesResumidos(vencidas)}. Já pagou? Marque como paga.`,
                '<button class="btn btn-sm btn-light" data-acao="ver-pendentes">Ver</button>'));
        }
        if (proximas.length) {
            alertas.push(htmlAlerta('aviso', 'bi-clock-history',
                `<strong>${plural(proximas.length, 'conta vence', 'contas vencem')} nos próximos 5 dias</strong> (${somaDe(proximas)}): ${nomesResumidos(proximas)}.`,
                '<button class="btn btn-sm btn-light" data-acao="ver-pendentes">Ver</button>'));
        }
    }

    if (mesVisivel === chaveHoje()) {
        const chaveAnterior = somarMeses(mesVisivel, -1);
        const anterior = dados.meses[chaveAnterior];
        const pendentesAnterior = anterior ? anterior.despesas.filter(d => !d.pago) : [];
        if (pendentesAnterior.length) {
            alertas.push(htmlAlerta('info', 'bi-calendar-x',
                `${plural(pendentesAnterior.length, 'conta', 'contas')} de ${nomeMes(chaveAnterior)} não ${pendentesAnterior.length === 1 ? 'foi marcada como paga' : 'foram marcadas como pagas'}: ${nomesResumidos(pendentesAnterior)}.`,
                '<button class="btn btn-sm btn-light" data-acao="ver-mes-anterior">Revisar</button>'));
        }
    }

    const totalLancamentos = Object.values(dados.meses).reduce((t, m) => t + m.receitas.length + m.despesas.length, 0);
    const ultimoBackup = dados.config.ultimoBackup;
    if (totalLancamentos >= 15 && (!ultimoBackup || ultimoBackup < somarDias(dataHoje, -30))) {
        alertas.push(htmlAlerta('info', 'bi-cloud-arrow-down',
            ultimoBackup
                ? `Seu último backup foi em ${dataBR(ultimoBackup)}. Salve uma cópia para não perder seus dados.`
                : 'Você ainda não fez backup. Seus dados ficam só neste navegador — salve uma cópia por segurança.',
            '<button class="btn btn-sm btn-light" data-acao="backup">Fazer backup</button>'));
    }

    $('#alertas').innerHTML = alertas.join('');
}
