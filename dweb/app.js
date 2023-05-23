const express = require('express');
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;
app.use(cookieParser());


app.listen(port, () => {
  console.log(`Servidor en funcionamiento en http://localhost:${port}`);
});

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
// Middleware para verificar el token de autenticación
function verificarToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    console.log('No posee cookie de autenticación');
    res.redirect('p1_v2');
    return;
  }

  jwt.verify(token, 'secreto', (err, decoded) => {
    if (err) {
      console.log('Cookie de autenticación inválida');
      res.redirect('p1_v2');
      return
    }

    req.user = decoded;
    next();
  });
}
app.use(express.static(path.join(__dirname, 'views')));

const handlebars = exphbs.create({
  extname: '.html' // Especifica la extensión de archivo como .html
});
app.use(express.urlencoded({ extended: false }));

// Configuración de Handlebars como el motor de plantillas predeterminado
app.engine('.html', handlebars.engine);
app.set('view engine', '.html');
app.set('views', path.join(__dirname, 'views'));


// Conexión a MongoDB
mongoose
  .connect('mongodb+srv://nicolasfernandez3:sDIgB1T8esNDwMAm@dweb.gp4z7sq.mongodb.net/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Conexión exitosa a MongoDB');
  })
  .catch((error) => {
    console.error('Error al conectar a MongoDB:', error);
  });
// Define el esquema de la tabla `Cuenta`


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  saldo: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

const transferenciaSchema = new mongoose.Schema({
  movimiento: String,
  monto: Number,
  usuario: String,
  glosa: String,
});

const Transferencia = mongoose.model('Transferencia', transferenciaSchema);


// Ruta GET para la página de inicio
app.get('/', (req, res) => {
  res.send(`
    <h1>¡Bienvenido a mi aplicación!</h1>
    <a href="p1_v2">Ir a p1_v2</a>
  `);
});
// Rutas para las páginas p1_v2, p2_v2, p3_v2, p4_v2, p5_v2 y p6_v2
app.get('/p1_v2', (req, res) => {
  res.clearCookie('token');
  res.render('p1_v2');
});

// Rutas para p2_v2
app.get('/p2_v2', (req, res) => {
  res.clearCookie('token');
  res.render('p2_v2');
});

// Rutas para p3_v2
app.get('/p3_v2', (req, res) => {
  res.clearCookie('token');
  res.render('p3_v2');
});
// Ruta POST para realizar la transferencia
app.post('/transferencia', (req, res) => {
  const { usuario, monto, glosa, movimiento } = req.body;
  const token = req.cookies.token;

  if (!usuario || !monto || !glosa || !movimiento) {
    console.error('Faltan datos');
    res.render('p4_v2', { error: 'Faltan datos' });
    return;
  }

  const montoNum = Number(monto);

  if (isNaN(montoNum)) {
    console.error('El monto no es un número válido');
    res.render('p4_v2', { error: 'El monto no es válido' });
    return;
  }
  if (montoNum > 300000) {
    console.error('El monto excede el límite máximo de transferencia');
    res.render('p4_v2', { error: 'El monto excede el límite máximo de transferencia' });
    return;
  }

  new Promise((resolve, reject) => {
    jwt.verify(token, 'secreto', (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  })
    .then((decoded) => {
      const emailOrigen = decoded.email;
      const userId = decoded.userId;

      User.findById(userId)
        .then((currentUser) => {
          if (!currentUser) {
            console.error('No se encontró el usuario actual');
            res.render('p4_v2', { error: 'No se encontró el usuario' });
            return;
          }

          if (montoNum > currentUser.saldo) {
            console.error('El monto excede el saldo actual del usuario');
            res.render('p4_v2', { error: 'El monto excede el saldo actual del usuario' });
            return;
          }

          User.findOne({ email: usuario })
            .then((user) => {
              if (!user) {
                console.error('El correo de destino no existe');
                res.render('p4_v2', { error: 'El correo de destino no existe' });
                return;
              }

              const transferencia = new Transferencia({
                movimiento: movimiento,
                monto: montoNum,
                usuario: usuario,
                glosa: glosa
              });

              return transferencia.save();
            })
            .then(() => {
              console.log('Transferencia enviada');
              res.redirect('p5_v2');
            })
            .catch((error) => {
              console.error('Error al buscar el correo de destino:', error);
              res.render('p4_v2', { error: 'Error interno del servidor' });
            });
        })
        .catch((error) => {
          console.error('Error al obtener el saldo actual del usuario:', error);
          res.render('p4_v2', { error: 'Error interno del servidor' });
        });
    })
    .catch((err) => {
      console.error('Error al verificar el token:', err);
      res.render('p4_v2', { error: 'Error interno del servidor' });
    });
});

// Ruta POST para añadir saldo a una Cuenta
app.post('/add-saldo', verificarToken, (req, res) => {
  const { saldo } = req.body;
  const userId = req.user.userId;

  // Buscar al usuario en la base de datos
  User.findById(userId)
    .then((user) => {
      if (!user) {
        console.error('No se encontró el usuario');
        res.render('p6_v2', { error: 'No se encontró el usuario' });
        return;
      }

      // Añadir el saldo especificado al usuario
      const saldoAumentado = parseInt(saldo);
      user.saldo += saldoAumentado;
      return user.save();
    })
    .then((user) => {
      console.log('Saldo añadido al usuario:', user);

      // Redirigir a la página de éxito o mostrar un mensaje adecuado
      res.render('logueado', { message: 'Saldo añadido correctamente' });
    })
    .catch((error) => {
      console.error('Error al añadir saldo al usuario:', error);
      res.render('p6_v2', { error: 'Error interno del servidor' });
    });
});


// Ruta para p4_v2
app.get('/p4_v2', verificarToken, (req, res) => {
  if (req.user) {
    // Usuario autenticado, redirigir a p4_v2.html con el token en la URL
    const token = req.cookies.token;
    res.render('p4_v2', { token });
  } else {
    // Usuario no autenticado, redirigir a página de inicio de sesión
    res.redirect('p1_v2');
  }
});


// Ruta para p5_v2
app.get('/p5_v2', verificarToken, (req, res) => {
  if (req.user) {
    // Usuario autenticado, redirigir a p5_v2.html con el token en la URL
    const token = req.cookies.token;
    res.render('p5_v2', { token });
  } else {
    // Usuario no autenticado, redirigir a página de inicio de sesión
    res.redirect('p1_v2');
  }
});

// Ruta para p6_v2
app.get('/p6_v2', verificarToken, (req, res) => {
  if (req.user) {
    // Usuario autenticado, redirigir a p6_v2.html con el token en la URL
    const token = req.cookies.token;
    res.render('p6_v2', { token });
  } else {
    // Usuario no autenticado, redirigir a página de inicio de sesión
    res.redirect('p1_v2');
  }
});

app.get('/logueado', verificarToken, (req, res) => {
  if (req.user) {
    const token = req.cookies.token;
    // Usuario autenticado, renderizar logueado.html
    res.render('logueado', { token });
  } else {
    // Usuario no autenticado, redirigir a página de inicio de sesión
    res.redirect('p1_v2');
  }
});


app.get('/users', (req, res) => {
  User.find()
    .then((users) => {
      res.render('users', { users }); // Renderiza la plantilla 'users' y pasa los datos de los usuarios
    })
    .catch((error) => {
      console.error('Error al obtener usuarios:', error);
      res.status(500).send('Error al obtener usuarios');
    });
});

// Ruta GET para la página de inicio de sesión
// Ruta POST para el inicio de sesión
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.render('p3_v2', { error: 'Faltan datos' });
    return;
  }

  const query = { email: email, password: password };

  User.findOne(query)
    .then((user) => {
      if (!user) {
        res.render('p1_v2', { error: 'Credenciales inválidas' });
        return;
      }

      const token = generarToken(user);

      // Establecer la cookie con el token
      res.cookie('token', token, { maxAge: 3600000 }); // 1 hora de duración

      res.redirect(`logueado?token=${token}`); // Redirigir a la ruta de '/logueado'
    })
    .catch((error) => {
      console.error('Error al buscar usuario:', error);
      res.render('p1_v2', { error: 'Error interno del servidor' });
    });
});




// Ruta POST para el registro
app.post('/registro', async (req, res) => {
  const { nombre, apellido, correo, password } = req.body;

  if (!nombre || !apellido || !correo || !password) {
    res.render('p1_v2', { error: 'Faltan datos' });
    return;
  }

  try {
    // Verificar si el correo ya está registrado
    const existingUser = await User.exists({ email: correo });

    if (existingUser) {
      res.render('p1_v2', { error: 'Correo ya registrado' });
      return;
    }

    // Crear un nuevo usuario en la base de datos
    const newUser = new User({ name: nombre, email: correo, password });
await newUser.save();



    // Generar un token de sesión
    const token = generarToken(newUser);

    // Establecer la cookie con el token
    res.cookie('token', token, { maxAge: 3600000 }); // 1 hora de duración

    res.redirect('/p3_v2'); // Redirigir a la ruta de '/p3_v2'
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.render('p1_v2', { error: 'Error interno del servidor' });
  }
});
// Ruta POST para cerrar sesión
app.post('/logout', (req, res) => {
  // Eliminar la cookie de token
  res.clearCookie('token');

  // Redirigir al usuario a la página de inicio de sesión
  res.redirect('p1_v2');
});
