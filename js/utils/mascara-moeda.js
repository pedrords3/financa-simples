// Máscara de moeda no estilo dos apps de banco: os dígitos entram pela direita
// e a vírgula já aparece no lugar (digitar 1, 2, 3, 4 mostra 0,01 → 0,12 → 1,23 → 12,34).
// Vale para todo campo com o atributo data-moeda, inclusive os criados depois.

import { parseValor, valorParaInput } from './formato.js';

const MAX_DIGITOS = 11; // até 999.999.999,99

export function formatarDigitos(texto) {
    const digitos = String(texto).replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_DIGITOS);
    return digitos ? valorParaInput(Number(digitos) / 100) : '';
}

function aplicarMascara(campo) {
    const formatado = formatarDigitos(campo.value);
    if (campo.value !== formatado) campo.value = formatado;
    // O cursor fica sempre no fim, que é onde os dígitos entram
    if (document.activeElement === campo) campo.setSelectionRange(formatado.length, formatado.length);
}

export function ativarMascaraMoeda() {
    // Fase de captura: a máscara roda antes dos outros ouvintes de "input" do campo
    document.addEventListener('input', e => {
        if (e.target.matches?.('[data-moeda]')) aplicarMascara(e.target);
    }, true);

    // Ao colar, interpreta o texto como valor ("50" é R$ 50,00, e não R$ 0,50)
    document.addEventListener('paste', e => {
        const campo = e.target;
        if (!campo.matches?.('[data-moeda]')) return;
        e.preventDefault();
        const valor = parseValor(e.clipboardData.getData('text'));
        campo.value = valor > 0 ? valorParaInput(valor) : '';
        campo.dispatchEvent(new Event('input', { bubbles: true }));
    }, true);
}
