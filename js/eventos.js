// Eventos globais: cliques delegados por data-acao, atalhos de teclado e filtros

import { STORAGE_KEY } from './config.js';
import { app, limparFiltros } from './estado.js';
import { $ } from './utils/dom.js';
import { chaveHoje, somarMeses } from './utils/datas.js';
import { ativarMascaraMoeda } from './utils/mascara-moeda.js';
import { carregar } from './dados/armazenamento.js';
import { resumoMes } from './dados/calculos.js';
import { abrirSeletorMes, mudarAnoSeletor } from './ui/cabecalho.js';
import { renderCategorias } from './ui/painel-categorias.js';
import { renderLista, tipoDaAba } from './ui/lista.js';
import { render } from './ui/render.js';
import { alternarTema } from './ui/tema.js';
import { irParaMes, mostrarPendentes, rolarParaLista } from './acoes/navegacao.js';
import { abrirLancamento, alternarPago, configurarLancamentos, excluirLancamento } from './acoes/lancamentos.js';
import { abrirRecorrente, configurarRecorrentes, encerrarRecorrente } from './acoes/recorrentes.js';
import { abrirAporte, abrirObjetivo, configurarObjetivos } from './acoes/objetivos.js';
import { abrirConfiguracoes, configurarConfiguracoes, excluirCategoria } from './acoes/configuracoes.js';
import { exportarExcelAno, exportarExcelMes } from './acoes/exportacao.js';
import { baixarBackup, configurarBackup, escolherBackup, limparTudo } from './acoes/backup.js';

// Todo elemento clicável declara o que faz em data-acao (com data-id/data-tipo quando precisa)
function tratarClique(evento) {
    const alvo = evento.target.closest('[data-acao]');
    if (!alvo) return;
    if (alvo.tagName === 'A') evento.preventDefault();
    const { acao, id, tipo } = alvo.dataset;

    switch (acao) {
        case 'mes-anterior': irParaMes(somarMeses(app.mesVisivel, -1)); break;
        case 'mes-proximo': irParaMes(somarMeses(app.mesVisivel, 1)); break;
        case 'mes-hoje': irParaMes(chaveHoje()); break;
        case 'seletor-ano': mudarAnoSeletor(Number(alvo.dataset.delta)); break;
        case 'seletor-mes':
            bootstrap.Dropdown.getOrCreateInstance($('#mes-label')).hide();
            irParaMes(alvo.dataset.chave);
            break;
        case 'tema': alternarTema(); break;

        case 'aba':
            app.abaAtiva = alvo.dataset.aba;
            app.filtros.categoria = '';
            render();
            break;
        case 'status':
            app.filtros.status = alvo.dataset.valor;
            render();
            break;
        case 'limpar-filtros':
            limparFiltros();
            render();
            break;
        case 'filtrar-categoria':
            app.abaAtiva = 'despesas';
            app.filtros.categoria = app.filtros.categoria === id ? '' : id;
            render();
            if (window.innerWidth < 992) rolarParaLista();
            break;
        case 'ver-pendentes': mostrarPendentes(); break;
        case 'ver-mes-anterior':
            app.mesVisivel = somarMeses(chaveHoje(), -1);
            mostrarPendentes();
            break;

        case 'novo-lancamento': abrirLancamento(tipo || tipoDaAba()); break;
        case 'adicionar-aba':
            if (app.abaAtiva === 'recorrentes') abrirRecorrente();
            else abrirLancamento(tipoDaAba());
            break;
        case 'editar-lancamento': abrirLancamento(tipo, id); break;
        case 'alternar-pago': alternarPago(tipo, id); break;
        case 'excluir-lancamento': excluirLancamento(tipo, id); break;

        case 'nova-recorrente': abrirRecorrente(null, tipo || 'despesa'); break;
        case 'editar-recorrente': abrirRecorrente(id); break;
        case 'excluir-recorrente': encerrarRecorrente(id); break;

        case 'novo-objetivo': abrirObjetivo(); break;
        case 'editar-objetivo': abrirObjetivo(id); break;
        case 'aporte': abrirAporte(id); break;
        case 'criar-reserva':
            abrirObjetivo(null, { nome: 'Reserva de emergência', valorMeta: Math.round(resumoMes(app.mesVisivel).despesas * 6) });
            break;

        case 'exportar-mes': exportarExcelMes(); break;
        case 'exportar-ano': exportarExcelAno(); break;
        case 'backup': baixarBackup(); break;
        case 'restaurar': escolherBackup(); break;
        case 'configuracoes': abrirConfiguracoes(); break;
        case 'excluir-categoria': excluirCategoria(id); break;
        case 'limpar-tudo': limparTudo(); break;
    }
}

function tratarTeclado(evento) {
    // Enter/espaço nas linhas clicáveis
    if ((evento.key === 'Enter' || evento.key === ' ') && evento.target.matches('.item[role="button"]')) {
        evento.preventDefault();
        evento.target.click();
        return;
    }
    // Atalho "N" para novo lançamento
    const digitando = evento.target.closest('input, textarea, select, [contenteditable="true"]');
    if (digitando || evento.ctrlKey || evento.metaKey || evento.altKey || $('.modal.show')) return;
    if (evento.key === 'n' || evento.key === 'N') {
        evento.preventDefault();
        abrirLancamento(tipoDaAba());
    }
}

export function configurarEventos() {
    document.addEventListener('click', tratarClique);
    document.addEventListener('keydown', tratarTeclado);
    ativarMascaraMoeda();

    $('#mes-label').addEventListener('show.bs.dropdown', abrirSeletorMes);

    $('#filtro-busca').addEventListener('input', e => {
        app.filtros.busca = e.target.value;
        renderLista();
    });
    $('#filtro-categoria').addEventListener('change', e => {
        app.filtros.categoria = e.target.value;
        renderLista();
        renderCategorias();
    });

    configurarLancamentos();
    configurarRecorrentes();
    configurarObjetivos();
    configurarConfiguracoes();
    configurarBackup();

    // Mantém abas do navegador sincronizadas
    window.addEventListener('storage', e => {
        if (e.key !== STORAGE_KEY || !e.newValue) return;
        app.dados = carregar();
        render();
    });
}
