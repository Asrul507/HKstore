// ================= CONFIG =================
const API_URL = "https://script.google.com/macros/s/AKfycbyMgSBqIry987HgseFbjM_JTP-hcLJ9ImzuNZi91Kj-WRHzAxHZimAzISpJ_keXxTh_/exec"; // GANTI

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
    alert(msg);
  },
  setUserInfo() {
    const el = document.getElementById("userName");
    if (el && AppState.user) {
      el.innerText = `${AppState.user.nama}`;
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
  }
};

// ================= AUTH =================
const Auth = {
  login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    API.login(username, password)
      .then(res => {
        console.log(res);

        if (res.status === "success") {
          Util.setUser(res);
          UI.showToast("Login berhasil");
          Render.menu();
          Render.dashboard();
        } else {
          UI.showToast("Login gagal");
        }
      })
      .catch(err => {
        console.error(err);
        UI.showToast("Server error");
      });
  },

  register() {
    const data = {
      nama: document.getElementById("nama").value,
      nip: document.getElementById("nip").value,
      jabatan: document.getElementById("jabatan").value,
      password: document.getElementById("pass").value
    };

    API.register(data)
      .then(res => {
        console.log(res);

        if (res.status === "success") {
          UI.showToast("Berhasil daftar");
          Render.login();
        } else {
          UI.showToast("Gagal daftar");
        }
      })
      .catch(err => {
        console.error(err);
        UI.showToast("Server error");
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
    let html = "<h2>HK STORE</h2>";

    if (!AppState.user) {
      html += `
        <a onclick="Render.login()">Login</a>
        <a onclick="Render.signup()">Sign Up</a>
      `;
    } else {
      html += `
        <a onclick="Render.dashboard()">Dashboard</a>
        <a onclick="Auth.logout()">Logout</a>
      `;
    }

    document.getElementById("sidebar").innerHTML = html;
    UI.setUserInfo();
  },

  login() {
    document.getElementById("content").innerHTML = `
      <div class="card">
        <h3>Login</h3>
        <input id="username" placeholder="NIP">
        <input id="password" type="password" placeholder="Password">
        <button onclick="Auth.login()">Login</button>
      </div>
    `;
  },

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

  dashboard() {
    document.getElementById("content").innerHTML = `
      <div class="card">
        <h3>Dashboard</h3>
        <p>Selamat datang ${AppState.user.nama}</p>
      </div>
    `;
  }
};

// ================= HAMBURGER FIX =================
window.toggleSidebar = function () {
  document.getElementById("sidebar").classList.toggle("show");
  document.getElementById("overlay").classList.toggle("show");
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
