let provider;
let signer;
let currentAccount;

const connectButton = document.getElementById("connectButton");
const sendButton = document.getElementById("sendButton");

connectButton.onclick = connectWallet;
sendButton.onclick = sendMatic;

async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    currentAccount = await signer.getAddress();

    document.getElementById("account").innerText = "Cuenta: " + currentAccount;

    // Mostrar saldo
    let balance = await provider.getBalance(currentAccount);
    document.getElementById("balance").innerText =
      "Saldo MATIC: " + ethers.utils.formatEther(balance);
  } else {
    alert("Instala MetaMask para continuar.");
  }
}

async function sendMatic() {
  if (!signer) return alert("Conecta la wallet primero.");

  const recipient = document.getElementById("recipient").value;
  const amount = document.getElementById("amount").value;

  try {
    const tx = await signer.sendTransaction({
      to: recipient,
      value: ethers.utils.parseEther(amount)
    });

    document.getElementById("history").innerHTML +=
      `<p>Enviado ${amount} MATIC a ${recipient}. TX: <a href="https://polygonscan.com/tx/${tx.hash}" target="_blank">${tx.hash}</a></p>`;
  } catch (err) {
    console.error(err);
    alert("Error al enviar transacción.");
  }
}
