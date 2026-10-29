// Objetivos com barra de progresso e meta mensal pelo prazo

import { app } from '../estado.js';
import { $ } from '../utils/dom.js';
import { arredondar, esc, moeda } from '../utils/formato.js';
import { chaveHoje, diferencaMeses, nomeMesCurto } from '../utils/datas.js';
import { htmlVazio } from './componentes.js';

export function renderObjetivos() {
    const container = $('#lista-objetivos');
    const { objetivos } = app.dados;
    if (!objetivos.length) {
        container.innerHTML = htmlVazio('bi-bullseye', 'Defina metas como uma reserva de emergência ou uma viagem e acompanhe quanto já guardou.',
            '<button class="btn btn-light btn-sm" data-acao="novo-objetivo"><i class="bi bi-plus-lg"></i> Criar objetivo</button>');
        return;
    }

    container.innerHTML = objetivos.map(o => {
        const pct = o.valorMeta > 0 ? Math.min(100, (o.valorAtual / o.valorMeta) * 100) : 0;
        const falta = Math.max(0, arredondar(o.valorMeta - o.valorAtual));
        const concluido = falta <= 0;

        let info = `Faltam ${moeda(falta)}`;
        if (concluido) {
            info = '<span class="positivo">Objetivo alcançado! 🎉</span>';
        } else if (o.prazo) {
            const meses = diferencaMeses(chaveHoje(), o.prazo) + 1;
            info = meses > 0
                ? `Guarde ${moeda(falta / meses)}/mês até ${nomeMesCurto(o.prazo)}`
                : `<span class="negativo">Prazo encerrado (${nomeMesCurto(o.prazo)})</span>`;
        }

        return `
            <div class="objetivo ${concluido ? 'concluido' : ''}">
                <div class="objetivo-topo">
                    <div class="text-truncate">
                        <div class="objetivo-nome text-truncate">${esc(o.nome)}</div>
                        <div class="objetivo-valores">${moeda(o.valorAtual)} de ${moeda(o.valorMeta)}</div>
                    </div>
                    <div class="d-flex align-items-center gap-1">
                        <button class="btn-guardar" data-acao="aporte" data-id="${esc(o.id)}"><i class="bi bi-plus-lg"></i> Guardar</button>
                        <button class="btn-icone" data-acao="editar-objetivo" data-id="${esc(o.id)}" title="Editar objetivo" aria-label="Editar objetivo"><i class="bi bi-pencil"></i></button>
                    </div>
                </div>
                <div class="barra" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100">
                    <span style="width:${pct}%;--cor:${concluido ? 'var(--app-success)' : 'var(--app-primary)'}"></span>
                </div>
                <div class="objetivo-rodape"><span>${pct.toFixed(0)}%</span><span class="text-end">${info}</span></div>
            </div>`;
    }).join('');
}
