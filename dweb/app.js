const express = require('express');
const exphbs = require('express-handlebars');
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
  const token = req.cookies.token;

  if (!token) {
    console.log('No posee cookie de autenticación');
    res.redirect('p1_v2.html');
    return;
  }

  jwt.verify(token, 'secreto', (err, decoded) => {
    if (err) {
      console.log('Cookie de autenticación inválida');
      res.redirect('p1_v2.html');
      return;
    }

    req.user = decoded;
    next();
  });
}
// Rutas para las páginas p1_v2, p2_v2, p3_v2, p4_v2, p5_v2 y p6_v2

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

// Ruta para p4_v2
app.get('/p4_v2', verificarToken, (req, res) => {
  if (req.user) {
    // Usuario autenticado, redirigir a p4_v2.html con el token en la URL
    const token = req.cookies.token;
    res.redirect(`p4_v2.html?token=${token}`);
  } else {
    // Usuario no autenticado, redirigir a página de inicio de sesión
    res.redirect('p1_v2.html');
  }
});

// Ruta para p5_v2
app.get('/p5_v2', verificarToken, (req, res) => {
  if (req.user) {
    // Usuario autenticado, redirigir a p5_v2.html con el token en la URL
    const token = req.cookies.token;
    res.redirect(`p5_v2.html?token=${token}`);
  } else {
    // Usuario no autenticado, redirigir a página de inicio de sesión
    res.redirect('p1_v2.html');
  }
});

// Ruta para p6_v2
app.get('/p6_v2', verificarToken, (req, res) => {
  if (req.user) {
    // Usuario autenticado, redirigir a p6_v2.html con el token en la URL
    const token = req.cookies.token;
    res.redirect(`p6_v2.html?token=${token}`);
  } else {
    // Usuario no autenticado, redirigir a página de inicio de sesión
    res.redirect('p1_v2.html');
  }
});

app.get('/logueado', verificarToken, (req, res) => {
  if (req.user) {
    const token = req.cookies.token;
    // Usuario autenticado, renderizar logueado.html
    res.render('logueado.html', { token }); // Pasar el token como dato a la plantilla
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

  const query = { email: email, password: password };

  User.findOne(query)
    .then((user) => {
      if (!user) {
        res.render('p1_v2.html', { error: 'Credenciales inválidas' });
        return;
      }

      const token = generarToken(user);

      // Establecer la cookie con el token
      res.cookie('token', token, { maxAge: 3600000 }); // 1 hora de duración

      res.redirect('/logueado'); // Redirigir a la ruta de '/logueado'
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
    const token = generarToken(newUser);

    // Establecer la cookie con el token
    res.cookie('token', token, { maxAge: 3600000 }); // 1 hora de duración

    res.redirect('/p3_v2'); // Redirigir a la ruta de '/p3_v2'
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.render('p1_v2.html', { error: 'Error interno del servidor' });
  }
});
