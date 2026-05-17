const SS_ID = "1iSB4YXopAnfzKl6M1Z0j4veO4wG1jKmYDfy06IdDMdA";

// ================= API ENTRY =================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    switch (data.action) {
      case "login": return json(loginUser(data));
      case "register": return json(registerUser(data));
      case "getItems": return json(getItems());
      case "getAllItems": return json(getAllItems());
      case "addItem": return json(addItem(data));
      case "updateItem": return json(updateItem(data));
      case "deleteItem": return json(deleteItem(data.nama));
      case "getUsers": return json(getAllUsers());
      case "deleteUser": return json(deleteUser(data.nip)); 
      case "updateUser": return json(updateUser(data));
      case "saveBinCard": return json(saveBinCard(data));
      case "changePassword": return json(changePassword(data));
      case "getStockMonthly": return json(getStockMonthly());
      case "getDashboard": return json(getDashboard(data));
      case "getHistory": return json(getHistory()); 

      // ================= MODUL PERALATAN UTUH (REKONSILIASI + KATEGORI) =================
      case "getPeralatan": 
        return json(getPeralatanData());
      case "addPeralatan": 
        return json(addPeralatanData(data));
      case "deletePeralatan": 
        return json(deletePeralatanData(data));
      case "saveOpnamePeralatan": 
        return json(saveOpnamePeralatanData(data));
      case "checkAreaOpname":
        return json(checkAreaOpnameData(data.area));
      case "savePemusnahanPeralatan":
        return json(savePemusnahanPeralatanData(data));
      case "getOpnameHistory": 
        return json(getOpnameHistoryData(data.startDate, data.endDate));
      case "getRiwayatPeralatan" :
      return json(getRiwayatPeralatan())
        
      default:
        return json({ status: "error", message: "unknown action" });
    }
  } catch (err) {
    return json({ status: "error", message: err.toString() });
  }
}

// FUNGSI UTAMA RESPONS JSON
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

// ================= LOGIKA PROSES UTUH DI GOOGLE SHEETS =================

function getPeralatanData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Peralatan");
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  return sheet.getRange(2, 1, lastRow - 1, 4).getValues(); // Mengambil 4 kolom penuh
}

function addPeralatanData(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Peralatan");
  var id = "ALT-" + Utilities.getUuid().substring(0,5).toUpperCase();
  sheet.appendRow([id, data.nama, data.jenis, data.satuan]); // Kolom C diisi jenis alat
  return { status: "success" };
}

function deletePeralatanData(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Peralatan");
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == data.id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { status: "success" };
}

function checkAreaOpnameData(area) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("OpnamePeralatan");
  if (!sheet) return { status: "available" };
  
  var values = sheet.getDataRange().getValues();
  var currentMonth = Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM");
  
  for (var i = 1; i < values.length; i++) {
    var rowDate = Utilities.formatDate(new Date(values[i][1]), "GMT+8", "yyyy-MM");
    if (rowDate === currentMonth && values[i][2] === "Opname" && values[i][3] === area) {
      return { 
        status: "blocked", 
        user: values[i][7], 
        tanggal: Utilities.formatDate(new Date(values[i][1]), "GMT+8", "dd/MM/yyyy") 
      };
    }
  }
  return { status: "available" };
}

function saveOpnamePeralatanData(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("OpnamePeralatan");
  var idLog = "LOG-" + Utilities.getUuid().substring(0,5).toUpperCase();
  var wibDate = Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
  
  // Jika ada kiriman data foto Base64, upload dulu ke Google Drive
  var finalFotoUrl = "";
  if (data.foto_base64 && data.foto_base64.slice(0, 4) === "data") {
    finalFotoUrl = uploadFotoKeDrive(data.foto_base64, "Opname_" + idLog);
  }
  
  // Susun ke baris Google Sheets. Kolom foto kita selipkan atau sesuaikan. 
  // Agar tidak merusak struktur 8 kolom kamu, kita masukkan link foto di kolom terakhir setelah user, atau sesuaikan urutannya.
  // Catatan: Jika ingin menambahkan kolom foto khusus di sheet OpnamePeralatan, pastikan baris headernya disesuaikan.
  sheet.appendRow([
    idLog, 
    wibDate, 
    data.jenis_transaksi, 
    data.area, 
    data.nama_alat, 
    Number(data.qty_bagus), 
    Number(data.qty_rusak), 
    data.user + " | Foto: " + finalFotoUrl // Disatukan di kolom user jika tidak mau tambah kolom, atau kamu bisa buat kolom ke-9 khusus foto
  ]);
  return { status: "success" };
}

function savePemusnahanPeralatanData(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pemusnahan");
  var idMusnah = "MSN-" + Utilities.getUuid().substring(0,5).toUpperCase();
  var wibDate = Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
  
  // Upload foto pemusnahan ke Google Drive
  var finalFotoUrl = "";
  if (data.foto_base64 && data.foto_base64.slice(0, 4) === "data") {
    finalFotoUrl = uploadFotoKeDrive(data.foto_base64, "Pemusnahan_" + idMusnah);
  }
  
  sheet.appendRow([
    idMusnah, 
    wibDate, 
    data.nama_alat, 
    Number(data.qty_dimusnahkan), 
    finalFotoUrl, // Menyimpan Link otomatis dari Google Drive
    data.user
  ]);
  return { status: "success" };
}

// FUNGSI BARU: OTOMATIS MEMBUAT FOLDER & UPLOAD FOTO KE GOOGLE DRIVE
function uploadFotoKeDrive(base64Data, namaFile) {
  try {
    // 1. Cari atau buat folder bernama "Foto_Logistik_Peralatan" di Google Drive kamu
    var folderName = "Foto_Logistik_Peralatan";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    // 2. Bersihkan format Base64 header teks
    var splitData = base64Data.split(",");
    var contentType = splitData[0].match(/:(.*?);/)[1];
    var rawBase64 = splitData[1];
    
    // 3. Ubah teks menjadi file gambar asli dan simpan ke folder
    var decoded = Utilities.base64Decode(rawBase64);
    var blob = Utilities.newBlob(decoded, contentType, namaFile + ".jpg");
    var file = folder.createFile(blob);
    
    // 4. Setel akses file agar bisa dilihat oleh siapapun yang memiliki link (Penting agar link bisa dibuka di Web App)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl(); // Mengembalikan link URL Google Drive resmi
  } catch (e) {
    return "Error Upload: " + e.toString();
  }
}
function getOpnameHistoryData(startDate, endDate) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetLog = ss.getSheetByName("OpnamePeralatan");
  var sheetMusnah = ss.getSheetByName("Pemusnahan");
  
  var logValues = sheetLog ? sheetLog.getDataRange().getValues() : [];
  if (logValues.length > 0) logValues.shift();
  
  var musnahValues = sheetMusnah ? sheetMusnah.getDataRange().getValues() : [];
  if (musnahValues.length > 0) musnahValues.shift();

  var formatDateStr = function(dStr) { return Utilities.formatDate(new Date(dStr), "GMT+8", "yyyy-MM-dd"); };

  var openingStokMap = {};
  var addStokBulanIniMap = {};
  
  logValues.forEach(function(row) {
    var rowDateStr = formatDateStr(row[1]);
    var type = row[2];
    var item = row[4];
    var qBagus = Number(row[5] || 0);

    if (!openingStokMap[item]) openingStokMap[item] = 0;
    if (!addStokBulanIniMap[item]) addStokBulanIniMap[item] = 0;

    if (startDate && rowDateStr < startDate) {
      if (type === "Datang") openingStokMap[item] += qBagus;
    } else if (startDate && endDate && rowDateStr >= startDate && rowDateStr <= endDate) {
      if (type === "Datang") addStokBulanIniMap[item] += qBagus;
    }
  });

  var areaBagusMap = {};
  var areaRusakMap = {};

  logValues.forEach(function(row) {
    var rowDateStr = formatDateStr(row[1]);
    var type = row[2];
    var area = row[3];
    var item = row[4];
    var qBagus = Number(row[5] || 0);
    var qRusak = Number(row[6] || 0);

    if (startDate && endDate && rowDateStr >= startDate && rowDateStr <= endDate && type === "Opname") {
      if (!areaBagusMap[item]) areaBagusMap[item] = {};
      if (!areaRusakMap[item]) areaRusakMap[item] = {};
      areaBagusMap[item][area] = qBagus;
      areaRusakMap[item][area] = qRusak;
    }
  });

  var filteredMusnah = [];
  musnahValues.forEach(function(row) {
    var rowDateStr = formatDateStr(row[1]);
    if (startDate && endDate && rowDateStr >= startDate && rowDateStr <= endDate) {
      filteredMusnah.push({
        id_musnah: row[0], tanggal: rowDateStr, item: row[2], qty: row[3], foto_url: row[4], user: row[5]
      });
    }
  });

  return {
    openingStok: openingStokMap, addStok: addStokBulanIniMap,
    areaBagus: areaBagusMap, areaRusak: areaRusakMap, pemusnahanLog: filteredMusnah
  };
}

// ================= JSON RESPONSE =================
function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================= LOGIN =================
function loginUser(data) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("Users");
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {

    if (
      String(rows[i][1]).trim() == String(data.username).trim() &&
      String(rows[i][3]).trim() == String(data.password).trim() &&
      rows[i][5] == "aktif"
    ) {

      return {
        status: "success",
        nama: rows[i][0],
        nip: rows[i][1],
        jabatan: rows[i][2],
        role: rows[i][4]
      };
    }
  }

  return { status: "error" };
}

// ================= REGISTER =================
function registerUser(data) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("Users");

  let jabatan = (data.jabatan || "").toLowerCase().trim();
  let role = (jabatan === "ho" || jabatan === "supervisor") ? "admin" : "staff";

  sheet.appendRow([
    data.nama,
    data.nip,
    data.jabatan,
    data.password,
    role,
    "aktif"
  ]);

  return { status: "success" };
}

// ================= ITEMS =================
function getItems() {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("ITEM");
  var data = sheet.getDataRange().getValues();
  data.shift();
  return data;
}

function getAllItems() {
  return getItems();
}

function addItem(data) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("ITEM");

  sheet.appendRow([
    data.nama,
    data.satuan
  ]);

  return { status: "success" };
}

function updateItem(data) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("ITEM");
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.oldNama) {

      sheet.getRange(i + 1, 1).setValue(data.nama);
      sheet.getRange(i + 1, 2).setValue(data.satuan);

      return { status: "success" };
    }
  }

  return { status: "error" };
}

function deleteItem(nama) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("ITEM");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == nama) {
      sheet.deleteRow(i + 1);
      return { status: "success" };
    }
  }

  return { status: "error" };
}

// ================= BIN CARD =================
function saveBinCard(data) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("BIN CARD");

  var now = new Date();
  var tanggal = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var waktu = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");

  sheet.appendRow([
    tanggal,
    waktu,
    data.item,
    data.satuan,
    data.tipe === "IN" ? data.qty : "",
    data.tipe === "OUT" ? data.qty : "",
    data.user
  ]);

  return { status: "success" };
}

// ================= USERS =================
function getAllUsers() {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("Users");
  var data = sheet.getDataRange().getValues();
  data.shift();
  return data;
}

function deleteUser(nip) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][1] == nip) {
      sheet.deleteRow(i + 1);
      return { status: "success" };
    }
  }

  return { status: "error" };
}

function updateUser(data) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("Users");
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {

    if (rows[i][1] == data.nip) {

      sheet.getRange(i + 1, 1).setValue(data.nama);
      sheet.getRange(i + 1, 3).setValue(data.jabatan);

      let jabatan = data.jabatan.toLowerCase().trim();
      let role = (jabatan === "ho" || jabatan === "supervisor") ? "admin" : "staff";

      sheet.getRange(i + 1, 5).setValue(role);

      return { status: "success" };
    }
  }

  return { status: "error" };
}

// ================= PASSWORD =================
function changePassword(data) {
  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("Users");
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] == data.nip && rows[i][3] == data.oldPass) {
      sheet.getRange(i + 1, 4).setValue(data.newPass);
      return { status: "success" };
    }
  }

  return { status: "error" };
}

// ================= STOCK =================
function getStockMonthly() {

  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("STOCK");
  var data = sheet.getDataRange().getValues();

  let headers = data[0];
  data.shift();

  let last;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].join("") != "") {
      last = data[i];
      break;
    }
  }

  function get(colName) {
    let index = headers.indexOf(colName);
    return index !== -1 ? last[index] : 0;
  }

  return {
    periode: get("PERIODE"),

    roll_in: get("TISSUE ROLL IN"),
    roll_out: get("TISSUE ROLL OUT"),
    roll_stock: get("TISSUE ROLL STOCK"),

    towel_in: get("TISSUE HAND TOWEL IN"),
    towel_out: get("TISSUE HAND TOWEL OUT"),
    towel_stock: get("TISSUE HAND TOWEL STOCK"),

    trash120_in: get("TRASH BAG 100 X 120 IN"),
    trash120_out: get("TRASH BAG 100 X 120 OUT"),
    trash120_stock: get("TRASH BAG 100 X 120 STOCK"),

    trash90_in: get("TRASH BAG 90X100 IN"),
    trash90_out: get("TRASH BAG 90X100 OUT"),
    trash90_stock: get("TRASH BAG 90X100 STOCK")
  };
}

//======DASHBOARD============
function getDashboard(data) {

  var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName("BIN CARD");
  var rows = sheet.getDataRange().getValues();

  rows.shift();

  let bulan = data.bulan;
  let result = {};

  rows.forEach(r => {

    let tanggal = r[0];
    if (!tanggal) return;

    // 🔥 paksa jadi date object
    let dateObj = new Date(tanggal);

    // 🔥 ubah ke yyyy-MM
    let ym = Utilities.formatDate(dateObj, "Asia/Jakarta", "yyyy-MM");

    if (ym !== bulan) return;

    let item = r[2];
    let masuk = Number(r[4]) || 0;
    let keluar = Number(r[5]) || 0;

    if (!result[item]) {
      result[item] = { in: 0, out: 0 };
    }

    result[item].in += masuk;
    result[item].out += keluar;
  });

  let final = [];

  for (let item in result) {
    final.push({
      item,
      masuk: result[item].in,
      keluar: result[item].out,
      stok: result[item].in - result[item].out
    });
  }

  return final;
}


function getHistory() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("BIN CARD");
    if (!sheet) return [];

    // Pakai getDisplayValues() agar format jam/tanggal persis seperti di Sheets
    var rows = sheet.getDataRange().getDisplayValues(); 
    
    if (rows.length <= 1) return [];

    var dataRows = rows.slice(1);
    dataRows.reverse();

    return dataRows.slice(0, 50).map(function(r) {
      return {
        tanggal: r[0], // Diambil mentah sesuai tampilan di Sheets (Kolom A)
        waktu: r[1],   // Diambil mentah sesuai tampilan di Sheets (Kolom B)
        item: r[2] || "-",
        satuan: r[3] || "-",
        in: r[4] || 0,
        out: r[5] || 0,
        user: r[6] || "-"
      };
    });
  } catch (e) {
    return [];
  }
}

function getRiwayatPeralatan() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetDatang = ss.getSheetByName("OpnamePeralatan");
    var sheetMusnah = ss.getSheetByName("Pemusnahan");
    var sheetMaster = ss.getSheetByName("Peralatan");
    
    // Ambil mapping master jenis alat dulu agar riwayat tahu mana yang Manual / Mechanical
    var jenisMap = {};
    if (sheetMaster) {
      var masterData = sheetMaster.getDataRange().getValues();
      for (var m = 1; m < masterData.length; m++) {
        jenisMap[masterData[m][1]] = masterData[m][2] || "Manual"; // Nama Alat -> Jenis
      }
    }
    
    var listDatang = [];
    var listMusnah = [];
    
    // 1. Ambil Semua Data Barang Datang
    if (sheetDatang) {
      var dataD = sheetDatang.getDataRange().getValues();
      for (var i = dataD.length - 1; i >= 1; i--) {
        if (dataD[i][2] === "Datang") {
          var userRaw = dataD[i][7] || "";
          var fotoUrl = "-";
          var namaUser = userRaw;
          if (userRaw.indexOf(" | Foto: ") !== -1) {
            var parts = userRaw.split(" | Foto: ");
            namaUser = parts[0];
            fotoUrl = parts[1] || "-";
          }
          
          var namaAlat = dataD[i][4];
          listDatang.push({
            id: dataD[i][0],
            tanggalRaw: dataD[i][1], // Untuk filter tanggal
            tanggal: Utilities.formatDate(new Date(dataD[i][1]), "GMT+8", "dd/MM/yyyy"),
            nama: namaAlat,
            jenis: jenisMap[namaAlat] || "Manual", // Ambil dari map master
            qty: dataD[i][5],
            user: namaUser,
            foto: fotoUrl
          });
        }
      }
    }
    
    // 2. Ambil Semua Data Pemusnahan
    if (sheetMusnah) {
      var dataM = sheetMusnah.getDataRange().getValues();
      for (var j = dataM.length - 1; j >= 1; j--) {
        var namaAlatM = dataM[j][2];
        listMusnah.push({
          id: dataM[j][0],
          tanggalRaw: dataM[j][1],
          tanggal: Utilities.formatDate(new Date(dataM[j][1]), "GMT+8", "dd/MM/yyyy"),
          nama: namaAlatM,
          jenis: jenisMap[namaAlatM] || "Manual",
          qty: dataM[j][3],
          foto: dataM[j][4] || "-",
          user: dataM[j][5]
        });
      }
    }
    
    return { datang: listDatang, musnah: listMusnah };
  } catch (e) {
    return { datang: [], musnah: [], error: e.toString() };
  }
}
