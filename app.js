const express = require('express');
const exphbs = require('express-handlebars');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));



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
    req.session.emailSesion = req.user.email;
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
  correoOrigen: String,
  fecha: { type: Date, default: Date.now }
});

const Transferencia = mongoose.model('Transferencia', transferenciaSchema);


function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return '';
}
function jwt_decode(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );
  return JSON.parse(jsonPayload);
}
app.use(session({
  secret: 'mi_secreto', // Cambia esto por una cadena secreta única para tu aplicación
  resave: false,
  saveUninitialized: true
}));
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
app.post('/transferencia', verificarToken, (req, res) => {
  const { usuario, monto, glosa } = req.body;
  const token = req.cookies.token;
  const emailSesion = req.session.emailSesion || '';

  if (!usuario || !monto || !glosa) {
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
              if (user.email === emailSesion) {
                console.error('No puedes transferir fondos a tu propia cuenta');
                res.render('p4_v2', { error: 'No puedes transferir fondos a tu propia cuenta' });
                return;
              }

              const transferencia = new Transferencia({
                movimiento: 'Transferencia',
                monto: montoNum,
                usuario: usuario,
                glosa: glosa,
                correoOrigen: emailSesion,
                fecha: Date.now()
              });

              transferencia.save()
                .then(() => {
                  console.log('Transferencia enviada', transferencia);
                  currentUser.saldo -= montoNum;
                  return currentUser.save();
                })
                .then(() => {
                  fs.readFile('transferencias.json', 'utf8', (err, jsonData) => {
                    if (err) {
                      console.error('Error al leer el archivo JSON:', err);
                      res.render('error', { message: 'Error interno del servidor' });
                      return;
                    }

                    try {
                      const transferencias = JSON.parse(jsonData);
                      transferencias.push({
                        movimiento: 'Transferencia',
                        monto: montoNum,
                        usuario: usuario,
                        correoOrigen: emailSesion,
                        glosa: glosa,
                        fecha: Date.now()
                      });

                      const updatedJsonData = JSON.stringify(transferencias);

                      fs.writeFile('transferencias.json', updatedJsonData, 'utf8', (err) => {
                        if (err) {
                          console.error('Error al escribir en el archivo JSON:', err);
                          res.render('error', { message: 'Error interno del servidor' });
                          return;
                        }

                        res.redirect('p5_v2');
                      });
                    } catch (parseError) {
                      console.error('Error al analizar el archivo JSON:', parseError);
                      res.render('error', { message: 'Error interno del servidor' });
                    }
                  });
                });
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

      // Crear un registro en la colección de transferencias para representar la recarga
      const transferencia = new Transferencia({
        movimiento: 'Recarga de saldo',
        monto: parseInt(saldo),
        usuario: user.email,
        glosa: '-',
        correoOrigen: user.email,
        fecha: Date.now()
      });

      return transferencia.save();
    })
    .then((transferencia) => {
      // Leer el archivo JSON y agregar la transferencia al arreglo
      const transferencias = JSON.parse(fs.readFileSync('transferencias.json'));
      transferencias.push(transferencia);

      // Guardar el arreglo actualizado en el archivo JSON
      const jsonData = JSON.stringify(transferencias);
      fs.writeFileSync('transferencias.json', jsonData);

      // Redirigir a la página de éxito o mostrar un mensaje adecuado
      res.render('logueado', { message: 'Saldo añadido correctamente' });
    })
    .catch((error) => {
      console.error('Error al añadir saldo al usuario:', error);
      res.render('p6_v2', { error: 'Error interno del servidor' });
    });
});

app.post('/retirar-saldo', verificarToken, (req, res) => {
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

      // Verificar si el saldo a retirar es válido
      const saldoRetirar = parseInt(saldo);
      if (saldoRetirar > user.saldo) {
        console.error('Saldo insuficiente');
        res.render('p6_v2', { error: 'Saldo insuficiente' });
        return;
      }

      // Restar el saldo especificado al usuario
      user.saldo -= saldoRetirar;
      return user.save();
    })
    .then((user) => {
      console.log('Saldo retirado del usuario:', user);

      // Crear un registro en la colección de transferencias para representar el retiro
      const transferencia = new Transferencia({
        movimiento: 'Retiro de saldo',
        monto: parseInt(saldo),
        usuario: user.email,
        glosa: '-',
        correoOrigen: user.email,
        fecha: Date.now()
      });

      return transferencia.save();
    })
    .then((transferencia) => {
      // Leer el archivo JSON y agregar la transferencia al arreglo
      const transferencias = JSON.parse(fs.readFileSync('transferencias.json'));
      transferencias.push(transferencia);

      // Guardar el arreglo actualizado en el archivo JSON
      const jsonData = JSON.stringify(transferencias);
      fs.writeFileSync('transferencias.json', jsonData);

      // Redirigir a la página de éxito o mostrar un mensaje adecuado
      res.render('logueado', { message: 'Saldo retirado correctamente' });
    })
    .catch((error) => {
      console.error('Error al retirar saldo del usuario:', error);
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
const jsonData = fs.readFileSync('transferencias.json');
const transferencias = JSON.parse(jsonData);

app.get('/p5_v2', verificarToken, (req, res) => {
  if (req.user) {
    const token = req.cookies.token;
    const emailSesion = req.session.emailSesion;

    // Leer transferencias.json y asignar a la variable transferencias
    fs.readFile('transferencias.json', 'utf8', (err, jsonData) => {
      if (err) {
        console.error('Error al leer el archivo JSON:', err);
        res.render('p5_v2', { token, transferencias: [] });
        return;
      }

      try {
        const transferencias = JSON.parse(jsonData);
        const transferenciasReducidas = transferencias.map(({ movimiento, monto, correoOrigen, glosa, usuario, fecha }) => {
          return { movimiento, monto, usuario, correoOrigen, glosa, fecha };
        });

        res.render('p5_v2', { token, transferencias: transferenciasReducidas }); // Renderiza la plantilla 'p5_v2.html' y pasa los datos de las transferencias
      } catch (parseError) {
        console.error('Error al analizar el archivo JSON:', parseError);
        res.render('p5_v2', { token, transferencias: [] });
      }
    });
  } else {
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
app.get('/p7_v2', verificarToken, (req, res) => {
  if (req.user) {
    // Usuario autenticado, redirigir a p6_v2.html con el token en la URL
    const token = req.cookies.token;
    res.render('p7_v2', { token });
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

      // Almacenar el email de la sesión iniciada en la variable global
      req.session.emailSesion = email;
      console.log('Inicio de sesion exitoso');
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
    console.log('Usuario registrado correctamente:',newUser)
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

  // Reiniciar la variable global del email de la sesión
  req.session.emailSesion = null;

  // Redirigir al usuario a la página de inicio de sesión
  res.redirect('p1_v2');
});
