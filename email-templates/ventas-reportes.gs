/**
 * ============================================================
 *  VENTAS REPORTES · Felipe Vergel Arte en Vidrio
 * ------------------------------------------------------------
 *  Registra cada compra completada en la hoja "VENTAS"
 *
 *  CÓMO INSTALAR (una sola vez, ~5 min):
 *   1. Abre el Google Sheet donde quieres registrar ventas.
 *   2. Menú: Extensiones → Apps Script.
 *   3. Borra todo lo que haya y pega ESTE archivo completo.
 *   4. Clic en "Implementar" (azul, arriba dcha) → "Nueva implementación".
 *   5. Tipo: "Aplicación web"
 *        - Ejecutar como: Yo (tu correo)
 *        - Quién tiene acceso: "Cualquier persona"
 *   6. "Implementar" → autoriza con tu cuenta → copia la URL /exec
 *   7. En checkout.html pega esa URL en la constante VENTAS_API.
 *
 *  PANEL EN VIVO (guárdalo como favorito):
 *    TU_URL/exec?action=panel&key=TU_SECRETO
 * ============================================================
 */

var CONFIG = {
  SECRETO: "felipe-ventas-2025",   // ← cámbialo por algo tuyo
  HOJA: "Ventas"
};

// ── Utilidades ────────────────────────────────────────────────

function _hoja() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName(CONFIG.HOJA);
  if (!h) {
    h = ss.insertSheet(CONFIG.HOJA);
    var cab = ["Fecha","Referencia","Cliente","Email","Teléfono",
               "Productos","Cantidad","Precio Unit.","Subtotal",
               "Descuento","Envío","Total","Método pago","Método entrega","Ciudad","Notas"];
    h.appendRow(cab);
    h.getRange(1,1,1,cab.length)
      .setFontWeight("bold")
      .setBackground("#572932")
      .setFontColor("#FAF4ED");
    h.setFrozenRows(1);
    h.setColumnWidth(1,140);
    h.setColumnWidth(6,260);
  }
  return h;
}

function _salida(data, cb) {
  var json = JSON.stringify(data);
  if (cb) return ContentService
    .createTextOutput(cb + "(" + json + ")")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function _fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

// ── Escritura (POST desde checkout.html) ──────────────────────

function doPost(e) {
  try {
    var body = {};
    try { body = JSON.parse(e.postData.contents); } catch(err) {}

    var hoja = _hoja();
    hoja.appendRow([
      new Date(),
      body.ref         || "",
      body.nombre      || body.cliente || "—",
      body.email       || "—",
      body.telefono    || "—",
      body.productos   || "—",
      body.cantidad    || 1,
      body.precioUnit  || body.precio || 0,
      body.subtotal    || 0,
      body.descuento   || 0,
      body.envio       || 0,
      body.total       || 0,
      body.metodoPago  || "—",
      body.metodoEntrega || "—",
      body.ciudad      || "—",
      body.notas       || ""
    ]);

    return _salida({ ok: true, filas: hoja.getLastRow() - 1 });
  } catch (err) {
    return _salida({ ok: false, error: String(err) });
  }
}

// ── Lectura (GET: panel HTML o JSON) ──────────────────────────

function doGet(e) {
  var p  = e.parameter || {};
  var cb = p.callback  || "";

  if (p.key !== CONFIG.SECRETO) {
    return _salida({ error: "no-autorizado" }, cb);
  }

  var action = (p.action || "panel").toLowerCase();

  if (action === "json") {
    var h    = _hoja();
    var rows = h.getDataRange().getValues().slice(1).map(function(r) {
      return {
        fecha: r[0], ref: r[1], cliente: r[2], email: r[3],
        productos: r[5], total: r[11], metodoPago: r[12], ciudad: r[14]
      };
    });
    return _salida({ count: rows.length, ventas: rows }, cb);
  }

  // action === "panel" → página HTML
  return _panelHTML();
}

// ── Panel HTML ─────────────────────────────────────────────────

function _panelHTML() {
  var h    = _hoja();
  var rows = h.getDataRange().getValues().slice(1).reverse(); // más recientes primero

  var totalAcum = rows.reduce(function(s, r) { return s + (Number(r[11]) || 0); }, 0);
  var descAcum  = rows.reduce(function(s, r) { return s + (Number(r[9])  || 0); }, 0);

  var filas = rows.slice(0, 100).map(function(r, i) {
    var fecha = r[0] ? new Date(r[0]).toLocaleDateString("es-CO") : "—";
    return '<tr>' +
      '<td style="color:#B89A8E">' + (i+1) + '</td>' +
      '<td style="font-weight:700;letter-spacing:.5px;font-size:11px">' + _esc(String(r[1])) + '</td>' +
      '<td>' + _esc(String(r[2])) + '</td>' +
      '<td><a href="mailto:' + _esc(String(r[3])) + '" style="color:#a8d5d1">' + _esc(String(r[3])) + '</a></td>' +
      '<td style="font-size:11px;color:#d4e8e6;max-width:200px;word-break:break-word">' + _esc(String(r[5])) + '</td>' +
      '<td>' + _fmt(r[8]) + '</td>' +
      '<td style="color:#C66E4E">' + (r[9] > 0 ? '-' + _fmt(r[9]) : '—') + '</td>' +
      '<td>' + _fmt(r[10]) + '</td>' +
      '<td style="font-weight:800;color:#FAF4ED;font-size:16px">' + _fmt(r[11]) + '</td>' +
      '<td style="font-size:11px">' + _esc(String(r[12])) + '</td>' +
      '<td style="font-size:11px;color:#B89A8E">' + _esc(String(r[14])) + '</td>' +
      '<td style="color:#B89A8E;font-size:11px">' + fecha + '</td>' +
    '</tr>';
  }).join("") ||
  '<tr><td colspan="12" style="padding:32px;color:#B89A8E;text-align:center">Aún no hay ventas registradas.</td></tr>';

  var html =
  '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Ventas · Felipe Vergel</title><style>' +
  'body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#3a1c22;color:#FAF4ED;padding:24px}' +
  '.card{max-width:1200px;margin:0 auto 28px;background:#572932;border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.45)}' +
  '.top{height:5px;background:#C66E4E}' +
  '.head{padding:26px 30px 12px}' +
  '.ey{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#F3CFB3;font-weight:700}' +
  'h1{margin:8px 0 0;font-size:26px;font-weight:300}' +
  '.stats{display:flex;border-top:1px solid rgba(243,207,179,.12)}' +
  '.stat{flex:1;padding:22px 28px;border-right:1px solid rgba(243,207,179,.08)}' +
  '.stat:last-child{border-right:none}' +
  '.stat-n{font-size:42px;font-weight:800;color:#F3CFB3;line-height:1}' +
  '.stat-l{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B89A8E;margin-top:6px}' +
  '.btn{display:inline-block;margin:0 28px 20px;padding:11px 22px;background:#C66E4E;color:#FAF4ED;border-radius:999px;text-decoration:none;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:700}' +
  'table{width:100%;border-collapse:collapse;font-size:13px}' +
  'th,td{text-align:left;padding:11px 14px;border-bottom:1px solid rgba(243,207,179,.08);white-space:nowrap}' +
  'th{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#C66E4E;white-space:nowrap}' +
  'tr:hover td{background:rgba(243,207,179,.04)}' +
  '.foot{padding:16px 28px;font-size:11px;color:#7a6258}' +
  '.ov{overflow-x:auto}' +
  '@media(max-width:640px){.stats{flex-direction:column}.stat{border-right:none;border-bottom:1px solid rgba(243,207,179,.08)}.stat-n{font-size:32px}}' +
  '</style></head><body>' +

  '<div class="card"><div class="top"></div>' +
  '<div class="head"><div class="ey">✦ Felipe Vergel Arte en Vidrio</div><h1>Panel de Ventas</h1></div>' +
  '<div class="stats">' +
    '<div class="stat"><div class="stat-n">' + rows.length + '</div><div class="stat-l">Pedidos totales</div></div>' +
    '<div class="stat"><div class="stat-n">' + _fmt(totalAcum) + '</div><div class="stat-l">Ingresos acumulados</div></div>' +
    '<div class="stat"><div class="stat-n">' + _fmt(descAcum) + '</div><div class="stat-l">Descuentos aplicados</div></div>' +
  '</div></div>' +

  '<div class="card"><div class="top"></div>' +
  '<div class="head"><div class="ey">Pedidos recientes</div></div>' +
  '<a class="btn" href="" onclick="location.reload();return false;">↻ Actualizar</a>' +
  '<div class="ov"><table><thead><tr>' +
    '<th>#</th><th>Referencia</th><th>Cliente</th><th>Email</th><th>Productos</th>' +
    '<th>Subtotal</th><th>Descuento</th><th>Envío</th><th>Total</th><th>Pago</th><th>Ciudad</th><th>Fecha</th>' +
  '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
  '<div class="foot">Mostrando últimos 100 pedidos · Panel privado Felipe Vergel</div>' +
  '</div></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle("Ventas · Felipe Vergel")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function _esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
