// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuración de CORS
app.use(cors());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Configuración de Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Variable para guardar usuarios conectados
let users = {};

// Ruta para subir archivos
app.post('/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    res.json({ 
      success: true, 
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype
    });
  } else {
    res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
  }
});

// Servir archivos subidos (para que el frontend pueda verlos/descargarlos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión de Socket.io
io.on('connection', (socket) => {
  console.log('Un usuario se conectó:', socket.id);

  // Cuando un usuario se registra (login)
  socket.on('register', (username) => {
    users[socket.id] = username;
    // Enviar lista de usuarios a todos
    io.emit('userList', Object.values(users));
    console.log(`${username} se unió al chat`);
  });

  // Cuando un usuario envía un mensaje de texto
  socket.on('chatMessage', (data) => {
    const username = users[socket.id];
    io.emit('chatMessage', {
      username: username,
      message: data.message,
      time: new Date().toLocaleTimeString()
    });
  });

  // Cuando un usuario envía un archivo
  socket.on('sendFile', (data) => {
    const username = users[socket.id];
    io.emit('receiveFile', {
      username: username,
      filename: data.filename,
      originalname: data.originalname,
      mimetype: data.mimetype,
      time: new Date().toLocaleTimeString()
    });
  });

  // Cuando un usuario se desconecta
  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      console.log(`${username} se desconectó`);
      delete users[socket.id];
      io.emit('userList', Object.values(users));
    }
  });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});