let provider;
let signer;

const connectButton = document.getElementById("connectButton");
const accountDisplay = document.getElementById("account");
const balanceDisplay = document.getElementById("balance");
const sendButton = document.getElementById("sendButton");

async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      const address = await signer.getAddress();

      accountDisplay.textContent = "Cuenta: " + address;
      connectButton.textContent = "Conectado";

      const balance = await provider.getBalance(address);
      balanceDisplay.textContent = "Saldo MATIC: " + ethers.utils.formatEther(balance);
    } catch (err) {
      console.error(err);
      connectButton.textContent = "Error al conectar";
    }
  } else {
    alert("MetaMask no detectado");
  }
}

async function sendTransaction() {
  if (!signer) return;

  const recipient = document.getElementById("recipient").value;
  const amount = document.getElementById("amount").value;

  try {
    const tx = await signer.sendTransaction({
      to: recipient,
      value: ethers.utils.parseEther(amount)
    });

    document.getElementById("history").innerHTML +=
      `<p>Tx enviada: <a href="https://polygonscan.com/tx/${tx.hash}" target="_blank">${tx.hash}</a></p>`;
  } catch (err) {
    console.error(err);
    alert("Error al enviar transacción");
  }
}

connectButton.addEventListener("click", connectWallet);
sendButton.addEventListener("click", sendTransaction);
