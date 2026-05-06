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
  loginPage.style.display = "flex";
  appPage.style.display = "none";
}

function showApp() {
  loginPage.style.display = "none";
  appPage.style.display = "block";
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

  sidebar.innerHTML = html;
  userName.innerText = user?.nama || "";
}

// ================= BOTTOM NAV =================
function renderBottomNav() {
  bottomNav.innerHTML = `
    <button onclick="renderHome()">🏠<small>Home</small></button>
    <button onclick="renderDashboard()">📊<small>Dash</small></button>
    <button onclick="renderItem()">📋<small>Item</small></button>
    <button onclick="renderUser()">👤<small>User</small></button>
  `;
}

// ================= HOME =================
function renderHome() {

  content.innerHTML = `
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

    formArea.innerHTML = `
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

  content.innerHTML = `
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

// ================= ITEM CRUD =================
function renderItem(){

  loading();

  api({ action:"getItems" }).then(items=>{

    let html = `
      <div class="card">
        <h3>Item</h3>
        <button onclick="showAddItem()">+ Tambah Item</button>
    `;

    html += items.map(i=>`
      <div class="item-card">
        <b>${i[0]}</b> (${i[1]})
        <button onclick="editItem('${i[0]}','${i[1]}')">✏️</button>
        <button onclick="deleteItem('${i[0]}')">🗑️</button>
      </div>
    `).join("");

    html += `</div>`;

    content.innerHTML = html;
  });
}

function showAddItem(){
  content.innerHTML = `
    <div class="card">
      <input id="itemNama" placeholder="Nama">
      <input id="itemSatuan" placeholder="Satuan">
      <button onclick="addItem()">Simpan</button>
      <button onclick="renderItem()">Kembali</button>
    </div>
  `;
}

function addItem(){
  api({
    action:"addItem",
    nama:itemNama.value,
    satuan:itemSatuan.value
  }).then(()=>{
    showToast("Berhasil","success");
    renderItem();
  });
}

function editItem(oldNama,satuan){
  content.innerHTML = `
    <div class="card">
      <input id="itemNama" value="${oldNama}">
      <input id="itemSatuan" value="${satuan}">
      <button onclick="updateItem('${oldNama}')">Update</button>
    </div>
  `;
}

function updateItem(oldNama){
  api({
    action:"updateItem",
    oldNama,
    nama:itemNama.value,
    satuan:itemSatuan.value
  }).then(()=>{
    showToast("Update berhasil","success");
    renderItem();
  });
}

function deleteItem(nama){
  if(!confirm("Hapus?")) return;

  api({ action:"deleteItem", nama }).then(()=>{
    showToast("Dihapus","success");
    renderItem();
  });
}

// ================= USER =================
function renderUser(){
  content.innerHTML = `
    <div class="card">
      <h3>${user.nama}</h3>
      <p>${user.role}</p>
    </div>
  `;
}

// ================= USER MANAGEMENT =================
function renderUserManagement(){

  api({ action:"getUsers" }).then(users=>{

    let html = `
      <div class="card">
        <h3>User Management</h3>
        <button onclick="showAddUser()">+ Tambah</button>
    `;

    html += users.map(u=>`
      <div class="user-card">
        ${u[0]} (${u[1]})
        <button onclick="deleteUser('${u[1]}')">🗑️</button>
      </div>
    `).join("");

    html += `</div>`;

    content.innerHTML = html;
  });
}

function showAddUser(){
  content.innerHTML = `
    <div class="card">
      <input id="nama" placeholder="Nama">
      <input id="nip" placeholder="NIP">
      <select id="jabatan">
        <option>Leader</option>
        <option>Supervisor</option>
        <option>HO</option>
      </select>
      <input id="password" placeholder="Password">
      <button onclick="addUser()">Simpan</button>
    </div>
  `;
}

function addUser(){

  let jabatan = document.getElementById("jabatan").value;

  let role = (jabatan === "Supervisor" || jabatan === "HO") ? "admin" : "staff";

  api({
    action:"register",
    nama:nama.value,
    nip:nip.value,
    jabatan,
    password:password.value,
    role
  }).then(()=>{
    showToast("User ditambah","success");
    renderUserManagement();
  });
}

function deleteUser(nip){
  api({ action:"deleteUser", nip }).then(()=>{
    showToast("User dihapus","success");
    renderUserManagement();
  });
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
  document.getElementById(el).innerHTML = `<div class="spinner"></div>`;
}

function showLoading(){
  loading.style.display="flex";
}

function hideLoading(){
  loading.style.display="none";
}

function showToast(msg,type="info"){
  let t=document.createElement("div");
  t.className=`toast ${type}`;
  t.innerText=msg;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(()=>t.remove(),3000);
}
