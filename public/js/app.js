// public/app.js (versão FINAL com modal de edição e CORREÇÃO da data)

document.addEventListener('DOMContentLoaded', () => {
  // Referências para o formulário de ADIÇÃO
  const pontoForm = document.getElementById('pontoForm');
  const dataInput = document.getElementById('data');
  const horaInicioInput = document.getElementById('horaInicio');
  const horaSaidaInput = document.getElementById('horaSaida');
  const tempoAlmocoInput = document.getElementById('tempoAlmoco');
  const isFaltaCheckbox = document.getElementById('isFalta');
  const isFeriadoCheckbox = document.getElementById('isFeriado');
  const isFeriasCheckbox = document.getElementById('isFerias');
  const checkboxesEspeciais = [isFaltaCheckbox, isFeriadoCheckbox, isFeriasCheckbox];

  // Referências para o MODAL DE EDIÇÃO
  const editForm = document.getElementById('editForm');
  const editLancamentoIdInput = document.getElementById('editLancamentoId');
  const editDataInput = document.getElementById('editData');
  const editHoraInicioInput = document.getElementById('editHoraInicio');
  const editHoraSaidaInput = document.getElementById('editHoraSaida');
  const editTempoAlmocoInput = document.getElementById('editTempoAlmoco');
  const editIsFaltaCheckbox = document.getElementById('editIsFalta');
  const editIsFeriadoCheckbox = document.getElementById('editIsFeriado');
  const editIsFeriasCheckbox = document.getElementById('editIsFerias');
  const editCheckboxesEspeciais = [editIsFaltaCheckbox, editIsFeriadoCheckbox, editIsFeriasCheckbox];

  // Outras referências
  const tabelaBody = document.querySelector('#lista-lancamentos');
  const horasTotaisSpan = document.getElementById('horasTotais');
  const horasExtrasSpan = document.getElementById('horasExtras');
  const horasMensalSpan = document.getElementById('horasMensal');
  const mesSelector = document.getElementById('mes-selector');
  const anoSelector = document.getElementById('ano-selector');
  const resumoTitulo = document.getElementById('resumo-titulo');

  let mesAtual = new Date().getMonth();
  let anoAtual = new Date().getFullYear();

  dataInput.valueAsDate = new Date();

  function parseDate(dateString) {
    return new Date(dateString + 'T00:00:00');
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

  function setupCheckboxLogic(formCheckboxes, formInputs) {
    formCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (event) => {
        const checkboxAtual = event.target;
        formCheckboxes.forEach(cb => {
          if (cb !== checkboxAtual) {
            cb.disabled = checkboxAtual.checked;
            cb.checked = false;
          }
        });
        const isDisabled = checkboxAtual.checked;
        formInputs.forEach(input => input.disabled = isDisabled);
        if (isDisabled) {
          formInputs.forEach(input => input.value = '');
        }
      });
    });
  }

  setupCheckboxLogic(checkboxesEspeciais, [horaInicioInput, horaSaidaInput, tempoAlmocoInput]);
  setupCheckboxLogic(editCheckboxesEspeciais, [editHoraInicioInput, editHoraSaidaInput, editTempoAlmocoInput]);

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
      checkboxesEspeciais.forEach(checkbox => checkbox.disabled = false);
      [horaInicioInput, horaSaidaInput, tempoAlmocoInput].forEach(input => input.disabled = false);

    } catch (error) {
      console.error('Erro ao processar o lançamento:', error);
      alert('Erro ao processar o lançamento. Tente novamente.');
    }
  });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = editLancamentoIdInput.value;
    const data = editDataInput.value;
    const horaInicio = editHoraInicioInput.value;
    const horaSaida = editHoraSaidaInput.value;
    const tempoAlmoco = editTempoAlmocoInput.value;
    const isFalta = editIsFaltaCheckbox.checked;
    const isFeriado = editIsFeriadoCheckbox.checked;
    const isFerias = editIsFeriasCheckbox.checked;

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
      const response = await fetch(`/api/lancamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lancamento)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }
      alert(result.message);
      closeEditModal();
      carregarLancamentos();

    } catch (error) {
      console.error('Erro ao editar lançamento:', error);
      alert('Erro ao editar lançamento. Tente novamente.');
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

  tabelaBody.addEventListener('click', async (e) => {
    const btnEditar = e.target.closest('.btn-editar');
    if (btnEditar) {
      const id = btnEditar.getAttribute('data-id');
      const response = await fetch('/api/lancamentos');
      const allLancamentos = await response.json();
      const lancamento = allLancamentos.find(l => l.id === id);

      if (lancamento) {
        editLancamentoIdInput.value = id;
        editDataInput.value = lancamento.data;
        editHoraInicioInput.value = lancamento.hora_inicio || '';
        editHoraSaidaInput.value = lancamento.hora_saida || '';
        editTempoAlmocoInput.value = lancamento.tempo_almoco || '';
        editIsFaltaCheckbox.checked = lancamento.is_falta;
        editIsFeriadoCheckbox.checked = lancamento.is_feriado;
        editIsFeriasCheckbox.checked = lancamento.is_ferias;

        const isEspecial = lancamento.is_falta || lancamento.is_feriado || lancamento.is_ferias;
        editCheckboxesEspeciais.forEach(checkbox => checkbox.disabled = false);
        editHoraInicioInput.disabled = isEspecial;
        editHoraSaidaInput.disabled = isEspecial;
        editTempoAlmocoInput.disabled = isEspecial;

        const modal = new bootstrap.Modal(editModal);
        modal.show();
      } else {
        alert('Lançamento não encontrado.');
      }
    }

    const btnRemover = e.target.closest('.btn-remover');
    if (btnRemover) {
      const id = btnRemover.getAttribute('data-id');
      removerLancamento(id);
    }
  });

  async function carregarLancamentos() {
    try {
      const response = await fetch('/api/lancamentos');
      const lancamentos = await response.json();

      const anosExistentes = [...new Set(lancamentos.map(l => parseDate(l.data).getFullYear()))].sort((a, b) => a - b);
      const anosParaExibir = anosExistentes.length > 0 ? anosExistentes : [anoAtual];

      anoSelector.innerHTML = '';
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

      lancamentos.sort((a, b) => a.data.localeCompare(b.data));

      const lancamentosMesAtual = lancamentos.filter(lancamento => {
        const dataLancamento = parseDate(lancamento.data);
        const mesRegistro = dataLancamento.getMonth();
        const anoRegistro = dataLancamento.getFullYear();
        return mesRegistro === mesAtual && anoRegistro === anoAtual;
      });

      let totalHorasMes = 0;
      lancamentosMesAtual.forEach(lancamento => {
        const horasTrabalhadasDecimal = parseFloat(lancamento.horas_trabalhadas);
        if (!isNaN(horasTrabalhadasDecimal)) {
          totalHorasMes += horasTrabalhadasDecimal;
        }
      });

      let totalExtrasMensalEmMinutos = 0;
      lancamentosMesAtual.forEach(lancamento => {
        const horasExtrasDiariasEmMinutos = parseInt(lancamento.horas_extras_diarias);
        if (!isNaN(horasExtrasDiariasEmMinutos)) {
          totalExtrasMensalEmMinutos += horasExtrasDiariasEmMinutos;
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
      horasMensalSpan.textContent = minutesToHHMM(totalExtrasMensalEmMinutos);
      horasExtrasSpan.textContent = minutesToHHMM(totalExtrasCumulativoEmMinutos);

      let htmlContent = ''; // Crie uma string vazia para armazenar o HTML

      if (lancamentosMesAtual.length === 0) {
        htmlContent = `<tr><td colspan="6">Nenhum lançamento para este mês.</td></tr>`;
      } else {
        lancamentosMesAtual.forEach(lancamento => {
          const horasTrabalhadasDecimal = parseFloat(lancamento.horas_trabalhadas);
          let horasDisplay = decimalHoursToHHMM(horasTrabalhadasDecimal);

          if (lancamento.is_falta) horasDisplay = `${lancamento.horas_trabalhadas} / Falta`;
          if (lancamento.is_feriado) horasDisplay = `${lancamento.horas_trabalhadas} / Feriado`;
          if (lancamento.is_ferias) horasDisplay = `${lancamento.horas_trabalhadas} / Férias`;

          htmlContent += `
            <tr>
                <td>${formatDate(lancamento.data)}</td>
                <td>${lancamento.hora_inicio || '---'}</td>
                <td>${lancamento.hora_saida || '---'}</td>
                <td>${lancamento.tempo_almoco || '---'}</td>
                <td>${horasDisplay}</td>
                <td class="btn-acoes">
                    <button class="btn btn-warning btn-sm btn-editar" data-id="${lancamento.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm btn-remover" data-id="${lancamento.id}" title="Remover"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
        });
      }

      tabelaBody.innerHTML = htmlContent;
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
      tabelaBody.innerHTML = `<tr><td colspan="6">Erro ao carregar dados.</td></tr>`;
    }
  }

  carregarLancamentos();
});