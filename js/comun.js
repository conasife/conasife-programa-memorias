/* CONASIFE 2026 · funciones comunes
   Autor: José Antonio Castillo Torres · © 2026 Instituto Politécnico Nacional */
(function () {
  "use strict";
  var C = {};

  C.esc = function (t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  // Texto con datos pendientes [entre corchetes] en dorado
  C.txt = function (t) {
    return C.esc(t).replace(/\[([^\]]+)\]/g, '<span class="pend">[$1]</span>');
  };
  C.norm = function (t) {
    return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  };
  // Resalta las palabras buscadas (sin distinguir acentos ni mayúsculas)
  C.resalta = function (t, consulta) {
    var base = C.txt(t);
    var palabras = C.norm(consulta).split(/\s+/).filter(function (p) { return p.length > 1; });
    if (!palabras.length) return base;
    var plano = String(t || "");
    var n = C.norm(plano);
    var marcas = new Array(plano.length).fill(false);
    palabras.forEach(function (p) {
      var i = n.indexOf(p);
      while (i >= 0) { for (var k = i; k < i + p.length; k++) marcas[k] = true; i = n.indexOf(p, i + 1); }
    });
    if (marcas.indexOf(true) < 0) return base;
    var out = "", dentro = false;
    for (var i = 0; i < plano.length; i++) {
      if (marcas[i] && !dentro) { out += "<mark>"; dentro = true; }
      if (!marcas[i] && dentro) { out += "</mark>"; dentro = false; }
      out += C.esc(plano[i]);
    }
    if (dentro) out += "</mark>";
    return out;
  };
  C.coincide = function (texto, consulta) {
    var n = C.norm(texto);
    return C.norm(consulta).split(/\s+/).filter(Boolean).every(function (p) { return n.indexOf(p) >= 0; });
  };
  C.aviso = function (msg) {
    var d = document.createElement("div");
    d.className = "copiado"; d.textContent = msg; d.setAttribute("role", "status");
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 2200);
  };
  C.copiar = function (texto, msg) {
    function ok() { C.aviso(msg || "Copiado"); }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(ok, function () { C.copiarViejo(texto); ok(); });
    } else { C.copiarViejo(texto); ok(); }
  };
  C.copiarViejo = function (texto) {
    var a = document.createElement("textarea");
    a.value = texto; a.style.position = "fixed"; a.style.opacity = "0";
    document.body.appendChild(a); a.select();
    try { document.execCommand("copy"); } catch (e) { /* nada */ }
    a.remove();
  };
  // Almacenamiento local con respaldo (modo privado, etc.)
  C.leer = function (clave, def) {
    try { var v = localStorage.getItem(clave); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  };
  C.guardar = function (clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* nada */ }
  };
  // Pestañas accesibles: botones [data-panel] dentro de .pestanas
  C.pestanas = function (contenedor, alCambiar) {
    var botones = contenedor.querySelectorAll("button[data-panel]");
    function activa(id, sinHash) {
      botones.forEach(function (b) {
        var si = b.getAttribute("data-panel") === id;
        b.setAttribute("aria-selected", si ? "true" : "false");
        document.getElementById(b.getAttribute("data-panel")).hidden = !si;
      });
      if (!sinHash) history.replaceState(null, "", "#" + id);
      if (alCambiar) alCambiar(id);
    }
    botones.forEach(function (b) {
      b.setAttribute("role", "tab");
      b.addEventListener("click", function () { activa(b.getAttribute("data-panel")); });
    });
    return activa;
  };
  window.Comun = C;
})();
