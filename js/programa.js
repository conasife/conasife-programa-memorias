/* CONASIFE 2026 · programa interactivo
   Autor: José Antonio Castillo Torres · © 2026 Instituto Politécnico Nacional */
(function () {
  "use strict";
  var C = window.Comun, D = window.CONASIFE, P = D.programa;
  var $ = function (id) { return document.getElementById(id); };
  var esc = C.esc, txt = C.txt;
  var TIPOS = {
    registro: ["Registro", "registro"], ceremonia: ["Ceremonia", "ceremonia"], magistral: ["Magistral", "magistral"],
    ponencias: ["Ponencias", "ponencias"], workshop: ["Workshop", "workshop"], microtaller: ["Microtalleres", "microtaller"],
    receso: ["Receso", "receso"], cierre: ["Cierre", "registro"], visita: ["Visita", "workshop"]
  };
  var CLAVE_FAV = "conasife2026-agenda";
  var fav = C.leer(CLAVE_FAV, []);
  var nombreDia = {}; P.dias.forEach(function (d) { nombreDia[d.dia] = d.nombre; });
  var magistral = {}; P.magistrales.forEach(function (m) { magistral[m.clave] = m; });
  var workshop = {}; P.workshops.forEach(function (w) { workshop[w.clave] = w; });

  // ---------------------------------------------------------- hora de México (UTC-6, sin horario de verano)
  function ahoraMexico() {
    var d = new Date(Date.now() - 6 * 3600 * 1000);
    return { fecha: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
  }
  function minutos(h) { var p = h.split(":"); return +p[0] * 60 + +p[1]; }
  var hoy = ahoraMexico();
  var diaHoy = null;
  P.dias.forEach(function (d) { if (d.fecha === hoy.fecha) diaHoy = d.dia; });

  // ---------------------------------------------------------- favoritos
  function esFav(k) { return fav.indexOf(k) >= 0; }
  function estrella(k, titulo) {
    return '<button class="estrella" data-fav="' + esc(k) + '" aria-pressed="' + esFav(k) + '" title="Agregar a mi agenda" aria-label="Agregar a mi agenda: ' + esc(titulo) + '">★</button>';
  }
  function alternaFav(k) {
    var i = fav.indexOf(k);
    if (i >= 0) fav.splice(i, 1); else fav.push(k);
    C.guardar(CLAVE_FAV, fav);
    document.querySelectorAll('[data-fav="' + k + '"]').forEach(function (b) { b.setAttribute("aria-pressed", esFav(k)); });
    contador();
    pintaAgenda();
  }
  function contador() { $("n-fav").textContent = fav.length ? "(" + fav.length + ")" : ""; }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-fav]");
    if (b) { e.preventDefault(); alternaFav(b.getAttribute("data-fav")); }
  });

  // ---------------------------------------------------------- piezas
  function autores(lista, conInst) {
    return lista.map(function (a) {
      var n = esc(a.nombre);
      if (a.corresp) n = "<b>" + n + "</b>";
      if (conInst && a.inst && a.inst.length) n += ' <span style="font-style:italic">(' + txt(a.inst.join("; ")) + ")</span>";
      return n;
    }).join(", ");
  }
  function enlaceMemorias(p) {
    return p.en_memorias ? '<a class="ver" href="memorias.html#' + p.clave + '">Ver resumen</a>' : "";
  }
  function ponencia(p) {
    return '<div class="pon">' + estrella("p:" + p.folio, p.titulo) +
      '<div class="h">' + esc(p.inicio) + "–" + esc(p.fin) +
      (C.norm(p.modalidad) === "virtual" ? '<span class="mod-v">en línea</span>' : "") + "</div>" +
      '<div class="t">' + txt(p.titulo) + "</div>" +
      '<div class="a">' + autores(p.autores, true) + "</div>" + enlaceMemorias(p) + "</div>";
  }
  function sesionesDe(dia, inicio) {
    return P.sesiones.filter(function (s) { return s.dia === dia && s.inicio === inicio; });
  }
  function claveAct(a) { return "a:" + a.dia + "-" + a.inicio + "-" + a.tipo; }

  function detalleAct(a) {
    if (a.tipo === "magistral" && magistral[a.detalle]) {
      var m = magistral[a.detalle];
      return '<div class="detalle"><i>' + txt(m.titulo) + "</i><br>" + esc(m.ponente) +
        (m.adscripcion ? ", " + txt(m.adscripcion) : "") + "</div>";
    }
    if (a.tipo === "workshop" && workshop[a.detalle]) {
      var w = workshop[a.detalle];
      return '<div class="detalle"><i>' + txt(w.exposicion) + "</i> · " + txt(w.empresa) +
        "<br>Coordina: " + esc(w.coordina) + (w.cultural ? " · Actividad cultural: " + txt(w.cultural) : "") +
        (w.ponencia ? "<br>Incluye el trabajo en extenso folio " + String(w.ponencia.folio).padStart(3, "0") + ": <i>" + txt(w.ponencia.titulo) + "</i> " + enlaceMemorias(w.ponencia) : "") + "</div>";
    }
    if (a.tipo === "ponencias") {
      var ses = sesionesDe(a.dia, a.inicio);
      if (!ses.length) return "";
      return '<div class="aulas">' + ses.map(function (s) {
        return '<div class="aula"><h4>' + esc(s.aula) + "</h4>" +
          '<div class="eje">' + txt(s.nombre) + "</div>" +
          '<div class="mod">Modera: ' + txt(s.moderador || "[Por confirmar]") + "</div>" +
          s.ponencias.map(ponencia).join("") + "</div>";
      }).join("") + "</div>";
    }
    if (a.tipo === "microtaller") {
      return '<div class="detalle">' + P.microtalleres.map(function (m) {
        return m.numero + ". " + txt(m.titulo) + ' <span class="lugar">(' + txt(m.lugar) + ")</span>";
      }).join("<br>") + '<br><a href="#talleres" data-ir="talleres">Detalles y requisitos</a></div>';
    }
    if (a.detalle) return '<div class="detalle">' + txt(a.detalle) + "</div>";
    return "";
  }

  // ---------------------------------------------------------- por día
  var diaActual = diaHoy || (P.dias[0] && P.dias[0].dia);
  function pintaDias() {
    $("dias").innerHTML = P.dias.map(function (d) {
      return '<button data-dia="' + d.dia + '" aria-pressed="' + (d.dia === diaActual) + '">' + esc(d.nombre) +
        (d.dia === diaHoy ? " · hoy" : "") + "</button>";
    }).join("");
  }
  function pintaLinea() {
    var items = P.agenda.filter(function (a) { return a.dia === diaActual; });
    $("linea").innerHTML = '<div class="linea-tiempo">' + items.map(function (a) {
      var t = TIPOS[a.tipo] || [a.tipo, "registro"];
      var receso = a.tipo === "receso";
      var ahora = diaActual === diaHoy && hoy.min >= minutos(a.inicio) && hoy.min < minutos(a.fin);
      var titulo = a.actividad;
      return '<div class="bloque' + (receso ? " receso" : "") + (ahora ? " ahora" : "") + '" style="--c:var(--' + t[1] + ')">' +
        '<span class="hora">' + esc(a.inicio) + "</span>" +
        (receso ? "" : estrella(claveAct(a), titulo)) +
        '<div class="tit">' + (receso ? "" : '<span class="etiqueta">' + esc(t[0]) + "</span>") + txt(titulo) +
        (ahora ? ' <span class="borrador">Ahora</span>' : "") + "</div>" +
        (receso ? "" : '<div class="lugar">' + esc(a.inicio) + "–" + esc(a.fin) + (a.lugar ? " · " + txt(a.lugar) : "") + "</div>") +
        (receso ? "" : detalleAct(a)) + "</div>";
    }).join("") + "</div>";
  }
  $("dias").addEventListener("click", function (e) {
    var b = e.target.closest("[data-dia]");
    if (!b) return;
    diaActual = +b.getAttribute("data-dia");
    if (P.aclaracion) $("ubica-nota").textContent = P.aclaracion;
  pintaDias(); pintaLinea();
  });

  // ---------------------------------------------------------- ubica tu ponencia
  var todas = [];
  P.sesiones.forEach(function (s) {
    s.ponencias.forEach(function (p) { todas.push({ p: p, s: s }); });
  });
  // Trabajos que se presentan dentro de un workshop (p. ej. folio 12 en el Workshop II)
  P.workshops.forEach(function (w) {
    if (w.ponencia) todas.push({ p: w.ponencia, s: { sesion: w.clave, dia: w.dia, aula: w.lugar + " (" + w.nombre + ")", nombre: w.nombre, ponencias: [w.ponencia] } });
  });
  todas.sort(function (x, y) { return C.norm(x.p.titulo).localeCompare(C.norm(y.p.titulo), "es"); });
  P.dias.forEach(function (d) { $("f-dia").insertAdjacentHTML("beforeend", '<option value="' + d.dia + '">' + esc(d.nombre) + "</option>"); });
  Array.from(new Set(P.sesiones.map(function (s) { return s.aula; }))).sort().forEach(function (a) {
    $("f-aula").insertAdjacentHTML("beforeend", '<option>' + esc(a) + "</option>");
  });
  function pintaUbica() {
    var q = $("q-pon").value.trim(), fd = $("f-dia").value, fa = $("f-aula").value;
    var res = todas.filter(function (x) {
      if (fd && String(x.s.dia) !== fd) return false;
      if (fa && x.s.aula !== fa) return false;
      if (!q) return true;
      var base = [x.p.titulo, x.p.folio, x.p.clave, x.s.nombre, x.p.autores.map(function (a) { return a.nombre + " " + (a.inst || []).join(" "); }).join(" ")].join(" ");
      return C.coincide(base, q);
    });
    $("c-pon").textContent = res.length + " de " + todas.length + " trabajos";
    $("t-pon").innerHTML = res.map(function (x) {
      return "<tr><td class=\"cuando\">" + esc(nombreDia[x.s.dia]) + "<br>" + esc(x.p.inicio) + "–" + esc(x.p.fin) + "<br>" + esc(x.s.aula) +
        (C.norm(x.p.modalidad) === "virtual" ? ' <span class="mod-v">en línea</span>' : "") + "</td>" +
        "<td><b>" + C.resalta(x.p.titulo, q) + "</b><br><small>Folio " + x.p.folio + " · " + txt(x.s.nombre) + "</small><br>" + enlaceMemorias(x.p) + "</td>" +
        "<td>" + x.p.autores.map(function (a) { return (a.corresp ? "<b>" : "") + C.resalta(a.nombre, q) + (a.corresp ? "</b>" : ""); }).join(", ") + "</td>" +
        "<td>" + estrella("p:" + x.p.folio, x.p.titulo) + "</td></tr>";
    }).join("") || '<tr><td colspan="4">No hay ponencias que coincidan. Pruebe con un apellido o una palabra del título.</td></tr>';
  }
  ["q-pon", "f-dia", "f-aula"].forEach(function (id) { $(id).addEventListener("input", pintaUbica); });

  // ---------------------------------------------------------- magistrales y talleres
  function pintaTalleres() {
    $("l-mag").innerHTML = P.magistrales.map(function (m) {
      return '<div class="ficha" style="--c:var(--magistral)">' + estrella("m:" + m.clave, m.titulo) +
        '<div class="cuando">Conferencia magistral ' + esc(m.numero) + " · " + esc(nombreDia[m.dia]) + ", " + esc(m.inicio) + "–" + esc(m.fin) + "</div>" +
        "<h3>" + txt(m.titulo) + "</h3><p>" + esc(m.ponente) + (m.adscripcion ? "<br><i>" + txt(m.adscripcion) + "</i>" : "") + "</p>" +
        '<p class="lugar">' + txt(m.lugar) + "</p></div>";
    }).join("");
    $("l-ws").innerHTML = P.workshops.map(function (w) {
      return '<div class="ficha" style="--c:var(--workshop)">' + estrella("w:" + w.clave, w.nombre) +
        '<div class="cuando">' + esc(w.nombre) + " · " + esc(nombreDia[w.dia]) + ", " + esc(w.inicio) + "–" + esc(w.fin) + "</div>" +
        "<h3>" + txt(w.exposicion) + "</h3><p><b>" + txt(w.empresa) + "</b> · Coordina: " + esc(w.coordina) + "</p>" +
        (w.resumen ? "<p>" + txt(w.resumen) + "</p>" : "") +
        (w.ponencia ? '<p class="presenta"><b>Trabajo en extenso (folio ' + String(w.ponencia.folio).padStart(3, "0") + "):</b> " + txt(w.ponencia.titulo) +
          "<br>" + autores(w.ponencia.autores, true) + " " + enlaceMemorias(w.ponencia) + "</p>" : "") +
        (w.cultural ? "<p>Actividad cultural: " + txt(w.cultural) + "</p>" : "") +
        '<p class="lugar">' + txt(w.lugar) + "</p></div>";
    }).join("");
    var horarios = P.horarios_micro.map(function (h) { return nombreDia[h.dia] + ", " + h.inicio + "–" + h.fin; });
    $("h-micro").innerHTML = "Horario: " + esc(horarios.join(" y ")) + ". Cupo limitado; el registro se hace en el formulario del congreso.";
    $("l-micro").innerHTML = P.microtalleres.map(function (m) {
      return '<div class="ficha" style="--c:var(--microtaller)">' + estrella("t:" + m.numero, m.titulo) +
        '<div class="cuando">Microtaller ' + esc(m.numero) + " · " + txt(m.lugar) + " · Cupo: " + esc(m.capacidad) + "</div>" +
        "<h3>" + txt(m.titulo) + "</h3><p>Imparte: " + esc(m.imparte) + "</p>" +
        (m.requisitos ? "<p><i>Requisitos:</i> " + txt(m.requisitos) + "</p>" : "") + "</div>";
    }).join("");
  }

  // ---------------------------------------------------------- mi agenda
  function eventos() {
    // Convierte los favoritos en eventos con día, inicio, fin, título y lugar
    var ev = [];
    fav.forEach(function (k) {
      var tipo = k.slice(0, 1), id = k.slice(2);
      if (tipo === "p") {
        todas.forEach(function (x) {
          if (String(x.p.folio) === id) ev.push({ k: k, dia: x.s.dia, inicio: x.p.inicio, fin: x.p.fin, titulo: "Ponencia: " + x.p.titulo, lugar: x.s.aula, extra: x.p.autores.map(function (a) { return a.nombre; }).join(", ") });
        });
      } else if (tipo === "a") {
        P.agenda.forEach(function (a) { if (claveAct(a) === k) ev.push({ k: k, dia: a.dia, inicio: a.inicio, fin: a.fin, titulo: a.actividad, lugar: a.lugar, extra: "" }); });
      } else if (tipo === "m" && magistral[id]) {
        var m = magistral[id];
        ev.push({ k: k, dia: m.dia, inicio: m.inicio, fin: m.fin, titulo: "Magistral " + m.numero + ": " + m.titulo, lugar: m.lugar, extra: m.ponente });
      } else if (tipo === "w" && workshop[id]) {
        var w = workshop[id];
        ev.push({ k: k, dia: w.dia, inicio: w.inicio, fin: w.fin, titulo: w.nombre + ": " + w.exposicion, lugar: w.lugar, extra: w.empresa });
      } else if (tipo === "t") {
        P.microtalleres.forEach(function (t) {
          if (t.numero === id) P.horarios_micro.forEach(function (h) {
            ev.push({ k: k, dia: h.dia, inicio: h.inicio, fin: h.fin, titulo: "Microtaller: " + t.titulo, lugar: t.lugar, extra: t.imparte });
          });
        });
      }
    });
    ev.sort(function (a, b) { return a.dia - b.dia || minutos(a.inicio) - minutos(b.inicio); });
    return ev;
  }
  function pintaAgenda() {
    var ev = eventos();
    if (!ev.length) {
      $("l-agenda").innerHTML = '<div class="aviso">Su agenda está vacía. Use la estrella ★ en <a href="#dia" data-ir="dia">Por día</a>, <a href="#ubica" data-ir="ubica">Ubica tu ponencia</a> o <a href="#talleres" data-ir="talleres">Magistrales y talleres</a>.</div>';
      return;
    }
    var html = "", dia = null;
    ev.forEach(function (e) {
      if (e.dia !== dia) { if (dia !== null) html += "</tbody></table>"; dia = e.dia; html += '<h3 style="margin-top:16px">' + esc(nombreDia[dia]) + '</h3><table class="lista"><tbody>'; }
      // Aviso de choque con otra actividad marcada
      var choque = ev.some(function (o) { return o !== e && o.dia === e.dia && minutos(o.inicio) < minutos(e.fin) && minutos(e.inicio) < minutos(o.fin) && o.k.slice(0, 1) !== "a" && e.k.slice(0, 1) !== "a"; });
      html += '<tr><td class="cuando">' + esc(e.inicio) + "–" + esc(e.fin) + "</td><td><b>" + txt(e.titulo) + "</b>" +
        (e.extra ? "<br><small>" + esc(e.extra) + "</small>" : "") + (e.lugar ? "<br>" + txt(e.lugar) : "") +
        (choque ? '<br><span class="pend">Se empalma con otra actividad de su agenda</span>' : "") +
        "</td><td>" + estrella(e.k, e.titulo) + "</td></tr>";
    });
    $("l-agenda").innerHTML = html + "</tbody></table>";
  }
  function ics() {
    var ev = eventos();
    if (!ev.length) { C.aviso("Primero marque actividades con ★"); return; }
    var fechas = {}; P.dias.forEach(function (d) { fechas[d.dia] = d.fecha; });
    function utc(dia, h) { // Hora de Palenque (UTC-6) a UTC
      var p = fechas[dia].split("-"), m = h.split(":");
      var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], +m[0] + 6, +m[1]));
      return d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    }
    function lim(t) { return String(t || "").replace(/[\\;,]/g, function (c) { return "\\" + c; }).replace(/\n/g, "\\n"); }
    var sello = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    var l = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CONASIFE 2026//Programa//ES", "CALSCALE:GREGORIAN"];
    ev.forEach(function (e, i) {
      l.push("BEGIN:VEVENT", "UID:" + e.k.replace(/[^\w-]/g, "_") + "-" + i + "@conasife2026", "DTSTAMP:" + sello,
        "DTSTART:" + utc(e.dia, e.inicio), "DTEND:" + utc(e.dia, e.fin),
        "SUMMARY:" + lim(e.titulo), "LOCATION:" + lim((e.lugar ? e.lugar + ", " : "") + "UPIIP Campus Palenque, IPN"),
        "DESCRIPTION:" + lim((e.extra ? e.extra + "\n" : "") + "1er Congreso Nacional de Sistemas Ferroviarios · " + D.url + "programa.html"),
        "END:VEVENT");
    });
    l.push("END:VCALENDAR");
    var blob = new Blob([l.join("\r\n")], { type: "text/calendar" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "mi_agenda_conasife_2026.ics";
    document.body.appendChild(a); a.click(); a.remove();
  }
  $("b-ics").addEventListener("click", ics);
  $("b-borrar").addEventListener("click", function () {
    fav = []; C.guardar(CLAVE_FAV, fav);
    document.querySelectorAll("[data-fav]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    contador(); pintaAgenda();
  });

  // ---------------------------------------------------------- bienvenida y comités
  function pintaInfo() {
    $("bienvenida").innerHTML = "<h2>Bienvenida</h2>" + P.bienvenida.map(function (p) { return "<p>" + txt(p) + "</p>"; }).join("");
    var grupos = {};
    P.comites.forEach(function (c) { (grupos[c.actividad] = grupos[c.actividad] || []).push(c.nombre); });
    $("comites").innerHTML = Object.keys(grupos).map(function (g) {
      return "<div><b>" + esc(g) + "</b>" + grupos[g].map(esc).join("<br>") + "</div>";
    }).join("");
  }

  // ---------------------------------------------------------- arranque
  var d0 = P.datos;
  $("p-sub").innerHTML = esc(d0.fechas) + " · " + esc(d0.sede) + " · " + esc(d0.modalidad) +
    (d0.estado === "borrador" ? ' <span class="borrador">' + esc(d0.version || "Versión preliminar") + "</span>" : "");
  if (P.aclaracion) $("ubica-nota").textContent = P.aclaracion;
  pintaDias(); pintaLinea(); pintaUbica(); pintaTalleres(); pintaAgenda(); pintaInfo(); contador();
  // Mapa de sedes: si no existe, se quita la pestaña
  var M = P.mapa || {};
  if (!M.svg && !M.png) { $("tab-mapa").remove(); $("mapa").remove(); }
  else {
    if (!M.svg) $("img-mapa").src = M.png;
    $("desc-mapa").innerHTML = (M.pdf ? '<a class="boton chico" href="' + esc(M.pdf) + '" download>Descargar mapa (PDF)</a>' : "") +
      (M.png ? '<a class="boton chico claro" href="' + esc(M.png) + '" download>Descargar mapa (imagen PNG)</a>' : "");
  }
  var activa = C.pestanas(document.querySelector(".pestanas"));
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-ir]");
    if (a) { e.preventDefault(); activa(a.getAttribute("data-ir")); window.scrollTo({ top: 0 }); }
  });
  var inicial = location.hash.slice(1);
  activa(["dia", "ubica", "talleres", "mapa", "agenda", "info"].indexOf(inicial) >= 0 ? inicial : "dia", true);
})();
