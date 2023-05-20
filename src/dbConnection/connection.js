const mongoose = require('mongoose');

async function connect() {
  const mongoUri = 'mongodb://localhost:3000/proyecto';

  console.log('Conexión exitosa a la base de datos');
}

module.exports = connect;
