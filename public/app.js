// public/app.js (código CORRIGIDO para o seletor de anos)

document.addEventListener('DOMContentLoaded', () => {
  const pontoForm = document.getElementById('pontoForm');
  const dataInput = document.getElementById('data');
  const horaInicioInput = document.getElementById('horaInicio');
  const horaSaidaInput = document.getElementById('horaSaida');
  const tempoAlmocoInput = document.getElementById('tempoAlmoco');

  const isFaltaCheckbox = document.getElementById('isFalta');
  const isFeriadoCheckbox = document.getElementById('isFeriado');
  const isFeriasCheckbox = document.getElementById('isFerias');
  const checkboxesEspeciais = [isFaltaCheckbox, isFeriadoCheckbox, isFeriasCheckbox];

  const tabelaBody = document.querySelector('#lista-lancamentos tbody');
  const horasTotaisSpan = document.getElementById('horasTotais');
  const horasExtrasSpan = document.getElementById('horasExtras');

  const mesSelector = document.getElementById('mes-selector');
  const anoSelector = document.getElementById('ano-selector');
  const resumoTitulo = document.getElementById('resumo-titulo');

  let mesAtual = new Date().getMonth();
  let anoAtual = new Date().getFullYear();

  dataInput.valueAsDate = new Date();

  function parseDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatDate(dateString) {
    const date = parseDate(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function minutesToHHMM(totalMinutes) {
    const sign = totalMinutes < 0 ? '-' : '';
    const absMinutes = Math.abs(totalMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    return `${sign}${formattedHours}:${formattedMinutes}`;
  }

  function decimalHoursToHHMM(decimalHours) {
    if (typeof decimalHours !== 'number' || isNaN(decimalHours)) return '---';
    const totalMinutes = Math.abs(decimalHours * 60);
    const totalMinutesRounded = Math.round(totalMinutes);
    const hours = Math.floor(totalMinutesRounded / 60);
    const minutes = totalMinutesRounded % 60;
    const sign = decimalHours < 0 ? '-' : '';
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    return `${sign}${formattedHours}:${formattedMinutes}`;
  }

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  meses.forEach((mes, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = mes;
    mesSelector.appendChild(option);
  });

  mesSelector.value = mesAtual;

  mesSelector.addEventListener('change', () => {
    mesAtual = parseInt(mesSelector.value);
    carregarLancamentos();
  });

  anoSelector.addEventListener('change', () => {
    anoAtual = parseInt(anoSelector.value);
    carregarLancamentos();
  });

  function gerenciarOpcoesEspeciais(event) {
    const checkboxAtual = event.target;

    checkboxesEspeciais.forEach(checkbox => {
      if (checkbox !== checkboxAtual) {
        checkbox.disabled = checkboxAtual.checked;
        checkbox.checked = false;
      }
    });
    const isDisabled = checkboxAtual.checked;
    horaInicioInput.disabled = isDisabled;
    horaSaidaInput.disabled = isDisabled;
    tempoAlmocoInput.disabled = isDisabled;
    if (isDisabled) {
      horaInicioInput.value = '';
      horaSaidaInput.value = '';
      tempoAlmocoInput.value = '';
    }
  }

  checkboxesEspeciais.forEach(checkbox => {
    checkbox.addEventListener('change', gerenciarOpcoesEspeciais);
  });

  pontoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = dataInput.value;
    const horaInicio = horaInicioInput.value;
    const horaSaida = horaSaidaInput.value;
    const tempoAlmoco = tempoAlmocoInput.value;
    const isFalta = isFaltaCheckbox.checked;
    const isFeriado = isFeriadoCheckbox.checked;
    const isFerias = isFeriasCheckbox.checked;

    const lancamento = {
      data,
      horaInicio,
      horaSaida,
      tempoAlmoco,
      isFalta,
      isFeriado,
      isFerias
    };

    try {
      const response = await fetch('/api/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lancamento)
      });
      const result = await response.json();

      if (response.status === 409) {
        alert(result.error);
      } else {
        alert(result.message);
        carregarLancamentos();
      }

      pontoForm.reset();
      dataInput.valueAsDate = new Date();
      checkboxesEspeciais.forEach(checkbox => {
        checkbox.disabled = false;
      });
      horaInicioInput.disabled = false;
      horaSaidaInput.disabled = false;
      tempoAlmocoInput.disabled = false;

    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      alert('Erro ao lançar ponto. Tente novamente.');
    }
  });

  async function removerLancamento(id) {
    if (!confirm('Tem certeza que deseja remover este lançamento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/lancamentos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      const result = await response.json();
      alert(result.message);
      carregarLancamentos();
    } catch (error) {
      console.error('Erro ao remover lançamento:', error);
      alert('Erro ao remover lançamento. Tente novamente.');
    }
  }

  tabelaBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remover') || e.target.closest('.btn-remover')) {
      const btnRemover = e.target.closest('.btn-remover');
      if (btnRemover) {
        const id = btnRemover.getAttribute('data-id');
        removerLancamento(id);
      }
    }
    if (e.target.classList.contains('btn-editar') || e.target.closest('.btn-editar')) {
      alert('A funcionalidade de edição será implementada futuramente!');
    }
  });

  async function carregarLancamentos() {
    try {
      const response = await fetch('/api/lancamentos');
      const lancamentos = await response.json();

      // Lógica para popular o seletor de anos
      const anosExistentes = [...new Set(lancamentos.map(l => parseDate(l.data).getFullYear()))].sort((a, b) => a - b);

      const anosParaExibir = anosExistentes.length > 0 ? anosExistentes : [anoAtual];

      anoSelector.innerHTML = ''; // Limpa as opções existentes
      anosParaExibir.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        anoSelector.appendChild(option);
      });

      if (!anosExistentes.includes(anoAtual)) {
        anoSelector.value = anosParaExibir[anosParaExibir.length - 1];
        anoAtual = parseInt(anoSelector.value);
      } else {
        anoSelector.value = anoAtual;
      }

      const lancamentosMesAtual = lancamentos.filter(lancamento => {
        const dataLancamento = parseDate(lancamento.data);
        return dataLancamento.getMonth() === mesAtual && dataLancamento.getFullYear() === anoAtual;
      });

      let totalHorasMes = 0;
      lancamentosMesAtual.forEach(lancamento => {
        const horasTrabalhadasDecimal = parseFloat(lancamento.horas_trabalhadas);
        if (!isNaN(horasTrabalhadasDecimal)) {
          totalHorasMes += horasTrabalhadasDecimal;
        }
      });

      let totalExtrasCumulativoEmMinutos = 0;
      lancamentos.forEach(lancamento => {
        const horasExtrasDiariasEmMinutos = parseInt(lancamento.horas_extras_diarias);
        if (!isNaN(horasExtrasDiariasEmMinutos)) {
          totalExtrasCumulativoEmMinutos += horasExtrasDiariasEmMinutos;
        }
      });

      resumoTitulo.textContent = `Resumo de ${meses[mesAtual]} de ${anoAtual}`;
      horasTotaisSpan.textContent = decimalHoursToHHMM(totalHorasMes);
      horasExtrasSpan.textContent = minutesToHHMM(totalExtrasCumulativoEmMinutos);

      tabelaBody.innerHTML = '';
      if (lancamentosMesAtual.length === 0) {
        tabelaBody.innerHTML = `<tr><td colspan="6">Nenhum lançamento para este mês.</td></tr>`;
      } else {
        lancamentosMesAtual.forEach(lancamento => {
          const horasTrabalhadasDecimal = parseFloat(lancamento.horas_trabalhadas);
          let horasDisplay = decimalHoursToHHMM(horasTrabalhadasDecimal);

          if (lancamento.is_falta) horasDisplay = `${lancamento.horas_trabalhadas} / Falta`;
          if (lancamento.is_feriado) horasDisplay = `${lancamento.horas_trabalhadas} / Feriado`;
          if (lancamento.is_ferias) horasDisplay = `${lancamento.horas_trabalhadas} / Férias`;

          const row = document.createElement('tr');
          row.innerHTML = `
                        <td>${formatDate(lancamento.data)}</td>
                        <td>${lancamento.hora_inicio || '---'}</td>
                        <td>${lancamento.hora_saida || '---'}</td>
                        <td>${lancamento.tempo_almoco || '---'}</td>
                        <td>${horasDisplay}</td>
                        <td class="btn-acoes">
                            <button class="btn btn-warning btn-sm btn-editar" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm btn-remover" data-id="${lancamento.id}" title="Remover"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `;
          tabelaBody.appendChild(row);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
      tabelaBody.innerHTML = `<tr><td colspan="6">Erro ao carregar dados.</td></tr>`;
    }
  }

  carregarLancamentos();
});