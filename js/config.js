// Constantes da aplicação: chaves de armazenamento, categorias padrão e textos fixos

export const STORAGE_KEY = 'financasSimples_v2';
export const STORAGE_TEMA = 'financasSimples_tema';
export const STORAGE_ANTIGO = 'financasSimples';
export const STORAGE_HISTORICO_ANTIGO = 'financasHistorico';

// grupo: usado na análise 50-30-20 (necessidade, desejo, poupanca)
export const CATEGORIAS_PADRAO = [
    { id: 'moradia', nome: 'Moradia', tipo: 'despesa', icone: 'bi-house-door', cor: '#6366f1', grupo: 'necessidade' },
    { id: 'contas', nome: 'Contas da casa', tipo: 'despesa', icone: 'bi-lightning-charge', cor: '#06b6d4', grupo: 'necessidade' },
    { id: 'mercado', nome: 'Mercado', tipo: 'despesa', icone: 'bi-cart3', cor: '#10b981', grupo: 'necessidade' },
    { id: 'alimentacao', nome: 'Alimentação', tipo: 'despesa', icone: 'bi-cup-hot', cor: '#f59e0b', grupo: 'desejo' },
    { id: 'transporte', nome: 'Transporte', tipo: 'despesa', icone: 'bi-car-front', cor: '#3b82f6', grupo: 'necessidade' },
    { id: 'saude', nome: 'Saúde', tipo: 'despesa', icone: 'bi-heart-pulse', cor: '#ef4444', grupo: 'necessidade' },
    { id: 'educacao', nome: 'Educação', tipo: 'despesa', icone: 'bi-book', cor: '#a855f7', grupo: 'necessidade' },
    { id: 'lazer', nome: 'Lazer', tipo: 'despesa', icone: 'bi-controller', cor: '#ec4899', grupo: 'desejo' },
    { id: 'assinaturas', nome: 'Assinaturas', tipo: 'despesa', icone: 'bi-tv', cor: '#84cc16', grupo: 'desejo' },
    { id: 'compras', nome: 'Compras', tipo: 'despesa', icone: 'bi-bag', cor: '#f97316', grupo: 'desejo' },
    { id: 'investimentos', nome: 'Reserva e investimentos', tipo: 'despesa', icone: 'bi-piggy-bank', cor: '#14b8a6', grupo: 'poupanca' },
    { id: 'outros', nome: 'Outros', tipo: 'despesa', icone: 'bi-three-dots', cor: '#94a3b8', grupo: 'desejo' },
    { id: 'salario', nome: 'Salário', tipo: 'receita', icone: 'bi-briefcase', cor: '#16a34a' },
    { id: 'extra', nome: 'Renda extra', tipo: 'receita', icone: 'bi-stars', cor: '#0ea5e9' },
    { id: 'rendimentos', nome: 'Rendimentos', tipo: 'receita', icone: 'bi-graph-up-arrow', cor: '#8b5cf6' },
    { id: 'outras-receitas', nome: 'Outras receitas', tipo: 'receita', icone: 'bi-plus-circle', cor: '#94a3b8' }
];

export const GRUPOS = { necessidade: 'Necessidade', desejo: 'Desejo', poupanca: 'Poupança' };

export const DICAS_GERAIS = [
    ['Revisão semanal', 'Separe 10 minutos por semana para marcar o que foi pago e lançar os gastos. Evita surpresas no fim do mês.'],
    ['Regra das 24 horas', 'Antes de uma compra não planejada, espere um dia. Se ainda fizer sentido, compre.'],
    ['Pague-se primeiro', 'Assim que o salário cair, separe o valor dos seus objetivos — não o que sobrar no fim do mês.'],
    ['Assinaturas esquecidas', 'Confira suas assinaturas: cancele o que você não usou no último mês.']
];
