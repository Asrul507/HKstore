const API_URL = "https://script.google.com/macros/s/AKfycbyMgSBqIry987HgseFbjM_JTP-hcLJ9ImzuNZi91Kj-WRHzAxHZimAzISpJ_keXxTh_/exec";

let user = JSON.parse(localStorage.getItem("user"));

// ================= API =================
function api(data) {
  return fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(data)
  }).then(res => res.json());
}

// ================= LOGIN =================
function login() {
  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  api({ action: "login", username, password }).then(res => {
    if (res.status === "success") {
      user = res;
      localStorage.setItem("user", JSON.stringify(res));
      renderMenu();
      renderBinCard();
    } else {
      alert("Login gagal");
    }
  });
}

// ================= REGISTER =================
function register() {
  let data = {
    nama: document.getElementById("nama").value,
    nip: document.getElementById("nip").value,
    jabatan: document.getElementById("jabatan").value,
    password: document.getElementById("pass").value
  };

  api({ action: "register", ...data }).then(res => {
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
  let data = {
    item: document.getElementById("item").value,
    qty: document.getElementById("qty").value,
    tipe: document.getElementById("tipe").value,
    user: user.nama
  };

  api({ action: "saveBinCard", ...data }).then(() => {
    alert("Berhasil disimpan");
    renderBinCard();
  });
}

// ================= ITEM =================
function renderItem() {
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
      <button onclick="changePassword()">Ganti Password</button>
    </div>
  `;
}

// ================= USER MANAGEMENT =================
function renderUserManagement() {
  api({ action: "getUsers" }).then(users => {

    let html = `<div class="card"><h3>User Management</h3>`;

    html += users.map(u => `<div>${u[0]} (${u[1]})</div>`).join("");

    html += `</div>`;

    document.getElementById("content").innerHTML = html;
  });
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("user");
  user = null;
  renderMenu();
  renderLogin();
}

// ================= NAV =================
function renderLogin() {
  document.getElementById("content").innerHTML = `
    <div class="card">
      <h3>Login</h3>
      <input id="username" placeholder="NIP">
      <input id="password" placeholder="password">
      <button onclick="login()">Login</button>
    </div>
  `;
}

function renderRegister() {
  document.getElementById("content").innerHTML = `
    <div class="card">
      <h3>Register</h3>
      <input id="nama">
      <input id="nip">
      <input id="jabatan">
      <input id="pass">
      <button onclick="register()">Daftar</button>
    </div>
  `;
}

// ================= SIDEBAR =================
window.toggleSidebar = function () {
  document.getElementById("sidebar").classList.toggle("show");
  document.getElementById("overlay").classList.toggle("show");
};

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  user ? renderBinCard() : renderLogin();
});
