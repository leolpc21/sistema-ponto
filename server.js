// server.js (Código completo com cálculo em minutos)
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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
    const connection = await mysql.createConnection(dbConfig);
    const { data, horaInicio, horaSaida, tempoAlmoco, isFalta, isFeriado, isFerias } = req.body;

    const [rows] = await connection.execute('SELECT id FROM lancamentos WHERE data = ?', [data]);
    if (rows.length > 0) {
      await connection.end();
      return res.status(409).json({ error: 'Já existe um lançamento para esta data. Por favor, edite o lançamento existente.' });
    }

    let horasTrabalhadas;
    let horasExtrasDiariasEmMinutos; // Nova variável em minutos

    if (isFalta) {
      horasTrabalhadas = 0;
      horasExtrasDiariasEmMinutos = -8 * 60; // -480 minutos
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

    const [result] = await connection.execute(
      'INSERT INTO lancamentos (data, hora_inicio, hora_saida, tempo_almoco, horas_trabalhadas, horas_extras_diarias, is_falta, is_feriado, is_ferias) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data, horaInicio || null, horaSaida || null, tempoAlmoco || null, horasTrabalhadas, horasExtrasDiariasEmMinutos, isFalta, isFeriado, isFerias]
    );

    await connection.end();
    res.status(201).json({ id: result.insertId, message: 'Lançamento realizado com sucesso!' });

  } catch (error) {
    console.error('Erro ao lançar ponto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/lancamentos', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM lancamentos ORDER BY data DESC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Erro ao obter lançamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/lancamentos/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const { id } = req.params;
    const [result] = await connection.execute('DELETE FROM lancamentos WHERE id = ?', [id]);
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Lançamento não encontrado.' });
    }

    res.status(200).json({ message: 'Lançamento removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover lançamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});