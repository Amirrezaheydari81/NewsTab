
/* Backup / restore + optional password encryption */
(function () {
  const BACKUP_SCHEMA = 1;
  const BACKUP_REMIND_MS = 14 * 24 * 60 * 60 * 1000;

  const PERSISTENT_KEYS = [
    "feeds",
    "showFa",
    "readLinks",
    "groupsCollapsed",
    "lowPowerMode",
    "sortBy",
    "showQuotes",
    "showTickers",
    "showGoogleStatus",
    "showApps",
    "showTodos",
    "showSaved",
    "showGreeting",
    "showWebSearch",
    "themeMode",
    "customApps",
    "hiddenApps",
    "todos",
    "savedItems",
    "lastBackupAt",
  ];

  function toast(msg, kind) {
    let el = document.getElementById("ntToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "ntToast";
      el.className = "nt-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.toggle("is-warn", kind === "warn");
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove("show");
    }, 3200);
  }

  function bytesToB64(buf) {
    const bytes = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function b64ToBytes(b64) {
    const s = atob(b64);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: 120000, hash: "SHA-256" },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptPayload(jsonText, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const enc = new TextEncoder();
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(jsonText));
    return {
      schemaVersion: BACKUP_SCHEMA,
      encrypted: true,
      salt: bytesToB64(salt),
      iv: bytesToB64(iv),
      data: bytesToB64(cipher),
      exportedAt: new Date().toISOString(),
    };
  }

  async function decryptPayload(obj, password) {
    const salt = b64ToBytes(obj.salt);
    const iv = b64ToBytes(obj.iv);
    const key = await deriveKey(password, salt);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, b64ToBytes(obj.data));
    return new TextDecoder().decode(plain);
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function collectBackupData(done) {
    chrome.storage.local.get(PERSISTENT_KEYS, function (res) {
      done({
        schemaVersion: BACKUP_SCHEMA,
        encrypted: false,
        exportedAt: new Date().toISOString(),
        app: "newstab",
        data: res || {},
      });
    });
  }

  async function exportBackup(password) {
    return new Promise(function (resolve, reject) {
      collectBackupData(async function (payload) {
        try {
          let out = payload;
          if (password && String(password).length) {
            out = await encryptPayload(JSON.stringify(payload.data), String(password));
          }
          const stamp = new Date().toISOString().slice(0, 10);
          downloadJson("newstab-backup-" + stamp + ".json", out);
          const now = Date.now();
          chrome.storage.local.set({ lastBackupAt: now });
          toast("پشتیبان ذخیره شد");
          resolve(out);
        } catch (err) {
          toast("خطا در ساخت پشتیبان", "warn");
          reject(err);
        }
      });
    });
  }

  function applyImportedData(data, done) {
    const clean = {};
    PERSISTENT_KEYS.forEach(function (k) {
      if (data[k] !== undefined) clean[k] = data[k];
    });
    clean.lastBackupAt = Date.now();
    chrome.storage.local.set(clean, function () {
      toast("بازیابی انجام شد — در حال بارگذاری مجدد");
      setTimeout(function () {
        location.reload();
      }, 700);
      if (done) done();
    });
  }

  async function importBackupFile(file, password) {
    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      toast("فایل پشتیبان نامعتبر است", "warn");
      return;
    }

    try {
      let data;
      if (parsed && parsed.encrypted) {
        if (!password) {
          toast("این بکاپ رمز دارد", "warn");
          return;
        }
        const plain = await decryptPayload(parsed, String(password));
        data = JSON.parse(plain);
      } else if (parsed && parsed.data && typeof parsed.data === "object") {
        data = parsed.data;
      } else if (parsed && typeof parsed === "object") {
        data = parsed;
      } else {
        toast("ساختار بکاپ ناشناخته است", "warn");
        return;
      }
      applyImportedData(data);
    } catch (e) {
      toast("رمز اشتباه است یا فایل خراب است", "warn");
    }
  }

  function maybeRemindBackup() {
    chrome.storage.local.get(["lastBackupAt"], function (res) {
      const last = res.lastBackupAt || 0;
      if (last && Date.now() - last < BACKUP_REMIND_MS) return;
      const banner = document.getElementById("backupReminder");
      if (!banner) return;
      setReminder(true);
    });
  }

  function setReminder(on) {
    const banner = document.getElementById("backupReminder");
    if (banner) banner.hidden = !on;
    document.body.classList.toggle("needs-backup", on);
  }

  function wireBackupUi() {
    const exportBtn = document.getElementById("backupExportBtn");
    const importBtn = document.getElementById("backupImportBtn");
    const fileInput = document.getElementById("backupFileInput");
    const passInput = document.getElementById("backupPassword");
    const remind = document.getElementById("backupReminder");
    const remindDismiss = document.getElementById("backupRemindDismiss");
    const remindExport = document.getElementById("backupRemindExport");

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        const pass = passInput ? passInput.value : "";
        exportBackup(pass).then(function () {
          setReminder(false);
        });
      });
    }
    if (importBtn && fileInput) {
      importBtn.addEventListener("click", function () {
        fileInput.click();
      });
      fileInput.addEventListener("change", function () {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const pass = passInput ? passInput.value : "";
        importBackupFile(file, pass).finally(function () {
          fileInput.value = "";
        });
      });
    }
    if (remindDismiss && remind) {
      remindDismiss.addEventListener("click", function () {
        setReminder(false);
        chrome.storage.local.set({ lastBackupAt: Date.now() });
      });
    }
    if (remindExport) {
      remindExport.addEventListener("click", function () {
        const pass = passInput ? passInput.value : "";
        exportBackup(pass).then(function () {
          setReminder(false);
        });
      });
    }
    maybeRemindBackup();
  }

  window.NewsTabBackup = {
    exportBackup: exportBackup,
    importBackupFile: importBackupFile,
    wireBackupUi: wireBackupUi,
    PERSISTENT_KEYS: PERSISTENT_KEYS,
    toast: toast,
  };
})();
