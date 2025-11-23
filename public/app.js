// =========================
//  CONFIG FIREBASE
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyAX3ivNDEunC4qug4LVUMLpBgvLtp2t-uE",
  authDomain: "chatcolabtech.firebaseapp.com",
  projectId: "chatcolabtech",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

// =========================
//  SOCKET.IO
// =========================
const socket = io("https://colabchat-production.up.railway.app");

// =========================
//  DOM
// =========================
const loginBtn = document.getElementById("loginBtn");
const chatDiv = document.getElementById("chat");
const userPhoto = document.getElementById("userPhoto");
const userName = document.getElementById("userName");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessage");
const messagesDiv = document.getElementById("messages");

// =========================
//  Mostrar mensajes
// =========================
function showMessage(data) {
  const div = document.createElement("div");

  // Mensajes del sistema
  if (data.system) {
    div.style.color = "gray";
    div.style.fontStyle = "italic";
    div.textContent = data.text;
  } else {
    div.innerHTML = `<strong>${data.user}:</strong> ${data.text}`;
  }

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// =========================
//  Login con Google
// =========================
loginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      currentUser = result.user;

      userPhoto.src = currentUser.photoURL;
      userName.textContent = currentUser.displayName;

      loginBtn.style.display = "none";
      chatDiv.style.display = "block";

      // 🔹 Registrar usuario en el BACKEND (socket)
      socket.emit("registerUser", {
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL
      });

      // 🔹 cargar historial
      socket.emit("loadHistorial");
    })
    .catch(err => console.error("Error login:", err));
});

// =========================
//  Enviar mensaje
// =========================
sendMessageButton.addEventListener("click", () => {
  if (!currentUser) return alert("Inicia sesión primero");

  const text = messageInput.value;
  if (text.trim() === "") return;

  const data = {
    text,
    user: currentUser.displayName,
    photo: currentUser.photoURL
  };

  socket.emit("mensaje", data);
  messageInput.value = "";
});

// =========================
//  Recibir mensajes normales
// =========================
socket.on("mensaje", (data) => {
  showMessage(data);
});

// =========================
//  Recibir mensajes del sistema
// =========================
socket.on("systemMessage", (text) => {
  showMessage({ text, system: true });
});

// =========================
//  Cargar historial
// =========================
socket.on("historial", (mensajes) => {
  messagesDiv.innerHTML = "";
  mensajes.forEach(msg => showMessage(msg));
});
