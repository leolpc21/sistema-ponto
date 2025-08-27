// server.js (NOVA ABORDAGEM: Dados organizados por Ano/Mês)
const express = require('express');
const fs = require('fs/promises');
const crypto = require('crypto');

const app = express();
const port = 3000;
const dataFile = 'data.json';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Funções utilitárias para ler e escrever no arquivo JSON
async function readData() {
  try {
    const data = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}; // Retorna um objeto vazio se o arquivo não existir
    }
    throw error;
  }
}

async function writeData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

// Funções para cálculo de tempo
function timeToMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToDecimalHours(minutes) {
  if (!minutes) return 0;
  return (minutes / 60).toFixed(2);
}

// Rota para lançar um novo ponto
app.post('/api/lancamentos', async (req, res) => {
  try {
    const allData = await readData();
    const { data, horaInicio, horaSaida, tempoAlmoco, isFalta, isFeriado, isFerias } = req.body;

    const [ano, mes] = data.split('-').slice(0, 2);

    // Cria a estrutura para o ano e mês se não existir
    if (!allData[ano]) {
      allData[ano] = {};
    }
    if (!allData[ano][mes]) {
      allData[ano][mes] = [];
    }

    // Verifica se já existe um lançamento para esta data
    const dataExists = allData[ano][mes].some(l => l.data === data);
    if (dataExists) {
      return res.status(409).json({ error: 'Já existe um lançamento para esta data.' });
    }

    let horasTrabalhadas;
    let horasExtrasDiariasEmMinutos;

    if (isFalta) {
      horasTrabalhadas = "00:00";
      horasExtrasDiariasEmMinutos = -8 * 60;
    } else if (isFeriado || isFerias) {
      horasTrabalhadas = "00:00";
      horasExtrasDiariasEmMinutos = "00:00";
    } else {
      const inicioMinutos = timeToMinutes(horaInicio);
      const saidaMinutos = timeToMinutes(horaSaida);
      const almocoMinutos = timeToMinutes(tempoAlmoco);
      const totalMinutosTrabalhados = (saidaMinutos - inicioMinutos) - almocoMinutos;
      horasTrabalhadas = minutesToDecimalHours(totalMinutosTrabalhados);
      horasExtrasDiariasEmMinutos = totalMinutosTrabalhados - (8 * 60);
    }

    const novoLancamento = {
      id: crypto.randomBytes(16).toString('hex'),
      data,
      hora_inicio: horaInicio || null,
      hora_saida: horaSaida || null,
      tempo_almoco: tempoAlmoco || null,
      horas_trabalhadas: horasTrabalhadas,
      horas_extras_diarias: horasExtrasDiariasEmMinutos,
      is_falta: isFalta,
      is_feriado: isFeriado,
      is_ferias: isFerias
    };

    allData[ano][mes].push(novoLancamento);
    await writeData(allData);

    res.status(201).json({ id: novoLancamento.id, message: 'Lançamento realizado com sucesso!' });

  } catch (error) {
    console.error('Erro ao lançar ponto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter todos os lançamentos
app.get('/api/lancamentos', async (req, res) => {
  try {
    const allData = await readData();
    const lancamentos = Object.values(allData).flatMap(year => Object.values(year)).flat();
    res.json(lancamentos);
  } catch (error) {
    console.error('Erro ao obter lançamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para remover um lançamento
app.delete('/api/lancamentos/:id', async (req, res) => {
  try {
    const allData = await readData();
    const { id } = req.params;

    let lancamentoFound = false;

    for (const ano in allData) {
      for (const mes in allData[ano]) {
        const lancamentosDoMes = allData[ano][mes];
        const lancamentoIndex = lancamentosDoMes.findIndex(l => l.id === id);

        if (lancamentoIndex !== -1) {
          lancamentosDoMes.splice(lancamentoIndex, 1);
          lancamentoFound = true;
          // Limpar meses e anos vazios
          if (lancamentosDoMes.length === 0) {
            delete allData[ano][mes];
          }
          if (Object.keys(allData[ano]).length === 0) {
            delete allData[ano];
          }
          break;
        }
      }
      if (lancamentoFound) break;
    }

    if (!lancamentoFound) {
      return res.status(404).json({ message: 'Lançamento não encontrado.' });
    }

    await writeData(allData);
    res.status(200).json({ message: 'Lançamento removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover lançamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para editar um lançamento
app.put('/api/lancamentos/:id', async (req, res) => {
  try {
    const allData = await readData();
    const { id } = req.params;
    const { data, horaInicio, horaSaida, tempoAlmoco, isFalta, isFeriado, isFerias } = req.body;

    let updated = false;

    // Itera sobre a estrutura de dados para encontrar e atualizar o lançamento
    for (const ano in allData) {
      for (const mes in allData[ano]) {
        const lancamentosDoMes = allData[ano][mes];
        const lancamentoIndex = lancamentosDoMes.findIndex(l => l.id === id);

        if (lancamentoIndex !== -1) {
          const lancamentoToUpdate = lancamentosDoMes[lancamentoIndex];

          // Recalcula as horas com base nos novos dados
          let horasTrabalhadas;
          let horasExtrasDiariasEmMinutos;

          if (isFalta) {
            horasTrabalhadas = 0;
            horasExtrasDiariasEmMinutos = -8 * 60;
          } else if (isFeriado || isFerias) {
            horasTrabalhadas = 0;
            horasExtrasDiariasEmMinutos = 0;
          } else {
            const inicioMinutos = timeToMinutes(horaInicio);
            const saidaMinutos = timeToMinutes(horaSaida);
            const almocoMinutos = timeToMinutes(tempoAlmoco);
            const totalMinutosTrabalhados = (saidaMinutos - inicioMinutos) - almocoMinutos;
            horasTrabalhadas = minutesToDecimalHours(totalMinutosTrabalhados);
            horasExtrasDiariasEmMinutos = totalMinutosTrabalhados - (8 * 60);
          }

          // Atualiza as propriedades do objeto
          lancamentoToUpdate.data = data;
          lancamentoToUpdate.hora_inicio = horaInicio || null;
          lancamentoToUpdate.hora_saida = horaSaida || null;
          lancamentoToUpdate.tempo_almoco = tempoAlmoco || null;
          lancamentoToUpdate.horas_trabalhadas = horasTrabalhadas;
          lancamentoToUpdate.horas_extras_diarias = horasExtrasDiariasEmMinutos;
          lancamentoToUpdate.is_falta = isFalta;
          lancamentoToUpdate.is_feriado = isFeriado;
          lancamentoToUpdate.is_ferias = isFerias;

          updated = true;
          break;
        }
      }
      if (updated) break;
    }

    if (!updated) {
      return res.status(404).json({ message: 'Lançamento não encontrado.' });
    }

    await writeData(allData);
    res.status(200).json({ message: 'Lançamento atualizado com sucesso!' });

  } catch (error) {
    console.error('Erro ao editar lançamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});