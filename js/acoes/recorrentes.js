// Contas e receitas fixas: lançadas automaticamente em todos os meses

import { app } from '../estado.js';
import { $, $$ } from '../utils/dom.js';
import { esc, gerarId, parseValor, valorParaInput } from '../utils/formato.js';
import { dataNoMes, nomeMes } from '../utils/datas.js';
import { salvar } from '../dados/armazenamento.js';
import { aplicarRecorrenteNosMeses, lista, obterMes } from '../dados/meses.js';
import { opcoesCategorias } from '../dados/categorias.js';
import { confirmar, fecharModais, modal, resetarFormulario, toast } from '../ui/componentes.js';
import { render } from '../ui/render.js';

let recorrenteEdicao = null; // id da conta fixa em edição

function definirTipoRecorrente(tipo, travar) {
    $(`#rec-tipo-${tipo}`).checked = true;
    ['despesa', 'receita'].forEach(t => { $(`#rec-tipo-${t}`).disabled = travar && t !== tipo; });
    $('#rec-categoria').innerHTML = opcoesCategorias(tipo, tipo === 'receita' ? 'salario' : 'moradia');
}

export function abrirRecorrente(id = null, tipoPadrao = 'despesa') {
    resetarFormulario($('#form-recorrente'));

    const rec = id ? app.dados.recorrentes.find(r => r.id === id) : null;
    recorrenteEdicao = rec ? rec.id : null;
    definirTipoRecorrente(rec ? rec.tipo : tipoPadrao, !!rec);

    $('#recorrente-titulo').textContent = rec ? 'Editar lançamento fixo' : (tipoPadrao === 'receita' ? 'Nova receita fixa' : 'Nova conta fixa');
    if (rec) {
        $('#rec-descricao').value = rec.descricao;
        $('#rec-valor').value = valorParaInput(rec.valor);
        $('#rec-dia').value = rec.dia;
        $('#rec-categoria').value = rec.categoria;
    }
    $('#bloco-propagar').classList.toggle('d-none', !rec);
    $('#rec-propagar-label').textContent = `Atualizar também os lançamentos pendentes de ${nomeMes(app.mesVisivel)} em diante`;
    $('#btn-excluir-recorrente').classList.toggle('d-none', !rec);

    modal('modal-recorrente').show();
}

function salvarRecorrente(evento) {
    evento.preventDefault();
    const form = evento.target;
    const tipo = $('input[name="rec-tipo"]:checked').value;
    const descricao = $('#rec-descricao').value.trim();
    const valor = parseValor($('#rec-valor').value);
    const dia = parseInt($('#rec-dia').value, 10);

    $('#rec-descricao').setCustomValidity(descricao ? '' : 'obrigatório');
    $('#rec-valor').setCustomValidity(valor > 0 ? '' : 'inválido');
    $('#rec-dia').setCustomValidity(dia >= 1 && dia <= 31 ? '' : 'inválido');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const { mesVisivel } = app;
    const dados = { descricao, valor, dia, categoria: $('#rec-categoria').value };
    const rec = app.dados.recorrentes.find(r => r.id === recorrenteEdicao);

    if (rec) {
        Object.assign(rec, dados);
        if ($('#rec-propagar').checked) {
            Object.keys(app.dados.meses).filter(k => k >= mesVisivel).forEach(k => {
                lista(app.dados.meses[k], rec.tipo).forEach(i => {
                    if (i.recorrenteId === rec.id && !i.pago) {
                        Object.assign(i, { descricao, valor, categoria: dados.categoria, data: dataNoMes(k, dia) });
                    }
                });
            });
        }
        toast('Lançamento fixo atualizado');
    } else {
        const novo = { id: gerarId(), tipo, ...dados, inicio: mesVisivel };
        app.dados.recorrentes.push(novo);
        obterMes(mesVisivel);
        aplicarRecorrenteNosMeses(novo);
        toast(`Adicionado: entra todo mês a partir de ${nomeMes(mesVisivel)}`);
    }

    salvar();
    render();
    modal('modal-recorrente').hide();
}

// Para de lançar nos próximos meses; mantém o histórico já pago
export async function encerrarRecorrente(id) {
    const rec = app.dados.recorrentes.find(r => r.id === id);
    if (!rec) return;
    await fecharModais();

    const ok = await confirmar({
        titulo: 'Encerrar lançamento fixo',
        mensagem: `<p><strong>${esc(rec.descricao)}</strong> deixará de ser lançado nos próximos meses.</p>
                   <p class="text-muted small mb-0">Os lançamentos já pagos são mantidos. Os pendentes de ${nomeMes(app.mesVisivel)} em diante serão removidos.</p>`,
        botoes: [{ texto: 'Encerrar', classe: 'btn-danger', valor: true }]
    });
    if (!ok) return;

    app.dados.recorrentes = app.dados.recorrentes.filter(r => r.id !== id);
    Object.keys(app.dados.meses).filter(k => k >= app.mesVisivel).forEach(k => {
        const itens = lista(app.dados.meses[k], rec.tipo);
        for (let i = itens.length - 1; i >= 0; i--) {
            if (itens[i].recorrenteId === id && !itens[i].pago) itens.splice(i, 1);
        }
    });

    salvar();
    render();
    toast('Lançamento fixo encerrado');
}

export function configurarRecorrentes() {
    $('#form-recorrente').addEventListener('submit', salvarRecorrente);
    $$('input[name="rec-tipo"]').forEach(r => r.addEventListener('change', () => definirTipoRecorrente(r.value, false)));
    $('#btn-excluir-recorrente').addEventListener('click', () => encerrarRecorrente(recorrenteEdicao));
    $('#modal-recorrente').addEventListener('shown.bs.modal', () => $('#rec-descricao').focus());
}
