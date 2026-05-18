const API_URL = "https://script.google.com/macros/s/AKfycbzJ9RaRYdNzDbfXUpnoWzBEo1_hnlKV1e4XG2aP3JpJz5IBt1comYwtQAR_DXpuvOPB/exec";
let user = JSON.parse(localStorage.getItem("user")) || null;
let selectedType = "IN"; 
let cachePusatLaporan = { bincard: [], datang: [], musnah: [], opname: [] };

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
        html += `<a onclick="renderPusatLaporanMenu(); closeSidebar()"><i class="fa-solid fa-folder-open"></i> Pusat Laporan & Riwayat</a>`;
        html += `<a onclick="setActiveNav(3); renderUser(); closeSidebar()"><i class="fa-solid fa-user"></i> My Profile</a>`;
        // Cari baris menu "Riwayat" atau "My Profile", lalu selipkan baris ini di antaranya:
html += `<a onclick="renderPeralatanMenu(); closeSidebar()"><i class="fa-solid fa-screwdriver-wrench"></i> Stok Peralatan</a>`;
        
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
// ================= DASHBOARD =================
function renderDashboard() {
  const content = document.getElementById("content");
  if (!content) return;

  const currentMonth = getCurrentMonth();

  content.innerHTML = `
    <div class="page-wrap">
      <div class="section-title">
        <i class="fa-solid fa-chart-simple" style="font-size:10px"></i>
        Dashboard Stock
      </div>

      <div class="month-selector">
        <div class="month-input-wrap">
          <i class="fa-solid fa-calendar-days"></i>
          <input type="month" id="filterBulan" value="${currentMonth}">
        </div>
        <button class="btn-tampil" onclick="loadDashboard()">
          <i class="fa-solid fa-magnifying-glass"></i>
          Tampilkan
        </button>
      </div>

      <div class="section-title">Detail Per Barang</div>
      <div id="dashList" style="display:flex; flex-direction:column; gap:10px;">
        <div class="dash-empty">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Memuat data...</p>
        </div>
      </div>
    </div>
  `;

  loadDashboard();
}

function loadDashboard() {
  const bulan = document.getElementById("filterBulan")?.value;
  const dashList = document.getElementById("dashList");
  if (!dashList) return;

  dashList.innerHTML = `
    <div class="dash-empty">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Memuat data...</p>
    </div>
  `;

  api({ action: "getDashboard", bulan: bulan })
    .then(data => {
      if (!data || data.length === 0) {
        dashList.innerHTML = `
          <div class="dash-empty">
            <i class="fa-solid fa-box-open"></i>
            <p>Belum ada data bulan ini</p>
          </div>
        `;
        return;
      }

      // Cari nilai stok maksimal untuk hitung panjang bar
      const maxStok = Math.max(...data.map(d => Math.max(d.masuk || 0, 1)));

      let html = '';
      data.forEach(d => {
        const stok    = d.stok || 0;
        const masuk   = d.masuk || 0;
        const keluar  = d.keluar || 0;

        // Panjang bar berdasarkan stok vs total masuk
        const barWidth = masuk > 0
          ? Math.max(3, Math.min(100, Math.round((stok / masuk) * 100)))
          : (stok > 0 ? 100 : 3);

        const barClass = stok < 0  ? 'bar-danger'
                       : stok < 20 ? 'bar-low'
                       : 'bar-safe';

        const stkClass = stok < 0  ? 'stok-danger'
                       : stok < 20 ? 'stok-low'
                       : 'stok-safe';

        html += `
          <div class="item-card-dash">
            <div class="item-dash-icon">📦</div>
            <div class="item-dash-body">
              <div class="item-dash-name">${d.item}</div>
              <div class="item-dash-bar-wrap">
                <div class="item-dash-bar ${barClass}"
                     style="width:${barWidth}%"></div>
              </div>
              <div class="item-dash-meta">
                <div class="item-in-out">
                  <span class="inout-tag in">
                    <i class="fa-solid fa-arrow-up"></i>${masuk}
                  </span>
                  <span class="inout-tag out">
                    <i class="fa-solid fa-arrow-down"></i>${keluar}
                  </span>
                </div>
                <div class="item-stok-val ${stkClass}">${stok}</div>
              </div>
            </div>
          </div>
        `;
      });

      dashList.innerHTML = html;
    })
    .catch(() => {
      dashList.innerHTML = `
        <div class="dash-empty">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Gagal memuat data. Coba lagi.</p>
        </div>
      `;
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

// ================= GERBANG UTAMA PUSAT LAPORAN & RIWAYAT (FULL SCREEN) =================
function renderPusatLaporanMenu() {
  const content = document.getElementById("content");
  if (!content) return;
  setActiveNav(-1); // Matikan sorotan di bottom nav karena ini menu eksklusif full screen

  document.getElementById("content").innerHTML = `
    <div class="page-wrap" style="width: 100%; max-width: 480px; margin: 0 auto; padding: 12px; box-sizing: border-box;">
      <div class="bin-header" style="margin-bottom: 15px;">
        <div class="bin-title" style="font-size: 16px;"><i class="fa-solid fa-folder-open"></i> PUSAT LAPORAN & RIWAYAT</div>
        <div class="bin-subtitle" style="font-size: 11px;">Living Plaza Balikpapan — Kontrol Logistik</div>
      </div>

      <div style="display: flex; gap: 4px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 12px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
        <button id="tabLpBincard" class="active" onclick="switchSubMenuLaporan('bincard')" style="flex: 0 0 auto; padding: 6px 10px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; white-space: nowrap;">Bin Card</button>
        <button id="tabLpDatang" onclick="switchSubMenuLaporan('datang')" style="flex: 0 0 auto; padding: 6px 10px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; white-space: nowrap;">Barang Masuk</button>
        <button id="tabLpMusnah" onclick="switchSubMenuLaporan('musnah')" style="flex: 0 0 auto; padding: 6px 10px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; white-space: nowrap;">Pemusnahan</button>
        <button id="tabLpOpname" onclick="switchSubMenuLaporan('opname')" style="flex: 0 0 auto; padding: 6px 10px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; white-space: nowrap;">Opname Area</button>
        <button id="tabLpMatriks" onclick="switchSubMenuLaporan('matriks')" style="flex: 0 0 auto; padding: 6px 10px; background: #1e293b; border: 1px solid #334155; color: #fbbf24; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; white-space: nowrap;"><i class="fa-solid fa-table"></i> Laporan</button>
      </div>

      <div id="kotakFilterPusatLaporan" class="card" style="padding: 10px; margin-bottom: 12px; background: #1e293b;"></div>

      <div class="card" style="padding: 6px; background: #0f172a; border: 1px solid #1e293b;">
        <div id="scrollContainerLaporan" style="overflow-x: auto; overflow-y: auto; max-height: calc(100vh - 260px); position: relative; border-radius: 6px;">
          <table id="tabelDinamisPusat" style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; color: #e2e8f0;">
            <thead id="headTabelPusat" style="position: sticky; top: 0; background: #1e293b; z-index: 20; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></thead>
            <tbody id="bodyTabelPusat"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  switchSubMenuLaporan('bincard');
}
// ================= SAKLAR ELEKTRONIK PERGANTIAN TAB SUB-MENU =================
function switchSubMenuLaporan(pilihan) {
  // 1. Matikan visual active semua tombol tab dlu
  const tabs = ['bincard', 'datang', 'musnah', 'opname', 'matriks'];
  tabs.forEach(t => {
    const btn = document.getElementById('tabLp' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) { btn.style.background = '#1e293b'; btn.style.borderColor = '#334155'; btn.style.color = '#fff'; }
  });

  // 2. Nyalakan visual active tombol tab yang sedang dipilih
  const activeBtn = document.getElementById('tabLp' + pilihan.charAt(0).toUpperCase() + pilihan.slice(1));
  if (activeBtn) {
    activeBtn.style.background = pilihan === 'matriks' ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'linear-gradient(135deg, #38bdf8, #2563eb)';
    activeBtn.style.borderColor = 'transparent';
    if (pilihan === 'matriks') activeBtn.style.color = '#0f172a';
  }

  const filterBox = document.getElementById("kotakFilterPusatLaporan");
  const headTabel = document.getElementById("headTabelPusat");
  const bodyTabel = document.getElementById("bodyTabelPusat");
  
  bodyTabel.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:#94a3b8;"><i class="fa-solid fa-circle-notch fa-spin"></i> Sinkronisasi Data Gudang...</td></tr>`;

  // 3. SETTING STRUKTUR HEADER & FILTER UNTUK MASING-MASING TAB
  if (pilihan === 'bincard') {
    filterBox.innerHTML = `
      <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;"><i class="fa-solid fa-calendar-day"></i> Pilih Tanggal Cari Riwayat Bin Card</label>
      <input type="date" id="fLpBincardTgl" onchange="filterEngineBincard()" style="width:100%; padding:8px; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:6px; font-size:12px;">
    `;
    headTabel.innerHTML = `
      <tr style="color:#38bdf8; border-bottom:2px solid #334155;">
        <th style="padding:10px;">TANGGAL</th><th style="padding:10px;">WAKTU</th><th style="padding:10px;">ITEM BARANG</th>
        <th style="padding:10px; text-align:center;">TIPE</th><th style="padding:10px; text-align:center;">QTY</th><th style="padding:10px;">STAFF</th>
      </tr>
    `;
    api({ action: "getHistory" }).then(res => {
      cachePusatLaporan.bincard = Array.isArray(res) ? res : [];
      filterEngineBincard();
    });

  } else if (pilihan === 'datang') {
    filterBox.innerHTML = `
      <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;"><i class="fa-solid fa-calendar-day"></i> Pilih Tanggal Riwayat Barang Masuk</label>
      <input type="date" id="fLpDatangTgl" onchange="filterEngineDatang()" style="width:100%; padding:8px; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:6px; font-size:12px;">
    `;
    headTabel.innerHTML = `
      <tr style="color:#22c55e; border-bottom:2px solid #334155;">
        <th style="padding:10px;">TANGGAL</th><th style="padding:10px;">NAMA PERALATAN</th>
        <th style="padding:10px; text-align:center;">KATEGORI</th><th style="padding:10px; text-align:center;">QTY</th><th style="padding:10px;">STAFF AUDIT</th>
      </tr>
    `;
    api({ action: "getRiwayatPeralatan" }).then(res => {
      cachePusatLaporan.datang = res.datang || [];
      cachePusatLaporan.musnah = res.musnah || []; 
      filterEngineDatang();
    });

  } else if (pilihan === 'musnah') {
    filterBox.innerHTML = `
      <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;"><i class="fa-solid fa-calendar-day"></i> Pilih Tanggal Berkas Pemusnahan (Afkir)</label>
      <input type="date" id="fLpMusnahTgl" onchange="filterEngineMusnah()" style="width:100%; padding:8px; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:6px; font-size:12px;">
    `;
    headTabel.innerHTML = `
      <tr style="color:#ef4444; border-bottom:2px solid #334155;">
        <th style="padding:10px;">TANGGAL</th><th style="padding:10px;">PERALATAN AFKIR</th>
        <th style="padding:10px; text-align:center;">KATEGORI</th><th style="padding:10px; text-align:center;">QTY</th><th style="padding:10px;">STAFF AUDIT</th>
      </tr>
    `;
    if (cachePusatLaporan.musnah.length > 0) filterEngineMusnah();
    else {
      api({ action: "getRiwayatPeralatan" }).then(res => {
        cachePusatLaporan.musnah = res.musnah || [];
        filterEngineMusnah();
      });
    }

  } else if (pilihan === 'opname') {
    filterBox.innerHTML = `
      <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;"><i class="fa-solid fa-calendar-days"></i> Pilih Periode Bulan Pemeriksaan Area</label>
      <input type="month" id="fLpOpnameBulan" onchange="filterEngineOpname()" style="width:100%; padding:8px; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:6px; font-size:12px;">
    `;
    headTabel.innerHTML = `
      <tr style="color:#fbbf24; border-bottom:2px solid #334155;">
        <th style="padding:10px;">TANGGAL</th><th style="padding:10px;">AREA KERJA</th><th style="padding:10px;">NAMA PERALATAN</th>
        <th style="padding:10px; text-align:center;">BAGUS</th><th style="padding:10px; text-align:center;">RUSAK</th><th style="padding:10px;">STAFF AUDIT</th>
      </tr>
    `;
    api({ action: "getRiwayatOpnameMurni" }).then(res => {
      cachePusatLaporan.opname = Array.isArray(res) ? res : [];
      document.getElementById("fLpOpnameBulan").value = getCurrentMonth(); // Isi otomatis ke bulan ini
      filterEngineOpname();
    });

  } else if (pilihan === 'matriks') {
    filterBox.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; align-items:flex-end;">
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;">Tanggal Mulai</label>
          <input type="date" id="lapMulai" style="width:100%; padding:6px; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:6px; font-size:11px;">
        </div>
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;">Tanggal Selesai</label>
          <input type="date" id="lapSelesai" style="width:100%; padding:6px; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:6px; font-size:11px;">
        </div>
      </div>
      <button onclick="prosesTarikLaporanPusat()" style="width:100%; margin-top:10px; padding:8px; background:#fbbf24; color:#0f172a; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px;">
        <i class="fa-solid fa-calculator"></i> Kalkulasi Rekonsiliasi Logistik (Full Screen)
      </button>
    `;
    headTabel.innerHTML = `
      <tr style="color:#67e8f9; border-bottom:2px solid rgba(255,255,255,0.15);">
        <th style="padding:10px; min-width:130px; position:sticky; left:0; background:#1e293b; z-index:21;">NAMA BARANG</th><th style="padding:10px; text-align:center;">JENIS</th>
        <th style="padding:10px; text-align:center;">OPENING</th><th style="padding:10px; text-align:center;">ADD</th>
        <th style="padding:10px; text-align:center;">TOTAL.STK</th><th style="padding:10px; text-align:center;">OPN.BGS</th>
        <th style="padding:10px; text-align:center;">OPN.RSK</th><th style="padding:10px; text-align:center;">TOT.INV</th>
        <th style="padding:10px; text-align:center;">SELISIH</th><th style="padding:10px; text-align:center; color:#22d3ee;">CLOSING</th>
      </tr>
    `;
    bodyTabel.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; opacity:0.5; color:#94a3b8;">Tentukan tanggal rentang audit di atas, lalu klik tombol kalkulasi.</td></tr>`;
  }
}

// ================= MESIN PENYARING DATA (CLIENT-SIDE ENGINES) =================
function filterEngineBincard() {
  let tglVal = document.getElementById("fLpBincardTgl").value;
  let filtered = cachePusatLaporan.bincard;
  if (tglVal) filtered = cachePusatLaporan.bincard.filter(d => getTglKey(d.tanggal) === tglVal);

  let html = filtered.map(r => {
    let isIn = Number(r.in) > 0;
    return `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:10px; opacity:0.7;">${formatTglDisplay(r.tanggal)}</td>
        <td style="padding:10px; opacity:0.7;">${r.waktu || '-'}</td>
        <td style="padding:10px; font-weight:bold; color:#fff;">${r.item}</td>
        <td style="padding:10px; text-align:center;"><span style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold; background:${isIn?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)'}; color:${isIn?'#22c55e':'#ef4444'};">${isIn?'IN':'OUT'}</span></td>
        <td style="padding:10px; text-align:center; font-weight:bold; color:${isIn?'#22c55e':'#ef4444'}">${isIn?'+':'-'}${isIn?r.in:r.out}</td>
        <td style="padding:10px; opacity:0.8;">${r.user}</td>
      </tr>
    `;
  }).join("");
  if(filtered.length === 0) html = `<tr><td colspan="6" style="text-align:center; padding:20px; opacity:0.4;">Tidak ada log bincard cocok.</td></tr>`;
  document.getElementById("bodyTabelPusat").innerHTML = html;
}

function filterEngineDatang() {
  let tglVal = document.getElementById("fLpDatangTgl").value;
  let filtered = cachePusatLaporan.datang;
  if (tglVal) filtered = cachePusatLaporan.datang.filter(d => d.tanggalRaw && d.tanggalRaw.substring(0,10) === tglVal);

  let html = filtered.map(r => {
    let linkFoto = r.foto !== "-" && r.foto !== "" ? `<a href="${r.foto}" target="_blank" style="color:#22c55e; font-weight:bold;"><i class="fa-solid fa-image"></i></a>` : `<span style="opacity:0.3">-</span>`;
    return `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:10px; opacity:0.7;">${r.tanggal}</td>
        <td style="padding:10px; font-weight:bold; color:#fff;">${r.nama}</td>
        <td style="padding:10px; text-align:center; color:#fbbf24;">[${r.jenis}]</td>
        <td style="padding:10px; text-align:center; color:#22c55e; font-weight:bold;">+${String(r.qty)}</td>
        <td style="padding:10px; opacity:0.8;">${r.user} ${linkFoto}</td>
      </tr>
    `;
  }).join("");
  if(filtered.length === 0) html = `<tr><td colspan="5" style="text-align:center; padding:20px; opacity:0.4;">Tidak ada riwayat barang masuk cocok.</td></tr>`;
  document.getElementById("bodyTabelPusat").innerHTML = html;
}

function filterEngineMusnah() {
  let tglVal = document.getElementById("fLpMusnahTgl").value;
  let filtered = cachePusatLaporan.musnah;
  if (tglVal) filtered = cachePusatLaporan.musnah.filter(d => d.tanggalRaw && d.tanggalRaw.substring(0,10) === tglVal);

  let html = filtered.map(r => {
    let linkFoto = r.foto !== "-" && r.foto !== "" ? `<a href="${r.foto}" target="_blank" style="color:#ef4444; font-weight:bold;"><i class="fa-solid fa-image"></i></a>` : `<span style="opacity:0.3">-</span>`;
    return `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:10px; opacity:0.7;">${r.tanggal}</td>
        <td style="padding:10px; font-weight:bold; color:#fff;">${r.nama}</td>
        <td style="padding:10px; text-align:center; color:#fbbf24;">[${r.jenis}]</td>
        <td style="padding:10px; text-align:center; color:#ef4444; font-weight:bold;">-${String(r.qty)}</td>
        <td style="padding:10px; opacity:0.8;">${r.user} ${linkFoto}</td>
      </tr>
    `;
  }).join("");
  if(filtered.length === 0) html = `<tr><td colspan="5" style="text-align:center; padding:20px; opacity:0.4;">Tidak ada riwayat pemusnahan cocok.</td></tr>`;
  document.getElementById("bodyTabelPusat").innerHTML = html;
}

function filterEngineOpname() {
  let blnVal = document.getElementById("fLpOpnameBulan").value;
  let filtered = cachePusatLaporan.opname;
  if (blnVal) filtered = cachePusatLaporan.opname.filter(d => d.tanggalRaw && d.tanggalRaw.substring(0,7) === blnVal);

  let html = filtered.map(r => `
    <tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:10px; opacity:0.7;">${r.tanggal || formatTglDisplay(r.tanggalRaw)}</td>
      <td style="padding:10px; color:#fbbf24; font-weight:600;">${r.area}</td>
      <td style="padding:10px; color:#fff;">${r.nama_alat}</td>
      <td style="padding:10px; text-align:center; color:#38bdf8; font-weight:bold;">${r.qty_bagus}</td>
      <td style="padding:10px; text-align:center; color:#f87171; font-weight:bold;">${r.qty_rusak}</td>
      <td style="padding:10px; opacity:0.7;">${r.user}</td>
    </tr>
  `).join("");
  if(filtered.length === 0) html = `<tr><td colspan="6" style="text-align:center; padding:20px; opacity:0.4;">Tidak ada pemeriksaan area untuk bulan ini.</td></tr>`;
  document.getElementById("bodyTabelPusat").innerHTML = html;
}

// ================= ENGINE LAPORAN BULANAN (TAB 5 FULL SCREEN) =================
function prosesTarikLaporanPusat() {
  let startDate = document.getElementById("lapMulai").value;
  let endDate = document.getElementById("lapSelesai").value;
  if (!startDate || !endDate) return showToast("Pilih rentang tanggal lengkap!", "error");
  
  const bodyTabel = document.getElementById("bodyTabelPusat");
  bodyTabel.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> Merajut rekonsiliasi data audit...</td></tr>`;
  
  api({ action: "getPeralatan" }).then(tools => {
    if (!Array.isArray(tools)) tools = [];
    
    api({ action: "getOpnameHistory", startDate, endDate }).then(res => {
      let openingStok = res.openingStok || {};
      let addStok = res.addStok || {};
      let areaBagus = res.areaBagus || {};
      let areaRusak = res.areaRusak || {};

      let htmlResult = "";
      tools.forEach(t => {
        let item = t[1]; 
        let jenis = t[2] || "Manual"; 
        let opStok = openingStok[item] || 0;
        let adStok = addStok[item] || 0;
        let totStok = opStok + adStok;

        let itemAreasBagus = areaBagus[item] || {};
        let totOpnBagus = Object.values(itemAreasBagus).reduce((a, b) => a + b, 0);

        let itemAreasRusak = areaRusak[item] || {};
        let totOpnRusak = Object.values(itemAreasRusak).reduce((a, b) => a + b, 0);

        let totInventory = totOpnBagus + totOpnRusak;
        let selisih = totInventory - totStok;
        let closingInv = totInventory - totOpnRusak; 

        let selisihColor = selisih < 0 ? '#ef4444' : (selisih > 0 ? '#22c55e' : '#e2e8f0');

        htmlResult += `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
            <td style="padding:10px; font-weight:600; color:#fff; position:sticky; left:0; background:#0f172a; z-index:5;">${item}</td>
            <td style="padding:10px; text-align:center; color:#fbbf24;">${jenis}</td>
            <td style="padding:10px; text-align:center; opacity:0.6;">${opStok}</td>
            <td style="padding:10px; text-align:center; color:#22c55e;">+${adStok}</td>
            <td style="padding:10px; text-align:center; font-weight:600;">${totStok}</td>
            <td style="padding:10px; text-align:center; color:#38bdf8;">${totOpnBagus}</td>
            <td style="padding:10px; text-align:center; color:#f87171;">${totOpnRusak}</td>
            <td style="padding:10px; text-align:center; font-weight:600;">${totInventory}</td>
            <td style="padding:10px; text-align:center; font-weight:bold; color:${selisihColor}">${selisih >= 0 ? '+' : ''}${selisih}</td>
            <td style="padding:10px; text-align:center; font-weight:bold; color:#22d3ee; background:rgba(34,211,238,0.05);">${closingInv}</td>
          </tr>
        `;
      });
      if(tools.length === 0) htmlResult = `<tr><td colspan="10" style="text-align:center; padding:20px;">Belum ada master alat terdaftar.</td></tr>`;
      bodyTabel.innerHTML = htmlResult;
      showToast("Matriks rekonsiliasi berhasil dimuat!", "success");
    });
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

// ================= AMANKAN FUNGSI DASHBOARD TODAY (GANTI YANG LAMA) =================
function loadDashboardToday() {
    let bulan = getCurrentMonth();
    
    // Validasi awal: Amankan area pembungkus dashboardArea agar tidak memicu crash null
    let dashArea = document.getElementById("dashboardArea");
    if (!dashArea) {
        console.warn("⚠️ Elemen dashboardArea belum siap di layar.");
        return; // Hentikan eksekusi sementara agar tidak memicu error innerHTML
    }

    loading("dashboardArea");
    api({ action: "getDashboard", bulan: bulan }).then(data => {
        // Validasi kedua: Cek kembali elemen jika user mendadak pindah halaman sebelum API selesai
        dashArea = document.getElementById("dashboardArea");
        if (!dashArea) return;

        if (!data || data.length === 0) {
            dashArea.innerHTML = "<p style='text-align:center; opacity:0.5; font-size:12px; padding:10px;'>Belum ada data bulan ini</p>";
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
        dashArea.innerHTML = html; // Aman digunakan karena objek elemen divalidasi nyata
    }).catch(err => {
        console.error("Gagal memuat dashboard hari ini:", err);
    });
}


// ================= INTERFACE MODUL PERALATAN (UTUH TERPROTEKSI) =================
function renderPeralatanMenu() {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="page-wrap">
      <div class="bin-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div class="bin-title">LOGISTIK & STOK PERALATAN</div>
          <div class="bin-subtitle">Penerimaan, Pemusnahan & Opname Area</div>
        </div>
        <button onclick="loadKelolaPeralatan()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fbbf24; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;">
          <i class="fa-solid fa-gear"></i> Kelola Alat
        </button>
      </div>

      <div class="toggle-group" style="margin-bottom: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button id="btnTabDatang" class="active" onclick="switchTabPeralatan('datang')">Barang Datang</button>
        <button id="btnTabMusnah" onclick="switchTabPeralatan('musnah')">Pemusnahan</button>
        <button id="btnTabOpname" onclick="switchTabPeralatan('opname')">Opname Area</button>
        <button id="btnTabLaporan" onclick="switchTabPeralatan('laporan')">Tarik Laporan</button>
      </div>

      <div id="peralatanSubContent"></div>
    </div>
  `;
  switchTabPeralatan('datang'); 
}

function switchTabPeralatan(tab) {
  const tabs = ['datang', 'musnah', 'opname', 'laporan'];
  tabs.forEach(t => {
    const btn = document.getElementById('btnTab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) btn.classList.remove("active");
  });
  
  const activeBtn = document.getElementById('btnTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (activeBtn) activeBtn.classList.add("active");

  const subContent = document.getElementById("peralatanSubContent");
  if (!subContent) return;

  subContent.innerHTML = `
    <div id="sub-loader" style="text-align:center; padding: 30px; opacity:0.6; font-weight:600;">
      <i class="fa-solid fa-spinner fa-spin"></i> MEMUAT FORM...
    </div>
  `;

  if (tab === 'datang') loadFormBarangDatang();
  else if (tab === 'musnah') loadFormPemusnahan();
  else if (tab === 'opname') loadFormOpnamePeralatan();
  else if (tab === 'laporan') loadLaporanPeralatan();
}

let globalFotoDatangBase64 = ""; // Variable penampung sementara
let globalFotoMusnahBase64 = ""; // Variable penampung sementara

// VARIABEL GLOBAL UNTUK MENAMPUNG CACHE DATA RIWAYAT SEBELUM DIFILTER
let cacheRiwayatPeralatan = { datang: [], musnah: [] };

// ================= TAB 1: FORM & RIWAYAT BARANG DATANG LENGKAP =================
function loadFormBarangDatang() {
  globalFotoDatangBase64 = ""; 
  showLoading(true);
  
  Promise.all([
    api({ action: "getPeralatan" }),
    api({ action: "getRiwayatPeralatan" })
  ]).then(([tools, riwayat]) => {
    showLoading(false);
    if (!Array.isArray(tools)) tools = [];
    cacheRiwayatPeralatan.datang = riwayat.datang || [];

    let optionsForm = tools.map(t => `<option value="${t[1]}">${t[1]} [${t[2]}]</option>`).join("");
    let optionsFilterItem = tools.map(t => `<option value="${t[1]}">${t[1]}</option>`).join("");
    if (tools.length === 0) optionsForm = `<option value="" disabled selected>Belum ada alat terdaftar!</option>`;

    document.getElementById("peralatanSubContent").innerHTML = `
      <div class="card" style="border-top: 4px solid #22c55e; margin-bottom: 20px;">
        <div class="section-title" style="color: #22c55e;">Penerimaan / Penambahan Alat Baru</div>
        <div class="form-field" style="margin-bottom:12px">
          <label>Nama Peralatan Masuk</label>
          <select id="datangNamaAlat">${optionsForm}</select>
        </div>
        <div class="form-field" style="margin-bottom:12px">
          <label>Jumlah Masuk (Qty)</label>
          <input id="datangQty" type="number" placeholder="0" min="1">
        </div>
        <div class="form-field" style="margin-bottom:20px">
          <label>Ambil Foto Bukti Fisik (Opsional)</label>
          <input id="datangFotoKamera" type="file" accept="image/*" capture="environment" style="display:none;" onchange="handleFotoDatangChange(this)">
          <button type="button" onclick="document.getElementById('datangFotoKamera').click()" style="width:100%; padding:11px; background:#475569; border:none; color:white; border-radius:8px; cursor:pointer; font-size:13px;">
            <i class="fa-solid fa-camera"></i> Buka Kamera / Pilih Foto
          </button>
          <div id="previewFotoDatang" style="margin-top:8px; text-align:center; font-size:11px; opacity:0.6;">Tidak ada foto (opsional)</div>
        </div>
        <button class="btn-submit" onclick="submitBarangDatang()" ${tools.length === 0 ? 'disabled' : ''} style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white;">
          <i class="fa-solid fa-circle-plus"></i> Simpan Barang Datang
        </button>
      </div>

      <div class="card" style="border-top: 4px solid #64748b; margin-bottom:15px; padding:12px;">
        <div class="section-title" style="color:#cbd5e1; font-size:13px; margin-bottom:10px;"><i class="fa-solid fa-filter"></i> Filter Riwayat Penerimaan</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
          <div class="filter-input" style="padding:4px 8px;"><input type="month" id="fDatangBulan" onchange="jalankanFilterMultiDatang()"></div>
          <div class="filter-input" style="padding:4px 8px;">
            <select id="fDatangJenis" onchange="jalankanFilterMultiDatang()">
              <option value="ALL">-- Semua Jenis --</option>
              <option value="Manual">Manual</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>
        </div>
        <div class="filter-input" style="padding:4px 8px;">
          <select id="fDatangItem" onchange="jalankanFilterMultiDatang()">
            <option value="ALL">-- Semua Item Barang --</option>
            ${optionsFilterItem}
          </select>
        </div>
      </div>

      <div class="card" style="padding:10px;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; color:#f8fafc; font-size:12px;">
            <thead>
              <tr style="background:#1e293b; color:#94a3b8; border-bottom:2px solid #334155;">
                <th style="padding:8px;">Tgl</th>
                <th style="padding:8px;">Nama Barang / Kategori</th>
                <th style="padding:8px; text-align:center;">Qty</th>
                <th style="padding:8px;">User</th>
                <th style="padding:8px; text-align:center;">Foto</th>
              </tr>
            </thead>
            <tbody id="bodyTabelRiwayatDatang"></tbody>
          </table>
        </div>
      </div>
    `;
    jalankanFilterMultiDatang(); // Gambar tabel pertama kali
  }).catch(err => { showLoading(false); handlePeralatanLoadError(err); });
}

// MESIN FILTER DATA DATANG (CLIENT-SIDE)
function jalankanFilterMultiDatang() {
  let fBulan = document.getElementById("fDatangBulan").value; 
  let fJenis = document.getElementById("fDatangJenis").value;
  let fItem = document.getElementById("fDatangItem").value;
  
  let dataFilter = cacheRiwayatPeralatan.datang.filter(row => {
    if (fBulan && row.tanggalRaw) {
      let rBulan = row.tanggalRaw.substring(0, 7); 
      if (rBulan !== fBulan) return false;
    }
    if (fJenis !== "ALL" && row.jenis !== fJenis) return false;
    if (fItem !== "ALL" && row.nama !== fItem) return false;
    return true;
  });

  let htmlBody = dataFilter.map(r => {
    let linkFoto = r.foto !== "-" && r.foto !== "" ? `<a href="${r.foto}" target="_blank" style="color:#22c55e; font-weight:bold;"><i class="fa-solid fa-image"></i> Lihat</a>` : `<span style="opacity:0.3">-</span>`;
    return `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:8px; opacity:0.8;">${r.tanggal}</td>
        <td style="padding:8px;"><b style="color:#fff;">${r.nama}</b><br><span style="font-size:10px; color:#fbbf24;">[${r.jenis || 'Manual'}]</span></td>
        <td style="padding:8px; text-align:center; color:#22c55e; font-weight:bold;">+${String(r.qty)}</td>
        <td style="padding:8px; opacity:0.8;">${r.user}</td>
        <td style="padding:8px; text-align:center;">${linkFoto}</td>
      </tr>
    `;
  }).join("");

  if (dataFilter.length === 0) htmlBody = `<tr><td colspan="5" style="text-align:center; padding:20px; opacity:0.4;">Tidak ada riwayat transaksi yang cocok dengan filter.</td></tr>`;
  document.getElementById("bodyTabelRiwayatDatang").innerHTML = htmlBody;
}

// ================= TAB 2: FORM & RIWAYAT PEMUSNAHAN LENGKAP =================
function loadFormPemusnahan() {
  globalFotoMusnahBase64 = ""; 
  showLoading(true);

  Promise.all([
    api({ action: "getPeralatan" }),
    api({ action: "getRiwayatPeralatan" })
  ]).then(([tools, riwayat]) => {
    showLoading(false);
    if (!Array.isArray(tools)) tools = [];
    cacheRiwayatPeralatan.musnah = riwayat.musnah || [];

    let optionsForm = tools.map(t => `<option value="${t[1]}">${t[1]}</option>`).join("");
    let optionsFilterItem = tools.map(t => `<option value="${t[1]}">${t[1]}</option>`).join("");
    if (tools.length === 0) optionsForm = `<option value="" disabled selected>Belum ada alat terdaftar!</option>`;

    document.getElementById("peralatanSubContent").innerHTML = `
      <div class="card" style="border-top: 4px solid #ef4444; margin-bottom: 20px;">
        <div class="section-title" style="color: #ef4444;">Pemusnahan Alat (Arsip Dokumen Afkir)</div>
        <div class="form-field" style="margin-bottom:12px">
          <label>Nama Peralatan yang Dimusnahkan</label>
          <select id="musnahNamaAlat">${optionsForm}</select>
        </div>
        <div class="form-field" style="margin-bottom:12px">
          <label>Jumlah Dibuang (Qty)</label>
          <input id="musnahQty" type="number" placeholder="0" min="1">
        </div>
        <div class="form-field" style="margin-bottom:20px">
          <label>Ambil Foto Bukti Pemusnahan (Opsional)</label>
          <input id="musnahFotoKamera" type="file" accept="image/*" capture="environment" style="display:none;" onchange="handleFotoMusnahChange(this)">
          <button type="button" onclick="document.getElementById('musnahFotoKamera').click()" style="width:100%; padding:11px; background:#475569; border:none; color:white; border-radius:8px; cursor:pointer; font-size:13px;">
            <i class="fa-solid fa-camera"></i> Buka Kamera / Pilih Foto
          </button>
          <div id="previewFotoMusnah" style="margin-top:8px; text-align:center; font-size:11px; opacity:0.6;">Tidak ada foto (opsional)</div>
        </div>
        // GANTI BARIS 1351 DENGAN KODE AMAN INI:
<button class="btn-submit" onclick="submitPemusnahan()" ${tools.length === 0 ? 'disabled' : ''} style="background: linear-gradient(to bottom right, #ef4444, #dc2626); color: white;">
  <i class="fa-solid fa-trash-can"></i> Simpan Dokumen Pemusnahan
</button>
          <i class="fa-solid fa-trash-can"></i> Simpan Dokumen Pemusnahan
        </button>
      </div>

      <div class="card" style="border-top: 4px solid #64748b; margin-bottom:15px; padding:12px;">
        <div class="section-title" style="color:#cbd5e1; font-size:13px; margin-bottom:10px;"><i class="fa-solid fa-filter"></i> Filter Riwayat Pemusnahan</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
          <div class="filter-input" style="padding:4px 8px;"><input type="month" id="fMusnahBulan" onchange="jalankanFilterMultiMusnah()"></div>
          <div class="filter-input" style="padding:4px 8px;">
            <select id="fMusnahJenis" onchange="jalankanFilterMultiMusnah()">
              <option value="ALL">-- Semua Jenis --</option>
              <option value="Manual">Manual</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>
        </div>
        <div class="filter-input" style="padding:4px 8px;">
          <select id="fMusnahItem" onchange="jalankanFilterMultiMusnah()">
            <option value="ALL">-- Semua Item Barang --</option>
            ${optionsFilterItem}
          </select>
        </div>
      </div>

      <div class="card" style="padding:10px;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; color:#f8fafc; font-size:12px;">
            <thead>
              <tr style="background:#1e293b; color:#94a3b8; border-bottom:2px solid #334155;">
                <th style="padding:8px;">Tgl</th>
                <th style="padding:8px;">Nama Barang / Kategori</th>
                <th style="padding:8px; text-align:center;">Qty</th>
                <th style="padding:8px;">User</th>
                <th style="padding:8px; text-align:center;">Foto</th>
              </tr>
            </thead>
            <tbody id="bodyTabelRiwayatMusnah"></tbody>
          </table>
        </div>
      </div>
    `;
    jalankanFilterMultiMusnah(); 
  }).catch(err => { showLoading(false); handlePeralatanLoadError(err); });
}

// MESIN FILTER DATA PEMUSNAHAN (CLIENT-SIDE)
function jalankanFilterMultiMusnah() {
  let fBulan = document.getElementById("fMusnahBulan").value; 
  let fJenis = document.getElementById("fMusnahJenis").value;
  let fItem = document.getElementById("fMusnahItem").value;
  
  let dataFilter = cacheRiwayatPeralatan.musnah.filter(row => {
    if (fBulan && row.tanggalRaw) {
      let rBulan = row.tanggalRaw.substring(0, 7);
      if (rBulan !== fBulan) return false;
    }
    if (fJenis !== "ALL" && row.jenis !== fJenis) return false;
    if (fItem !== "ALL" && row.nama !== fItem) return false;
    return true;
  });

  let htmlBody = dataFilter.map(r => {
    let linkFoto = r.foto !== "-" && r.foto !== "" ? `<a href="${r.foto}" target="_blank" style="color:#ef4444; font-weight:bold;"><i class="fa-solid fa-image"></i> Lihat</a>` : `<span style="opacity:0.4">-</span>`;
    return `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:8px; opacity:0.8;">${r.tanggal}</td>
        <td style="padding:8px;"><b style="color:#fff;">${r.nama}</b><br><span style="font-size:10px; color:#fbbf24;">[${r.jenis || 'Manual'}]</span></td>
        <td style="padding:8px; text-align:center; color:#ef4444; font-weight:bold;">-${String(r.qty)}</td>
        <td style="padding:8px; opacity:0.8;">${r.user}</td>
        <td style="padding:8px; text-align:center;">${linkFoto}</td>
      </tr>
    `;
  }).join("");

  if (dataFilter.length === 0) htmlBody = `<tr><td colspan="5" style="text-align:center; padding:20px; opacity:0.4;">Tidak ada riwayat transaksi yang cocok dengan filter.</td></tr>`;
  document.getElementById("bodyTabelRiwayatMusnah").innerHTML = htmlBody;
}

function handleFotoDatangChange(input) {
  const p = document.getElementById("previewFotoDatang");
  p.innerHTML = "🔄 Sedang mengkompres gambar...";
  prosesKompresiKamera(input, function(base64) {
    globalFotoDatangBase64 = base64;
    p.innerHTML = `🟢 <b>Foto Berhasil Diproses!</b><br><img src="${base64}" style="max-width:120px; border-radius:6px; margin-top:5px; border:2px solid #22c55e;">`;
  });
}

function submitBarangDatang() {
  let nama_alat = document.getElementById("datangNamaAlat").value;
  let qty = document.getElementById("datangQty").value;
  if (!qty) return showToast("Harap isi Jumlah Masuk (Qty) terlebih dahulu!", "error");

  showLoading(true);
  api({
    action: "saveOpnamePeralatan", jenis_transaksi: "Datang", area: "Gudang Utama",
    nama_alat, qty_bagus: qty, qty_rusak: 0, 
    foto_base64: globalFotoDatangBase64, 
    user: user.nama
  }).then(() => {
    showLoading(false);
    showToast("Data penerimaan barang berhasil disimpan!", "success");
    loadFormBarangDatang(); 
  });
}

function handleFotoMusnahChange(input) {
  const p = document.getElementById("previewFotoMusnah");
  p.innerHTML = "🔄 Sedang mengkompres gambar...";
  prosesKompresiKamera(input, function(base64) {
    globalFotoMusnahBase64 = base64;
    p.innerHTML = `🟢 <b>Foto Berhasil Diproses!</b><br><img src="${base64}" style="max-width:120px; border-radius:6px; margin-top:5px; border:2px solid #ef4444;">`;
  });
}

function submitPemusnahan() {
  let nama_alat = document.getElementById("musnahNamaAlat").value;
  let qty = document.getElementById("musnahQty").value;
  if (!qty) return showToast("Harap isi Jumlah yang Dimusnahkan (Qty)!", "error");
  if (!confirm("Konfirmasi simpan dokumen pemusnahan fisik? Barang keluar dari gedung secara permanen.")) return;

  showLoading(true);
  api({
    action: "savePemusnahanPeralatan",
    nama_alat, qty_dimusnahkan: qty, 
    foto_base64: globalFotoMusnahBase64, 
    user: user.nama
  }).then(() => {
    showLoading(false);
    showToast("Dokumen arsip pemusnahan berhasil dicatat!", "success");
    loadFormPemusnahan();
  });
}

// VARIABEL GLOBAL BARU UNTUK MENAMPUNG KERANJANG OPNAME SEMENTARA DI HP
let keranjangOpnameArea = [];

// 1. REKONSTRUKSI TAMPILAN FORM OPNAME MULTI-ITEM
function loadFormOpnamePeralatan() {
  keranjangOpnameArea = []; // Reset keranjang setiap kali form dibuka
  
  api({ action: "getPeralatan" }).then(tools => {
    if (!Array.isArray(tools)) tools = [];
    let optionsAlat = tools.map(t => `<option value="${t[1]}">${t[1]} [${t[2]}]</option>`).join("");
    if (tools.length === 0) optionsAlat = `<option value="" disabled selected>Belum ada alat terdaftar!</option>`;

    document.getElementById("peralatanSubContent").innerHTML = `
      <div class="card" style="border-top: 4px solid #fbbf24; margin-bottom: 15px;">
        <div class="section-title" style="color: #fbbf24;"><i class="fa-solid fa-location-dot"></i> Langkah 1: Pilih Area Kerja Janitor</div>
        <div class="form-field">
          <select id="opnameArea" onchange="checkAreaAvailability()">
            <option value="Janitor BM">Janitor BM</option>
            <option value="Janitor GF">Janitor GF</option>
            <option value="Janitor UG">Janitor UG</option>
            <option value="Janitor Lt 2">Janitor Lt 2</option>
            <option value="Janitor Foodcourt">Janitor Foodcourt</option>
            <option value="Gudang">Gudang</option>
            <option value="Office HK">Office HK</option>
          </select>
        </div>
        <div id="opnameLockNotice" style="display:none; margin-top:10px; padding:10px; background:rgba(239,68,68,0.15); border:1px solid #ef4444; border-radius:8px; font-size:12px; color:#f87171;"></div>
      </div>

      <div id="opnameFieldsBlock">
        <div class="card" style="border-top: 4px solid #38bdf8; margin-bottom: 15px;">
          <div class="section-title" style="color: #38bdf8;"><i class="fa-solid fa-rectangle-list"></i> Langkah 2: Masukkan Alat & Qty</div>
          <div class="form-field" style="margin-bottom:12px">
            <label>Nama Peralatan</label>
            <select id="opnameNamaAlat">${optionsAlat}</select>
          </div>
          <div class="row-2" style="margin-bottom:15px">
            <div class="form-field">
              <label>Kondisi Bagus</label>
              <input id="opnameQtyBagus" type="number" placeholder="0" min="0">
            </div>
            <div class="form-field">
              <label>Kondisi Rusak</label>
              <input id="opnameQtyRusak" type="number" placeholder="0" min="0">
            </div>
          </div>
          <button type="button" onclick="tambahItemKeKeranjangOpname()" style="width:100%; padding:10px; background:#38bdf8; border:none; color:#0f172a; border-radius:8px; font-weight:bold; cursor:pointer; font-size:12px;">
            <i class="fa-solid fa-plus"></i> Masukkan ke Daftar Tunggu
          </button>
        </div>

        <div class="card" style="border-top: 4px solid #cbd5e1;">
          <div class="section-title" style="color: #cbd5e1; font-size:13px;"><i class="fa-solid fa-basket-shopping"></i> Daftar Alat yang Siap Disimpan</div>
          <div style="overflow-x:auto; margin-bottom:15px;">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:12px; color:#e2e8f0;">
              <thead>
                <tr style="border-bottom:1px solid #475569; color:#94a3b8;">
                  <th style="padding:6px;">Nama Item</th>
                  <th style="padding:6px; text-align:center;">Bagus</th>
                  <th style="padding:6px; text-align:center;">Rusak</th>
                  <th style="padding:6px; text-align:center;">Aksi</th>
                </tr>
              </thead>
              <tbody id="bodyKeranjangOpname">
                <tr><td colspan="4" style="text-align:center; padding:15px; opacity:0.4;">Belum ada item dimasukkan.</td></tr>
              </tbody>
            </table>
          </div>
          <button id="btnSubmitOpname" class="btn-submit" onclick="submitOpnamePeralatan()" disabled style="background: linear-gradient(135deg, #fbbf24, #d97706); color: #0f172a; font-weight:bold;">
            <i class="fa-solid fa-cloud-arrow-up"></i> Simpan Semua Alat (<span id="countKeranjang">0</span>)
          </button>
        </div>
      </div>
    `;
    checkAreaAvailability();
  }).catch(err => handlePeralatanLoadError(err));
}

// FUNGSI BARU: MEMASUKKAN DATA LIST KE KERANJANG SEMENTARA SISI HP
function tambahItemKeKeranjangOpname() {
  let nama_alat = document.getElementById("opnameNamaAlat").value;
  let qty_bagus = parseInt(document.getElementById("opnameQtyBagus").value) || 0;
  let qty_rusak = parseInt(document.getElementById("opnameQtyRusak").value) || 0;

  if (qty_bagus === 0 && qty_rusak === 0) {
    return showToast("Isi Qty Bagus atau Rusak terlebih dahulu!", "error");
  }

  // Cek jika item tersebut sudah pernah dimasukkan, kita update Qty-nya biar tidak double row
  let indeksAda = keranjangOpnameArea.findIndex(item => item.nama_alat === nama_alat);
  if (indeksAda !== -1) {
    keranjangOpnameArea[indeksAda].qty_bagus = qty_bagus;
    keranjangOpnameArea[indeksAda].qty_rusak = qty_rusak;
  } else {
    keranjangOpnameArea.push({ nama_alat, qty_bagus, qty_rusak });
  }

  // Reset field input qty agar staf bisa pilih alat lain
  document.getElementById("opnameQtyBagus").value = "";
  document.getElementById("opnameQtyRusak").value = "";
  
  renderTabelKeranjangOpname();
  showToast("Item berhasil ditambahkan ke daftar tunggu", "success");
}

// FUNGSI BARU: MENGGAMBAR BARIS TABEL DAFTAR TUNGGU
function renderTabelKeranjangOpname() {
  const tbody = document.getElementById("bodyKeranjangOpname");
  const btnSubmit = document.getElementById("btnSubmitOpname");
  const countBadge = document.getElementById("countKeranjang");
  
  if (keranjangOpnameArea.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; opacity:0.4;">Belum ada item dimasukkan.</td></tr>`;
    btnSubmit.disabled = true;
    countBadge.textContent = "0";
    return;
  }

  let html = keranjangOpnameArea.map((item, idx) => `
    <tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:8px; font-weight:600; color:#fff;">${item.nama_alat}</td>
      <td style="padding:8px; text-align:center; color:#38bdf8; font-weight:bold;">${item.qty_bagus}</td>
      <td style="padding:8px; text-align:center; color:#f87171; font-weight:bold;">${item.qty_rusak}</td>
      <td style="padding:8px; text-align:center;">
        <button onclick="hapusItemDariKeranjangOpname(${idx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:14px;"><i class="fa-solid fa-square-minus"></i></button>
      </td>
    </tr>
  `).join("");

  tbody.innerHTML = html;
  btnSubmit.disabled = false;
  countBadge.textContent = keranjangOpnameArea.length;
}

function hapusItemDariKeranjangOpname(index) {
  keranjangOpnameArea.splice(index, 1);
  renderTabelKeranjangOpname();
}

function checkAreaAvailability() {
  let area = document.getElementById("opnameArea").value;
  let noticeBox = document.getElementById("opnameLockNotice");
  let blockFields = document.getElementById("opnameFieldsBlock");
  let isSupervisor = (user?.jabatan === "Supervisor" || user?.jabatan === "HO");

  api({ action: "checkAreaOpname", area: area }).then(res => {
    if (res.status === "blocked") {
      noticeBox.innerHTML = `⚠️ <b>AREA SUDAH DI-OPNAME!</b><br>Area ini sudah dihitung oleh <b>${res.user}</b>.`;
      noticeBox.style.display = "block";
      
      if (!isSupervisor) {
        blockFields.style.opacity = "0.3";
        blockFields.style.pointerEvents = "none"; // Matikan semua interaksi form
        showToast("Area terkunci! Staf tidak bisa double input bulan ini.", "error");
      } else {
        noticeBox.innerHTML += `<br><span style="color:#fbbf24;">💡 Mode Supervisor: Akses Terbuka Ekstra Koreksi.</span>`;
        blockFields.style.opacity = "1";
        blockFields.style.pointerEvents = "auto";
      }
    } else {
      noticeBox.style.display = "none";
      blockFields.style.opacity = "1";
      blockFields.style.pointerEvents = "auto";
    }
  });
}

// 2. MODIFIKASI FUNGSI SUBMIT MENJADI SISTEM MASAL (BULK UPLOAD)
function submitOpnamePeralatan() {
  let area = document.getElementById("opnameArea").value;
  if (keranjangOpnameArea.length === 0) return showToast("Daftar tunggu masih kosong!", "error");
  if (!confirm(`Kirim sekaligus ${keranjangOpnameArea.length} data opname untuk area ${area}?`)) return;

  showLoading(true);
  api({
    action: "saveOpnamePeralatan",
    jenis_transaksi: "Opname",
    is_bulk: true,
    area: area,
    items: keranjangOpnameArea, // Kirim array objek utuh
    user: user.nama
  }).then((res) => {
    showLoading(false);
    showToast(res.message || "Seluruh data area berhasil disimpan!", "success");
    loadFormOpnamePeralatan(); // Reset form & kosongkan keranjang kembali
  }).catch(() => showLoading(false));
}

function loadLaporanPeralatan() {
  document.getElementById("peralatanSubContent").innerHTML = `
    <div class="card">
      <div class="section-title">Tarik Rekapan & Tekapan Bulanan</div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
        <div class="filter-input" style="padding:4px 10px;"><input type="date" id="lapMulai"></div>
        <div class="filter-input" style="padding:4px 10px;"><input type="date" id="lapSelesai"></div>
      </div>
      <button class="btn-submit" onclick="prosesTarikLaporan()" style="margin-bottom:20px;">
        <i class="fa-solid fa-magnifying-glass"></i> Hitung Rekapan Inventory
      </button>
      <div id="opnameResultList">
        <p style="text-align:center; opacity:0.5; font-size:12px;">Tentukan tanggal periode untuk menghitung data audit</p>
      </div>
    </div>
  `;
}

function prosesTarikLaporan() {
  let startDate = document.getElementById("lapMulai").value;
  let endDate = document.getElementById("lapSelesai").value;
  if (!startDate || !endDate) return showToast("Pilih rentang tanggal lengkap!", "error");
  
  const resultBox = document.getElementById("opnameResultList");
  resultBox.innerHTML = `<p style='text-align:center; padding:20px;'>🔄 Sedang menghitung tabel rekapan...</p>`;
  
  api({ action: "getPeralatan" }).then(tools => {
    if (!Array.isArray(tools)) tools = [];
    
    api({ action: "getOpnameHistory", startDate, endDate }).then(res => {
      let openingStok = res.openingStok || {};
      let addStok = res.addStok || {};
      let areaBagus = res.areaBagus || {};
      let areaRusak = res.areaRusak || {};
      let pemusnahanLog = res.pemusnahanLog || [];

      // Membuka string HTML utama secara bersih
      let htmlResult = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div class="section-title" style="margin:0;"><i class="fa-solid fa-table"></i> REKAPAN INVENTORY REKONSILIASI</div>
          <button onclick="downloadExcelPeralatan('${startDate}', '${endDate}')" style="background:#107c41; border:none; color:white; padding:6px 12px; border-radius:6px; font-size:11px; cursor:pointer; font-weight:600; display:flex; align-items:center; gap:5px;">
            <i class="fa-solid fa-file-excel" style="font-size:13px;"></i> Export ke Excel
          </button>
        </div>
        
        <div style="overflow-x:auto; max-height:420px; overflow-y:auto; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.08); padding:8px; margin-bottom:25px;">
          <table id="tabelLaporanPeralatan" style="width:100%; border-collapse:collapse; font-size:10px; text-align:left; color:#e2e8f0;">
            <thead style="position: sticky; top: 0; background: #1e293b; z-index: 10;">
              <tr style="border-bottom:2px solid rgba(255,255,255,0.15); color:#fbbf24;">
                <th style="padding:8px;">NAMA BARANG</th>
                <th style="padding:8px; text-align:center;">JENIS PERALATAN</th>
                <th style="padding:8px; text-align:center;">OPENING STOK</th>
                <th style="padding:8px; text-align:center;">ADD STOCK</th>
                <th style="padding:8px; text-align:center;">TOTAL STOCK</th>
                <th style="padding:8px; text-align:center;">OPNAME BAGUS</th>
                <th style="padding:8px; text-align:center;">OPNAME RUSAK</th>
                <th style="padding:8px; text-align:center;">TOTAL INVENTORY</th>
                <th style="padding:8px; text-align:center;">SELISIH</th>
                <th style="padding:8px; text-align:center; color:#67e8f9;">CLOSING INVENTORY</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Melakukan looping data baris item barang
      tools.forEach(t => {
        let item = t[1]; 
        let jenis = t[2] || "Manual"; 
        let opStok = openingStok[item] || 0;
        let adStok = addStok[item] || 0;
        let totStok = opStok + adStok;

        let itemAreasBagus = areaBagus[item] || {};
        let totOpnBagus = Object.values(itemAreasBagus).reduce((a, b) => a + b, 0);

        let itemAreasRusak = areaRusak[item] || {};
        let totOpnRusak = Object.values(itemAreasRusak).reduce((a, b) => a + b, 0);

        let totInventory = totOpnBagus + totOpnRusak;
        let selisih = totInventory - totStok;
        let closingInv = totInventory - totOpnRusak; 

        let selisihColor = selisih < 0 ? '#ef4444' : (selisih > 0 ? '#22c55e' : '#e2e8f0');

        htmlResult += `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
            <td style="padding:6px; font-weight:600; color:#fff;">${item}</td>
            <td style="padding:6px; text-align:center; color:#fbbf24;">${jenis}</td>
            <td style="padding:6px; text-align:center; opacity:0.6;">${opStok}</td>
            <td style="padding:6px; text-align:center; color:#22c55e;">+${adStok}</td>
            <td style="padding:6px; text-align:center; font-weight:600;">${totStok}</td>
            <td style="padding:6px; text-align:center; color:#38bdf8;">${totOpnBagus}</td>
            <td style="padding:6px; text-align:center; color:#f87171;">${totOpnRusak}</td>
            <td style="padding:6px; text-align:center; font-weight:600;">${totInventory}</td>
            <td style="padding:6px; text-align:center; font-weight:bold; color:${selisihColor}">${selisih >= 0 ? '+' : ''}${selisih}</td>
            <td style="padding:6px; text-align:center; font-weight:bold; color:#22d3ee; background:rgba(34,211,238,0.05);">${closingInv}</td>
          </tr>
        `;
      });

      // Menutup pembungkus tabel secara terstruktur
      htmlResult += `
            </tbody>
          </table>
        </div>
      `;

      // Membuat bagian lampiran berkas foto pemusnahan di bawahnya
      htmlResult += `<div class="section-title"><i class="fa-solid fa-camera"></i> LAMPIRAN ARSIP BUKTI FOTO PEMUSNAHAN</div>`;
      
      if (pemusnahanLog.length === 0) {
        htmlResult += `<p style="opacity:0.4; font-size:11px; text-align:center; padding:10px;">Tidak ada dokumen pemusnahan fisik pada periode ini</p>`;
      } else {
        htmlResult += pemusnahanLog.map(row => `
          <div class="history-card" style="margin-top:6px; border-left:3px solid #ef4444;">
            <div class="type-dot type-out" style="font-size:9px;">AFKIR</div>
            <div class="hcard-body" style="padding-left:8px;">
              <div class="hcard-item">${row.item}</div>
              <div class="hcard-meta">
                <span class="meta-tag"><i class="fa-solid fa-calendar"></i> ${formatTglDisplay(row.tanggal)}</span>
                <span class="meta-tag"><i class="fa-solid fa-user"></i> ${row.user}</span>
                <span class="meta-tag"><a href="${row.foto_url}" target="_blank" style="color:#fbbf24; text-decoration:underline;"><i class="fa-solid fa-image"></i> Bukti Foto</a></span>
              </div>
            </div>
            <div class="qty-badge" style="color:#ef4444;">-${row.qty}</div>
          </div>
        `).join("");
      }

      // Render hasil akhir ke DOM browser
      resultBox.innerHTML = htmlResult;
    });
  });
}

function downloadExcelPeralatan(tglMulai, tglSelesai) {
  const tabel = document.getElementById("tabelLaporanPeralatan");
  if (!tabel) return showToast("Tabel data tidak ditemukan!", "error");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(tabel);
  const namaFile = `Laporan_Inventory_LivingPlaza_${tglMulai}_ke_${tglSelesai}.xlsx`;
  XLSX.utils.book_append_sheet(wb, ws, "Rekapan Inventory");
  XLSX.writeFile(wb, namaFile);
  showToast("File Excel berhasil diunduh!", "success");
}

function loadKelolaPeralatan() {
  document.getElementById("peralatanSubContent").innerHTML = `
    <button onclick="renderPeralatanMenu()" style="width: 100%; background: #475569; color: white; padding: 10px; border: none; border-radius: 12px; cursor: pointer; font-size: 13px; margin-bottom: 15px; font-weight: bold;">
      <i class="fa-solid fa-arrow-left"></i> Kembali ke Form Logistik
    </button>
    <div class="card" style="border-top: 4px solid #a855f7; margin-bottom: 20px;">
      <div class="section-title" style="color: #a855f7;"><i class="fa-solid fa-square-plus"></i> Tambah Alat Baru ke Sistem</div>
      <div class="form-field" style="margin-bottom:12px">
        <label>Nama Peralatan / Item Baru</label>
        <input id="newMasterNama" type="text" placeholder="Contoh: Mesin Polisher, Tangga Alumunium">
      </div>
      <div class="form-field" style="margin-bottom:12px">
        <label>Jenis Peralatan</label>
        <select id="newMasterJenis">
          <option value="Manual">Manual (Alat Tangan)</option>
          <option value="Mechanical">Mechanical (Mesin/Elektrik)</option>
        </select>
      </div>
      <div class="form-field" style="margin-bottom:20px">
        <label>Satuan Besaran</label>
        <select id="newMasterSatuan">
          <option value="Unit">Unit</option>
          <option value="Pcs">Pcs</option>
          <option value="Botol">Botol</option>
          <option value="Pack">Pack</option>
        </select>
      </div>
      <button class="btn-submit" onclick="submitMasterPeralatanBaru()" style="background: linear-gradient(135deg, #a855f7, #9333ea); color: white;">
        <i class="fa-solid fa-floppy-disk"></i> Daftarkan Alat Baru
      </button>
    </div>
    <div class="card">
      <div class="section-title"><i class="fa-solid fa-list"></i> Daftar Master Alat Saat Ini</div>
      <div id="masterAlatListTable" style="margin-top:10px;"><p style="text-align:center; opacity:0.5; font-size:11px;">Memuat list item...</p></div>
    </div>
  `;
  renderMasterAlatList();
}

function renderMasterAlatList() {
  api({ action: "getPeralatan" }).then(tools => {
    if (!Array.isArray(tools)) tools = [];
    const listTable = document.getElementById("masterAlatListTable");
    if (!listTable) return;
    if (tools.length === 0) {
      listTable.innerHTML = `<p style="text-align:center; opacity:0.5; font-size:12px; padding:15px 0;">Belum ada alat terdaftar</p>`;
      return;
    }
    let html = tools.map(t => `
      <div class="dash-row" style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size:11px; opacity:0.4; display:block;">${t[0]}</span>
          <b style="font-size:13px; color:#fff;">${t[1]}</b> 
          <span style="font-size:11px; color:#fbbf24; margin-left:5px;">[${t[2] || 'Manual'}]</span> 
          <span style="font-size:11px; opacity:0.6;">(${t[3]})</span>
        </div>
        <button onclick="hapusMasterPeralatan('${t[0]}', '${t[1]}')" style="background:#ef4444; border:none; color:white; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;"><i class="fa-solid fa-trash"></i> Hapus</button>
      </div>
    `).join("");
    listTable.innerHTML = html;
  }).catch(() => {
    const listTable = document.getElementById("masterAlatListTable");
    if (listTable) listTable.innerHTML = `<p style="text-align:center; color:#ef4444; font-size:12px;">Gagal memuat data master</p>`;
  });
}

function submitMasterPeralatanBaru() {
  let nama = document.getElementById("newMasterNama").value.trim();
  let jenis = document.getElementById("newMasterJenis").value;
  let satuan = document.getElementById("newMasterSatuan").value;
  if (!nama) return showToast("Nama peralatan tidak boleh kosong!", "error");
  
  showLoading(true);
  api({ action: "addPeralatan", nama: nama, jenis: jenis, satuan: satuan }).then(() => {
    showLoading(false);
    showToast("Item baru berhasil didaftarkan!", "success");
    document.getElementById("newMasterNama").value = "";
    renderMasterAlatList();
  });
}

function hapusMasterPeralatan(id, nama) {
  if (!confirm(`Apakah Anda yakin ingin menghapus "${nama}"? Semua form pilihan barang ini nantinya akan hilang.`)) return;
  showLoading(true);
  api({ action: "deletePeralatan", id: id }).then(() => {
    showLoading(false);
    showToast("Item berhasil dihapus dari master", "success");
    renderMasterAlatList();
  });
}

function handlePeralatanLoadError(err) {
  console.error(err);
  if (typeof showLoading === "function") showLoading(false);
  const subContent = document.getElementById("peralatanSubContent");
  if (subContent) {
    subContent.innerHTML = `
      <div class="card" style="text-align:center; padding:20px; border-top: 4px solid #ef4444;">
        <i class="fa-solid fa-wifi" style="font-size:28px; color:#ef4444; margin-bottom:10px;"></i>
        <b style="display:block; margin-bottom:5px;">Gagal Menghubungkan ke Database</b>
        <span style="font-size:12px; opacity:0.6;">Pastikan koneksi internet aktif dan Google Apps Script sudah dideploy ulang.</span>
      </div>
    `;
  }
}

function prosesKompresiKamera(inputElement, callback) {
  const file = inputElement.files[0];
  if (!file) return callback("");
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      callback(dataUrl);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}
