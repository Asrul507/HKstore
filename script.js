const API_URL = "https://script.google.com/macros/s/AKfycbzPACE9hT0K1Lom5BxWOqa2WRlYIDa_VlqG_gjeirYLmnlhWbjf_A_IPMobsQ4EOw2l/exec";
let user = JSON.parse(localStorage.getItem("user")) || null;
let selectedType = "IN"; 

// ================= API =================
function api(data) {
    // 1. Nyalakan loading setiap kali fungsi api dipanggil
    showLoading(true); 

    return fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
        // 2. MATIKAN loading saat data berhasil diterima
        showLoading(false); 
        return response;
    })
    .catch(err => {
        // 3. MATIKAN juga kalau error supaya tidak "loading abadi"
        showLoading(false); 
        console.error("API Error:", err);
        if (typeof showToast === "function") {
            showToast("Gagal terhubung ke server", "error");
        }
        throw err;
    });
}

function getCurrentMonth() {
    let d = new Date();
    return d.toISOString().slice(0, 7);
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  renderMenu();
  renderBottomNav();

  if (user) {
    showApp();

    setTimeout(() => {
      renderHome();
      setActiveNav(0);
    }, 100);

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
document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && document.getElementById("loginPage").style.display !== "none") {
        login();
    }
});

// ================= LOGIN =================
function login(e) {
    let btn = e?.target;
    if (btn) btn.classList.add("loading");

    // 1. Nyalakan Loading
    showLoading(true);

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (!username || !password) {
        showToast("Isi username & password", "error");
        // 2. Matikan jika input kosong
        showLoading(false); 
        if (btn) btn.classList.remove("loading");
        return;
    }

    api({ action: "login", username, password })
    .then(res => {
        // 3. Matikan setelah dapat respon dari API
        showLoading(false);
        if (btn) btn.classList.remove("loading");

        if (res.status === "success") {
            user = res;
            localStorage.setItem("user", JSON.stringify(res));

            showApp();
            renderMenu();
            renderBottomNav();

            setTimeout(() => {
                setActiveNav(0);
                renderHome();
            }, 100);

            showToast("Login berhasil", "success");
        } else {
            showToast("Login gagal: " + (res.message || "Cek kembali akun anda"), "error");
        }
    })
    .catch(err => {
        // 4. PENTING: Matikan jika koneksi internet error/putus
        showLoading(false);
        if (btn) btn.classList.remove("loading");
        showToast("Kesalahan server/koneksi", "error");
        console.error(err);
    });
}
// ================= MENU =================
function renderMenu() {
    // Bagian Header Sidebar dengan Ikon 3D-ish
    let html = `
        <div class="sidebar-header" style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 15px;">
            <div style="font-size: 50px; margin-bottom: 10px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">🏢</div>
            <h3 style="margin: 0; letter-spacing: 2px; color: #fff;">LIVING PLAZA</h3>
            <small style="opacity: 0.6; font-size: 10px;">INVENTORY SYSTEM</small>
        </div>
    `;

    if (!user) {
        html += `<a onclick="showLogin(); closeSidebar()"><i class="fa-solid fa-right-to-bracket"></i> Login</a>`;
    } else {
        // Menggunakan ikon Font Awesome agar seragam dengan Bottom Nav
        html += `<a onclick="renderHome(); closeSidebar()"><i class="fa-solid fa-house"></i> Home</a>`;
        html += `<a onclick="setActiveNav(1); renderDashboard(); closeSidebar()"><i class="fa-solid fa-chart-line"></i> Dashboard</a>`;
        html += `<a onclick="setActiveNav(2); renderItem(); closeSidebar()"><i class="fa-solid fa-box"></i> Item List</a>`;
        html += `<a onclick="renderHistory(); closeSidebar()"><i class="fa-solid fa-clock-rotate-left"></i> Riwayat</a>`;
        html += `<a onclick="setActiveNav(3); renderUser(); closeSidebar()"><i class="fa-solid fa-user"></i> My Profile</a>`;
        
        if (user.role === "admin") {
            html += `<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 15px 0;">`;
            html += `<a onclick="renderUserManagement(); closeSidebar()"><i class="fa-solid fa-users-gear"></i> User Admin</a>`;
        }
        
        html += `<a onclick="logout(); closeSidebar()" style="color: #ef4444; margin-top: 20px;"><i class="fa-solid fa-power-off"></i> Logout</a>`;
    }

    document.getElementById("sidebar").innerHTML = html;
    
    if (document.getElementById("userName")) {
        document.getElementById("userName").innerText = user?.nama || "";
    }
}


// ================= BOTTOM NAV =================
function renderBottomNav() {
    document.getElementById("bottomNav").innerHTML = `
        <button onclick="setActiveNav(0); renderHome()">
            <i class="fa-solid fa-house-chimney"></i>
            <small>Home</small>
        </button>
        <button onclick="setActiveNav(1); renderDashboard()">
            <i class="fa-solid fa-chart-simple"></i>
            <small>Dash</small>
        </button>
        <button onclick="setActiveNav(2); renderItem()">
            <i class="fa-solid fa-boxes-stacked"></i>
            <small>Item</small>
        </button>
        <button onclick="setActiveNav(3); renderUser()">
            <i class="fa-solid fa-user-gear"></i>
            <small>Profile</small>
        </button>
    `;
}

// ================= ACTIVE NAV =================
function setActiveNav(index) {
    let btns = document.querySelectorAll("#bottomNav button");
    btns.forEach(b => b.classList.remove("active"));
    if (btns[index]) btns[index].classList.add("active");
}

// ================= BIN CARD =================
function renderBinCard(target = "content") {
  api({ action: "getItems" }).then(items => {
    let options = items.map(i => `
      <option value="${i[0]}" data-satuan="${i[1]}">${i[0]}</option>
    `).join("");

    document.getElementById(target).innerHTML = `
      <div class="section-title">Input Stok</div>
      <div class="card">
        <div class="bin-header">
          <div class="bin-icon">📦</div>
          <div>
            <div class="bin-title">BIN CARD</div>
            <div class="bin-subtitle">Input keluar masuk barang</div>
          </div>
        </div>

        <div class="form-field" style="margin-bottom:12px">
          <label>Nama Barang</label>
          <select id="item" onchange="setSatuan()">${options}</select>
        </div>

        <div class="row-2" style="margin-bottom:16px">
          <div class="form-field">
            <label>Satuan</label>
            <input id="satuan" readonly>
          </div>
          <div class="form-field">
            <label>Qty</label>
            <input id="qty" type="number" placeholder="0" min="1"
              oninput="checkQty()">
          </div>
        </div>

        <div class="switch-section">
          <span class="switch-label">Tipe Transaksi</span>
          <div class="switch-wrapper">
            <span class="sw-lbl in" id="lbl-in">IN</span>
            <div class="switch-track" id="swTrack" onclick="toggleSwitch()">
              <div class="switch-thumb"></div>
            </div>
            <span class="sw-lbl out" id="lbl-out">OUT</span>
            <span class="mode-badge in-badge" id="modeBadge">Barang Masuk</span>
          </div>
        </div>

        <button class="btn-submit" id="btnSubmit" disabled onclick="submitBin(event)">
          <i class="fa-solid fa-paper-plane" style="font-size:14px"></i>
          <span>Simpan Data</span>
        </button>
      </div>
    `;
    setSatuan();
  });
}

function checkQty() {
  const qty = document.getElementById('qty').value;
  const btn = document.getElementById('btnSubmit');
  if (btn) btn.disabled = !qty || qty <= 0;
}

function toggleSwitch() {
  const track  = document.getElementById('swTrack');
  const lblIn  = document.getElementById('lbl-in');
  const lblOut = document.getElementById('lbl-out');
  const badge  = document.getElementById('modeBadge');

  if (!track) return;

  if (!track.classList.contains('out-mode')) {
    selectedType = 'OUT';
    track.classList.add('out-mode');
    lblIn.classList.add('dim');
    lblOut.classList.add('lit');
    badge.textContent = 'Barang Keluar';
    badge.className = 'mode-badge out-badge';
  } else {
    selectedType = 'IN';
    track.classList.remove('out-mode');
    lblIn.classList.remove('dim');
    lblOut.classList.remove('lit');
    badge.textContent = 'Barang Masuk';
    badge.className = 'mode-badge in-badge';
  }
}


function setSatuan() {
    let select = document.getElementById("item");
    if (!select.options[select.selectedIndex]) return;
    let satuan = select.options[select.selectedIndex].dataset.satuan;
    document.getElementById("satuan").value = satuan;
}

function setType(type) {
    selectedType = type;
    document.getElementById("btnIn").classList.remove("active");
    document.getElementById("btnOut").classList.remove("active");
    if (type === "IN") {
        document.getElementById("btnIn").classList.add("active");
    } else {
        document.getElementById("btnOut").classList.add("active");
    }
}

function submitBin(e) {
    let btn = e?.target;
    let qty = document.getElementById("qty").value;
    if (!qty) {
        showToast("Qty tidak boleh kosong", "error");
        return;
    }
    if (btn) btn.classList.add("loading");
    showLoading();
    api({
        action: "saveBinCard",
        item: document.getElementById("item").value,
        satuan: document.getElementById("satuan").value,
        qty: qty,
        tipe: selectedType,
        user: user.nama
    }).then(() => {
        setTimeout(() => {
            showLoading(false);
            if (btn) btn.classList.remove("loading");
            document.getElementById("qty").value = "";
            showToast("Data berhasil disimpan", "success");
            loadDashboardToday();
        }, 400);
    });
}

// ================= ITEM =================
function renderItem() {
    loading();
    api({ action: "getItems" }).then(items => {
        let html = `
            <div class="card">
                <h3>Item</h3>
                <button onclick="showAddItem()">+ Tambah Item</button>
                <div class="item-list">
        `;
        html += items.map(i => `
            <div class="item-card">
                <div><b>${i[0]}</b> <small>${i[1]}</small></div>
                <div class="item-action">
                    <button onclick="editItem('${i[0]}','${i[1]}')">✏️</button>
                    <button onclick="deleteItem('${i[0]}')">🗑️</button>
                </div>
            </div>
        `).join("");
        html += `</div></div>`;
        document.getElementById("content").innerHTML = html;
    });
}

function showAddItem() {
    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>Tambah Item</h3>
            <input id="itemNama" placeholder="Nama Item">
            <input id="itemSatuan" placeholder="Satuan">
            <button onclick="addItem()">Simpan</button>
            <button onclick="renderItem()">Kembali</button>
        </div>
    `;
}

function addItem() {
    let nama = document.getElementById("itemNama").value;
    let satuan = document.getElementById("itemSatuan").value;
    if (!nama || !satuan) {
        showToast("Lengkapi data", "error");
        return;
    }
    showLoading();
    api({ action: "addItem", nama, satuan }).then(() => {
        showLoading(false);
        showToast("Item ditambahkan", "success");
        renderItem();
    });
}

function editItem(oldNama, satuan) {
    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>Edit Item</h3>
            <input id="itemNama" value="${oldNama}">
            <input id="itemSatuan" value="${satuan}">
            <button onclick="updateItem('${oldNama}')">Update</button>
            <button onclick="renderItem()">Batal</button>
        </div>
    `;
}

function updateItem(oldNama) {
    let nama = document.getElementById("itemNama").value;
    let satuan = document.getElementById("itemSatuan").value;
    showLoading();
    api({ action: "updateItem", oldNama, nama, satuan }).then(() => {
        showLoading(false);
        showToast("Item diupdate", "success");
        renderItem();
    });
}

function deleteItem(nama) {
    if (!confirm("Hapus item ini?")) return;
    showLoading();
    api({ action: "deleteItem", nama }).then(() => {
        showLoading(false);
        showToast("Item dihapus", "success");
        renderItem();
    });
}

// ================= USER =================
function renderUser() {
  const content = document.getElementById("content");
  if (!content) return;

  const jabatanIcon = {
    "Supervisor": "fa-shield-halved",
    "Leader": "fa-star",
    "HO": "fa-crown"
  };
  const icon = jabatanIcon[user?.jabatan] || "fa-user-tie";

  content.innerHTML = `
    <div class="page-wrap">

      <div class="profile-hero">
        <div class="avatar">👤</div>
        <div class="profile-name">${user?.nama || "-"}</div>
        <div class="profile-jabatan">
          <i class="fa-solid ${icon}" style="font-size:10px"></i>
          ${user?.jabatan || "-"}
        </div>
      </div>

      <div class="section-title">Informasi Akun</div>
      <div class="info-card">
        <div class="info-row">
          <div class="info-icon icon-gold">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="info-content">
            <div class="info-label">Nama Lengkap</div>
            <div class="info-value">${user?.nama || "-"}</div>
          </div>
        </div>

        <div class="info-row">
          <div class="info-icon icon-blue">
            <i class="fa-solid fa-id-card"></i>
          </div>
          <div class="info-content">
            <div class="info-label">NIP</div>
            <div class="info-value">${user?.nip || "-"}</div>
          </div>
        </div>

        <div class="info-row">
          <div class="info-icon icon-green">
            <i class="fa-solid fa-briefcase"></i>
          </div>
          <div class="info-content">
            <div class="info-label">Jabatan</div>
            <div class="info-value">${user?.jabatan || "-"}</div>
          </div>
        </div>
      </div>

      <div class="section-title">Aktivitas Bulan Ini</div>
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">📥</div>
          <div class="stat-value" id="statInput">-</div>
          <div class="stat-label">Total Input</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-value" id="statItem">-</div>
          <div class="stat-label">Item Diinput</div>
        </div>
      </div>

      <button class="btn-logout-big" onclick="logout()">
        <i class="fa-solid fa-right-from-bracket"></i>
        Keluar dari Aplikasi
      </button>

    </div>
  `;

  loadUserStats();
}

function loadUserStats() {
  api({ action: "getHistory" }).then(data => {
    if (!Array.isArray(data)) return;
    const bulan = getCurrentMonth();
    const filtered = data.filter(d => {
      return d.user === user?.nama && (d.tanggal || "").startsWith(bulan);
    });
    const items = [...new Set(filtered.map(d => d.item))];
    const statInput = document.getElementById("statInput");
    const statItem  = document.getElementById("statItem");
    if (statInput) statInput.textContent = filtered.length;
    if (statItem)  statItem.textContent  = items.length;
  }).catch(() => {
    const statInput = document.getElementById("statInput");
    const statItem  = document.getElementById("statItem");
    if (statInput) statInput.textContent = "0";
    if (statItem)  statItem.textContent  = "0";
  });
}

// ================= USER MANAGEMENT =================
function renderUserManagement() {
    if (user.role !== "admin") {
        showToast("Akses ditolak", "error");
        return;
    }
    loading();
    api({ action: "getUsers" }).then(users => {
        let html = `
            <div class="card">
                <h3>User Management</h3>
                <button onclick="showAddUser()">+ Tambah User</button>
                <div class="user-list">
        `;
        html += users.map(u => `
            <div class="user-card">
                <div>
                    <b>${u[0]}</b><br>
                    <small>${u[1]} - ${u[2]}</small><br>
                    <span class="badge">${u[4]}</span>
                </div>
                <div class="user-action">
                    <button onclick="editUser('${u[0]}','${u[1]}','${u[2]}')">✏️</button>
                    <button onclick="deleteUser('${u[1]}')">🗑️</button>
                </div>
            </div>
        `).join("");
        html += `</div></div>`;
        document.getElementById("content").innerHTML = html;
    });
}

function showAddUser() {
    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>Tambah User</h3>
            <input id="nama" placeholder="Nama">
            <input id="nip" placeholder="NIP">
            <select id="jabatan">
                <option>Leader</option>
                <option>Supervisor</option>
                <option>HO</option>
            </select>
            <input id="password" type="password" placeholder="Password">
            <button onclick="addUser()">Simpan</button>
            <button onclick="renderUserManagement()">Kembali</button>
        </div>
    `;
}

function addUser() {
    let namaVal = document.getElementById("nama").value;
    let nipVal = document.getElementById("nip").value;
    let passVal = document.getElementById("password").value;
    let jabatan = document.getElementById("jabatan").value;
    let role = (jabatan === "Supervisor" || jabatan === "HO") ? "admin" : "staff";
    
    showLoading();
    api({ action: "register", nama: namaVal, nip: nipVal, jabatan, password: passVal, role }).then(() => {
        showLoading(false);
        showToast("User ditambahkan", "success");
        renderUserManagement();
    });
}
// Fungsi untuk Membuka Modal dan Mengisi Data Lama
function editUser(nama, nip, jabatan) { 
    // Kita isi field form berdasarkan urutan yang kamu punya
    document.getElementById("edit-nama").value = nama;
    document.getElementById("edit-nip").value = nip;       
    document.getElementById("edit-jabatan").value = jabatan; 
    
    // Kita simpan NIP di field hidden sebagai "kunci" untuk mencari baris di Google Sheets nanti
    document.getElementById("edit-user-id").value = nip; 

    document.getElementById("modal-edit-user").style.display = "flex";
}

// Fungsi untuk Menutup Modal
function closeModalEdit() {
    document.getElementById("modal-edit-user").style.display = "none";
}

// Fungsi untuk Mengirim Data ke Google Sheets
function saveEditUser() {
    const id = document.getElementById("edit-user-id").value;
    const nama = document.getElementById("edit-nama").value;
    const nip = document.getElementById("edit-nip").value;
    const jabatan = document.getElementById("edit-jabatan").value;
    const password = document.getElementById("edit-password").value;

    if (!nama || !nip) return showToast("Nama dan NIP wajib diisi", "error");

    showLoading(true);
    closeModalEdit();

    api({ 
        action: "updateUser", 
        id: id, 
        nama: nama, 
        nip: nip, 
        jabatan: jabatan, 
        password: password 
    })
    .then(res => {
        showLoading(false);
        showToast("Data user berhasil diperbarui!", "success");
        renderUserManagement(); // Refresh daftar user
    })
    .catch(err => {
        showLoading(false);
        showToast("Gagal memperbarui data", "error");
    });
}
function deleteUser(id) {
    if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
        showLoading(true);
        api({ action: "deleteUser", id: id })
            .then(res => {
                showLoading(false);
                showToast("User dihapus", "success");
                renderUserManagement();
            })
            .catch(err => {
                showLoading(false);
                showToast("Gagal hapus user", "error");
            });
    }
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

// ================= LOADING & UI =================
// SATU FUNGSI UNTUK SEMUA (Ganti fungsi loading & showLoading lama dengan ini)
function showLoading(show) {
    const loader = document.getElementById("loading-overlay");
    if (loader) {
        loader.style.display = show ? "flex" : "none";
    } else {
        console.warn("Elemen loading-overlay tidak ditemukan di HTML.");
    }
}

// Supaya kode lama yang memanggil loading() tidak error, kita buatkan alias
function loading(show) {
    // Jika inputnya boolean (true/false), gunakan showLoading
    if (typeof show === "boolean") {
        showLoading(show);
    } else {
        // Jika inputnya ID elemen (seperti "content"), kita abaikan saja 
        // atau tampilkan loader transparan agar lebih modern
        showLoading(true);
    }
}

// Alias untuk hideLoading agar tidak error saat dipanggil
function showLoading(show) {
    const loader = document.getElementById("loading-overlay");
    if (loader) {
        loader.style.display = show ? "flex" : "none";
    }
}
//======= DASHBOARD ===========
function renderDashboard() {
    let currentMonth = getCurrentMonth();
    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>Dashboard Stock</h3>
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
    api({ action: "getDashboard", bulan: bulan }).then(data => {
        let html = `<div class="dashboard-list">`;
        html += data.map(d => `
            <div class="dash-card">
                <b>${d.item}</b>
                <div class="dash-row">
                    <span>IN: ${d.masuk}</span>
                    <span>OUT: ${d.keluar}</span>
                </div>
                <div class="dash-stock ${d.stok < 0 ? 'minus' : ''}">
                    Stock: ${d.stok}
                </div>
            </div>
        `).join("");
        html += `</div>`;
        document.getElementById("dashboardData").innerHTML = html;
    });
}

//====== HOME =========
function renderHome() {
  let content = document.getElementById("content");

  if (!content) {
    console.error("❌ content tidak ditemukan");
    return;
  }

  // TEPAT DI SINI: Kita tambahkan <div class="home-grid"> sebagai pembungkus
  content.innerHTML = `
  <div style="width:100%; max-width:480px; margin:0 auto; padding:16px; display:flex; flex-direction:column; gap:16px;">
    <div id="formArea"></div>
    <div id="dashboardArea"></div>
  </div>
`;

  // Bagian ini tetap sama seperti punya kamu
  setTimeout(() => {
    try {
      renderBinCard("formArea");
    } catch (e) {
      console.error("❌ renderBinCard error:", e);
    }

    try {
      loadDashboardToday();
    } catch (e) {
      console.error("❌ dashboard error:", e);
    }
  }, 50);
}

function loadDashboardToday() {
    let bulan = getCurrentMonth();
    loading("dashboardArea");
    api({ action: "getDashboard", bulan: bulan }).then(data => {
        if (!data || data.length === 0) {
            document.getElementById("dashboardArea").innerHTML = "<p style='text-align:center'>Belum ada data bulan ini</p>";
            return;
        }
        let html = `<div class="card"><h3>Stock Saat Ini (${bulan})</h3>`;
        html += data.map(d => `
  <div class="stock-item">
    <div>
      <div class="stock-name">${d.item}</div>
      <div class="stock-meta">${d.stok < 10 ? '⚠️ Stok menipis' : 'Stok aman'}</div>
    </div>
    <div class="stock-count ${d.stok < 0 ? 'minus' : d.stok < 10 ? 'low' : ''}">
      ${d.stok}
    </div>
  </div>
`).join("");

        html += `</div>`;
        document.getElementById("dashboardArea").innerHTML = html;
    });
}

//=====RIWAYAT========
// Simpan data asli di memori untuk difilter

/**
 * 1. FUNGSI UTAMA: Ambil data dari Apps Script
 */
// ================= RIWAYAT =================
let allHistoryData = [];

function renderHistory() {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="page-wrap">
      <div class="section-title">
        <i class="fa-solid fa-clock-rotate-left" style="font-size:10px"></i>
        Riwayat Transaksi
      </div>

      <div class="filter-bar">
        <div class="filter-input">
          <i class="fa-solid fa-calendar-days"></i>
          <input type="date" id="filterTgl" onchange="filterHistory()">
        </div>
        <button class="btn-reset" onclick="resetHistoryFilter()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="history-list" id="historyList">
        <div class="empty-state">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Memuat data...</p>
        </div>
      </div>
    </div>
  `;

  api({ action: "getHistory" })
    .then(data => {
      allHistoryData = Array.isArray(data) ? data : [];
      renderHistoryList(allHistoryData);
    })
    .catch(() => {
      document.getElementById("historyList").innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Gagal memuat data. Coba lagi.</p>
        </div>
      `;
    });
}

function formatTglDisplay(tgl) {
  if (!tgl) return '-';
  const t = tgl.split(' ')[0];
  if (t.includes('-')) {
    const [y, m, d] = t.split('-');
    return `${d}/${m}/${y}`;
  }
  return tgl;
}

function getTglKey(tgl) {
  if (!tgl) return '';
  return tgl.split(' ')[0];
}

function groupByDate(data) {
  const groups = {};
  data.forEach(d => {
    const key = getTglKey(d.tanggal);
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });
  return groups;
}

function renderHistoryList(data) {
  const container = document.getElementById("historyList");
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-box-open"></i>
        <p>Tidak ada data untuk tanggal ini</p>
      </div>
    `;
    return;
  }

  const groups = groupByDate(data);
  const today  = new Date().toISOString().slice(0, 10);
  let html = '';

  Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .forEach(tgl => {
      const label = tgl === today ? '🟢 Hari Ini' : formatTglDisplay(tgl);
      html += `
        <div class="section-title" style="margin-top:6px">${label}</div>
      `;
      groups[tgl].forEach((row, i) => {
        const isIn = Number(row.in) > 0;
        const qty  = isIn ? row.in : row.out;
        html += `
          <div class="history-card" style="animation-delay:${i * 0.05}s">
            <div class="type-dot ${isIn ? 'type-in' : 'type-out'}">
              ${isIn ? 'IN' : 'OUT'}
            </div>
            <div class="hcard-body">
              <div class="hcard-item">${row.item || '-'}</div>
              <div class="hcard-meta">
                <span class="meta-tag">
                  <i class="fa-solid fa-clock"></i>
                  ${row.waktu || '-'}
                </span>
                <span class="meta-tag">
                  <i class="fa-solid fa-user"></i>
                  ${row.user || '-'}
                </span>
              </div>
            </div>
            <div class="qty-badge ${isIn ? 'qty-in' : 'qty-out'}">
              ${isIn ? '+' : '-'}${qty}
            </div>
          </div>
        `;
      });
    });

  container.innerHTML = html;
}

function filterHistory() {
  const val = document.getElementById("filterTgl")?.value;
  if (!val) { resetHistoryFilter(); return; }

  const filtered = allHistoryData.filter(d => {
    const key = getTglKey(d.tanggal);
    return key === val;
  });

  renderHistoryList(filtered);
}

function resetHistoryFilter() {
  const input = document.getElementById("filterTgl");
  if (input) input.value = '';
  renderHistoryList(allHistoryData);
}


// Paksa semua loading mati saat halaman baru terbuka
(function() {
    setTimeout(() => {
        const loader = document.getElementById("loading-overlay");
        if (loader) {
            loader.style.display = "none";
            console.log("Loading otomatis dimatikan oleh sistem.");
        }
    }, 1000); // Tunggu 1 detik agar script lain selesai dulu
})();

function showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    
    // Jika container toast belum ada di HTML, kita buatkan otomatis
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);

    // Hilangkan toast setelah 3 detik
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}


function logout() {
    // 1. Tampilkan konfirmasi (Opsional, tapi bagus untuk keamanan)
    if (confirm("Apakah Anda yakin ingin keluar?")) {
        
        // 2. Tampilkan Loading (Biar terasa prosesnya)
        document.getElementById("loading-overlay").style.display = "flex";

        // 3. Hapus data sesi (Jika kamu menggunakan localStorage)
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userData");

        // 4. Sembunyikan halaman aplikasi, munculkan halaman login
        document.getElementById("appPage").style.display = "none";
        document.getElementById("loginPage").style.display = "flex";

        // 5. Bersihkan input username & password agar tidak nyangkut
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";

        // 6. Hilangkan loading setelah pindah halaman
        setTimeout(() => {
            document.getElementById("loading-overlay").style.display = "none";
            // Beri notifikasi sukses
            showToast("Berhasil keluar dari sistem", "success");
        }, 500);

        // Alternatif paling ampuh: Refresh halaman total
        // location.reload(); 
    }
}
