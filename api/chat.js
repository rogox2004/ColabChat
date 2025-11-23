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

  // 🔹 1) Registrar usuario cuando se loguea en el frontend
  // El frontend debe hacer: socket.emit("registerUser", { displayName, email, photo });
  socket.on("registerUser", (user) => {
    socket.user = user; // Guardamos los datos del usuario en el socket
    console.log("Usuario autenticado en socket:", user.displayName);

    // Avisar a todos que este usuario entró
    io.emit("systemMessage", `${user.displayName} se ha unido al chat`);
  });

  // 🔹 2) Cargar historial desde Firestore
  socket.on("loadHistorial", async () => {
    try {
      const snapshot = await db
        .collection("messages")
        .orderBy("timestamp", "asc")
        .get();

      const historial = snapshot.docs.map(doc => doc.data());
      socket.emit("historial", historial);
    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  });

  // 🔹 3) Nuevo mensaje normal
  socket.on("mensaje", async (data) => {
    try {
      const payload = {
        text: data.text,
        user: data.user || (socket.user && socket.user.displayName) || "Anónimo",
        photo: data.photo || (socket.user && socket.user.photoURL) || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("messages").add(payload);

      // Enviamos el mensaje a todos los clientes
      io.emit("mensaje", payload);
    } catch (err) {
      console.error("Error guardando mensaje:", err);
    }
  });

  // 🔹 4) Cuando el usuario se desconecta
  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);

    if (socket.user && socket.user.displayName) {
      // Avisamos a todos que este usuario salió del chat
      io.emit("systemMessage", `${socket.user.displayName} ha salido del chat`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
