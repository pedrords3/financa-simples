// Backup em arquivo JSON, restauração e limpeza total dos dados

import { STORAGE_ANTIGO, STORAGE_HISTORICO_ANTIGO, STORAGE_KEY } from '../config.js';
import { app, limparFiltros } from '../estado.js';
import { $ } from '../utils/dom.js';
import { esc } from '../utils/formato.js';
import { chaveHoje, hoje } from '../utils/datas.js';
import { estadoInicial, normalizar, salvar } from '../dados/armazenamento.js';
import { prepararMes } from '../dados/meses.js';
import { confirmar, toast } from '../ui/componentes.js';
import { render } from '../ui/render.js';

export function baixarBackup() {
    app.dados.config.ultimoBackup = hoje();
    salvar();
    const conteudo = JSON.stringify({ app: 'financa-simples', exportadoEm: new Date().toISOString(), ...app.dados }, null, 2);
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `financa-simples-backup-${hoje()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    render();
    toast('Backup salvo na pasta de downloads');
}

function restaurarBackup(arquivo) {
    const leitor = new FileReader();
    leitor.onload = async () => {
        let dados;
        try {
            dados = JSON.parse(leitor.result);
        } catch (erro) {
            dados = null;
        }
        if (!dados || typeof dados !== 'object' || !dados.meses || typeof dados.meses !== 'object') {
            toast('Arquivo inválido. Escolha um backup gerado pelo Finança Simples.', 'erro');
            return;
        }
        const quando = dados.exportadoEm ? ` de ${new Date(dados.exportadoEm).toLocaleString('pt-BR')}` : '';
        const ok = await confirmar({
            titulo: 'Restaurar backup',
            mensagem: `<p class="mb-0">Substituir todos os dados atuais pelo backup${esc(quando)}? Esta ação não pode ser desfeita.</p>`,
            botoes: [{ texto: 'Restaurar', classe: 'btn-primary', valor: true }]
        });
        if (!ok) return;
        app.dados = normalizar(dados);
        app.mesVisivel = chaveHoje();
        prepararMes(app.mesVisivel);
        salvar();
        render();
        toast('Backup restaurado');
    };
    leitor.readAsText(arquivo);
}

export function escolherBackup() {
    $('#input-backup').click();
}

export async function limparTudo() {
    const ok = await confirmar({
        titulo: 'Apagar todos os dados',
        mensagem: `<div class="alert alert-danger py-2"><i class="bi bi-exclamation-triangle"></i> Esta ação não pode ser desfeita.</div>
                   <p class="mb-0">Serão apagados todos os meses, contas fixas, objetivos e categorias personalizadas. Recomendamos <strong>fazer um backup</strong> antes.</p>`,
        botoes: [
            { texto: 'Fazer backup primeiro', classe: 'btn-outline-primary', valor: 'backup' },
            { texto: 'Apagar tudo', classe: 'btn-danger', valor: 'apagar' }
        ]
    });
    if (ok === 'backup') {
        baixarBackup();
        return;
    }
    if (ok !== 'apagar') return;

    try {
        [STORAGE_KEY, STORAGE_ANTIGO, STORAGE_HISTORICO_ANTIGO].forEach(k => localStorage.removeItem(k));
    } catch (erro) { /* ignora */ }
    app.dados = estadoInicial();
    app.mesVisivel = chaveHoje();
    app.abaAtiva = 'despesas';
    limparFiltros();
    salvar();
    render();
    toast('Todos os dados foram apagados');
}

export function configurarBackup() {
    $('#input-backup').addEventListener('change', e => {
        const arquivo = e.target.files[0];
        if (arquivo) restaurarBackup(arquivo);
        e.target.value = '';
    });
}
