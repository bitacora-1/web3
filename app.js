const socket = io("http://localhost:3000"); // cambia si tu servidor está remoto
const connectButton = document.getElementById("connectButton");
const chatBox = document.getElementById("chatBox");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

let userAccount = null;

// Conectar wallet
async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      userAccount = accounts[0];
      connectButton.textContent = "Conectado: " + userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
      chatBox.style.display = "flex";
    } catch (error) {
      console.error(error);
      connectButton.textContent = "Error al conectar";
    }
  } else {
    connectButton.textContent = "MetaMask no detectado";
  }
}

// Mostrar mensaje en el chat
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.textContent = sender + ": " + text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Enviar mensaje
sendButton.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text !== "" && userAccount) {
    const msg = { sender: userAccount, text }; // dirección completa como nombre
    socket.emit("chatMessage", msg);
    messageInput.value = "";
  }
});

// Recibir mensajes de otros usuarios
socket.on("chatMessage", (msg) => {
  addMessage(msg.sender, msg.text);
});

connectButton.addEventListener("click", connectWallet);
