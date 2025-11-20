const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');

if (!process.env.FIREBASE_CREDENTIALS) {
  console.error("FIREBASE_CREDENTIALS no definida");
  process.exit(1);
}

// Inicializar Firebase con credenciales
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
  databaseURL: 'https://chatcolabtech.firebaseio.com'
});

const app = express();
const server = http.createServer(app);

// Habilitar WebSocket con CORS para Firebase Hosting
const io = socketIo(server, {
  cors: {
    origin: "*", // Ideal: poner tu dominio Firebase cuando ya funcione
    methods: ["GET", "POST"]
  }
});

// Firestore
const db = admin.firestore();

app.get("/", (req, res) => {
  res.send("Servidor WebSocket activo");
});

// WebSocket
io.on('connection', (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on('mensaje', async (data) => {
    console.log("Mensaje recibido:", data);

    try {
      await db.collection('messages').add({
        text: data.text,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      io.emit('mensaje', data);
    } catch (err) {
      console.error("Error guardando mensaje:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log("Usuario desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Servidor WebSocket corriendo en puerto " + PORT);
});
