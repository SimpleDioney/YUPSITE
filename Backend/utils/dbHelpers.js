const db = require('../database/db');

/**
 * Executa uma consulta que retorna no máximo uma linha (ex: SELECT por ID).
 * @param {string} sql - A consulta SQL.
 * @param {Array} params - Os parâmetros para a consulta.
 * @returns {Promise<Object|null>} A linha encontrada ou null.
 */
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Erro em getAsync:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Executa uma consulta que não retorna dados (ex: INSERT, UPDATE, DELETE).
 * @param {string} sql - A consulta SQL.
 * @param {Array} params - Os parâmetros para a consulta.
 * @returns {Promise<Object>} Um objeto contendo lastID e changes.
 */
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Erro em runAsync:', err);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

/**
 * Executa uma consulta que retorna múltiplas linhas (ex: SELECT * FROM ...).
 * @param {string} sql - A consulta SQL.
 * @param {Array} params - Os parâmetros para a consulta.
 * @returns {Promise<Array>} Um array com as linhas encontradas.
 */
function getAllAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Erro em getAllAsync:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Exporta todas as funções para serem usadas em outros ficheiros
module.exports = {
  getAsync,
  runAsync,
  getAllAsync, // A exportação correta da função que estava a faltar
};