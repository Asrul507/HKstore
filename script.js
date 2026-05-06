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
  return new Date().toISOString().slice(0,7);
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  renderBottomNav();

  if (user) {
    showApp();
    renderHome();
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
function login() {

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
      renderHome();

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
    html += `<a onclick="showLogin()">Login</a>`;
  } else {

    html += `<a onclick="renderHome()">🏠 Home</a>`;
    html += `<a onclick="renderDashboard()">📊 Dashboard</a>`;
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
    <button onclick="renderHome()">🏠<small>Home</small></button>
    <button onclick="renderDashboard()">📊<small>Dash</small></button>
    <button onclick="renderItem()">📋<small>Item</small></button>
    <button onclick="renderUser()">👤<small>User</small></button>
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

  renderBinCardHome();
  loadDashboardToday();
}

// ================= BIN CARD =================
function renderBinCardHome() {

  api({ action: "getItems" }).then(items => {

    let options = items.map(i => `
      <option value="${i[0]}" data-satuan="${i[1]}">${i[0]}</option>
    `).join("");

    document.getElementById("formArea").innerHTML = `
      <select id="item" onchange="setSatuan()">${options}</select>
      <input id="satuan" readonly>
      <input id="qty" type="number" placeholder="Qty">

      <div class="toggle-group">
        <button onclick="setType('IN')">IN</button>
        <button onclick="setType('OUT')">OUT</button>
      </div>

      <button onclick="submitBin()">Submit</button>
    `;

    setSatuan();
  });
}

function setSatuan() {
  let s = document.getElementById("item");
  let satuan = s.options[s.selectedIndex].dataset.satuan;
  document.getElementById("satuan").value = satuan;
}

function setType(type){
  selectedType = type;
}

function submitBin() {

  let qty = document.getElementById("qty").value;

  if(!qty){
    showToast("Qty kosong","error");
    return;
  }

  showLoading();

  api({
    action:"saveBinCard",
    item: item.value,
    satuan: satuan.value,
    qty,
    tipe: selectedType,
    user: user.nama
  }).then(()=>{
    hideLoading();
    document.getElementById("qty").value="";
    showToast("Tersimpan","success");
    loadDashboardToday();
  });
}

// ================= DASHBOARD =================
function renderDashboard() {

  let currentMonth = getCurrentMonth();

  document.getElementById("content").innerHTML = `
    <div class="card">
      <h3>Dashboard</h3>
      <input type="month" id="filterBulan" value="${currentMonth}">
      <button onclick="loadDashboard()">Tampilkan</button>
      <div id="dashboardData"></div>
    </div>
  `;

  loadDashboard();
}

function loadDashboard() {

  let bulan = document.getElementById("filterBulan").value;

  loading("dashboardData");

  api({ action:"getDashboard", bulan }).then(data=>{

    if(!data || data.length===0){
      dashboardData.innerHTML="Tidak ada data";
      return;
    }

    dashboardData.innerHTML = data.map(d=>`
      <div class="dash-row">
        <b>${d.item}</b>
        <span>${d.stok}</span>
      </div>
    `).join("");
  });
}

function loadDashboardToday() {

  let bulan = getCurrentMonth();

  api({ action:"getDashboard", bulan }).then(data=>{

    if(!data || data.length===0){
      dashboardArea.innerHTML="Belum ada data";
      return;
    }

    dashboardArea.innerHTML = data.map(d=>`
      <div class="dash-row">
        <b>${d.item}</b>
        <span>${d.stok}</span>
      </div>
    `).join("");
  });
}

// ================= ITEM =================
function renderItem(){

  loading();

  api({ action:"getItems" }).then(items=>{

    let html = `
      <div class="card">
        <h3>Item</h3>
        <button onclick="showAddItem()">+ Tambah</button>
    `;

    html += items.map(i=>`
      <div class="dash-row">
        <b>${i[0]}</b>
        <span>${i[1]}</span>
      </div>
    `).join("");

    html += `</div>`;

    content.innerHTML = html;
  });
}

// ================= USER =================
function renderUser(){
  content.innerHTML = `
    <div class="card">
      <h3>${user?.nama}</h3>
    </div>
  `;
}

// ================= USER MANAGEMENT =================
function renderUserManagement(){
  content.innerHTML = `<div class="card">User Management</div>`;
}

// ================= LOGOUT =================
function logout(){
  localStorage.removeItem("user");
  user=null;
  showLogin();
  renderMenu();
}

// ================= UTIL =================
function loading(el="content"){
  document.getElementById(el).innerHTML = `
    <div style="text-align:center">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;
}

function showLoading(){
  document.getElementById("loading").style.display="flex";
}

function hideLoading(){
  document.getElementById("loading").style.display="none";
}

function showToast(msg,type="info"){
  let t=document.createElement("div");
  t.className=`toast ${type}`;
  t.innerText=msg;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(()=>t.remove(),3000);
}
