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
  showToast(msg) {
    alert(msg); // simple dulu biar stabil
  },

  setUserInfo() {
    const el = document.getElementById("userName");
    if (!el) return;
    el.innerText = AppState.user
      ? `${AppState.user.nama} (${AppState.user.role})`
      : "";
  }
};

// ================= API =================
const API = {

  post(data) {
    return fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain" // ✅ WAJIB untuk GAS
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .catch(err => {
      console.error("FETCH ERROR:", err);
      throw err;
    });
  },

  login(username, password) {
    return this.post({ action: "login", username, password });
  },

  register(data) {
    return this.post({ action: "register", ...data });
  },

  getItems() {
    return this.post({ action: "getItems" });
  }
};

// ================= AUTH =================
const Auth = {

  login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    console.log("TRY LOGIN:", username);

    API.login(username, password)
      .then(res => {

        console.log("LOGIN RESPONSE:", res);

        if (res.status === "success") {
          Util.setUser(res);
          UI.showToast("Login berhasil ✅");

          Render.menu();
          Render.dashboard();

        } else {
          UI.showToast("Login gagal ❌");
        }

      })
      .catch(err => {
        console.error("LOGIN ERROR:", err);
        UI.showToast("Server error / tidak terhubung ❌");
      });
  },

  register() {
    const data = {
      nama: document.getElementById("nama").value,
      nip: document.getElementById("nip").value,
      jabatan: document.getElementById("jabatan").value,
      password: document.getElementById("pass").value
    };

    console.log("TRY REGISTER:", data);

    API.register(data)
      .then(res => {

        console.log("REGISTER RESPONSE:", res);

        if (res.status === "success") {
          UI.showToast("Berhasil daftar ✅");
          Render.login();
        } else {
          UI.showToast("Gagal daftar ❌");
        }

      })
      .catch(err => {
        console.error("REGISTER ERROR:", err);
        UI.showToast("Server error ❌");
      });
  },

  logout() {
    Util.clearUser();
    Render.menu();
    Render.login();
  }
};

// ================= RENDER =================
const Render = {

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
        <a onclick="Auth.logout()">Logout</a>
      `;
    }

    document.getElementById("sidebar").innerHTML = menu;
    UI.setUserInfo();
  },

  // ===== LOGIN PAGE =====
  login() {
    document.getElementById("content").innerHTML = `
      <div class="card">
        <h3>Login</h3>
        <input id="username" placeholder="NIP (Username)">
        <input id="password" type="password" placeholder="Password">
        <button onclick="Auth.login()">Login</button>
      </div>
    `;
  },

  // ===== REGISTER PAGE =====
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

  // ===== ITEM =====
  item() {
    document.getElementById("content").innerHTML = "Loading data...";

    API.getItems()
      .then(data => {

        console.log("ITEM DATA:", data);

        let html = `
          <div class="card">
            <h3>Item List</h3>
            <table>
              <tr><th>Nama</th><th>Satuan</th></tr>
              ${data.map(i => `
                <tr>
                  <td>${i[0]}</td>
                  <td>${i[1]}</td>
                </tr>
              `).join("")}
            </table>
          </div>
        `;

        document.getElementById("content").innerHTML = html;

      })
      .catch(err => {
        console.error("ITEM ERROR:", err);
        UI.showToast("Gagal ambil data ❌");
      });
  }
};

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  Render.menu();

  if (AppState.user) {
    Render.dashboard();
  } else {
    Render.login();
  }
});
