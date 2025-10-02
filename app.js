/* app.js
   - Multi-red compact dashboard
   - Usa ethers (UMD). Asegurate de que index.html cargue ethers.umd.min.js antes.
   - Para enviar tx en otra red MetaMask pedirá cambiar la red (wallet_switchEthereumChain).
*/

/* --- CONFIG: redes y tokens --- 
   Agrega/edita redes y tokens según necesites. Cada token tiene address y decimals.
*/
const networks = [
  {
    key: "ethereum",
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    rpc: "https://cloudflare-eth.com",
    nativeSymbol: "ETH",
    tokens: [ // tokens to display (example)
      { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 }
    ]
  },
  {
    key: "polygon",
    chainId: "0x89",
    chainName: "Polygon Mainnet",
    rpc: "https://polygon-rpc.com",
    nativeSymbol: "MATIC",
    tokens: [
      { symbol: "USDC", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6 },
      { symbol: "USDT", address: "0x3813e82e6f7098b9583FC0F33a962D02018B6803", decimals: 6 } // example polygon usdt (replace if you want official)
    ]
  },
  {
    key: "mumbai",
    chainId: "0x13881",
    chainName: "Polygon Mumbai",
    rpc: "https://rpc-mumbai.maticvigil.com",
    nativeSymbol: "MATIC",
    tokens: []
  }
];

/* Minimal ERC20 ABI */
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

/* --- Estado --- */
let provider;         // ethers provider from MetaMask (Web3Provider)
let signer;           // current signer (MetaMask)
let account = null;
let activeNetworkKey = networks[0].key; // UI selected network

/* --- DOM --- */
const connectBtn = document.getElementById("connectBtn");
const accountLabel = document.getElementById("accountLabel");
const networksList = document.getElementById("networksList");
const grids = document.getElementById("grids");
const refreshBtn = document.getElementById("refreshBtn");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalNetwork = document.getElementById("modalNetwork");
const modalType = document.getElementById("modalType");
const modalToken = document.getElementById("modalToken");
const tokenSelectLabel = document.getElementById("tokenSelectLabel");
const modalTo = document.getElementById("modalTo");
const modalAmount = document.getElementById("modalAmount");
const modalSend = document.getElementById("modalSend");
const modalClose = document.getElementById("modalClose");
const modalStatus = document.getElementById("modalStatus");

const transferBtn = document.getElementById("transferBtn");
const swapBtn = document.getElementById("swapBtn");
const bridgeBtn = document.getElementById("bridgeBtn");

/* --- Inicialización UI --- */
function initUI(){
  // redes en el left panel
  networksList.innerHTML = "";
  networks.forEach(n=>{
    const div = document.createElement("div");
    div.className = "netCard " + (n.key === activeNetworkKey ? "active" : "");
    div.id = "net_"+n.key;
    div.innerHTML = `<div class="title">${n.chainName}</div><small>${n.nativeSymbol}</small>`;
    div.onclick = ()=>{ activeNetworkKey = n.key; document.querySelectorAll(".netCard").forEach(x=>x.classList.remove("active")); div.classList.add("active"); renderGrids(); };
    networksList.appendChild(div);
  });

  // modal network select and tokens
  modalNetwork.innerHTML = networks.map(n=>`<option value="${n.key}">${n.chainName}</option>`).join("");
  populateModalTokens();
}

/* --- populate token select in modal --- */
function populateModalTokens(){
  const key = modalNetwork.value;
  const net = networks.find(x=>x.key===key);
  modalToken.innerHTML = "";
  if(!net) return;
  if(net.tokens.length===0){ tokenSelectLabel.classList.add("hidden"); }
  else {
    tokenSelectLabel.classList.remove("hidden");
    net.tokens.forEach(t=>{
      const opt = document.createElement("option");
      opt.value = JSON.stringify({net:key,addr:t.address,dec:t.decimals});
      opt.textContent = t.symbol + " ("+t.address.slice(0,6)+"...)";
      modalToken.appendChild(opt);
    });
  }
}

/* --- Render compact grids for each network --- */
async function renderGrids(){
  grids.innerHTML = "";
  if(!account) { grids.innerHTML = `<p class="status">Conecta la wallet para ver datos.</p>`; return; }

  for(const net of networks){
    const card = document.createElement("div");
    card.className = "gridCard";
    card.id = "grid_"+net.key;
    card.innerHTML = `<div class="gridHeader"><h3>${net.chainName}</h3><div class="muted">${net.nativeSymbol}</div></div>
      <div class="cells" id="cells_${net.key}">
        <div class="cellRow"><div class="cell tokenName">Activo</div><div class="cell">Balance</div><div class="cell">Acción</div></div>
        <div class="cellRow"><div class="cell">Nativo (${net.nativeSymbol})</div><div class="cell" id="native_${net.key}">...</div><div class="cell small">—</div></div>
      </div>`;
    grids.appendChild(card);

    // fetch balances async
    fetchNetworkBalances(net);
  }
}

/* --- fetch native + token balances for a network --- */
async function fetchNetworkBalances(net){
  const rpcProvider = new ethers.providers.JsonRpcProvider(net.rpc);
  // native balance
  try {
    const bal = await rpcProvider.getBalance(account);
    const formatted = ethers.utils.formatEther(bal);
    const nativeEl = document.getElementById("native_"+net.key);
    nativeEl.textContent = `${parseFloat(formatted).toFixed(6)} ${net.nativeSymbol}`;
  } catch(e){
    document.getElementById("native_"+net.key).textContent = "err";
    console.error("getBalance", net.key, e);
  }

  // tokens
  const cells = document.getElementById("cells_"+net.key);
  for(const t of net.tokens){
    try {
      const token = new ethers.Contract(t.address, ERC20_ABI, rpcProvider);
      const bn = await token.balanceOf(account);
      const value = ethers.utils.formatUnits(bn, t.decimals);
      const row = document.createElement("div");
      row.className = "cellRow";
      row.innerHTML = `<div class="cell tokenName">${t.symbol}</div>
                       <div class="cell">${(+value).toFixed(6)}</div>
                       <div class="cell small">—</div>`;
      cells.appendChild(row);
    } catch(err){
      console.error("token balance", t, err);
    }
  }
}

/* --- Wallet connect --- */
async function connectWallet(){
  if(!window.ethereum) return alert("Instala MetaMask");

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    account = await signer.getAddress();
    accountLabel.textContent = `Cuenta: ${account}`;
    connectBtn.textContent = "Conectado";
    renderGrids();
  } catch(e){
    console.error(e);
    alert("Error al conectar");
  }
}

/* --- Utility: switch network in MetaMask (chainId hex e.g. 0x89) --- */
async function ensureWalletOnChain(chainIdHex){
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }]});
    return true;
  } catch(switchError){
    // 4902: chain not added
    if(switchError.code === 4902){
      // Attempt to add chain (simple example for polygon)
      const net = networks.find(n=>n.chainId===chainIdHex);
      if(!net) throw switchError;
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: net.chainId,
            chainName: net.chainName,
            rpcUrls: [net.rpc],
            nativeCurrency: { name: net.nativeSymbol, symbol: net.nativeSymbol, decimals: 18 },
            blockExplorerUrls: net.chainId === "0x89" ? ["https://polygonscan.com"] : []
          }]
        });
        return true;
      } catch(addErr){
        console.error("add chain err", addErr);
        throw addErr;
      }
    } else {
      throw switchError;
    }
  }
}

/* --- Transfer native or ERC20 --- */
async function sendFromModal(){
  const netKey = modalNetwork.value;
  const net = networks.find(n=>n.key===netKey);
  const type = modalType.value;
  const to = modalTo.value.trim();
  const amount = modalAmount.value.trim();

  if(!ethers.utils.isAddress(to)) return modalStatus.innerText = "Dirección inválida";

  modalStatus.innerText = "Preparando transacción...";
  try {
    // ensure wallet on chain
    await ensureWalletOnChain(net.chainId);

    // Recreate provider/signer on the target chain (MetaMask exposes same signer; switching network is enough)
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    if(type === "native"){
      const tx = await signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(amount)
      });
      modalStatus.innerHTML = `Enviada: <a href="https://${net.key==='polygon' ? 'polygonscan.com' : 'etherscan.io'}/tx/${tx.hash}" target="_blank">${tx.hash}</a>`;
    } else {
      // token selected
      const sel = JSON.parse(modalToken.value);
      const tokenAddr = sel.addr;
      const decimals = sel.dec;
      const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
      const bnAmount = ethers.utils.parseUnits(amount, decimals);
      const tx = await tokenContract.transfer(to, bnAmount);
      modalStatus.innerHTML = `Enviada token: <a href="https://${net.key==='polygon' ? 'polygonscan.com' : 'etherscan.io'}/tx/${tx.hash}" target="_blank">${tx.hash}</a>`;
    }
  } catch(err){
    console.error(err);
    modalStatus.innerText = "Error: " + (err && err.message ? err.message : err);
  }
}

/* --- Modal control --- */
function openModal(){
  modal.classList.remove("hidden");
  modalStatus.innerText = "";
  populateModalTokens();
}
function closeModal(){ modal.classList.add("hidden"); }

/* --- Swap & Bridge buttons (abren UIs externas) --- */
function openSwap(){
  // ejemplo: quickswap swap url para polygon token (no es estándar universal)
  const url = "https://quickswap.exchange/#/swap";
  window.open(url, "_blank");
}
function openBridge(){
  // ejemplo: polygon bridge
  const url = "https://wallet.polygon.technology/bridge";
  window.open(url, "_blank");
}

/* --- bind events --- */
connectBtn.onclick = connectWallet;
refreshBtn.onclick = ()=>{ if(account) renderGrids(); };
transferBtn.onclick = ()=>{ if(!account) return alert("Conecta wallet"); openModal(); };
modalClose.onclick = closeModal;
modalNetwork.onchange = populateModalTokens;
modalType.onchange = ()=> {
  if(modalType.value === "token") tokenSelectLabel.classList.remove("hidden");
  else tokenSelectLabel.classList.add("hidden");
};
modalSend.onclick = sendFromModal;

swapBtn.onclick = openSwap;
bridgeBtn.onclick = openBridge;

/* --- start --- */
initUI();
renderGrids();
