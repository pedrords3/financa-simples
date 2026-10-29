# Finança Simples - Controle Financeiro Pessoal

Aplicação web para organizar as finanças **mês a mês**: contas fixas que entram sozinhas, compras parceladas, controle do que já foi pago, limites por categoria e objetivos de economia. Tudo roda no navegador, sem login e sem servidor.

## 🚀 Demonstração
[Clique aqui para testar](https://pedrords3.github.io/financa-simples/)

## ✨ Funcionalidades
- 📅 **Mês a mês**: navegue entre os meses ou escolha um mês no seletor; cada mês tem seus próprios lançamentos
- 🔁 **Contas e receitas fixas**: salário, aluguel e assinaturas são lançados automaticamente todo mês como pendentes
- 💳 **Compras parceladas**: cada parcela vai para o mês dela (informe o valor da parcela ou o total)
- ✅ **Pago / pendente**: marque com um clique; avisos de contas vencidas, que vencem nos próximos 5 dias e pendentes do mês anterior
- 💰 **Campos de valor com máscara**: a vírgula aparece sozinha enquanto você digita (`1` `2` `3` `4` → `12,34`)
- 📊 **Resumo do mês**: receitas, despesas, saldo previsto, quanto da renda está comprometido e comparação com o mês anterior
- 🎯 **Limite por categoria** e **objetivos**, com depósitos e retiradas e o valor mensal necessário para cumprir o prazo
- 💡 **Dicas personalizadas** e análise da regra **50-30-20**
- 📈 **Gráficos**: despesas por categoria e evolução dos últimos 12 meses
- 📥 **Exportação para Excel**: planilha do mês ou do ano inteiro
- 💾 **Backup e restauração** em arquivo JSON, com lembrete periódico
- 🌙 **Tema claro e escuro**, layout responsivo e atalho de teclado (**N** = novo lançamento)

## 🛠️ Tecnologias
- HTML5, CSS3 e JavaScript puro com **ES Modules** (sem build)
- Bootstrap 5 e Bootstrap Icons
- Chart.js
- SheetJS (XLSX)
- LocalStorage

## 📁 Estrutura do projeto
```
├── index.html
├── assets/img/            # ícone
├── css/
│   ├── base.css           # tokens de cor (claro/escuro) e estilos globais
│   ├── layout.css         # barra superior, painéis, rodapé
│   ├── componentes.css    # indicadores, listas, categorias, objetivos, dicas
│   └── responsivo.css     # ajustes para telas pequenas
└── js/
    ├── main.js            # ponto de entrada
    ├── config.js          # constantes e categorias padrão
    ├── estado.js          # estado compartilhado (dados, mês visível, filtros)
    ├── eventos.js         # cliques delegados (data-acao) e atalhos de teclado
    ├── utils/             # datas, formatação, máscara de moeda, DOM
    ├── dados/             # armazenamento, migração, meses e fixas, categorias, cálculos
    ├── ui/                # renderização de cada parte da tela e gráficos
    └── acoes/             # lançamentos, fixas, objetivos, configurações, exportação, backup
```

A interface segue um fluxo simples: as **ações** alteram `app.dados`, chamam `salvar()` e depois `render()`, que redesenha a tela a partir do estado. Todo texto digitado pelo usuário é escapado antes de ir para o HTML.

## 💻 Como rodar localmente
Como o JavaScript usa módulos (`type="module"`), abra o projeto por um servidor HTTP, e não direto pelo arquivo:

```bash
# qualquer servidor estático serve, por exemplo:
npx serve .
# ou
python -m http.server 8000
```

Também funciona dentro do `htdocs` do XAMPP (`http://localhost/<pasta-do-projeto>/`).

## 📱 Como usar no dia a dia
1. Na aba **Fixas**, cadastre o salário e as contas que se repetem todo mês
2. Lance os gastos do dia a dia pelo botão **Novo lançamento** (ou tecla **N**)
3. Marque como pago conforme for pagando, e os avisos mostram o que está vencendo
4. Acompanhe o resumo, os limites por categoria e os objetivos
5. Faça um backup de vez em quando (menu **⋮**)

> Os dados de versões anteriores do app são migrados automaticamente no primeiro acesso.

## 🔧 Melhorias futuras
- [ ] Sincronização entre dispositivos (login com Firebase)
- [ ] Importação de extrato bancário (OFX/CSV)
- [ ] PWA para uso offline e instalação no celular

## 📄 Licença
Projeto open-source para fins educacionais e de portfólio.
