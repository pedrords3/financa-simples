// Redesenha a tela inteira a partir do estado atual

import { renderCabecalho } from './cabecalho.js';
import { renderAlertas } from './alertas.js';
import { renderKPIs } from './kpis.js';
import { renderAbas, renderLista } from './lista.js';
import { renderCategorias } from './painel-categorias.js';
import { renderObjetivos } from './painel-objetivos.js';
import { renderDicas } from './dicas.js';
import { renderGraficos } from './graficos.js';

export function render() {
    renderCabecalho();
    renderAlertas();
    renderKPIs();
    renderAbas();
    renderLista();
    renderCategorias();
    renderObjetivos();
    renderDicas();
    renderGraficos();
}
