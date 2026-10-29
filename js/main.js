// Ponto de entrada: carrega os dados, liga os eventos e desenha a tela

import { app } from './estado.js';
import { carregar, salvar } from './dados/armazenamento.js';
import { prepararMes } from './dados/meses.js';
import { render } from './ui/render.js';
import { atualizarIconeTema } from './ui/tema.js';
import { configurarEventos } from './eventos.js';

app.dados = carregar();
prepararMes(app.mesVisivel);
salvar();

if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
}

configurarEventos();
atualizarIconeTema();
render();
