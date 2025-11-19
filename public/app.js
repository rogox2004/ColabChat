const socket = io();  // Conectar con el servidor WebSocket

// Obtener el DOM
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessage');
const messagesDiv = document.getElementById('messages');

// Mostrar el mensaje en el chat
function showMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.textContent = message.text;
  messagesDiv.appendChild(messageElement);
}

// Enviar mensaje cuando el usuario haga clic en el botón
sendMessageButton.addEventListener('click', () => {
  const messageText = messageInput.value;
  if (messageText.trim() !== '') {
    socket.emit('mensaje', { text: messageText });
    messageInput.value = ''; // Limpiar el campo de entrada
  }
});

// Escuchar nuevos mensajes y mostrarlos
socket.on('mensaje', (data) => {
  showMessage(data);
});

