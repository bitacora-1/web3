// Firebase configuration (reemplaza con tu proyecto)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://TU_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const connectButton = document.getElementById("connectButton");
const chatBox = document.getElementById("chatBox");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

let userAccount = null;

// Conectar Wallet
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

// Mostrar mensaje
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
  if (text && userAccount) {
    const msg = { sender: userAccount, text };
    db.ref("chat").push(msg);
    messageInput.value = "";
  }
});

// Escuchar nuevos mensajes
db.ref("chat").on("child_added", snapshot => {
  const msg = snapshot.val();
  addMessage(msg.sender, msg.text);
});

connectButton.addEventListener("click", connectWallet);
