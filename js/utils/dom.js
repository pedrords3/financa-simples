// Atalhos para seleção de elementos

export const $ = (seletor, ctx = document) => ctx.querySelector(seletor);
export const $$ = (seletor, ctx = document) => Array.from(ctx.querySelectorAll(seletor));
