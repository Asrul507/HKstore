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
  renderBottomNav();

  if (user) {
    showApp();
    renderBinCard();
    setActiveNav(0);
  } else {
    showLogin();
  }
});

// ================= PAGE CONTROL =================
function showLogin() {
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("appPage").style.display = "none";

  setTimeout(() => {
    document.getElementById("username")?.focus();
  }, 200);
}

function showApp() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("appPage").style.display = "block";
}

// ================= ENTER KEY LOGIN =================
document.addEventListener("keydown", function(e){
  if(e.key === "Enter" && document.getElementById("loginPage").style.display !== "none"){
    login();
  }
});

// ================= LOGIN =================
function login(e) {

  let btn = e?.target;
  if (btn) btn.classList.add("loading");

  showLoading();

  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  if(!username || !password){
    showToast("Isi username & password","error");
    hideLoading();
    return;
  }

  api({ action: "login", username, password }).then(res => {

    setTimeout(() => {

      hideLoading();
      if (btn) btn.classList.remove("loading");

      if (res.status === "success") {

        user = res;
        localStorage.setItem("user", JSON.stringify(res));

        showApp();
        renderMenu();
        renderBottomNav();

        setActiveNav(0);
        renderBinCard();

        showToast("Login berhasil", "success");

      } else {
        showToast("Login gagal", "error");
      }

    }, 500);
  });
}

// ================= MENU =================
function renderMenu() {

  let html = `<h3>HK STORE</h3>`;

  if (!user) {
    html += `<a onclick="renderLogin(); closeSidebar()">🔑 Login</a>`;
    html += `<a onclick="renderRegister(); closeSidebar()">📝 Sign Up</a>`;
  } else {

    html += `<a onclick="setActiveNav(0); renderBinCard(); closeSidebar()">📦 Bin Card</a>`;
    html += `<a onclick="setActiveNav(1); renderItem(); closeSidebar()">📋 Item</a>`;
    html += `<a onclick="setActiveNav(2); renderUser(); closeSidebar()">👤 User</a>`;

    if (user.role === "admin") {
      html += `<a onclick="renderUserManagement(); closeSidebar()">⚙️ User Management</a>`;
    }

    html += `<a onclick="logout(); closeSidebar()">🚪 Logout</a>`;
  }

  document.getElementById("sidebar").innerHTML = html;
  document.getElementById("userName").innerText = user?.nama || "";
}

// ================= BOTTOM NAV =================
function renderBottomNav() {

  document.getElementById("bottomNav").innerHTML = `
    <button onclick="setActiveNav(0); renderBinCard()">📦<small>Bin</small></button>
    <button onclick="setActiveNav(1); renderItem()">📋<small>Item</small></button>
    <button onclick="setActiveNav(2); renderUser()">👤<small>Profile</small></button>
  `;
}

// ================= ACTIVE NAV =================
function setActiveNav(index){
  let btns = document.querySelectorAll(".bottom-nav button");
  btns.forEach(b => b.classList.remove("active"));
  if(btns[index]) btns[index].classList.add("active");
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

        <button onclick="submitBin(event)">Submit</button>
      </div>
    `;
  });
}

function submitBin(e) {

  let btn = e?.target;
  if (btn) btn.classList.add("loading");

  let qty = document.getElementById("qty").value;

  if(!qty){
    showToast("Qty tidak boleh kosong","error");
    return;
  }

  showLoading();

  api({
    action: "saveBinCard",
    item: document.getElementById("item").value,
    qty: qty,
    tipe: document.getElementById("tipe").value,
    user: user.nama
  }).then(() => {

    setTimeout(() => {

      hideLoading();
      if (btn) btn.classList.remove("loading");

      document.getElementById("qty").value = "";

      showToast("Data berhasil disimpan", "success");

    }, 400);
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
      <p>${user?.nama || "-"}</p>
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

// ================= SIDEBAR =================
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("show");
  document.getElementById("overlay").classList.toggle("show");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("show");
  document.getElementById("overlay").classList.remove("show");
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("user");
  user = null;

  showLogin();
  renderMenu();
  renderBottomNav();
}

// ================= LOADING =================
function loading(el = "content") {
  document.getElementById(el).innerHTML = `
    <div style="text-align:center;padding:20px;">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;
}

function showLoading() {
  document.getElementById("loading").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
}

// ================= TOAST =================
function showToast(message, type = "info") {

  let container = document.getElementById("toast-container");

  let toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}