const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
  databaseURL: 'https://chatcolabtech.firebaseio.com'
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*"
  }
});

const db = admin.firestore();

// Servir frontend desde /public
app.use(express.static(path.join(__dirname, '../public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Usuario conectado');

  socket.on('mensaje', async (data) => {
    console.log('Mensaje recibido:', data);

    try {
      await db.collection('messages').add({
        text: data.text,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      io.emit('mensaje', data);
    } catch (error) {
      console.error('Error Firestore:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
