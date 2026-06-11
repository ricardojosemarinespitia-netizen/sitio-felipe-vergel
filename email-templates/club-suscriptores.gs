/**
 * ============================================================
 *  CLUB DE COLECCIONISTAS · Control de suscriptores
 *  Felipe Vergel Arte en Vidrio
 * ------------------------------------------------------------
 *  QUÉ HACE:
 *   - Bloquea correos duplicados desde CUALQUIER dispositivo
 *   - Da el conteo de suscriptores en tiempo real
 *   - Te muestra la lista completa en una página bonita
 *
 *  CÓMO INSTALAR (una sola vez, ~5 min):
 *   1. Abre tu Google Sheet de respuestas del Club.
 *   2. Menú: Extensiones → Apps Script.
 *   3. Borra todo lo que haya y pega ESTE archivo completo.
 *   4. Arriba, en CONFIG, revisa SECRETO (cámbialo por algo tuyo).
 *   5. Botón "Implementar" (azul, arriba dcha) → "Nueva implementación".
 *   6. Tipo: "Aplicación web".
 *        - Ejecutar como: Yo (tu correo)
 *        - Quién tiene acceso: "Cualquier persona"
 *   7. "Implementar" → autoriza con tu cuenta → copia la URL que termina en /exec
 *   8. Pega esa URL en index.html, en la constante CLUB_API.
 *
 *  PARA VER TUS SUSCRIPTORES cuando quieras:
 *   Abre en el navegador:
 *     TU_URL/exec?action=list&key=TU_SECRETO
 *   (guárdala como favorito — es tu panel en vivo)
 * ============================================================
 */

var CONFIG = {
  // Cámbialo por una palabra secreta tuya (protege la lista de miradas ajenas)
  SECRETO: "felipe-circulo-2025",
  // Deja "" para usar la primera hoja. O pon el nombre exacto de la pestaña.
  NOMBRE_HOJA: ""
};

// --- Utilidades -------------------------------------------------

function _hoja() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (CONFIG.NOMBRE_HOJA) {
    var h = ss.getSheetByName(CONFIG.NOMBRE_HOJA);
    if (h) return h;
  }
  return ss.getSheets()[0];
}

// Recorre TODA la hoja y arma la lista de suscriptores (sin importar
// en qué columna esté el correo). Devuelve objetos {email, nombre, fecha, fila}.
function _suscriptores() {
  var hoja = _hoja();
  var datos = hoja.getDataRange().getValues();
  if (datos.length < 1) return { emails: {}, lista: [] };

  var rxEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var encabezados = datos[0].map(function (c) { return String(c).toLowerCase(); });

  // Detecta columna de nombre y fecha por su encabezado (si existen)
  var colNombre = -1, colFecha = -1;
  encabezados.forEach(function (h, i) {
    if (colNombre < 0 && /(nombre|name)/.test(h)) colNombre = i;
    if (colFecha < 0 && /(fecha|marca temporal|timestamp|date)/.test(h)) colFecha = i;
  });

  var vistos = {};   // email -> true (para dedup y conteo único)
  var lista = [];
  for (var r = 1; r < datos.length; r++) {
    var fila = datos[r];
    var email = "";
    // Busca el primer valor que parezca correo en la fila
    for (var c = 0; c < fila.length; c++) {
      var val = String(fila[c]).trim().toLowerCase();
      if (rxEmail.test(val)) { email = val; break; }
    }
    if (!email || vistos[email]) continue;
    vistos[email] = true;
    lista.push({
      email: email,
      nombre: colNombre >= 0 ? String(fila[colNombre]) : "",
      fecha: colFecha >= 0 ? String(fila[colFecha]) : ""
    });
  }
  return { emails: vistos, lista: lista };
}

function _salida(payload, callback) {
  var json = JSON.stringify(payload);
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Lectura (dedup, conteo, lista) ------------------------------

function doGet(e) {
  var p = e.parameter || {};
  var cb = p.callback || "";
  var action = (p.action || "count").toLowerCase();

  if (action === "check") {
    var email = String(p.email || "").trim().toLowerCase();
    var data = _suscriptores();
    return _salida({ registered: !!data.emails[email], count: data.lista.length }, cb);
  }

  if (action === "count") {
    var data2 = _suscriptores();
    return _salida({ count: data2.lista.length }, cb);
  }

  if (action === "list") {
    if (p.key !== CONFIG.SECRETO) {
      return _salida({ error: "no-autorizado" }, cb);
    }
    var data3 = _suscriptores();
    if (cb) return _salida({ count: data3.lista.length, lista: data3.lista }, cb);
    return _paginaLista(data3.lista); // sin callback → página HTML bonita
  }

  return _salida({ ok: true, msg: "Club API activa" }, cb);
}

// --- Escritura (registro nuevo, opcional) ------------------------
// Si decides escribir directo aquí en vez de por el Formulario.
// El sitio puede seguir usando el Formulario; esto es respaldo.

function doPost(e) {
  try {
    var body = {};
    try { body = JSON.parse(e.postData.contents); } catch (err) {}
    var email = String(body.email || "").trim().toLowerCase();
    if (!email) return _salida({ ok: false, error: "sin-email" });

    var data = _suscriptores();
    if (data.emails[email]) {
      return _salida({ ok: true, registered: true, count: data.lista.length });
    }
    var hoja = _hoja();
    hoja.appendRow([
      new Date(),
      body.nombre || "Suscriptor",
      email,
      body.codigo || "",
      body.metodo || "club"
    ]);
    return _salida({ ok: true, registered: false, count: data.lista.length + 1 });
  } catch (err) {
    return _salida({ ok: false, error: String(err) });
  }
}

// --- Panel HTML para Felipe -------------------------------------

function _paginaLista(lista) {
  var filas = lista.map(function (s, i) {
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + _esc(s.nombre) + '</td>' +
      '<td><a href="mailto:' + _esc(s.email) + '">' + _esc(s.email) + '</a></td>' +
      '<td>' + _esc(s.fecha) + '</td>' +
    '</tr>';
  }).join("");

  var html =
  '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Círculo · Suscriptores</title><style>' +
  'body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#3a1c22;color:#FAF4ED;padding:28px}' +
  '.card{max-width:860px;margin:0 auto;background:#572932;border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.4)}' +
  '.top{background:#C66E4E;height:5px}' +
  '.head{padding:28px 30px 10px}' +
  '.ey{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#F3CFB3;font-weight:700}' +
  'h1{margin:8px 0 0;font-size:26px}' +
  '.big{font-size:54px;font-weight:800;color:#F3CFB3;line-height:1;margin:14px 30px}' +
  '.big small{font-size:14px;color:#E7CDBC;font-weight:400;letter-spacing:1px;text-transform:uppercase;display:block;margin-top:6px}' +
  'table{width:100%;border-collapse:collapse;font-size:14px}' +
  'th,td{text-align:left;padding:12px 14px;border-bottom:1px solid rgba(243,207,179,.15)}' +
  'th{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#C66E4E}' +
  'td a{color:#F3CFB3}' +
  'tr:hover td{background:rgba(243,207,179,.05)}' +
  '.foot{padding:18px 30px;font-size:12px;color:#B89A8E}' +
  '.btn{display:inline-block;margin:0 30px 24px;padding:11px 22px;background:#C66E4E;color:#FAF4ED;border-radius:999px;text-decoration:none;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:700}' +
  '</style></head><body><div class="card"><div class="top"></div>' +
  '<div class="head"><div class="ey">✦ Círculo de Coleccionistas</div><h1>Suscriptores registrados</h1></div>' +
  '<div class="big">' + lista.length + '<small>personas en el Círculo</small></div>' +
  '<a class="btn" href="" onclick="location.reload();return false;">↻ Actualizar</a>' +
  '<table><thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Fecha</th></tr></thead>' +
  '<tbody>' + (filas || '<tr><td colspan="4" style="padding:24px;color:#B89A8E">Aún no hay suscriptores.</td></tr>') + '</tbody></table>' +
  '<div class="foot">Panel privado · Felipe Vergel Arte en Vidrio</div></div></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle("Círculo · Suscriptores")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function _esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
