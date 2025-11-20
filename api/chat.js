const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');

// Inicializar Firebase con las credenciales
admin.initializeApp({
  credential: admin.credential.cert(require('../firebase-credentials.json')), // Asegúrate de la ruta correcta
  databaseURL: 'https://chatcolabtech.firebaseio.com' // Cambia esto con tu ID de proyecto
});

// Crear el servidor express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Base de datos Firestore
const db = admin.firestore();

// Conexión WebSocket
io.on('connection', (socket) => {
  console.log('Usuario conectado');

  // Escuchar mensajes de los usuarios
  socket.on('mensaje', async (data) => {
    console.log('Mensaje recibido:', data);

    // Guardar mensaje en Firebase Firestore
    try {
      await db.collection('messages').add({
        text: data.text,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Emitir el mensaje a todos los usuarios conectados
      io.emit('mensaje', data);
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

// La exportación que espera Vercel
module.exports = (req, res) => {
  server.listen(3000, () => {
    console.log('Servidor WebSocket corriendo en el puerto 3000');
    res.send('Servidor WebSocket activo');
  });
};
