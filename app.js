const express = require('express');
const exphbs = require('express-handlebars');
const connection = require('./src/dbConnection/connection');
const authController = require('./src/controllers/authController');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const path = require('path');
const mongoose = require('mongoose');
const sessionId = uuid.v4();
const app = express();
var db = [];


// Generar un token JWT único para cada inicio de sesión
function generarToken(usuario) {
  const payload = {
    userId: usuario.id,
    sessionId: usuario.sessionId,
    // Otros datos adicionales que desees incluir en el token
  };

  const token = jwt.sign(payload, 'secreto', { expiresIn: '1h' });

  return token;
}

app.use(express.static(path.join(__dirname, 'public')));
const handlebars = exphbs.create({
  extname: '.hbs' // Especifica la extensión de archivo como .hbs
});
app.use(express.urlencoded({ extended: false }));

// Configuración de Handlebars como el motor de plantillas predeterminado
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');
app.set('views', path.resolve(__dirname, 'src', 'views'));
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});
const User = mongoose.model('User', userSchema);
// Ruta GET para mostrar el resultado
//app.get('/resultado', (req, res) => {
//  const datosFormulario = {
//    nombre: req.query.nombre,
//    email: req.query.email
//  };
//  res.render('resultado', { datosFormulario });
//});
app.get('/', (req, res) => {
  res.json(db);
});
// Rutas para las páginas p1_v2, p2_v2, p3_v2, p4_v2, p5_v2 y p6_v2
app.get('/p1_v2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'p1_v2.html'));
});
app.post('/p1_v2', (req, res) => {
  const { username, password } = req.body;

  // Realizar la verificación del usuario en la base de datos
  // Aquí deberías realizar la consulta a tu base de datos para verificar si el usuario existe y las credenciales son válidas
  if (verificarCredenciales(username, password)) {
    // Supongamos que la verificación fue exitosa y obtienes el ID del usuario y otros datos relacionados
    const userId = '1234';
    const email = 'example@example.com';
    const sessionId = uuid.v4();
    // Generar un token de sesión con información personal del usuario
    const token = jwt.sign({ userId, email, sessionId }, 'secreto', { expiresIn: '1h' });

    // Redirigir al usuario a la página principal con el token en la URL
    res.redirect(`/logueado?token=${token}`);
  } else {
    // Las credenciales son inválidas, redirigir al formulario de inicio de sesión con un mensaje de error
    res.redirect('/p1_v2?error=invalid_credentials');
  }
});
// Rutas para p1_v2


// Rutas para p2_v2
app.get('/p2_v2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'p2_v2.html'));
});

// Rutas para p3_v2
app.get('/p3_v2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'p3_v2.html'));
});

// Rutas para p4_v2
app.get('/p4_v2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'p4_v2.html'));
});

// Rutas para p5_v2
app.get('/p5_v2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'p5_v2.html'));
});

// Rutas para p6_v2
app.get('/p6_v2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'p6_v2.html'));
});


// Ruta GET para la página de inicio
app.get('/', (req, res) => {
  res.send(`
    <h1>¡Bienvenido a mi aplicación!</h1>
    <a href="/p1_v2">Ir a p1_v2</a>
  `);
});


//------------------------------------------------------------------------------------------------------------------------------
app.post('/registro', (req, res) => {
  const { user, pass, email, tarjeta } = req.body;
  if (user === undefined || pass === undefined || email === undefined || tarjeta === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.user === user);
  if (userExists) {
    res.status(400).json({
      message: 'El usuario ya existe'
    });
    return;
  }
  const emailExists = db.find((u) => u.email === email);
  if (emailExists) {
    res.status(400).json({
      message: 'El email ya existe'
    });
    return;
  }
  // regex for email
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!regex.test(email)) {
    res.status(400).json({
      message: 'El email no es válido'
    });
    return;
  }

  // regex for credit card
  //const regex2 = /^([0-9]{4}[-]){3}[0-9]{4}$/;
  //if (!regex2.test(tarjeta)) {
    //res.status(400).json({
      //message: 'La tarjeta no es válida'
  //});

  db.push({ user, pass, email, monto: 0, tarjeta, historial: []});
  res.json({
    message: 'Usuario registrado'
  });
});

app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === undefined || pass === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.user === user);
  if (!userExists) {
    res.status(400).json({
      message: 'El usuario no existe'
    });
    return;
  }
  if (userExists.pass !== pass) {
    res.status(400).json({
      message: 'La contraseña es incorrecta'
    });
    return;
  }
  res.json({
    message: 'Usuario logueado'
  });
});

app.post('/recarga', (req, res) => {
  const { monto, tarjeta } = req.body;
  if (monto === undefined || tarjeta === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.tarjeta === tarjeta);
  if (!userExists) {
    res.status(400).json({
      message: 'La tarjeta no existe'
    });
    return;
  }
  userExists.monto += monto;
  userExists.historial.push({
    movimiento: 'Recarga',
    monto: monto,
    usuario: '-',
    glosa: '-'
  });
  res.json({
    message: 'Recarga exitosa'
  });
});

app.post('/transferir', (req, res) => {
  const {user, mail, monto, glosa} = req.body;
  if (user === undefined || mail === undefined || monto === undefined || glosa === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.user === user);
  if (!userExists) {
    res.status(400).json({
      message: 'El usuario no existe'
    });
    return;
  }
  const emailExists = db.find((u) => u.email === mail);
  if (!emailExists) {
    res.status(400).json({
      message: 'El email no existe'
    });
    return;
  }
  if (userExists.monto < monto) {
    res.status(400).json({
      message: 'No tienes saldo suficiente'
    });
    return;
  }
  userExists.monto -= monto;
  emailExists.monto += monto;
  userExists.historial.push({
    movimiento: 'Envío dinero',
    monto: monto,
    usuario: emailExists.email,
    glosa: glosa
  });
  emailExists.historial.push({
    movimiento: 'Dinero recibido',
    monto: monto,
    usuario: userExists.email,
    glosa: glosa
  });
  res.json({
    message: 'Transferencia exitosa',
    glosa: glosa
  });

});











// Iniciar la conexión a la base de datos y luego iniciar el servidor
connection()
  .then(() => {
    app.listen(3000, () => {
      console.log('Servidor iniciado en http://localhost:3000');
    });
  })
  .catch((err) => {
    console.error('Error al conectar a la base de datos:', err);
  });
