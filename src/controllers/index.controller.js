const connection = require('../dbConnection/connection');

const controller = {};

controller.index = async (req, res) => {
  try {
    const title = 'Hola';
    await connection();
    console.log('CONNECTION OK');
    res.render('index', { title });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error de servidor');
  }
};

module.exports = controller;
