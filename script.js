const API_URL = "https://script.google.com/macros/s/AKfycbyMgSBqIry987HgseFbjM_JTP-hcLJ9ImzuNZi91Kj-WRHzAxHZimAzISpJ_keXxTh_/exec";

let user = JSON.parse(localStorage.getItem("user"));

loading();
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
  let jabatan = document.getElementById("jabatan").value;

  let role = (jabatan === "Supervisor" || jabatan === "HO")
    ? "admin"
    : "staff";

  let data = {
    nama: nama.value,
    nip: nip.value,
    jabatan: jabatan,
    password: pass.value,
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
function addItem() {
  api({
    action: "addItem",
    nama: item.value,
    satuan: satuan.value
  }).then(() => {
    alert("Item ditambah");
    renderItem();
  });
}

function deleteItem(nama) {
  api({ action: "deleteItem", nama }).then(() => {
    alert("Item dihapus");
    renderItem();
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
      <input id="password" type="password" placeholder="Password">
      <button onclick="login()">Login</button>
    </div>
  `;
}

function renderRegister() {
  document.getElementById("content").innerHTML = `
    <div class="card">
      <h3>Daftar</h3>

      <div class="input-group">
        <label>Nama</label>
        <input id="nama">
      </div>

      <div class="input-group">
        <label>NIP</label>
        <input id="nip">
      </div>

      <div class="input-group">
        <label>Jabatan</label>
        <select id="jabatan">
          <option>Leader</option>
          <option>Supervisor</option>
          <option>HO</option>
        </select>
      </div>

      <div class="input-group">
        <label>Password</label>
        <input id="pass" type="password">
      </div>

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

//==========DARK MODE=============
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
}

window.onload = function () {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
};

function loading(el="content") {
  document.getElementById(el).innerHTML = "Loading...";
}
