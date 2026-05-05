const API_URL = "https://script.google.com/macros/s/AKfycbyMgSBqIry987HgseFbjM_JTP-hcLJ9ImzuNZi91Kj-WRHzAxHZimAzISpJ_keXxTh_/exec";

let user = JSON.parse(localStorage.getItem("user")) || null;

// ================= API =================
function api(data) {
  return fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(data)
  }).then(res => res.json());
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  renderMenu();

  if (user) {
    showApp();
    renderBinCard();
  } else {
    showLogin();
  }
});

// ================= PAGE CONTROL =================
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

  if (!username || !password) {
    alert("Isi username & password");
    return;
  }

  api({ action: "login", username, password }).then(res => {

    if (res.status === "success") {

      user = res;
      localStorage.setItem("user", JSON.stringify(res));

      showApp();
      renderMenu();
      renderBinCard();

    } else {
      alert("Login gagal");
    }
  });
}

// ================= REGISTER =================
function register() {

  let jabatan = document.getElementById("jabatan").value;

  let role = (jabatan === "Supervisor" || jabatan === "HO")
    ? "admin"
    : "staff";

  let data = {
    nama: document.getElementById("nama").value,
    nip: document.getElementById("nip").value,
    jabatan: jabatan,
    password: document.getElementById("pass").value,
    role: role
  };

  api({ action: "register", ...data }).then(() => {
    alert("Berhasil daftar");
    renderLogin();
  });
}

// ================= MENU =================
function renderMenu() {

  let html = "<h3>HK STORE</h3>";

  if (!user) {
    html += `<a onclick="renderLogin()">Login</a>`;
    html += `<a onclick="renderRegister()">Sign Up</a>`;
  } else {

    html += `<a onclick="renderBinCard()">Bin Card</a>`;
    html += `<a onclick="renderItem()">Item</a>`;
    html += `<a onclick="renderUser()">User</a>`;

    if (user.role === "admin") {
      html += `<a onclick="renderUserManagement()">User Management</a>`;
    }

    html += `<a onclick="logout()">Logout</a>`;
  }

  document.getElementById("sidebar").innerHTML = html;
  document.getElementById("userName").innerText = user ? user.nama : "";
}

// ================= BIN CARD =================
function renderBinCard() {

  loading();

  api({ action: "getItems" }).then(items => {

    let options = items.map(i => `<option>${i[0]}</option>`).join("");

    document.getElementById("content").innerHTML = `
      <div class="card">
        <h3>BIN CARD</h3>

        <select id="item">${options}</select>

        <input id="qty" type="number" placeholder="Qty">

        <select id="tipe">
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
        </select>

        <button onclick="submitBin()">Submit</button>
      </div>
    `;
  });
}

function submitBin() {
  api({
    action: "saveBinCard",
    item: document.getElementById("item").value,
    qty: document.getElementById("qty").value,
    tipe: document.getElementById("tipe").value,
    user: user.nama
  }).then(() => {
    alert("Berhasil disimpan");
    renderBinCard();
  });
}

// ================= ITEM =================
function renderItem() {

  loading();

  api({ action: "getItems" }).then(items => {

    let html = `<div class="card"><h3>Item</h3>`;

    html += items.map(i => `
      <div>${i[0]} (${i[1]})</div>
    `).join("");

    html += `</div>`;

    document.getElementById("content").innerHTML = html;
  });
}

// ================= USER =================
function renderUser() {

  document.getElementById("content").innerHTML = `
    <div class="card">
      <h3>User</h3>
      <p>${user.nama}</p>
    </div>
  `;
}

// ================= USER MANAGEMENT =================
function renderUserManagement() {

  loading();

  api({ action: "getUsers" }).then(users => {

    let html = `<div class="card"><h3>User Management</h3>`;

    html += users.map(u => `<div>${u[0]} (${u[1]})</div>`).join("");

    html += `</div>`;

    document.getElementById("content").innerHTML = html;
  });
}

// ================= REGISTER / LOGIN VIEW =================
function renderLogin() {
  document.getElementById("content").innerHTML = `
    <div class="card">
      <h3>Login</h3>
      <input id="username" placeholder="NIP">
      <input id="password" type="password" placeholder="Password">
      <button onclick="login()">Login</button>
    </div>
  `;
}

function renderRegister() {
  document.getElementById("content").innerHTML = `
    <div class="card">

      <h3>Daftar</h3>

      <input id="nama" placeholder="Nama">
      <input id="nip" placeholder="NIP">

      <select id="jabatan">
        <option>Leader</option>
        <option>Supervisor</option>
        <option>HO</option>
      </select>

      <input id="pass" type="password" placeholder="Password">

      <button onclick="register()">Daftar</button>
    </div>
  `;
}

// ================= SIDEBAR =================
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("show");
  document.getElementById("overlay").classList.toggle("show");
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("user");
  user = null;

  showLogin();
  renderMenu();
  renderLogin();
}

// ================= LOADING =================
function loading(el = "content") {
  document.getElementById(el).innerHTML = "Loading...";
}
/* ===== SHOW / HIDE LOADING ===== */
function showLoading() {
  document.getElementById("loading").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
}