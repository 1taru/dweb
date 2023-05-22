const express = require('express');
const exphbs = require('express-handlebars');
const jwt = require('jsonwebtoken');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

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
  });
  const User = mongoose.model('User', userSchema);
// Ruta GET para la página de inicio
app.get('/', (req, res) => {
  res.send(`
    <h1>¡Bienvenido a mi aplicación!</h1>
    <a href="p1_v2">Ir a p1_v2</a>
  `);
});
// Middleware para verificar el token de autenticación
function verificarToken(req, res, next) {
  const token = req.headers.authorization;
  console.log('Token recibido:', token);
  if (!token) {
    res.render('p1_v2.html', { error: 'Acceso no autorizado, inicie sesión' });
    return;
  }

  jwt.verify(token, 'secreto', (err, decoded) => {
    if (err) {
      res.render('p1_v2.html', { error: 'Acceso no autorizado, inicie sesión' });
      return;
    }

    req.user = decoded;
    next();
  });
}
// Rutas para las páginas p1_v2, p2_v2, p3_v2, p4_v2, p5_v2 y p6_v2
app.get('/logueado', (req, res) => {
  res.render('logueado.html');
});
app.get('/p1_v2', (req, res) => {
  res.render('p1_v2.html');
});

// Rutas para p2_v2
app.get('/p2_v2.html', (req, res) => {
  res.render('p2_v2.html');
});

// Rutas para p3_v2
app.get('/p3_v2.html', (req, res) => {
  res.render('p3_v2.html');
});

// Rutas para p4_v2
app.get('/p4_v2', verificarToken, (req, res) => {
  if (req.user) {
    // Usuario autenticado, realizar acciones correspondientes
    res.render('p4_v2.html');
  } else {
    // Usuario no autenticado, redirigir a página de inicio de sesión
    res.redirect('p1_v2.html');
  }
});

// Rutas para p5_v2
app.get('/p5_v2', verificarToken, (req, res) => {
  if (req.user) {
    // Usuario autenticado, realizar acciones correspondientes
    res.render('p5_v2.html');
  } else {
    // Usuario no autenticado, redirigir a página de inicio de sesión
    res.redirect('p1_v2.html');
  }
});

// Rutas para p6_v2
app.get('/p6_v2', verificarToken, (req, res) => {
  if (req.user) {
    // Usuario autenticado, realizar acciones correspondientes
    res.render('p6_v2.html');
  } else {
    // Usuario no autenticado, redirigir a página de inicio de sesión
    res.redirect('p1_v2.html');
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

  const query = { email: email, password: password };  // Agrega esta línea

  User.findOne(query)
    .then((user) => {
      if (!user) {
        res.render('p1_v2.html', { error: 'Credenciales inválidas' });
        return;
      }
      console.log('logueado');
      const token = generarToken(user);
      res.redirect(`logueado?token=${token}`);
    })
    .catch((error) => {
      console.error('Error al buscar usuario:', error);
      res.render('p1_v2.html', { error: 'Error interno del servidor' });
    });
});




// Ruta POST para el registro
app.post('/registro', async (req, res) => {
  const { nombre, apellido, correo, password } = req.body;

  if (!nombre || !apellido || !correo || !password) {
    res.render('p1_v2.html', { error: 'Faltan datos' });
    return;
  }

  try {
    // Verificar si el correo ya está registrado
    const existingUser = await User.exists({ email: correo });

    if (existingUser) {
      res.render('p1_v2.html', { error: 'Correo ya registrado' });
      return;
    }

    // Crear un nuevo usuario en la base de datos
    const newUser = new User({ name: nombre, email: correo, password });
    await newUser.save();

    // Generar un token de sesión
    res.redirect('p3_v2.html');
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.render('p1_v2.html', { error: 'Error interno del servidor' });
  }
});


