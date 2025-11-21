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

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  // Cargar historial
  socket.on("loadHistorial", async () => {
    const snapshot = await db.collection("messages")
      .orderBy("timestamp", "asc")
      .get();

    const historial = snapshot.docs.map(doc => doc.data());
    socket.emit("historial", historial);
  });

  // Nuevo mensaje
  socket.on("mensaje", async (data) => {
    const payload = {
      text: data.text,
      user: data.user,
      photo: data.photo,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("messages").add(payload);

    io.emit("mensaje", payload);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
