const API_URL = "https://script.google.com/macros/s/AKfycbzPACE9hT0K1Lom5BxWOqa2WRlYIDa_VlqG_gjeirYLmnlhWbjf_A_IPMobsQ4EOw2l/exec";
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

  loading(target);

  api({ action: "getItems" }).then(items => {

    let options = items.map(i => `
      <option value="${i[0]}" data-satuan="${i[1]}">
        ${i[0]}
      </option>
    `).join("");

    document.getElementById(target).innerHTML = `
      <div class="card">
        <h3>BIN CARD</h3>

        <select id="item" onchange="setSatuan()">
          ${options}
        </select>

        <input id="satuan" readonly>
        <input id="qty" type="number" placeholder="Qty">

        <div class="toggle-group">
          <button id="btnIn" onclick="setType('IN')" class="active">IN</button>
          <button id="btnOut" onclick="setType('OUT')">OUT</button>
        </div>

        <button onclick="submitBin(event)">Submit</button>
      </div>
    `;

    setSatuan();
  });
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
            hideLoading();
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
        hideLoading();
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
        hideLoading();
        showToast("Item diupdate", "success");
        renderItem();
    });
}

function deleteItem(nama) {
    if (!confirm("Hapus item ini?")) return;
    showLoading();
    api({ action: "deleteItem", nama }).then(() => {
        hideLoading();
        showToast("Item dihapus", "success");
        renderItem();
    });
}

// ================= USER =================
function renderUser() {
    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>User Profile</h3>
            <p>Nama: ${user?.nama || "-"}</p>
            <p>NIP: ${user?.nip || "-"}</p>
            <p>Role: ${user?.role || "-"}</p>
        </div>
    `;
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
                    <button onclick="editUser('${u[1]}','${u[0]}','${u[2]}')">✏️</button>
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
        hideLoading();
        showToast("User ditambahkan", "success");
        renderUserManagement();
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
function hideLoading() {
    showLoading(false);
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
    <div class="home-grid">
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
            <div class="dash-row" style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #eee;">
                <b>${d.item}</b>
                <span>${d.stok}</span>
            </div>
        `).join("");
        html += `</div>`;
        document.getElementById("dashboardArea").innerHTML = html;
    });
}

//=====RIWAYAT========
let allHistoryData = []; // Simpan data asli di memori untuk difilter

/**
 * 1. FUNGSI UTAMA: Ambil data dari Apps Script
 */
function renderHistory() {
  const content = document.getElementById("content");
  if (typeof loading === "function") loading();

  api({ action: "getHistory" })
    .then(data => {
      // Simpan data ke variabel global agar bisa difilter tanpa panggil API lagi
      allHistoryData = Array.isArray(data) ? data : [];
      displayHistoryTable(allHistoryData);
    })
    .catch(err => {
      console.error(err);
      content.innerHTML = `<div class="card"><h3 style="color:#ef4444">Error Koneksi</h3><p>${err.message}</p></div>`;
    });
}

/**
 * 2. FUNGSI TAMPILAN: Membuat struktur Card dan Tabel
 */
function displayHistoryTable(data) {
  const content = document.getElementById("content");
  
  let html = `
    <div class="card" style="max-width: 1000px;">
      <div class="card-header-wrapper" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
        <h3 style="margin:0">Riwayat Bin Card</h3>
        
        <div class="search-wrapper" style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
          <i class="fa-solid fa-calendar-alt" style="color: #fbbf24; font-size: 14px;"></i>
          <input type="date" id="searchTgl" onchange="filterHistory()" 
                 style="background: transparent; border: none; color: white; outline: none; cursor: pointer; font-family: 'Poppins', sans-serif; font-size: 13px; height: 35px;">
          <button onclick="resetHistoryFilter()" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 18px; padding: 0 5px;">&times;</button>
        </div>
      </div>
      
      <div style="overflow-x: auto;">
        <table class="table">
          <thead>
            <tr>
              <th class="col-tgl">Tanggal</th>
              <th class="col-wkt">Waktu</th>
              <th class="col-item">Item</th>
              <th class="col-qty">IN</th>
              <th class="col-qty">OUT</th>
              <th class="col-user">User</th>
            </tr>
          </thead>
          <tbody id="historyBody">
            ${renderTableRows(data)}
          </tbody>
        </table>
      </div>
    </div>
  `;
  content.innerHTML = html;
}
/**
 * 3. FUNGSI BANTU: Generate isi baris tabel (TR)
/**
 * 1. FUNGSI UNTUK MERUBAH FORMAT TANGGAL DI TABEL
 */
function renderTableRows(data) {
  if (data.length === 0) return `<tr><td colspan="6" style="text-align:center; padding: 20px;">Data tidak ditemukan</td></tr>`;
  
  return data.map(row => {
    let tglOri = row.tanggal || '-';
    let tglTampil = tglOri;

    // Jika format dari Apps Script TTTT-MM-DD, ubah ke DD/MM/YYYY
    if (tglOri.includes('-')) {
        const bagian = tglOri.split(' ')[0].split('-'); 
        if (bagian.length === 3) {
            tglTampil = `${bagian[2]}/${bagian[1]}/${bagian[0]}`;
        }
    }

    return `
    <tr>
      <td class="col-tgl" style="font-size: 11px;">${tglTampil}</td>
      <td class="col-wkt" style="font-size: 11px;">${row.waktu || '-'}</td>
      <td class="col-item"><b>${row.item || '-'}</b></td>
      <td class="col-qty" style="color: #22c55e; font-weight: bold;">${row.in || 0}</td>
      <td class="col-qty" style="color: #ef4444; font-weight: bold;">${row.out || 0}</td>
      <td class="col-user" style="font-size: 11px; opacity: 0.8;">${row.user || '-'}</td>
    </tr>
    `;
  }).join('');
}

/**
 * 2. FUNGSI FILTER YANG DISINKRONKAN
 */
function filterHistory() {
  const inputVal = document.getElementById("searchTgl").value; // Format: YYYY-MM-DD
  if (!inputVal) {
    resetHistoryFilter();
    return;
  }

  // Langkah 1: Ubah input kalender (2026-05-07) jadi (07/05/2026)
  const p = inputVal.split('-');
  const searchString = `${p[2]}/${p[1]}/${p[0]}`;
  
  console.log("Mencari tanggal:", searchString); // Cek di F12 apakah formatnya sudah bener

  // Langkah 2: Filter data asli
  const filtered = allHistoryData.filter(row => {
    let tglData = row.tanggal || '';
    
    // Samakan format data di memori dengan format pencarian
    if (tglData.includes('-')) {
        const d = tglData.split(' ')[0].split('-');
        tglData = `${d[2]}/${d[1]}/${d[0]}`;
    }
    
    return tglData.includes(searchString);
  });
  
  // Langkah 3: Update isi tabel
  document.getElementById("historyBody").innerHTML = renderTableRows(filtered);
}

/**
 * 5. FUNGSI LOGIKA: Reset pencarian
 */
function resetHistoryFilter() {
  document.getElementById("searchTgl").value = "";
  document.getElementById("historyBody").innerHTML = renderTableRows(allHistoryData);
}

// Memastikan loading mati saat halaman selesai dimuat
window.addEventListener('load', function() {
    showLoading(false);
});
// Paksa loading mati setelah semua script selesai dibaca
setTimeout(() => {
    const loader = document.getElementById("loading-overlay");
    if (loader) {
        loader.style.setProperty('display', 'none', 'important');
    }
}, 100);
