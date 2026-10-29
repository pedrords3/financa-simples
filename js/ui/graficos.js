// Gráficos (Chart.js): rosca por categoria e evolução dos últimos 12 meses

import { app } from '../estado.js';
import { $ } from '../utils/dom.js';
import { arredondar, formatoMoedaCurta, moeda } from '../utils/formato.js';
import { nomeMesCurto, somarMeses } from '../utils/datas.js';
import { resumoMes } from '../dados/calculos.js';
import { categoriasDo } from '../dados/categorias.js';

const graficos = {};

function corCss(nome) {
    return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

// Atualiza o gráfico existente em vez de recriá-lo (evita piscar a cada render)
function desenharGrafico(nome, canvas, config) {
    const existente = graficos[nome];
    if (existente && existente.config.type === config.type) {
        existente.data = config.data;
        existente.options = config.options;
        existente.update('none');
        return;
    }
    if (existente) existente.destroy();
    graficos[nome] = new Chart(canvas, config);
}

export function renderGraficos() {
    if (typeof Chart === 'undefined') return;

    const texto = corCss('--app-muted');
    const grade = corCss('--app-border');
    const superficie = corCss('--app-surface');
    const tooltip = {
        callbacks: { label: ctx => ` ${ctx.dataset.label || ctx.label}: ${moeda(ctx.parsed.y ?? ctx.parsed)}` }
    };

    // Rosca: despesas por categoria
    const r = resumoMes(app.mesVisivel);
    const fatias = categoriasDo('despesa')
        .map(c => ({ c, valor: r.porCategoria[c.id] || 0 }))
        .filter(x => x.valor > 0)
        .sort((a, b) => b.valor - a.valor);

    desenharGrafico('categorias', $('#grafico-categorias'), {
        type: 'doughnut',
        data: {
            labels: fatias.map(x => x.c.nome),
            datasets: [{
                data: fatias.map(x => arredondar(x.valor)),
                backgroundColor: fatias.map(x => x.c.cor),
                borderColor: superficie,
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            cutout: '72%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${moeda(ctx.parsed)} (${((ctx.parsed / r.despesas) * 100).toFixed(0)}%)`
                    }
                }
            }
        }
    });

    // Barras: últimos 12 meses
    const chaves = Array.from({ length: 12 }, (_, i) => somarMeses(app.mesVisivel, i - 11));
    const resumos = chaves.map(resumoMes);
    const comDados = resumos.filter(x => x.despesas > 0);
    $('#evolucao-legenda').textContent = comDados.length
        ? `Média de despesas: ${moeda(comDados.reduce((t, x) => t + x.despesas, 0) / comDados.length)}`
        : '';

    desenharGrafico('evolucao', $('#grafico-evolucao'), {
        type: 'bar',
        data: {
            labels: chaves.map(nomeMesCurto),
            datasets: [
                { label: 'Receitas', data: resumos.map(x => x.receitas), backgroundColor: corCss('--app-success'), borderRadius: 6, maxBarThickness: 18 },
                { label: 'Despesas', data: resumos.map(x => x.despesas), backgroundColor: corCss('--app-danger'), borderRadius: 6, maxBarThickness: 18 },
                {
                    type: 'line', label: 'Saldo', data: resumos.map(x => x.saldo),
                    borderColor: corCss('--app-info'), backgroundColor: corCss('--app-info'),
                    tension: 0.35, pointRadius: 3, borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { color: texto, usePointStyle: true, boxWidth: 8, padding: 16 } },
                tooltip
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: texto } },
                y: { grid: { color: grade }, border: { display: false }, ticks: { color: texto, callback: v => formatoMoedaCurta.format(v) } }
            }
        }
    });
}
