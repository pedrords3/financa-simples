// Datas: meses no formato "AAAA-MM" e dias no formato "AAAA-MM-DD"

import { capitalizar } from './formato.js';

export function pad(n) {
    return String(n).padStart(2, '0');
}

function isoData(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function hoje() {
    return isoData(new Date());
}

export function chaveHoje() {
    return hoje().slice(0, 7);
}

export function partes(chave) {
    return chave.split('-').map(Number);
}

export function somarMeses(chave, n) {
    const [ano, mes] = partes(chave);
    const d = new Date(ano, mes - 1 + n, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function somarDias(iso, n) {
    const [ano, mes, dia] = partes(iso);
    return isoData(new Date(ano, mes - 1, dia + n));
}

export function diferencaMeses(de, ate) {
    const [a1, m1] = partes(de);
    const [a2, m2] = partes(ate);
    return (a2 - a1) * 12 + (m2 - m1);
}

function diasNoMes(chave) {
    const [ano, mes] = partes(chave);
    return new Date(ano, mes, 0).getDate();
}

// Dia do mês limitado ao último dia (ex.: dia 31 em fevereiro vira 28/29)
export function dataNoMes(chave, dia) {
    return `${chave}-${pad(Math.min(dia, diasNoMes(chave)))}`;
}

export function nomeMes(chave) {
    const [ano, mes] = partes(chave);
    return capitalizar(new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
}

export function nomeMesAbrev(chave) {
    const [ano, mes] = partes(chave);
    return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

export function nomeMesCurto(chave) {
    return `${nomeMesAbrev(chave)}/${chave.slice(2, 4)}`;
}

export function formatarData(iso) {
    const [ano, mes, dia] = partes(iso);
    const semana = new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    return `${semana}, ${pad(dia)}/${pad(mes)}`;
}

export function dataBR(iso) {
    const [ano, mes, dia] = partes(iso);
    return `${pad(dia)}/${pad(mes)}/${ano}`;
}
