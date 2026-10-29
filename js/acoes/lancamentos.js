// Lançamentos: criar (único, mensal ou parcelado), editar, marcar como pago e excluir

import { app } from '../estado.js';
import { $, $$ } from '../utils/dom.js';
import { esc, gerarId, moeda, normalizarTexto, parseValor, valorParaInput } from '../utils/formato.js';
import { dataNoMes, hoje, nomeMes, nomeMesCurto, somarMeses } from '../utils/datas.js';
import { salvar } from '../dados/armazenamento.js';
import { aplicarRecorrenteNosMeses, dataPadraoNoMes, encontrarItem, lista, obterMes, removerDaLista } from '../dados/meses.js';
import { categoriaPadrao, opcoesCategorias } from '../dados/categorias.js';
import { calcularParcelas } from '../dados/calculos.js';
import { confirmar, fecharModais, modal, resetarFormulario, toast } from '../ui/componentes.js';
import { render } from '../ui/render.js';

let edicao = null;          // lançamento em edição: { tipo, id }
let sugestoes = new Map();  // descrição normalizada → último lançamento com ela

function definirTipoLancamento(tipo, travar) {
    $(`#lanc-tipo-${tipo}`).checked = true;
    ['despesa', 'receita'].forEach(t => { $(`#lanc-tipo-${t}`).disabled = travar && t !== tipo; });
    $('#lanc-categoria').innerHTML = opcoesCategorias(tipo, categoriaPadrao(tipo));
    $('#lanc-pago-label').textContent = tipo === 'receita' ? 'Já foi recebido' : 'Já foi pago';
    $('#lanc-data-label').textContent = tipo === 'receita' ? 'Data' : 'Data / vencimento';

    // Sugestões de descrição a partir do histórico (a mais recente prevalece)
    sugestoes = new Map();
    Object.keys(app.dados.meses).sort().forEach(k => {
        lista(app.dados.meses[k], tipo).forEach(i => sugestoes.set(normalizarTexto(i.descricao), i));
    });
    $('#sugestoes-descricao').innerHTML = Array.from(sugestoes.values()).slice(-200)
        .map(i => `<option value="${esc(i.descricao)}"></option>`).join('');
}

export function abrirLancamento(tipo = 'despesa', id = null) {
    resetarFormulario($('#form-lancamento'));

    let item = null;
    edicao = null;
    if (id) {
        const achado = encontrarItem(tipo, id);
        if (!achado) return;
        item = achado.item;
        edicao = { tipo, id };
    }

    definirTipoLancamento(tipo, !!item);
    $('#lancamento-titulo').textContent = item ? 'Editar lançamento' : 'Novo lançamento';
    $('#lanc-descricao').value = item ? item.descricao : '';
    $('#lanc-valor').value = item ? valorParaInput(item.valor) : '';
    $('#lanc-data').value = item ? item.data : dataPadraoNoMes();
    if (item) $('#lanc-categoria').value = item.categoria;
    $('#lanc-pago').checked = item ? item.pago : $('#lanc-data').value <= hoje();

    $('#bloco-repeticao').classList.toggle('d-none', !!item);
    $('#lanc-repeticao').value = 'unica';
    atualizarAjudaRepeticao();

    let info = '';
    if (item?.recorrenteId) info = '<i class="bi bi-arrow-repeat"></i> Lançamento fixo. As alterações valem só para este mês — para mudar todos os meses, edite na aba <strong>Fixas</strong>.';
    else if (item?.parcela) info = `<i class="bi bi-credit-card"></i> Parcela ${item.parcela.numero} de ${item.parcela.total}. As alterações valem só para esta parcela.`;
    else if (item?.objetivoId) info = '<i class="bi bi-bullseye"></i> Movimentação de objetivo. Alterar aqui não muda o valor guardado no objetivo.';
    $('#lanc-info').innerHTML = info;
    $('#lanc-info').classList.toggle('d-none', !info);

    $('#btn-excluir-lancamento').classList.toggle('d-none', !item);
    $('#btn-salvar-novo').classList.toggle('d-none', !!item);

    modal('modal-lancamento').show();
}

function atualizarAjudaRepeticao() {
    const repeticao = $('#lanc-repeticao').value;
    const data = $('#lanc-data').value;
    const valor = parseValor($('#lanc-valor').value);
    const ajuda = $('#ajuda-repeticao');
    $('#bloco-parcelas').classList.toggle('d-none', repeticao !== 'parcelada');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        ajuda.textContent = '';
        return;
    }
    const chave = data.slice(0, 7);
    if (repeticao === 'mensal') {
        ajuda.innerHTML = `Entra automaticamente todo mês no dia ${Number(data.slice(8))}, a partir de ${nomeMes(chave)}. Você pode editar ou encerrar na aba <strong>Fixas</strong>.`;
    } else if (repeticao === 'parcelada') {
        const n = Math.min(120, Math.max(2, parseInt($('#lanc-parcelas').value, 10) || 2));
        if (valor > 0) {
            const valores = calcularParcelas(valor, n, $('#lanc-modo-parcela').value);
            const total = valores.reduce((t, v) => t + v, 0);
            ajuda.innerHTML = `${n}x de <strong>${moeda(valores[0])}</strong> (total ${moeda(total)}), de ${nomeMesCurto(chave)} a ${nomeMesCurto(somarMeses(chave, n - 1))}.`;
        } else {
            ajuda.textContent = `Lança uma parcela por mês, de ${nomeMesCurto(chave)} a ${nomeMesCurto(somarMeses(chave, n - 1))}.`;
        }
    } else {
        ajuda.textContent = '';
    }
}

function salvarLancamento(evento) {
    evento.preventDefault();
    const form = evento.target;
    const continuar = evento.submitter?.value === 'novo';

    const tipo = $('input[name="lanc-tipo"]:checked').value;
    const campoDescricao = $('#lanc-descricao');
    const campoValor = $('#lanc-valor');
    const campoData = $('#lanc-data');
    const descricao = campoDescricao.value.trim();
    const valor = parseValor(campoValor.value);
    const data = campoData.value;

    campoDescricao.setCustomValidity(descricao ? '' : 'obrigatório');
    campoValor.setCustomValidity(valor > 0 ? '' : 'inválido');
    campoData.setCustomValidity(/^\d{4}-\d{2}-\d{2}$/.test(data) ? '' : 'inválida');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const categoriaId = $('#lanc-categoria').value;
    const pago = $('#lanc-pago').checked;
    const chave = data.slice(0, 7);
    let mensagem;

    if (edicao) {
        const achado = encontrarItem(edicao.tipo, edicao.id);
        if (achado) {
            Object.assign(achado.item, { descricao, valor, categoria: categoriaId, data, pago });
            if (achado.chave !== chave) {
                removerDaLista(achado.itens, achado.item);
                lista(obterMes(chave), edicao.tipo).push(achado.item);
            }
        }
        mensagem = 'Lançamento atualizado';
    } else {
        const repeticao = $('#lanc-repeticao').value;
        if (repeticao === 'mensal') {
            const rec = { id: gerarId(), tipo, descricao, valor, categoria: categoriaId, dia: Number(data.slice(8)), inicio: chave };
            app.dados.recorrentes.push(rec);
            const gerado = lista(obterMes(chave), tipo).find(i => i.recorrenteId === rec.id);
            if (gerado) Object.assign(gerado, { data, pago });
            aplicarRecorrenteNosMeses(rec);
            mensagem = `Fixa criada: entra todo mês no dia ${rec.dia}`;
        } else if (repeticao === 'parcelada') {
            const n = Math.min(120, Math.max(2, parseInt($('#lanc-parcelas').value, 10) || 2));
            const valores = calcularParcelas(valor, n, $('#lanc-modo-parcela').value);
            const grupo = gerarId();
            const dia = Number(data.slice(8));
            valores.forEach((valorParcela, i) => {
                const k = somarMeses(chave, i);
                lista(obterMes(k), tipo).push({
                    id: gerarId(), descricao, valor: valorParcela, categoria: categoriaId,
                    data: i === 0 ? data : dataNoMes(k, dia),
                    pago: i === 0 ? pago : false,
                    parcela: { grupo, numero: i + 1, total: n }
                });
            });
            mensagem = `${n} parcelas lançadas até ${nomeMesCurto(somarMeses(chave, n - 1))}`;
        } else {
            lista(obterMes(chave), tipo).push({ id: gerarId(), descricao, valor, categoria: categoriaId, data, pago });
            mensagem = tipo === 'receita' ? 'Receita adicionada' : 'Despesa adicionada';
            if (chave !== app.mesVisivel) mensagem += ` em ${nomeMes(chave)}`;
        }
    }

    salvar();
    render();
    toast(mensagem);

    if (continuar) {
        campoDescricao.value = '';
        campoValor.value = '';
        $('#lanc-repeticao').value = 'unica';
        atualizarAjudaRepeticao();
        form.classList.remove('was-validated');
        definirTipoLancamento(tipo, false);
        $('#lanc-categoria').value = categoriaId;
        campoDescricao.focus();
    } else {
        modal('modal-lancamento').hide();
    }
}

// Ao escolher uma descrição já usada, sugere a categoria e o valor da última vez
function sugerirPelaDescricao() {
    if (edicao) return;
    const anterior = sugestoes.get(normalizarTexto($('#lanc-descricao').value));
    if (!anterior) return;
    if ($(`#lanc-categoria option[value="${CSS.escape(anterior.categoria)}"]`)) $('#lanc-categoria').value = anterior.categoria;
    if (!$('#lanc-valor').value) $('#lanc-valor').value = valorParaInput(anterior.valor);
    atualizarAjudaRepeticao();
}

export function alternarPago(tipo, id) {
    const achado = encontrarItem(tipo, id);
    if (!achado) return;
    achado.item.pago = !achado.item.pago;
    salvar();
    render();
}

export async function excluirLancamento(tipo, id) {
    const achado = encontrarItem(tipo, id);
    if (!achado) return;
    const { item } = achado;
    await fecharModais();

    if (item.parcela) {
        const escolha = await confirmar({
            titulo: 'Excluir parcela',
            mensagem: `<p><strong>${esc(item.descricao)}</strong> — parcela ${item.parcela.numero} de ${item.parcela.total} (${moeda(item.valor)}).</p>
                       <p class="mb-0 text-muted">Excluir só esta parcela ou também as próximas?</p>`,
            botoes: [
                { texto: 'Só esta', classe: 'btn-outline-danger', valor: 'uma' },
                { texto: 'Esta e as próximas', classe: 'btn-danger', valor: 'proximas' }
            ]
        });
        if (!escolha) return;
        if (escolha === 'uma') {
            removerDaLista(achado.itens, item);
        } else {
            const { grupo, numero } = item.parcela;
            Object.values(app.dados.meses).forEach(m => {
                const itens = lista(m, tipo);
                for (let i = itens.length - 1; i >= 0; i--) {
                    const p = itens[i].parcela;
                    if (p && p.grupo === grupo && p.numero >= numero) itens.splice(i, 1);
                }
            });
        }
    } else {
        let mensagem = `<p class="mb-0">Excluir <strong>${esc(item.descricao)}</strong> (${moeda(item.valor)})?</p>`;
        if (item.recorrenteId && app.dados.recorrentes.some(r => r.id === item.recorrenteId)) {
            mensagem += '<p class="text-muted small mt-2 mb-0">Remove só deste mês. Para parar de lançar nos próximos meses, encerre na aba <strong>Fixas</strong>.</p>';
        }
        const ok = await confirmar({
            titulo: 'Excluir lançamento',
            mensagem,
            botoes: [{ texto: 'Excluir', classe: 'btn-danger', valor: true }]
        });
        if (!ok) return;
        removerDaLista(achado.itens, item);
    }

    salvar();
    render();
    toast('Lançamento excluído');
}

export function configurarLancamentos() {
    $('#form-lancamento').addEventListener('submit', salvarLancamento);
    $$('input[name="lanc-tipo"]').forEach(r => r.addEventListener('change', () => definirTipoLancamento(r.value, false)));
    $('#lanc-descricao').addEventListener('change', sugerirPelaDescricao);
    $('#lanc-data').addEventListener('change', () => {
        if (!edicao) $('#lanc-pago').checked = $('#lanc-data').value <= hoje();
        atualizarAjudaRepeticao();
    });
    ['#lanc-valor', '#lanc-parcelas'].forEach(s => $(s).addEventListener('input', atualizarAjudaRepeticao));
    ['#lanc-repeticao', '#lanc-modo-parcela'].forEach(s => $(s).addEventListener('change', atualizarAjudaRepeticao));
    $('#btn-excluir-lancamento').addEventListener('click', () => edicao && excluirLancamento(edicao.tipo, edicao.id));
    $('#modal-lancamento').addEventListener('shown.bs.modal', () => (edicao ? $('#lanc-valor') : $('#lanc-descricao')).focus());
}
