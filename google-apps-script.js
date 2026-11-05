/**
 * =======================================================================
 * CÓDIGO PARA GOOGLE APPS SCRIPT - 2DO PRIMOFEST
 * =======================================================================
 * 
 * INSTRUCCIONES RÁPIDAS PARA CONECTAR TU HOJA DE CÁLCULO:
 * 
 * 1. Abre Google Sheets (https://sheets.new) y crea una hoja nueva.
 *    Nómbrala como gustes, por ejemplo: "Registro - 2do Primofest".
 * 
 * 2. En el menú superior de Google Sheets, ve a:
 *    Extensiones -> Apps Script
 * 
 * 3. Borra todo el código que aparezca en el editor y PEGA ESTE ARCHIVO COMPLETO.
 * 
 * 4. Guarda los cambios (ícono de disco o Ctrl + S).
 * 
 * 5. Haz clic en el botón azul superior: "Implementar" -> "Nueva implementación".
 * 
 * 6. En el engrane (Seleccionar tipo), elige: "Aplicación web".
 * 
 * 7. Configura los siguientes campos exactamente así:
 *    - Descripción: "Registro Primofest API"
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquiera" (IMPORTANTE: Debe ser 'Cualquiera' o 'Anyone'
 *      para que los invitados puedan enviar su confirmación sin iniciar sesión).
 * 
 * 8. Haz clic en "Implementar", autoriza los permisos con tu cuenta si te lo pide.
 * 
 * 9. Copia la "URL de la aplicación web" (termina en `/exec`).
 * 
 * 10. Abre el archivo `js/app.js` de tu proyecto y pega esa URL en:
 *     const GOOGLE_SCRIPT_URL = "TU_URL_AQUI";
 * 
 * ¡Listo! Cada vez que alguien confirme en la web, aparecerá en tu hoja en tiempo real.
 * =======================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Esperar hasta 15 segundos si varios primos confirman al mismo segundo
  lock.tryLock(15000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Confirmaciones");
    
    // Si no existe la pestaña "Confirmaciones", la creamos o usamos la activa
    if (!sheet) {
      sheet = ss.getActiveSheet();
      sheet.setName("Confirmaciones");
    }

    // Si la hoja está nueva / vacía, creamos los encabezados estilizados
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Fecha de Registro",
        "Nombre Completo",
        "Acompañantes (+)",
        "Total Personas (Titular + Acomp.)",
        "Mensaje / Rolita Sugerida",
        "Estado Asistencia"
      ];
      sheet.appendRow(headers);
      
      // Dar formato elegante a los encabezados
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0d0f12");
      headerRange.setFontColor("#ccff00");
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Arial");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // Obtener los datos enviados
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var nombre = data.nombre ? String(data.nombre).trim() : "Anónimo";
    var acompanantes = parseInt(data.acompanantes !== undefined ? data.acompanantes : 0, 10);
    if (isNaN(acompanantes) || acompanantes < 0) acompanantes = 0;
    if (acompanantes > 5) acompanantes = 5; // Límite máximo de 5 acompañantes

    var totalPersonas = acompanantes + 1; // 1 titular + sus acompañantes
    var mensaje = data.mensaje ? String(data.mensaje).trim() : "-";
    var fechaRegistro = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "America/Mexico_City", "yyyy-MM-dd HH:mm:ss");

    // Agregar la fila
    sheet.appendRow([
      fechaRegistro,
      nombre,
      acompanantes,
      totalPersonas,
      mensaje,
      "CONFIRMADO"
    ]);

    // Calcular el gran total acumulado de asistentes
    var lastRow = sheet.getLastRow();
    var totalAsistentesFormula = "=SUM(D2:D" + lastRow + ")";

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "¡Confirmación registrada con éxito!",
      nombre: nombre,
      acompanantes: acompanantes,
      totalPersonas: totalPersonas
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Para probar que el script funciona desde el navegador con una petición GET simple
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    event: "2do Primofest - API de Registro",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

