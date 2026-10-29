// Objetivos: criar, editar, excluir e guardar/retirar dinheiro

import { app } from '../estado.js';
import { $, $$ } from '../utils/dom.js';
import { arredondar, esc, gerarId, moeda, parseValor, valorParaInput } from '../utils/formato.js';
import { nomeMes } from '../utils/datas.js';
import { salvar } from '../dados/armazenamento.js';
import { dataPadraoNoMes, lista, obterMes } from '../dados/meses.js';
import { confirmar, fecharModais, modal, resetarFormulario, toast } from '../ui/componentes.js';
import { render } from '../ui/render.js';

let objetivoEdicao = null;  // id do objetivo em edição
let objetivoAporte = null;  // id do objetivo recebendo depósito/retirada

export function abrirObjetivo(id = null, preenchimento = {}) {
    resetarFormulario($('#form-objetivo'));

    const obj = id ? app.dados.objetivos.find(o => o.id === id) : null;
    objetivoEdicao = obj ? obj.id : null;
    const dados = obj || preenchimento;

    $('#objetivo-titulo').textContent = obj ? 'Editar objetivo' : 'Novo objetivo';
    $('#obj-nome').value = dados.nome || '';
    $('#obj-meta').value = valorParaInput(dados.valorMeta);
    $('#obj-atual').value = valorParaInput(dados.valorAtual);
    $('#obj-prazo').value = dados.prazo || '';
    $('#btn-excluir-objetivo').classList.toggle('d-none', !obj);

    modal('modal-objetivo').show();
}

function salvarObjetivo(evento) {
    evento.preventDefault();
    const form = evento.target;
    const nome = $('#obj-nome').value.trim();
    const valorMeta = parseValor($('#obj-meta').value);
    const valorAtual = parseValor($('#obj-atual').value) || 0;

    $('#obj-nome').setCustomValidity(nome ? '' : 'obrigatório');
    $('#obj-meta').setCustomValidity(valorMeta > 0 ? '' : 'inválido');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const dados = { nome, valorMeta, valorAtual: Math.max(0, valorAtual), prazo: $('#obj-prazo').value || '' };
    const obj = app.dados.objetivos.find(o => o.id === objetivoEdicao);
    if (obj) Object.assign(obj, dados);
    else app.dados.objetivos.push({ id: gerarId(), ...dados });

    salvar();
    render();
    modal('modal-objetivo').hide();
    toast(obj ? 'Objetivo atualizado' : 'Objetivo criado');
}

async function excluirObjetivo(id) {
    const obj = app.dados.objetivos.find(o => o.id === id);
    if (!obj) return;
    await fecharModais();
    const ok = await confirmar({
        titulo: 'Excluir objetivo',
        mensagem: `<p class="mb-0">Excluir o objetivo <strong>${esc(obj.nome)}</strong>? Os lançamentos já feitos nos meses continuam lá.</p>`,
        botoes: [{ texto: 'Excluir', classe: 'btn-danger', valor: true }]
    });
    if (!ok) return;
    app.dados.objetivos = app.dados.objetivos.filter(o => o.id !== id);
    salvar();
    render();
    toast('Objetivo excluído');
}

function atualizarRotuloAporte() {
    const guardar = $('#aporte-guardar').checked;
    $('#aporte-lancar-label').textContent = guardar
        ? `Lançar como despesa em ${nomeMes(app.mesVisivel)} (sai do saldo do mês)`
        : `Lançar como receita em ${nomeMes(app.mesVisivel)} (volta para o saldo)`;
}

export function abrirAporte(id) {
    const obj = app.dados.objetivos.find(o => o.id === id);
    if (!obj) return;
    objetivoAporte = id;
    resetarFormulario($('#form-aporte'));
    $('#aporte-titulo').textContent = obj.nome;
    atualizarRotuloAporte();
    modal('modal-aporte').show();
}

function salvarAporte(evento) {
    evento.preventDefault();
    const form = evento.target;
    const obj = app.dados.objetivos.find(o => o.id === objetivoAporte);
    if (!obj) return;

    const guardar = $('#aporte-guardar').checked;
    const valor = parseValor($('#aporte-valor').value);
    const campo = $('#aporte-valor');
    let erro = valor > 0 ? '' : 'Informe um valor.';
    if (!erro && !guardar && valor > obj.valorAtual) erro = `Você só tem ${moeda(obj.valorAtual)} guardado.`;
    campo.setCustomValidity(erro);
    campo.parentElement.querySelector('.invalid-feedback').textContent = erro || 'Informe um valor.';
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const antes = obj.valorAtual;
    obj.valorAtual = arredondar(obj.valorAtual + (guardar ? valor : -valor));

    if ($('#aporte-lancar').checked) {
        const tipo = guardar ? 'despesa' : 'receita';
        lista(obterMes(app.mesVisivel), tipo).push({
            id: gerarId(),
            descricao: `${guardar ? 'Guardado' : 'Resgate'}: ${obj.nome}`,
            valor,
            categoria: guardar ? 'investimentos' : 'outras-receitas',
            data: dataPadraoNoMes(),
            pago: true,
            objetivoId: obj.id
        });
    }

    salvar();
    render();
    modal('modal-aporte').hide();
    if (guardar && antes < obj.valorMeta && obj.valorAtual >= obj.valorMeta) {
        toast(`🎉 Parabéns! Você alcançou o objetivo "${obj.nome}"!`);
    } else {
        toast(guardar ? `${moeda(valor)} guardado em "${obj.nome}"` : `${moeda(valor)} retirado de "${obj.nome}"`);
    }
}

export function configurarObjetivos() {
    $('#form-objetivo').addEventListener('submit', salvarObjetivo);
    $('#btn-excluir-objetivo').addEventListener('click', () => excluirObjetivo(objetivoEdicao));
    $('#modal-objetivo').addEventListener('shown.bs.modal', () => $('#obj-nome').focus());
    $('#form-aporte').addEventListener('submit', salvarAporte);
    $$('input[name="aporte-tipo"]').forEach(r => r.addEventListener('change', atualizarRotuloAporte));
    $('#modal-aporte').addEventListener('shown.bs.modal', () => $('#aporte-valor').focus());
}
