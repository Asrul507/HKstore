const API_URL = "https://script.google.com/macros/s/AKfycbyi1UnqP29wrVCPYk0kGGWpAhAgBpfuWNKT6NrixWzjqxcGbSxXZuyYPmKPHkkxjkPB/exec";

let user = JSON.parse(localStorage.getItem("user")) || null;
let selectedType = "IN";

// ================= API =================
function api(data) {
  return fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(data)
  }).then(res => res.json());
}

function getCurrentMonth() {
  let d = new Date();
  return d.toISOString().slice(0,7);
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  renderMenu();
  renderBottomNav();

  if (user) {
    showApp();
    renderHome(); // 🔥 langsung home
    setActiveNav(0);
  } else {
    showLogin();
  }
});

// ================= PAGE =================
function showLogin() {
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("appPage").style.display = "none";
}

function showApp() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("appPage").style.display = "block";
}

// ================= LOGIN =================
function login(e) {

  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  if(!username || !password){
    showToast("Isi username & password","error");
    return;
  }

  showLoading();

  api({ action: "login", username, password }).then(res => {

    hideLoading();

    if (res.status === "success") {

      user = res;
      localStorage.setItem("user", JSON.stringify(res));

      showApp();
      renderMenu();
      renderBottomNav();

      renderHome(); // 🔥 langsung ke HOME
      setActiveNav(0);

      showToast("Login berhasil", "success");

    } else {
      showToast("Login gagal", "error");
    }
  });
}

// ================= MENU =================
function renderMenu() {

  let html = `<h3>HK STORE</h3>`;

  if (!user) {
    html += `<a onclick="renderLogin(); closeSidebar()">🔑 Login</a>`;
  } else {

    html += `<a onclick="renderHome()">🏠 Home</a>`;
    html += `<a onclick="renderItem()">📋 Item</a>`;
    html += `<a onclick="renderUser()">👤 User</a>`;

    if (user.role === "admin") {
      html += `<a onclick="renderUserManagement()">⚙️ User Management</a>`;
    }

    html += `<a onclick="logout()">🚪 Logout</a>`;
  }

  document.getElementById("sidebar").innerHTML = html;
  document.getElementById("userName").innerText = user?.nama || "";
}

// ================= BOTTOM NAV =================
function renderBottomNav() {
  document.getElementById("bottomNav").innerHTML = `
    <button onclick="setActiveNav(0); renderHome()">🏠<small>Home</small></button>
    <button onclick="setActiveNav(1); renderItem()">📋<small>Item</small></button>
    <button onclick="setActiveNav(2); renderUser()">👤<small>Profile</small></button>
  `;
}

// ================= HOME =================
function renderHome() {

  document.getElementById("content").innerHTML = `
    <div class="card">
      <h3>BIN CARD</h3>
      <div id="formArea"></div>
    </div>

    <div class="card">
      <h3>Stock Saat Ini</h3>
      <div id="dashboardArea"></div>
    </div>
  `;

  renderBinCard();
  loadDashboardToday();
}

// ================= BIN CARD =================
function renderBinCard() {

  loading("formArea");

  api({ action: "getItems" }).then(items => {

    let options = items.map(i => `
      <option value="${i[0]}" data-satuan="${i[1]}">${i[0]}</option>
    `).join("");

    document.getElementById("formArea").innerHTML = `
        <select id="item" onchange="setSatuan()">${options}</select>
        <input id="satuan" readonly>
        <input id="qty" type="number" placeholder="Qty">

        <div class="toggle-group">
          <button id="btnIn" class="active" onclick="setType('IN')">IN</button>
          <button id="btnOut" onclick="setType('OUT')">OUT</button>
        </div>

        <button onclick="submitBin(event)">Submit</button>
    `;

    setSatuan();
  });
}

function setSatuan() {
  let select = document.getElementById("item");
  let satuan = select.options[select.selectedIndex].dataset.satuan;
  document.getElementById("satuan").value = satuan;
}

function setType(type) {
  selectedType = type;

  document.getElementById("btnIn").classList.remove("active");
  document.getElementById("btnOut").classList.remove("active");

  if(type === "IN") document.getElementById("btnIn").classList.add("active");
  else document.getElementById("btnOut").classList.add("active");
}

function submitBin(e) {

  let qty = document.getElementById("qty").value;

  if(!qty){
    showToast("Qty kosong","error");
    return;
  }

  showLoading();

  api({
    action: "saveBinCard",
    item: document.getElementById("item").value,
    satuan: document.getElementById("satuan").value,
    qty: qty,
    tipe: selectedType,
    user: user.nama
  }).then(() => {

    hideLoading();

    document.getElementById("qty").value = "";

    showToast("Tersimpan", "success");

    loadDashboardToday(); // 🔥 AUTO REFRESH
  });
}

// ================= DASHBOARD =================
function loadDashboardToday() {

  let bulan = getCurrentMonth();

  loading("dashboardArea");

  api({
    action: "getDashboard",
    bulan: bulan
  }).then(data => {

    if (!data || data.length === 0) {
      document.getElementById("dashboardArea").innerHTML = "Belum ada data";
      return;
    }

    let html = data.map(d => `
      <div class="dash-row">
        <b>${d.item}</b>
        <span class="${d.stok < 0 ? 'minus':''}">${d.stok}</span>
      </div>
    `).join("");

    document.getElementById("dashboardArea").innerHTML = html;
  });
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("user");
  user = null;
  showLogin();
  renderMenu();
}

// ================= HELPER =================
function loading(el="content"){
  document.getElementById(el).innerHTML = "Loading...";
}

function showLoading(){
  document.getElementById("loading").style.display = "flex";
}

function hideLoading(){
  document.getElementById("loading").style.display = "none";
}

function showToast(msg,type="info"){
  let t=document.createElement("div");
  t.className="toast "+type;
  t.innerText=msg;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(()=>t.remove(),3000);
}
