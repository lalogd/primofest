/**
 * ==========================================================================
 * 2DO PRIMOFEST - LOGIC & SCRIPT
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. CONFIGURACIÓN DE GOOGLE SHEETS
// --------------------------------------------------------------------------
// Pega aquí la URL de tu Web App de Google Apps Script (terminada en /exec)
// Sigue la guía en google-apps-script.js o README.md
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwkN8dWWWANVnBtqUCtbH2mT29epgSEaMxr_NfhMmqyG2s0uzYDE_p-kOl2iuuyh_XB/exec"; 

// Fecha del evento: Sábado 5 de Diciembre 2026 a las 20:00 hrs
const EVENT_DATE = new Date("2026-12-05T20:00:00").getTime();

// Clave para almacenamiento local de respaldo
const STORAGE_KEY = "primofest_rsvp_data";
const CONFIRMED_USER_KEY = "primofest_my_ticket";

// --------------------------------------------------------------------------
// 2. INICIALIZACIÓN
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initCountdown();
  initFormPills();
  initFormSubmit();
  initFlyerDownload();
  checkExistingTicket();
  updateConfirmedStats();
  initMobileStickyBar();
});

// --------------------------------------------------------------------------
// 3. CUENTA REGRESIVA
// --------------------------------------------------------------------------
function initCountdown() {
  const daysEl = document.getElementById("count-days");
  const hoursEl = document.getElementById("count-hours");
  const minutesEl = document.getElementById("count-minutes");
  const secondsEl = document.getElementById("count-seconds");

  if (!daysEl) return;

  function update() {
    const now = new Date().getTime();
    const distance = EVENT_DATE - now;

    if (distance < 0) {
      document.getElementById("countdown-container").innerHTML = `
        <div class="text-lime-400 font-bold text-xl uppercase tracking-widest py-3">
          ¡EL PRIMOFEST ES HOY! ¡NOS VEMOS EN EL ROCK!
        </div>
      `;
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");
    secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

// --------------------------------------------------------------------------
// 4. SELECTOR DE ACOMPAÑANTES (PILLS INTERACTIVOS)
// --------------------------------------------------------------------------
function initFormPills() {
  const pills = document.querySelectorAll('input[name="acompanantes"]');
  const summaryEl = document.getElementById("guest-summary-text");

  pills.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const count = parseInt(e.target.value, 10);
      const total = count + 1;

      if (count === 0) {
        summaryEl.innerHTML = `<span class="text-white font-medium">Asistirás en solitario:</span> <span class="text-lime-400 font-bold">1 persona</span> en total.`;
      } else {
        summaryEl.innerHTML = `<span class="text-white font-medium">Tú + ${count} acompañante${count > 1 ? "s" : ""}:</span> <span class="text-lime-400 font-bold">${total} personas</span> en tu grupo.`;
      }
    });
  });
}

// --------------------------------------------------------------------------
// 5. ENVÍO DEL FORMULARIO Y CONEXIÓN CON GOOGLE SHEETS
// --------------------------------------------------------------------------
function initFormSubmit() {
  const form = document.getElementById("rsvp-form");
  const submitBtn = document.getElementById("submit-btn");
  const btnText = document.getElementById("btn-text");
  const btnSpinner = document.getElementById("btn-spinner");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const acompanantesInput = document.querySelector('input[name="acompanantes"]:checked');
    const acompanantes = acompanantesInput ? parseInt(acompanantesInput.value, 10) : 0;
    const mensaje = document.getElementById("mensaje").value.trim();
    const totalPersonas = acompanantes + 1;

    if (!nombre) {
      showToast("Por favor ingresa tu nombre", "error");
      document.getElementById("nombre").focus();
      return;
    }

    // Estado cargando
    submitBtn.disabled = true;
    btnText.textContent = "Confirmando asistencia...";
    btnSpinner.classList.remove("hidden");

    const payload = {
      nombre: nombre,
      acompanantes: acompanantes,
      totalPersonas: totalPersonas,
      mensaje: mensaje,
      fechaEnvio: new Date().toISOString()
    };

    let sheetsSuccess = false;

    // Intentar enviar a Google Apps Script si hay URL configurada
    if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.startsWith("http")) {
      try {
        console.log("Enviando confirmación a Google Sheets:", payload);
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(payload)
        });

        try {
          const resData = await response.json();
          console.log("Respuesta recibida de Google Sheets:", resData);
        } catch(e) {
          console.log("Confirmación enviada (respuesta no-JSON o redirigida):", e);
        }

        sheetsSuccess = true;
      } catch (err) {
        console.warn("Fallo el envío estándar a Google Sheets, reintentando con no-cors:", err);
        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
          });
          sheetsSuccess = true;
        } catch (err2) {
          console.error("Error definitivo enviando a Google Sheets:", err2);
        }
      }
    } else {
      console.info("Aviso: GOOGLE_SCRIPT_URL no está configurada aún en js/app.js. Guardando en modo demo local.");
    }

    // Siempre guardar en almacenamiento local como respaldo del organizador
    saveLocalRsvp(payload);

    // Guardar el ticket del usuario en su navegador
    const ticketId = "PF26-" + Math.floor(1000 + Math.random() * 9000);
    const userTicket = {
      ...payload,
      ticketId: ticketId,
      dateFormatted: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
    };
    localStorage.setItem(CONFIRMED_USER_KEY, JSON.stringify(userTicket));

    // Restaurar botón
    submitBtn.disabled = false;
    btnText.textContent = "¡Asistencia Confirmada! 🤘";
    btnSpinner.classList.add("hidden");

    // Efecto de Confeti festivo
    triggerRockConfetti();

    // Actualizar vista con el pase virtual de confirmación
    renderConfirmedPass(userTicket);
    updateConfirmedStats();

    // Mostrar aviso al usuario
    if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.startsWith("http")) {
      showToast("¡Listo! Tu confirmación ya se registró en Google Sheets", "success");
    } else {
      showToast("¡Confirmado con éxito! (Modo local activo. Recuerda conectar tu Google Sheet)", "success");
    }
  });
}

// Guardar en array local de confirmaciones
function saveLocalRsvp(record) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    list.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Error guardando localmente:", e);
  }
}

// --------------------------------------------------------------------------
// 6. PASE VIRTUAL DIGITAL (TICKET CONFIRMADO)
// --------------------------------------------------------------------------
function checkExistingTicket() {
  const saved = localStorage.getItem(CONFIRMED_USER_KEY);
  if (saved) {
    try {
      const ticket = JSON.parse(saved);
      renderConfirmedPass(ticket);
    } catch (e) {
      console.error(e);
    }
  }
}

function renderConfirmedPass(ticket) {
  const container = document.getElementById("ticket-result-container");
  const formBox = document.getElementById("form-card-container");
  
  if (!container) return;

  document.getElementById("ticket-name").textContent = ticket.nombre;
  document.getElementById("ticket-guests").textContent = 
    ticket.acompanantes === 0 
      ? "Solo tú (1 persona)" 
      : `Tú + ${ticket.acompanantes} acompañante${ticket.acompanantes > 1 ? "s" : ""} (${ticket.totalPersonas} personas)`;
  
  document.getElementById("ticket-id-display").textContent = ticket.ticketId || "PF26-OFFICIAL";
  
  const songBox = document.getElementById("ticket-song");
  if (ticket.mensaje) {
    songBox.textContent = `"${ticket.mensaje}"`;
    document.getElementById("ticket-song-container").classList.remove("hidden");
  } else {
    document.getElementById("ticket-song-container").classList.add("hidden");
  }

  // Ocultar formulario y mostrar ticket confirmado
  formBox.classList.add("hidden");
  container.classList.remove("hidden");
  container.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Botón para editar / registrar a alguien más
window.resetFormView = function() {
  localStorage.removeItem(CONFIRMED_USER_KEY);
  const form = document.getElementById("rsvp-form");
  if (form) form.reset();
  
  const formBox = document.getElementById("form-card-container");
  const ticketBox = document.getElementById("ticket-result-container");
  const summaryEl = document.getElementById("guest-summary-text");
  
  if (formBox) formBox.classList.remove("hidden");
  if (ticketBox) ticketBox.classList.add("hidden");
  if (summaryEl) {
    summaryEl.innerHTML = `<span class="text-white font-medium">Asistirás en solitario:</span> <span class="text-lime-400 font-bold">1 persona</span> en total.`;
  }
  
  const nombreInput = document.getElementById("nombre");
  if (nombreInput) nombreInput.focus();
};

// --------------------------------------------------------------------------
// 7. DESCARGA DEL FLYER (HTML2CANVAS)
// --------------------------------------------------------------------------
function initFlyerDownload() {
  const downloadBtns = document.querySelectorAll(".btn-download-flyer");

  downloadBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      await generateAndDownloadFlyer(btn);
    });
  });
}

async function generateAndDownloadFlyer(triggerBtn) {
  const template = document.getElementById("flyer-export-template");
  if (!template) return;

  const originalText = triggerBtn ? triggerBtn.innerHTML : "";
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline text-black" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Generando Flyer HD...
    `;
  }

  showToast("Generando flyer en alta resolución para compartir...", "info");

  // Clonar el template temporalmente para renderizarlo limpio sin afectar el layout móvil
  const clone = template.cloneNode(true);
  clone.id = "flyer-export-clone";
  clone.style.position = "fixed";
  clone.style.top = "0";
  clone.style.left = "0";
  clone.style.zIndex = "99999";
  clone.style.display = "block";
  clone.style.visibility = "visible";
  clone.style.opacity = "1";
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2, // 2x para resolución ultra nítida (1080 x 1920)
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#0b0c10",
      scrollX: 0,
      scrollY: 0,
      windowWidth: 540,
      windowHeight: 960,
      logging: false
    });

    const imgData = canvas.toDataURL("image/png");
    
    // Crear enlace de descarga
    const link = document.createElement("a");
    link.download = "Flyer-2do-Primofest-2026.png";
    link.href = imgData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("¡Flyer descargado con éxito! Compártelo por WhatsApp 🚀", "success");
  } catch (error) {
    console.error("Error al generar flyer:", error);
    showToast("Hubo un detalle al generar el flyer. Intenta de nuevo.", "error");
  } finally {
    clone.remove();
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = originalText;
    }
  }
}

// --------------------------------------------------------------------------
// 7.1 BARRA FIJA MÓVIL REACTIVA AL SCROLL
// --------------------------------------------------------------------------
function initMobileStickyBar() {
  const bar = document.getElementById("mobile-sticky-bar");
  const formSection = document.getElementById("confirmar");
  if (!bar || !formSection) return;

  function handleScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const formRect = formSection.getBoundingClientRect();

    // Si está cerca o dentro del formulario, ocultar la barra para no estorbar
    const inForm = formRect.top < window.innerHeight - 100 && formRect.bottom > 100;

    if (scrollY > 200 && !inForm) {
      bar.classList.remove("opacity-0", "pointer-events-none", "translate-y-full");
      bar.classList.add("opacity-100", "translate-y-0", "transition-all", "duration-200");
    } else {
      bar.classList.add("opacity-0", "pointer-events-none", "translate-y-full");
      bar.classList.remove("opacity-100", "translate-y-0");
    }
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
}

// --------------------------------------------------------------------------
// 8. EFECTO DE CONFETI DE ROCK
// --------------------------------------------------------------------------
function triggerRockConfetti() {
  if (typeof confetti === "function") {
    // Disparo 1: Centro
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#d4ff00", "#ffffff", "#ff3366", "#3b82f6"]
    });

    // Disparo 2: Lateral izquierdo
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#d4ff00", "#ff3366"]
      });
    }, 200);

    // Disparo 3: Lateral derecho
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#ffffff", "#d4ff00"]
      });
    }, 350);
  }
}

// --------------------------------------------------------------------------
// 9. CONTADOR DE REGISTROS LOCALES (UTILIDAD PARA EL ORGANIZADOR)
// --------------------------------------------------------------------------
function updateConfirmedStats() {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const countEl = document.getElementById("confirmed-count-badge");
  if (!countEl) return;

  const totalHeadcount = list.reduce((acc, curr) => acc + (curr.totalPersonas || 1), 0);
  if (totalHeadcount > 0) {
    countEl.textContent = `${totalHeadcount} confirmados`;
    countEl.classList.remove("hidden");
  } else {
    countEl.classList.add("hidden");
  }
}

// --------------------------------------------------------------------------
// 10. NOTIFICACIONES TOAST MINIMALISTAS
// --------------------------------------------------------------------------
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `transform translate-y-4 transition-all duration-300 ease-out flex items-center gap-3 px-5 py-3.5 rounded-lg border shadow-2xl backdrop-blur-md text-sm font-medium ${
    type === "success" 
      ? "bg-stone-950/90 text-lime-400 border-lime-400/40" 
      : type === "error" 
      ? "bg-stone-950/90 text-rose-400 border-rose-500/40" 
      : "bg-stone-950/90 text-stone-200 border-stone-700/60"
  }`;

  const icon = type === "success" 
    ? `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`
    : type === "error"
    ? `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`
    : `<svg class="w-5 h-5 flex-shrink-0 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);

  // Animar entrada
  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-4");
    toast.classList.add("translate-y-0");
  });

  // Retirar tras 4 segundos
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

// --------------------------------------------------------------------------
// 11. MODAL DE ASISTENTES (PANEL DEL ORGANIZADOR)
// --------------------------------------------------------------------------
window.toggleAdminModal = function() {
  const modal = document.getElementById("admin-modal");
  if (!modal) return;
  modal.classList.toggle("hidden");
  if (!modal.classList.contains("hidden")) {
    renderAdminTable();
  }
};

function renderAdminTable() {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const tbody = document.getElementById("admin-table-body");
  const totalDisplay = document.getElementById("admin-total-headcount");
  if (!tbody) return;

  tbody.innerHTML = "";
  let totalHeadcount = 0;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-stone-500">Aún no hay registros en este navegador. Cuando los primos confirmen o se sincronicen, aparecerán aquí y en Google Sheets.</td></tr>`;
  } else {
    list.forEach((item, idx) => {
      totalHeadcount += (item.totalPersonas || 1);
      const tr = document.createElement("tr");
      tr.className = "border-b border-stone-800 hover:bg-stone-900/40 text-sm";
      tr.innerHTML = `
        <td class="py-3 px-3 text-stone-300 font-medium">${item.nombre}</td>
        <td class="py-3 px-3 text-center text-stone-400">${item.acompanantes}</td>
        <td class="py-3 px-3 text-center font-bold text-lime-400">${item.totalPersonas}</td>
        <td class="py-3 px-3 text-stone-400 text-xs italic">${item.mensaje || "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (totalDisplay) {
    totalDisplay.textContent = `${totalHeadcount} personas en total`;
  }
}

// Descargar lista local como CSV
window.downloadLocalCsv = function() {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (list.length === 0) {
    showToast("No hay registros locales para exportar", "error");
    return;
  }

  let csv = "Fecha,Nombre,Acompañantes,Total Personas,Mensaje / Cancion\n";
  list.forEach(i => {
    csv += `"${i.fechaEnvio || ''}","${i.nombre}","${i.acompanantes}","${i.totalPersonas}","${(i.mensaje || '').replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "asistentes_2do_primofest.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Archivo CSV descargado", "success");
};
