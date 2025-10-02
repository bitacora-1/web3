let provider;
let signer;
let account;

// Dirección USDT en Polygon (ejemplo mainnet)
const tokenAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; 
const tokenABI = [
  "function balanceOf(address) view returns (uint)",
  "function transfer(address to, uint amount) returns (bool)"
];

const connectButton = document.getElementById("connectButton");

async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    account = await signer.getAddress();
    document.getElementById("account").textContent = "Conectado: " + account;

    getBalances();
    loadHistory();
  } else {
    alert("Instala MetaMask para usar esta DApp.");
  }
}

async function getBalances() {
  const maticBalance = await provider.getBalance(account);
  document.getElementById("maticBalance").textContent =
    ethers.utils.formatEther(maticBalance);

  const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
  const tokenBalance = await tokenContract.balanceOf(account);
  document.getElementById("tokenBalance").textContent =
    ethers.utils.formatUnits(tokenBalance, 6); // USDT tiene 6 decimales
}

async function sendMatic() {
  const recipient = document.getElementById("recipient").value;
  const amount = document.getElementById("amount").value;

  try {
    const tx = await signer.sendTransaction({
      to: recipient,
      value: ethers.utils.parseEther(amount)
    });
    document.getElementById("txStatus").textContent = "Enviando... " + tx.hash;
    await tx.wait();
    document.getElementById("txStatus").textContent = "Confirmado ✔️";
    getBalances();
  } catch (err) {
    document.getElementById("txStatus").textContent = "Error: " + err.message;
  }
}

async function sendToken() {
  const recipient = document.getElementById("recipient").value;
  const amount = document.getElementById("amount").value;

  try {
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
    const tx = await tokenContract.transfer(
      recipient,
      ethers.utils.parseUnits(amount, 6)
    );
    document.getElementById("txStatus").textContent = "Enviando... " + tx.hash;
    await tx.wait();
    document.getElementById("txStatus").textContent = "Confirmado ✔️";
    getBalances();
  } catch (err) {
    document.getElementById("txStatus").textContent = "Error: " + err.message;
  }
}

// Historial simple (últimas transacciones de la cuenta)
async function loadHistory() {
  const history = await provider.getHistory(account, -100, "latest");
  const txList = document.getElementById("txHistory");
  txList.innerHTML = "";

  history.slice(-5).forEach(tx => {
    const li = document.createElement("li");
    li.textContent = `Hash: ${tx.hash} → To: ${tx.to} → Value: ${ethers.utils.formatEther(tx.value)} MATIC`;
    txList.appendChild(li);
  });
}

document.getElementById("sendMatic").addEventListener("click", sendMatic);
document.getElementById("sendToken").addEventListener("click", sendToken);
connectButton.addEventListener("click", connectWallet);
