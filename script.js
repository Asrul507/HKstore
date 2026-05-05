// ================= CONFIG =================
const API_URL = "https://script.google.com/macros/s/AKfycbyMgSBqIry987HgseFbjM_JTP-hcLJ9ImzuNZi91Kj-WRHzAxHZimAzISpJ_keXxTh_/exec";

// ================= STATE =================
const AppState = {
  user: JSON.parse(localStorage.getItem("user")) || null
};

// ================= UTIL =================
const Util = {
  setUser(data) {
    AppState.user = data;
    localStorage.setItem("user", JSON.stringify(data));
  },

  clearUser() {
    AppState.user = null;
    localStorage.removeItem("user");
  }
};

// ================= UI =================
const UI = {

  toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("show");
    document.getElementById("overlay").classList.toggle("show");
  },

  showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  },

  showLoading() {
    document.getElementById("content").innerHTML =
      `<div class="card"><div class="loader"></div></div>`;
  },

  setUserInfo() {
    const el = document.getElementById("userName");
    el.innerText = AppState.user
      ? `${AppState.user.nama} (${AppState.user.role})`
      : "";
  }
};

// ================= THEME =================
const Theme = {
  toggle() {
    document.body.classList.toggle("dark");
    localStorage.setItem("dark", document.body.classList.contains("dark"));
  },

  init() {
    if (localStorage.getItem("dark") === "true") {
      document.body.classList.add("dark");
    }
  }
};

// ================= API =================
const API = {

  post(data) {
    return fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(data)
    }).then(res => res.json());
  },

  login(username, password) {
    return this.post({ action: "login", username, password });
  },

  register(data) {
    return this.post({ action: "register", ...data });
  },

  // ===== ITEM =====
  getItems() {
    return this.post({ action: "getItems" });
  },

  addItem(data) {
    return this.post({ action: "addItem", ...data });
  },

  updateItem(data) {
    return this.post({ action: "updateItem", ...data });
  },

  deleteItem(nama) {
    return this.post({ action: "deleteItem", nama });
  }
};

// ================= RENDER =================
const Render = {

  // ===== MENU =====
  menu() {
    let menu = "<h2>HK STORE</h2>";

    if (!AppState.user) {
      menu += `
        <a onclick="Render.login()">Login</a>
        <a onclick="Render.signup()">Sign Up</a>
      `;
    } else {
      menu += `
        <a onclick="Render.dashboard()">Dashboard</a>
        <a onclick="Render.item()">Item</a>
      `;

      menu += `<a onclick="Auth.logout()">Logout</a>`;
    }

    document.getElementById("sidebar").innerHTML = menu;
    UI.setUserInfo();
  },

  // ===== LOGIN =====
  login() {
    document.getElementById("content").innerHTML = `
      <div class="card">
        <h3>Login</h3>
        <input id="username" placeholder="Username">
        <input id="password" type="password" placeholder="Password">
        <button onclick="Auth.login()">Login</button>
      </div>
    `;
  },

  // ===== SIGNUP =====
  signup() {
    document.getElementById("content").innerHTML = `
      <div class="card">
        <h3>Register</h3>
        <input id="nama" placeholder="Nama">
        <input id="nip" placeholder="NIP">
        <input id="jabatan" placeholder="Jabatan">
        <input id="pass" type="password" placeholder="Password">
        <button onclick="Auth.register()">Daftar</button>
      </div>
    `;
  },

  // ===== DASHBOARD =====
  dashboard() {
    document.getElementById("content").innerHTML = `
      <div class="card">
        <h3>Dashboard</h3>
        <p>Selamat datang <b>${AppState.user.nama}</b></p>
      </div>
    `;
  },

  // ================= ITEM =================
  item() {
    UI.showLoading();

    API.getItems().then(data => {

      let html = `
        <div class="card">
          <h3>Item Management</h3>

          <button class="add-btn" onclick="Render.addItemForm()">+ Tambah Item</button>

          <div class="search-box">
            <input placeholder="Cari item..." oninput="Render.filterItem(this.value)">
          </div>

          <div class="table-container">
            <table id="itemTable">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Satuan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr>
                    <td>${row[0]}</td>
                    <td>${row[1]}</td>
                    <td>
                      <span class="action-btn edit-btn"
                        onclick="Render.editItem('${row[0]}','${row[1]}')">Edit</span>

                      <span class="action-btn delete-btn"
                        onclick="Render.deleteItem('${row[0]}')">Hapus</span>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById("content").innerHTML = html;
    });
  },

  // ===== ADD ITEM =====
  addItemForm() {
    document.getElementById("content").innerHTML = `
      <div class="card">
        <h3>Tambah Item</h3>
        <input id="nama" placeholder="Nama Item">
        <input id="satuan" placeholder="Satuan">
        <button onclick="Render.saveItem()">Simpan</button>
      </div>
    `;
  },

  saveItem() {
    const nama = document.getElementById("nama").value;
    const satuan = document.getElementById("satuan").value;

    API.addItem({ nama, satuan }).then(() => {
      UI.showToast("Item ditambahkan ✅");
      Render.item();
    });
  },

  // ===== EDIT =====
  editItem(nama, satuan) {
    document.getElementById("content").innerHTML = `
      <div class="card">
        <h3>Edit Item</h3>
        <input id="nama" value="${nama}">
        <input id="satuan" value="${satuan}">
        <button onclick="Render.updateItem('${nama}')">Update</button>
      </div>
    `;
  },

  updateItem(oldNama) {
    const nama = document.getElementById("nama").value;
    const satuan = document.getElementById("satuan").value;

    API.updateItem({ oldNama, nama, satuan }).then(() => {
      UI.showToast("Item diupdate ✅");
      Render.item();
    });
  },

  // ===== DELETE =====
  deleteItem(nama) {
    if (!confirm("Yakin hapus item ini?")) return;

    API.deleteItem(nama).then(() => {
      UI.showToast("Item dihapus ❌");
      Render.item();
    });
  },

  // ===== FILTER =====
  filterItem(keyword) {
    const rows = document.querySelectorAll("#itemTable tbody tr");

    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(keyword.toLowerCase()) ? "" : "none";
    });
  }
};

// ================= AUTH =================
const Auth = {

  login() {
    UI.showLoading();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    API.login(username, password).then(res => {

      if (res.status === "success") {
        Util.setUser(res);
        UI.showToast("Login berhasil ✅");

        setTimeout(() => {
          Render.menu();
          Render.dashboard();
        }, 800);

      } else {
        Render.login();
        UI.showToast("Login gagal ❌");
      }
    });
  },

  register() {
    UI.showLoading();

    const data = {
      nama: document.getElementById("nama").value,
      nip: document.getElementById("nip").value,
      jabatan: document.getElementById("jabatan").value,
      password: document.getElementById("pass").value
    };

    API.register(data).then(res => {
      Render.signup();
      UI.showToast(res.status === "success" ? "Berhasil daftar ✅" : "Gagal ❌");
    });
  },

  logout() {
    Util.clearUser();
    Render.menu();
    Render.login();
    UI.showToast("Logout berhasil");
  }
};

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  Render.menu();

  if (AppState.user) {
    Render.dashboard();
  } else {
    Render.login();
  }
});

// ================= GLOBAL =================
window.toggleSidebar = UI.toggleSidebar;
window.toggleDark = Theme.toggle;
