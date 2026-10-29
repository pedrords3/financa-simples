// Leitura e gravação dos dados no localStorage

import { CATEGORIAS_PADRAO, STORAGE_KEY } from '../config.js';
import { app } from '../estado.js';
import { toast } from '../ui/componentes.js';
import { migrarDadosAntigos } from './migracao.js';

export function estadoInicial() {
    return {
        versao: 2,
        meses: {},
        recorrentes: [],
        objetivos: [],
        categorias: CATEGORIAS_PADRAO.map(c => ({ ...c, orcamento: 0 })),
        config: { transportarSaldo: false, ultimoBackup: null }
    };
}

// Garante a estrutura esperada em dados vindos do navegador ou de um backup
export function normalizar(dados) {
    const base = estadoInicial();
    const e = {
        versao: 2,
        meses: dados.meses && typeof dados.meses === 'object' ? dados.meses : {},
        recorrentes: Array.isArray(dados.recorrentes) ? dados.recorrentes : [],
        objetivos: Array.isArray(dados.objetivos) ? dados.objetivos : [],
        categorias: Array.isArray(dados.categorias) && dados.categorias.length ? dados.categorias : base.categorias,
        config: { ...base.config, ...(dados.config || {}) }
    };
    // Garante que categorias padrão novas existam em dados antigos
    base.categorias.forEach(c => {
        if (!e.categorias.some(x => x.id === c.id)) e.categorias.push(c);
    });
    Object.values(e.meses).forEach(m => {
        m.receitas = Array.isArray(m.receitas) ? m.receitas : [];
        m.despesas = Array.isArray(m.despesas) ? m.despesas : [];
        m.recorrentesAplicadas = Array.isArray(m.recorrentesAplicadas) ? m.recorrentesAplicadas : [];
        [...m.receitas, ...m.despesas].forEach(i => { i.valor = Number(i.valor) || 0; });
    });
    return e;
}

export function carregar() {
    try {
        const bruto = localStorage.getItem(STORAGE_KEY);
        if (bruto) return normalizar(JSON.parse(bruto));
    } catch (erro) {
        console.error('Erro ao carregar dados', erro);
    }
    const novo = estadoInicial();
    migrarDadosAntigos(novo);
    return novo;
}

export function salvar() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(app.dados));
    } catch (erro) {
        console.error(erro);
        toast('Não foi possível salvar os dados neste navegador.', 'erro');
    }
}
