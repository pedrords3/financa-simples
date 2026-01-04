// Sistema de armazenamento
let financas = {
    salario: 0,
    entradas: [],
    gastos: [],
    objetivos: [],
    historico: JSON.parse(localStorage.getItem('financasHistorico')) || []
};

// Cores para categorias
const coresCategorias = {
    moradia: '#FF6384',
    alimentacao: '#36A2EB',
    transporte: '#FFCE56',
    lazer: '#4BC0C0',
    saude: '#9966FF',
    educacao: '#FF9F40',
    outros: '#C9CBCF'
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    carregarDados();
    atualizarInterface();
    
    // Configurar data atual
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
    });
    document.querySelector('.header-principal p').textContent += ` - ${dataAtual}`;
});

// ========== FUNÇÕES PRINCIPAIS ==========

function carregarDados() {
    const dados = localStorage.getItem('financasSimples');
    if (dados) {
        const parsed = JSON.parse(dados);
        financas.salario = parsed.salario || 0;
        financas.entradas = parsed.entradas || [];
        financas.gastos = parsed.gastos || [];
        financas.objetivos = parsed.objetivos || [];
    }
}

function salvarDados() {
    localStorage.setItem('financasSimples', JSON.stringify({
        salario: financas.salario,
        entradas: financas.entradas,
        gastos: financas.gastos,
        objetivos: financas.objetivos
    }));
    
    // Salvar no histórico mensal
    const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const resumoMes = calcularResumo();
    
    financas.historico.push({
        mes: mesAtual,
        ...resumoMes,
        data: new Date().toISOString()
    });
    
    localStorage.setItem('financasHistorico', JSON.stringify(financas.historico));
}

// ========== FUNÇÕES DE ENTRADAS ==========

function atualizarSalario() {
    const salarioInput = document.getElementById('salario');
    financas.salario = parseFloat(salarioInput.value) || 0;
    salvarDados();
    atualizarInterface();
}

function addEntrada() {
    const desc = document.getElementById('entrada-desc').value.trim();
    const valor = parseFloat(document.getElementById('entrada-valor').value);
    
    if (desc && valor && valor > 0) {
        financas.entradas.push({
            id: Date.now(),
            descricao: desc,
            valor: valor,
            data: new Date().toLocaleDateString()
        });
        
        salvarDados();
        atualizarInterface();
        
        // Limpar campos
        document.getElementById('entrada-desc').value = '';
        document.getElementById('entrada-valor').value = '';
    }
}

// ========== FUNÇÕES DE GASTOS ==========

function addGasto() {
    const desc = document.getElementById('gasto-desc').value.trim();
    const categoria = document.getElementById('gasto-categoria').value;
    const valor = parseFloat(document.getElementById('gasto-valor').value);
    
    if (desc && valor && valor > 0) {
        financas.gastos.push({
            id: Date.now(),
            descricao: desc,
            categoria: categoria,
            valor: valor,
            data: new Date().toLocaleDateString()
        });
        
        salvarDados();
        atualizarInterface();
        
        // Limpar campos
        document.getElementById('gasto-desc').value = '';
        document.getElementById('gasto-valor').value = '';
    }
}

// ========== FUNÇÕES DE OBJETIVOS ==========

function addObjetivo() {
    const nome = document.getElementById('objetivo-nome').value.trim();
    const valor = parseFloat(document.getElementById('objetivo-valor').value);
    
    if (nome && valor && valor > 0) {
        financas.objetivos.push({
            id: Date.now(),
            nome: nome,
            valorNecessario: valor,
            valorAtual: 0,
            concluido: false,
            dataCriacao: new Date().toLocaleDateString()
        });
        
        salvarDados();
        atualizarInterface();
        
        // Limpar campos
        document.getElementById('objetivo-nome').value = '';
        document.getElementById('objetivo-valor').value = '';
    }
}

// ========== FUNÇÕES DE EDIÇÃO ==========

function abrirEdicao(tipo, index) {
    document.getElementById('edit-tipo').value = tipo;
    document.getElementById('edit-index').value = index;
    
    let item;
    if (tipo === 'gasto') {
        item = financas.gastos[index];
        document.getElementById('edit-categoria').value = item.categoria;
    } else if (tipo === 'entrada') {
        item = financas.entradas[index];
    } else if (tipo === 'objetivo') {
        item = financas.objetivos[index];
    }
    
    document.getElementById('edit-descricao').value = item.descricao || item.nome;
    document.getElementById('edit-valor').value = item.valor || item.valorNecessario;
    
    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();
}

function salvarEdicao() {
    const tipo = document.getElementById('edit-tipo').value;
    const index = parseInt(document.getElementById('edit-index').value);
    const descricao = document.getElementById('edit-descricao').value.trim();
    const valor = parseFloat(document.getElementById('edit-valor').value);
    const categoria = document.getElementById('edit-categoria').value;
    
    if (tipo === 'gasto') {
        financas.gastos[index].descricao = descricao;
        financas.gastos[index].valor = valor;
        financas.gastos[index].categoria = categoria;
    } else if (tipo === 'entrada') {
        financas.entradas[index].descricao = descricao;
        financas.entradas[index].valor = valor;
    } else if (tipo === 'objetivo') {
        financas.objetivos[index].nome = descricao;
        financas.objetivos[index].valorNecessario = valor;
    }
    
    salvarDados();
    atualizarInterface();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
    modal.hide();
}

function removerItem() {
    const tipo = document.getElementById('edit-tipo').value;
    const index = parseInt(document.getElementById('edit-index').value);
    
    if (tipo === 'gasto') {
        financas.gastos.splice(index, 1);
    } else if (tipo === 'entrada') {
        financas.entradas.splice(index, 1);
    } else if (tipo === 'objetivo') {
        financas.objetivos.splice(index, 1);
    }
    
    salvarDados();
    atualizarInterface();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditar'));
    modal.hide();
}

// ========== FUNÇÕES DE CÁLCULO ==========

function calcularResumo() {
    let totalEntradas = financas.salario;
    financas.entradas.forEach(e => totalEntradas += e.valor);
    
    let totalGastos = 0;
    const gastosPorCategoria = {};
    financas.gastos.forEach(g => {
        totalGastos += g.valor;
        gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] || 0) + g.valor;
    });
    
    const saldo = totalEntradas - totalGastos;
    
    return {
        totalEntradas,
        totalGastos,
        saldo,
        gastosPorCategoria
    };
}

// ========== ATUALIZAÇÃO DA INTERFACE ==========

function atualizarInterface() {
    const resumo = calcularResumo();
    
    // Atualizar totais
    document.getElementById('total-entradas').textContent = formatarMoeda(resumo.totalEntradas);
    document.getElementById('total-gastos').textContent = formatarMoeda(resumo.totalGastos);
    document.getElementById('saldo-restante').textContent = formatarMoeda(resumo.saldo);
    
    // Atualizar cor do saldo
    const cardSaldo = document.getElementById('card-saldo');
    if (resumo.saldo >= 0) {
        cardSaldo.classList.remove('saldo-negativo');
        cardSaldo.classList.add('saldo-positivo');
    } else {
        cardSaldo.classList.remove('saldo-positivo');
        cardSaldo.classList.add('saldo-negativo');
    }
    
    // Atualizar listas
    atualizarListaEntradas();
    atualizarListaGastos();
    atualizarListaObjetivos();
    
    // Atualizar dicas
    gerarDicasInteligentes(resumo);
    
    // Atualizar gráficos
    atualizarGraficoCategorias(resumo.gastosPorCategoria);
    atualizarGraficoEvolucao();
}

function atualizarListaEntradas() {
    const container = document.getElementById('lista-entradas');
    if (financas.entradas.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-3">Nenhuma entrada extra adicionada</div>';
        return;
    }
    
    let html = '';
    financas.entradas.forEach((entrada, index) => {
        html += `
            <div class="gasto-item d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold">${entrada.descricao}</div>
                    <small class="text-muted">${entrada.data}</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="valor-entrada">${formatarMoeda(entrada.valor)}</span>
                    <button class="btn btn-outline-secondary btn-sm btn-action" 
                            onclick="abrirEdicao('entrada', ${index})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function atualizarListaGastos() {
    const container = document.getElementById('lista-gastos');
    if (financas.gastos.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-3">Nenhum gasto registrado</div>';
        return;
    }
    
    let html = '';
    financas.gastos.forEach((gasto, index) => {
        const categoriaNome = {
            'moradia': 'Moradia',
            'alimentacao': 'Alimentação',
            'transporte': 'Transporte',
            'lazer': 'Lazer',
            'saude': 'Saúde',
            'educacao': 'Educação',
            'outros': 'Outros'
        }[gasto.categoria];
        
        html += `
            <div class="gasto-item d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold">${gasto.descricao}</div>
                    <div class="d-flex align-items-center gap-2 mt-1">
                        <span class="categoria-badge" style="background-color: ${coresCategorias[gasto.categoria]}; color: white;">
                            ${categoriaNome}
                        </span>
                        <small class="text-muted">${gasto.data}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="valor-gasto">${formatarMoeda(gasto.valor)}</span>
                    <button class="btn btn-outline-secondary btn-sm btn-action" 
                            onclick="abrirEdicao('gasto', ${index})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function atualizarListaObjetivos() {
    const container = document.getElementById('lista-objetivos');
    if (financas.objetivos.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-3">Nenhum objetivo definido</div>';
        return;
    }
    
    const saldo = calcularResumo().saldo;
    let html = '';
    
    financas.objetivos.forEach((objetivo, index) => {
        const progresso = Math.min(100, (objetivo.valorAtual / objetivo.valorNecessario) * 100);
        const mesesRestantes = saldo > 0 ? Math.ceil((objetivo.valorNecessario - objetivo.valorAtual) / saldo) : '∞';
        
        html += `
            <div class="objetivo-card">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 class="fw-bold mb-1">${objetivo.nome}</h6>
                        <small>${formatarMoeda(objetivo.valorAtual)} de ${formatarMoeda(objetivo.valorNecessario)}</small>
                    </div>
                    <button class="btn btn-light btn-sm btn-action" 
                            onclick="abrirEdicao('objetivo', ${index})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
                <div class="progresso-objetivo">
                    <div class="progress-bar" style="width: ${progresso}%"></div>
                </div>
                <div class="mt-2 d-flex justify-content-between">
                    <small>${progresso.toFixed(1)}% concluído</small>
                    <small>${mesesRestantes} meses restantes</small>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ========== DICAS INTELIGENTES ==========

function gerarDicasInteligentes(resumo) {
    const container = document.getElementById('dicas-financeiras');
    let dicas = [];
    
    // 1. Análise de saldo
    if (resumo.saldo > 0) {
        dicas.push(`
            <div class="dica-item">
                <strong>💰 Ótima notícia!</strong><br>
                Você tem ${formatarMoeda(resumo.saldo)} disponível este mês.
                ${resumo.saldo > 500 ? 'Ótimo momento para investir!' : 'Considere reservar uma parte para emergências.'}
            </div>
        `);
    } else if (resumo.saldo < 0) {
        dicas.push(`
            <div class="dica-item" style="border-left-color: #e74c3c;">
                <strong>⚠️ Atenção ao orçamento</strong><br>
                Seus gastos ultrapassaram sua renda em ${formatarMoeda(Math.abs(resumo.saldo))}.
                Reveja suas despesas não essenciais.
            </div>
        `);
    }
    
    // 2. Análise por categoria (compreensiva)
    Object.entries(resumo.gastosPorCategoria).forEach(([categoria, valor]) => {
        const percentual = (valor / resumo.totalEntradas * 100).toFixed(1);
        const categoriaNome = {
            'moradia': 'Moradia',
            'alimentacao': 'Alimentação',
            'transporte': 'Transporte',
            'lazer': 'Lazer',
            'saude': 'Saúde',
            'educacao': 'Educação',
            'outros': 'Outros'
        }[categoria];
        
        let mensagem = '';
        if (categoria === 'moradia' && percentual > 40) {
            mensagem = `Seus gastos com moradia são ${percentual}% da sua renda. Este é um compromisso importante - considere se há espaço para otimização nos outros custos relacionados.`;
        } else if (categoria === 'alimentacao' && percentual > 30) {
            mensagem = `Alimentação representa ${percentual}% da sua renda. Planejar compras e refeições pode trazer economia.`;
        } else if (categoria === 'lazer' && percentual > 20) {
            mensagem = `Lazer: ${percentual}% da renda. Equilíbrio é importante para qualidade de vida!`;
        } else if (percentual > 50) {
            mensagem = `${categoriaNome} representa ${percentual}% da sua renda.`;
        }
        
        if (mensagem) {
            dicas.push(`
                <div class="dica-item">
                    <strong>📊 ${categoriaNome}</strong><br>
                    ${mensagem}
                </div>
            `);
        }
    });
    
    // 3. Sugestões baseadas em objetivos
    if (financas.objetivos.length > 0 && resumo.saldo > 0) {
        const objetivoAtivo = financas.objetivos.find(o => !o.concluido);
        if (objetivoAtivo) {
            const valorMensal = resumo.saldo * 0.3; // Sugere 30% do saldo
            const meses = Math.ceil(objetivoAtivo.valorNecessario / valorMensal);
            
            dicas.push(`
                <div class="dica-item">
                    <strong>🎯 Seu objetivo: ${objetivoAtivo.nome}</strong><br>
                    Destinando ${formatarMoeda(valorMensal)} por mês (30% do seu saldo disponível), 
                    você atingirá seu objetivo em aproximadamente ${meses} meses.
                </div>
            `);
        }
    }
    
    // 4. Dica de emergência
    if (resumo.totalEntradas > 0) {
        const reservaEmergencia = resumo.totalEntradas * 3; // 3 meses de renda
        dicas.push(`
            <div class="dica-item">
                <strong>🛡️ Reserva de emergência</strong><br>
                Recomenda-se ter ${formatarMoeda(reservaEmergencia)} guardado 
                (equivalente a 3 meses de renda) para imprevistos.
            </div>
        `);
    }
    
    container.innerHTML = dicas.join('');
}

// ========== GRÁFICOS ==========

function atualizarGraficoCategorias(gastosPorCategoria) {
    const ctx = document.getElementById('grafico-categorias').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.graficoCategorias) {
        window.graficoCategorias.destroy();
    }
    
    const categorias = Object.keys(gastosPorCategoria);
    const valores = Object.values(gastosPorCategoria);
    const cores = categorias.map(cat => coresCategorias[cat]);
    
    if (categorias.length === 0) {
        return;
    }
    
    window.graficoCategorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categorias.map(cat => ({
                'moradia': 'Moradia',
                'alimentacao': 'Alimentação',
                'transporte': 'Transporte',
                'lazer': 'Lazer',
                'saude': 'Saúde',
                'educacao': 'Educação',
                'outros': 'Outros'
            }[cat])),
            datasets: [{
                data: valores,
                backgroundColor: cores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function atualizarGraficoEvolucao() {
    const ctx = document.getElementById('grafico-evolucao').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.graficoEvolucao) {
        window.graficoEvolucao.destroy();
    }
    
    // Usar histórico ou dados atuais
    const historico = financas.historico.slice(-6); // Últimos 6 meses
    const meses = historico.map(h => h.mes);
    const saldos = historico.map(h => h.saldo);
    const entradas = historico.map(h => h.totalEntradas);
    const gastos = historico.map(h => h.totalGastos);
    
    window.graficoEvolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Entradas',
                    data: entradas,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.3
                },
                {
                    label: 'Gastos',
                    data: gastos,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.3
                },
                {
                    label: 'Saldo',
                    data: saldos,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
}

// ========== EXPORTAÇÃO EXCEL ==========

function exportarParaExcel() {
    const resumo = calcularResumo();
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Criar planilha com múltiplas abas
    const wb = XLSX.utils.book_new();
    
    // Aba 1: Resumo Geral
    const resumoData = [
        ['RESUMO FINANCEIRO', '', ''],
        ['Data de exportação:', dataAtual, ''],
        ['', '', ''],
        ['Renda Principal', formatarMoeda(financas.salario), ''],
        ['Total de entradas extras', formatarMoeda(resumo.totalEntradas - financas.salario), ''],
        ['Total de entradas', formatarMoeda(resumo.totalEntradas), ''],
        ['Total de gastos', formatarMoeda(resumo.totalGastos), ''],
        ['Saldo disponível', formatarMoeda(resumo.saldo), ''],
        ['', '', ''],
        ['Distribuição por categoria:', '', '']
    ];
    
    // Adicionar categorias
    Object.entries(resumo.gastosPorCategoria).forEach(([categoria, valor]) => {
        const percentual = ((valor / resumo.totalEntradas) * 100).toFixed(1);
        const categoriaNome = {
            'moradia': 'Moradia',
            'alimentacao': 'Alimentação',
            'transporte': 'Transporte',
            'lazer': 'Lazer',
            'saude': 'Saúde',
            'educacao': 'Educação',
            'outros': 'Outros'
        }[categoria];
        
        resumoData.push([categoriaNome, formatarMoeda(valor), `${percentual}%`]);
    });
    
    // Aba 2: Gastos detalhados
    const gastosData = [
        ['GASTOS DETALHADOS', '', '', ''],
        ['Descrição', 'Categoria', 'Valor', 'Data']
    ];
    
    financas.gastos.forEach(gasto => {
        const categoriaNome = {
            'moradia': 'Moradia',
            'alimentacao': 'Alimentação',
            'transporte': 'Transporte',
            'lazer': 'Lazer',
            'saude': 'Saúde',
            'educacao': 'Educação',
            'outros': 'Outros'
        }[gasto.categoria];
        
        gastosData.push([
            gasto.descricao,
            categoriaNome,
            gasto.valor,
            gasto.data
        ]);
    });
    
    // Aba 3: Objetivos
    const objetivosData = [
        ['MEUS OBJETIVOS', '', '', ''],
        ['Objetivo', 'Valor necessário', 'Valor atual', 'Progresso']
    ];
    
    financas.objetivos.forEach(objetivo => {
        const progresso = ((objetivo.valorAtual / objetivo.valorNecessario) * 100).toFixed(1);
        objetivosData.push([
            objetivo.nome,
            objetivo.valorNecessario,
            objetivo.valorAtual,
            `${progresso}%`
        ]);
    });
    
    // Criar as abas
    const ws1 = XLSX.utils.aoa_to_sheet(resumoData);
    const ws2 = XLSX.utils.aoa_to_sheet(gastosData);
    const ws3 = XLSX.utils.aoa_to_sheet(objetivosData);
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');
    XLSX.utils.book_append_sheet(wb, ws2, 'Gastos');
    XLSX.utils.book_append_sheet(wb, ws3, 'Objetivos');
    
    // Gerar e baixar arquivo
    const nomeArquivo = `financa-simples-${dataAtual.replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
    
    // Feedback visual
    const btn = document.querySelector('.btn-exportar');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Exportado!';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 2000);
}

// ========== FUNÇÕES AUXILIARES ==========

function formatarMoeda(valor) {
    return 'R$ ' + valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}