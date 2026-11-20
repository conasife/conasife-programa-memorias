/* CONASIFE 2026 · memorias interactivas
   Autor: José Antonio Castillo Torres · © 2026 Instituto Politécnico Nacional */
(function () {
  "use strict";
  var C = window.Comun, D = window.CONASIFE, M = D.memorias;
  var $ = function (id) { return document.getElementById(id); };
  var esc = C.esc, txt = C.txt;
  var T = M.trabajos;
  var ejeNombre = {}; M.ejes.forEach(function (e) { ejeNombre[e.numero] = e.nombre; });
  var filtroEje = 0;

  // ---------------------------------------------------------- citas
  function iniciales(n) {
    return n.split(/\s+/).filter(Boolean).map(function (p) {
      return p.split("-").map(function (q) { return q.charAt(0).toUpperCase() + "."; }).join("-");
    }).join(" ");
  }
  function citaAPA(t) {
    var a = t.autores.map(function (x) { return x.apellidos + (x.nombres ? ", " + iniciales(x.nombres) : ""); });
    var lista = a.length > 1 ? a.slice(0, -1).join(", ") + ", y " + a[a.length - 1] : a[0];
    return lista + " (2026). " + t.titulo + ". En " + M.libro.titulo + " (" + M.libro.subtitulo + ")" +
      (t.pagina ? " (p. " + t.pagina + ")" : "") + ". Instituto Politécnico Nacional, UPIIP. " + D.url + "memorias.html#" + t.clave;
  }
  function citaIEEE(t) {
    var a = t.autores.map(function (x) { return (x.nombres ? iniciales(x.nombres) + " " : "") + x.apellidos; });
    var lista = a.length > 2 ? a.slice(0, -1).join(", ") + " y " + a[a.length - 1] : a.join(" y ");
    return lista + ", “" + t.titulo + ",” en " + M.libro.titulo + " (" + M.libro.subtitulo + "), " +
      M.libro.lugar + ", 2026" + (t.pagina ? ", p. " + t.pagina : "") + ".";
  }

  // ---------------------------------------------------------- tarjeta de un trabajo
  function tarjeta(t, q) {
    var autores = t.autores.map(function (a) {
      var sup = t.adscripciones.length > 1 ? "<sup>" + a.ads.join(",") + (a.corresp ? ",*" : "") + "</sup>" : (a.corresp ? "<sup>*</sup>" : "");
      return C.resalta(a.nombre, q) + sup;
    }).join(", ");
    var ads = t.adscripciones.map(function (x) {
      return (t.adscripciones.length > 1 ? "<sup>" + esc(x.numero) + "</sup>" : "") + C.resalta(x.texto, q);
    }).join("<br>");
    var pr = t.presentacion;
    var presenta = pr ? '<div class="presenta"><b>Se presenta:</b> ' + esc(pr.dia_nombre) + ", " + esc(pr.inicio) + "–" + esc(pr.fin) +
      ", " + esc(pr.aula) + (pr.workshop ? ", dentro del " + esc(pr.workshop) : "") +
      ' · <a href="programa.html#' + (pr.workshop ? "talleres" : "ubica") + '">Ver en el programa</a></div>' : "";
    var pdf = D.pdf.memorias + (t.pagina_pdf ? "#page=" + t.pagina_pdf : "");
    return '<details class="trabajo" id="' + t.clave + '"' + (q ? " open" : "") + ">" +
      "<summary>" +
      '<div class="clave">' + esc(t.clave) + " · Sub eje " + C.resalta(t.subeje, q) + (t.modalidad ? " · " + esc(t.modalidad) : "") + "</div>" +
      '<div class="t">' + C.resalta(t.titulo, q) + "</div>" +
      '<div class="a">' + autores + "</div></summary>" +
      '<div class="mas">' +
      '<div class="ads">' + ads + (t.autores.some(function (a) { return a.corresp; }) ? "<br><sup>*</sup>Autor(a) de correspondencia" : "") + "</div>" +
      presenta +
      '<p class="resumen"><b>Resumen.</b> ' + C.resalta(t.resumen, q) + "</p>" +
      '<div class="chips"><b style="margin-right:4px">Palabras clave:</b>' +
      t.palabras.map(function (p) { return '<button class="chip" data-buscar="' + esc(p) + '">' + C.resalta(p, q) + "</button>"; }).join("") + "</div>" +
      '<div class="acciones-t">' +
      '<a class="boton chico" href="' + esc(pdf) + '" target="_blank" rel="noopener">Ver en el PDF' + (t.pagina ? " (pág. " + t.pagina + ")" : "") + "</a>" +
      '<button class="boton chico claro" data-cita="apa" data-t="' + t.folio + '">Copiar cita APA</button>' +
      '<button class="boton chico claro" data-cita="ieee" data-t="' + t.folio + '">Copiar cita IEEE</button>' +
      '<button class="boton chico claro" data-cita="enlace" data-t="' + t.folio + '">Copiar enlace</button>' +
      "</div></div></details>";
  }

  // ---------------------------------------------------------- lista con filtros
  function filtraEjes() {
    var cuenta = {}; T.forEach(function (t) { cuenta[t.eje] = (cuenta[t.eje] || 0) + 1; });
    $("f-ejes").innerHTML = '<button data-eje="0" aria-pressed="' + (filtroEje === 0) + '"><span>Todos los ejes</span><span class="n">' + T.length + "</span></button>" +
      M.ejes.map(function (e) {
        return '<button data-eje="' + e.numero + '" aria-pressed="' + (filtroEje === e.numero) + '"' + (cuenta[e.numero] ? "" : " disabled") +
          "><span>" + e.numero + ". " + esc(e.nombre) + '</span><span class="n">' + (cuenta[e.numero] || 0) + "</span></button>";
      }).join("");
    // En celular el filtro de ejes es una lista desplegable
    $("f-eje").innerHTML = '<option value="0">Todos los ejes (' + T.length + ")</option>" + M.ejes.filter(function (e) { return cuenta[e.numero]; }).map(function (e) {
      return '<option value="' + e.numero + '"' + (filtroEje === e.numero ? " selected" : "") + ">Eje " + e.numero + ". " + esc(e.nombre) + " (" + cuenta[e.numero] + ")</option>";
    }).join("");
  }
  function pinta() {
    var q = $("q-mem").value.trim(), mod = $("f-mod").value;
    var res = T.filter(function (t) {
      if (filtroEje && t.eje !== filtroEje) return false;
      if (mod && t.modalidad !== mod) return false;
      if (!q) return true;
      return C.coincide([t.clave, t.titulo, t.subeje, t.resumen, t.palabras.join(" "),
        t.autores.map(function (a) { return a.nombre; }).join(" "),
        t.adscripciones.map(function (a) { return a.texto; }).join(" ")].join(" "), q);
    });
    $("c-mem").textContent = res.length + " de " + T.length + " trabajos";
    var html = "", eje = null;
    res.forEach(function (t) {
      if (t.eje !== eje) { eje = t.eje; html += '<h2 style="margin:18px 0 10px">Eje ' + eje + ". " + esc(ejeNombre[eje] || "") + "</h2>"; }
      html += tarjeta(t, q);
    });
    $("l-mem").innerHTML = html || '<div class="aviso">No hay trabajos que coincidan. Pruebe con otra palabra o elija «Todos los ejes».</div>';
  }
  Array.from(new Set(T.map(function (t) { return t.modalidad; }).filter(Boolean))).sort().forEach(function (m) {
    $("f-mod").insertAdjacentHTML("beforeend", "<option>" + esc(m) + "</option>");
  });
  $("q-mem").addEventListener("input", pinta);
  $("f-mod").addEventListener("input", pinta);
  $("f-eje").addEventListener("input", function () { filtroEje = +this.value; filtraEjes(); pinta(); });
  $("f-ejes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-eje]");
    if (!b) return;
    filtroEje = +b.getAttribute("data-eje");
    filtraEjes(); pinta();
  });
  $("b-abrir").addEventListener("click", function () {
    var d = document.querySelectorAll("#l-mem details");
    var abrir = Array.from(d).some(function (x) { return !x.open; });
    d.forEach(function (x) { x.open = abrir; });
    this.textContent = abrir ? "Cerrar todos" : "Abrir todos";
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-buscar]");
    if (b) { activa("trabajos"); $("q-mem").value = b.getAttribute("data-buscar"); filtroEje = 0; filtraEjes(); pinta(); window.scrollTo({ top: 0 }); return; }
    var c = e.target.closest("[data-cita]");
    if (c) {
      var t = T.filter(function (x) { return String(x.folio) === c.getAttribute("data-t"); })[0];
      var tipo = c.getAttribute("data-cita");
      if (tipo === "apa") C.copiar(citaAPA(t), "Cita APA copiada");
      else if (tipo === "ieee") C.copiar(citaIEEE(t), "Cita IEEE copiada");
      else C.copiar(D.url + "memorias.html#" + t.clave, "Enlace copiado");
      return;
    }
    var v = e.target.closest("[data-ver]");
    if (v) { e.preventDefault(); irA(v.getAttribute("data-ver")); }
  });

  // ---------------------------------------------------------- índice de autores
  var registro = {};
  T.forEach(function (t) {
    t.autores.forEach(function (a) {
      var k = C.norm(a.apellidos + " " + a.nombres);
      registro[k] = registro[k] || { nombre: a.apellidos + (a.nombres ? ", " + a.nombres : ""), trabajos: [] };
      if (registro[k].trabajos.indexOf(t) < 0) registro[k].trabajos.push(t);
    });
  });
  var claves = Object.keys(registro).sort(function (a, b) { return a.localeCompare(b, "es"); });
  function pintaAutores() {
    var q = $("q-aut").value.trim(), letra = "", html = "";
    claves.forEach(function (k) {
      var r = registro[k];
      if (q && !C.coincide(r.nombre, q)) return;
      var l = k.charAt(0).toUpperCase();
      if (l !== letra) { letra = l; html += '<div class="letra">' + esc(l) + "</div>"; }
      html += "<div>" + C.resalta(r.nombre, q) + " " + r.trabajos.map(function (t) {
        return '<button data-ver="' + t.clave + '" title="' + esc(t.titulo) + '">' + String(t.folio).padStart(3, "0") + "</button>";
      }).join(" ") + "</div>";
    });
    $("l-aut").innerHTML = html || "<p>No hay autores que coincidan.</p>";
  }
  $("q-aut").addEventListener("input", pintaAutores);

  // ---------------------------------------------------------- ejes y presentación
  function pintaEjes() {
    var cuenta = {}; T.forEach(function (t) { var k = (t.subeje.match(/^\s*(\d+\.\d+)/) || [])[1]; cuenta[k] = (cuenta[k] || 0) + 1; });
    $("l-ejes").innerHTML = "<p class=\"intro\">Catálogo completo de ejes y sub ejes de la convocatoria. Entre paréntesis, los trabajos publicados en cada uno.</p>" +
      M.ejes.map(function (e) {
        return "<h3>Eje " + e.numero + ". " + esc(e.nombre) + "</h3><ol style=\"list-style:none;padding-left:0\">" + e.subejes.map(function (s) {
          var n = cuenta[s.clave] || 0;
          return "<li>" + esc(s.clave) + " " + esc(s.nombre) + (n ? ' <button class="chip" data-buscar="' + esc(s.clave) + '">' + n + (n === 1 ? " trabajo" : " trabajos") + "</button>" : "") + "</li>";
        }).join("") + "</ol>";
      }).join("");
  }
  function grupos(lista, campo, valor) {
    var g = {};
    lista.forEach(function (c) { (g[c[campo]] = g[c[campo]] || []).push(c[valor]); });
    return Object.keys(g).map(function (k) { return "<div><b>" + esc(k) + "</b>" + g[k].map(esc).join("<br>") + "</div>"; }).join("");
  }
  function pintaPresentacion() {
    var L = M.libro;
    $("pres").innerHTML = M.presentacion.map(function (p) { return "<p>" + txt(p) + "</p>"; }).join("");
    $("libro").innerHTML = '<table class="lista"><tbody>' + [
      ["Título", L.titulo + ". " + L.subtitulo], ["Coordinadores", L.coordinadores.replace(/;\s*/g, ", ")],
      ["Edición", L.edicion], ["ISBN", L.isbn], ["Formato", L.formato], ["Sede", L.sede + ", " + L.lugar], ["Contacto", L.correo]
    ].filter(function (f) { return f[1]; }).map(function (f) { return "<tr><td><b>" + esc(f[0]) + "</b></td><td>" + txt(f[1]) + "</td></tr>"; }).join("") + "</tbody></table>";
    $("m-comites").innerHTML = grupos(M.comites, "actividad", "nombre");
    $("directorio").innerHTML =
      "<div><b>Instituto Politécnico Nacional</b>" + M.directorio_ipn.map(function (r) { return esc(r.nombre) + "<br><small>" + esc(r.cargo) + "</small>"; }).join("<br>") + "</div>" +
      "<div><b>UPIIP Campus Palenque</b>" + M.directorio_upiip.map(function (r) { return esc(r.nombre) + "<br><small>" + esc(r.cargo) + "</small>"; }).join("<br>") + "</div>";
  }

  // ---------------------------------------------------------- ir a un trabajo (#CONASIFE-2026-NNN)
  function irA(clave) {
    activa("trabajos", true);
    $("q-mem").value = ""; filtroEje = 0; filtraEjes(); pinta();
    var d = document.getElementById(clave);
    if (d) { d.open = true; d.scrollIntoView({ block: "start" }); history.replaceState(null, "", "#" + clave); }
  }

  // ---------------------------------------------------------- arranque
  var L = M.libro;
  $("m-sub").innerHTML = esc(M.totales.trabajos) + " trabajos · " + esc(M.totales.autores) + " autoras y autores · " +
    esc(L.fechas) + " · " + esc(L.lugar) + ' · <a href="' + esc(D.pdf.memorias) + '" download>Descargar PDF</a>';
  if (M.aclaracion) $("m-nota").textContent = M.aclaracion;
  filtraEjes(); pinta(); pintaAutores(); pintaEjes(); pintaPresentacion();
  var activa = C.pestanas(document.querySelector(".pestanas"));
  var h = decodeURIComponent(location.hash.slice(1));
  if (/^CONASIFE-2026-\d+$/.test(h)) { activa("trabajos", true); setTimeout(function () { irA(h); }, 0); }
  else activa(["trabajos", "autores", "ejes", "presentacion"].indexOf(h) >= 0 ? h : "trabajos", true);
  window.addEventListener("hashchange", function () {
    var x = location.hash.slice(1);
    if (/^CONASIFE-2026-\d+$/.test(x)) irA(x);
  });
})();
