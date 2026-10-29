// Formatação de valores e textos

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatoMoedaCurta = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });

export function moeda(valor) {
    return formatoMoeda.format(valor || 0);
}

// Escapa texto do usuário antes de inseri-lo em HTML
export function esc(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function arredondar(valor) {
    return Math.round(valor * 100) / 100;
}

// Aceita "1.234,56", "1234,56", "1234.56", "R$ 50" e "1.500"
export function parseValor(texto) {
    if (typeof texto === 'number') return texto;
    let s = String(texto || '').replace(/[^\d,.-]/g, '');
    if (s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
        s = s.replace(/\./g, '');
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? arredondar(n) : NaN;
}

export function valorParaInput(valor) {
    return valor ? valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
}

export function normalizarTexto(texto) {
    return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function plural(n, singular, pluralTexto) {
    return `${n} ${n === 1 ? singular : pluralTexto}`;
}

export function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
