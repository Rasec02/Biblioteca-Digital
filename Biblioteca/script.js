"use strict";

/* ============ 1. ESTADO ============ */
let libros = [];
let prestamos = [];
let usuario = "";
let tema = "claro";
let ordenCatalogo = "titulo";
let direccionOrden = "asc";
let filtroEstado = "todos";
let filtroGenero = "todos";
let busqueda = "";
let editandoId = null;

const K = {
  libros: "bib_libros",
  prestamos: "bib_prestamos",
  usuario: "bib_usuario",
  tema: "bib_tema",
  orden: "bib_orden",
  direccion: "bib_direccion"
};

/* ============ 2. FECHAS ============ */
function hoyISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}
function sumarDias(fechaISO, dias) {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const f = new Date(y, m - 1, d);
  f.setDate(f.getDate() + dias);
  const yy = f.getFullYear();
  const mm = String(f.getMonth() + 1).padStart(2, "0");
  const dd = String(f.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
function diferenciaDias(f1, f2) {
  const [y1, m1, d1] = f1.split("-").map(Number);
  const [y2, m2, d2] = f2.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1);
  const b = new Date(y2, m2 - 1, d2);
  return Math.round((b - a) / 86400000);
}

/* ============ 3. DATOS INICIALES ============ */
function datosIniciales() {
  const h = hoyISO();
  const librosIni = [
    { id: "L1", titulo: "Cien años de soledad", autor: "Gabriel García Márquez", anio: 1967, genero: "novela", coleccion: false, comentario: "" },
    { id: "L2", titulo: "El principito", autor: "Antoine de Saint-Exupéry", anio: 1943, genero: "infantil", coleccion: false, comentario: "" },
    { id: "L3", titulo: "Breve historia del tiempo", autor: "Stephen Hawking", anio: 1988, genero: "ciencia", coleccion: false, comentario: "" },
    { id: "L4", titulo: "Sapiens", autor: "Yuval Noah Harari", anio: 2011, genero: "historia", coleccion: false, comentario: "" },
    { id: "L5", titulo: "La Odisea", autor: "Homero", anio: 800, genero: "poesia", coleccion: true, comentario: "Colección" },
    { id: "L6", titulo: "El arte de la guerra", autor: "Sun Tzu", anio: 500, genero: "ensayo", coleccion: true, comentario: "Colección" },
    { id: "L7", titulo: "Rayuela", autor: "Julio Cortázar", anio: 1963, genero: "novela", coleccion: false, comentario: "" },
    { id: "L8", titulo: "Cosmos", autor: "Carl Sagan", anio: 1980, genero: "ciencia", coleccion: false, comentario: "" }
  ];
  const prestamosIni = [
    { id: "P1", idLibro: "L2", persona: "Ana", fechaPrestamo: sumarDias(h, -20), fechaLimite: sumarDias(h, -6), fechaDevolucion: null },
    { id: "P2", idLibro: "L4", persona: "Luis", fechaPrestamo: sumarDias(h, -3), fechaLimite: sumarDias(h, 11), fechaDevolucion: null },
    { id: "P3", idLibro: "L1", persona: "María", fechaPrestamo: sumarDias(h, -30), fechaLimite: sumarDias(h, -16), fechaDevolucion: sumarDias(h, -18) },
    { id: "P4", idLibro: "L7", persona: "Pedro", fechaPrestamo: sumarDias(h, -40), fechaLimite: sumarDias(h, -26), fechaDevolucion: sumarDias(h, -22) }
  ];
  return { libros: librosIni, prestamos: prestamosIni };
}

/* ============ 4. PERSISTENCIA ============ */
function guardar() {
  localStorage.setItem(K.libros, JSON.stringify(libros));
  localStorage.setItem(K.prestamos, JSON.stringify(prestamos));
  localStorage.setItem(K.usuario, usuario);
  localStorage.setItem(K.tema, tema);
  localStorage.setItem(K.orden, ordenCatalogo);
  localStorage.setItem(K.direccion, direccionOrden);
}
function cargar() {
  const l = localStorage.getItem(K.libros);
  const p = localStorage.getItem(K.prestamos);
  if (l && p) {
    libros = JSON.parse(l);
    prestamos = JSON.parse(p);
    usuario = localStorage.getItem(K.usuario) || "";
    tema = localStorage.getItem(K.tema) || "claro";
    ordenCatalogo = localStorage.getItem(K.orden) || "titulo";
    direccionOrden = localStorage.getItem(K.direccion) || "asc";
  } else {
    const d = datosIniciales();
    libros = d.libros;
    prestamos = d.prestamos;
    usuario = ""; tema = "claro"; ordenCatalogo = "titulo"; direccionOrden = "asc";
    guardar();
  }
}
function restablecer() {
  localStorage.clear();
  const d = datosIniciales();
  libros = d.libros; prestamos = d.prestamos;
  usuario = ""; tema = "claro"; ordenCatalogo = "titulo"; direccionOrden = "asc";
  filtroEstado = "todos"; filtroGenero = "todos"; busqueda = ""; editandoId = null;
  guardar();
}
function siguienteId(prefijo, coleccion) {
  let max = 0;
  for (const item of coleccion) {
    const num = parseInt(String(item.id).replace(prefijo, ""), 10);
    if (!isNaN(num) && num > max) max = num;
  }
  return prefijo + (max + 1);
}
/* ============ 5. CONSULTAS ============ */
function libroPorId(id) { return libros.find((l) => l.id === id) || null; }
function prestamoActivo(idLibro) { return prestamos.find((p) => p.idLibro === idLibro && p.fechaDevolucion === null) || null; }
function disponible(l) { return !l.coleccion && !prestamoActivo(l.id); }
function vencido(p) { return p.fechaDevolucion === null && p.fechaLimite < hoyISO(); }
function diasRetraso(p) {
  if (p.fechaDevolucion === null) { const d = diferenciaDias(p.fechaLimite, hoyISO()); return d > 0 ? d : 0; }
  const d = diferenciaDias(p.fechaLimite, p.fechaDevolucion); return d > 0 ? d : 0;
}
function contarActivos() { return prestamos.filter((p) => p.fechaDevolucion === null).length; }

/* ============ 6. FILTRAR / ORDENAR ============ */
function generosDisponibles() {
  const s = new Set(libros.map((l) => l.genero));
  return [...s].sort((a, b) => a.localeCompare(b, "es"));
}
function filtrarYOrdenar() {
  let r = [...libros];
  if (busqueda.trim()) {
    const q = busqueda.trim().toLowerCase();
    r = r.filter((l) => l.titulo.toLowerCase().includes(q) || l.autor.toLowerCase().includes(q));
  }
  if (filtroEstado === "disponibles") r = r.filter((l) => disponible(l));
  if (filtroEstado === "prestados") r = r.filter((l) => prestamoActivo(l.id) !== null);
  if (filtroGenero !== "todos") r = r.filter((l) => l.genero === filtroGenero);
  r.sort((a, b) => {
    let c = 0;
    if (ordenCatalogo === "titulo") c = a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" });
    else if (ordenCatalogo === "autor") c = a.autor.localeCompare(b.autor, "es", { sensitivity: "base" });
    else c = a.anio - b.anio;
    return direccionOrden === "asc" ? c : -c;
  });
  return r;
}

/* ============ 7. REFERENCIAS DOM ============ */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* ============ 8. NAVEGACIÓN ============ */
function mostrarVista(nombre) {
  $$(".vista").forEach((v) => (v.hidden = true));
  const v = document.getElementById("vista-" + nombre);
  if (v) v.hidden = false;
  $$(".menu-enlace").forEach((b) => b.classList.toggle("activo", b.dataset.vista === nombre));

  // Limpia mensajes viejos al entrar a cada vista
  if (nombre === "prestamos") {
    const mp = $("#mensaje-prestamos");
    if (mp) { mp.textContent = ""; mp.className = "mensaje"; }
  }
  if (nombre === "formulario" && !editandoId) {
    const mf = $("#mensaje-formulario");
    if (mf) { mf.textContent = ""; mf.className = "mensaje"; }
  }
}

/* ============ 9. TEMA ============ */
function aplicarTema() {
  document.body.classList.toggle("tema-oscuro", tema === "oscuro");
  $("#btn-tema").textContent = tema === "oscuro" ? "☀️ Claro" : "🌙 Oscuro";
}

/* ============ 10. MENÚ ============ */
function renderMenu() {
  $("#contador-prestamos").textContent = contarActivos();
  $("#saludo-usuario").textContent = usuario ? "Hola, " + usuario : "Hola";
}

/* ============ 11. SELECT GÉNERO ============ */
function renderSelectGenero() {
  const sel = $("#filtro-genero");
  const generos = generosDisponibles();
  const actuales = [...sel.options].map((o) => o.value).filter((v) => v !== "todos");
  const iguales = generos.length === actuales.length && generos.every((g) => actuales.includes(g));
  if (!iguales) {
    sel.textContent = "";
    const o0 = document.createElement("option");
    o0.value = "todos"; o0.textContent = "Todos los géneros";
    sel.append(o0);
    for (const g of generos) {
      const o = document.createElement("option");
      o.value = g; o.textContent = g;
      sel.append(o);
    }
  }
  sel.value = [...sel.options].some((o) => o.value === filtroGenero) ? filtroGenero : "todos";
}

/* ============ 12. RENDER CATÁLOGO ============ */
function crearTarjeta(libro) {
  const act = prestamoActivo(libro.id);
  const venc = act && vencido(act);

  const card = document.createElement("article");
  card.className = "tarjeta";
  if (act) card.classList.add("tarjeta-prestada");
  if (libro.coleccion) card.classList.add("tarjeta-coleccion");

  const h = document.createElement("h3");
  h.className = "tarjeta-titulo";
  h.textContent = libro.titulo;
  card.append(h);

  const meta = document.createElement("p");
  meta.className = "tarjeta-meta";
  meta.textContent = `${libro.autor} · ${libro.anio} · ${libro.genero}`;
  card.append(meta);

  const est = document.createElement("span");
  est.className = "tarjeta-estado";
  est.textContent = libro.coleccion ? "De colección" : act ? "Prestado" : "Disponible";
  card.append(est);

  if (act) {
    const info = document.createElement("p");
    info.className = "tarjeta-prestamo-info";
    info.textContent = `Prestado a ${act.persona} · Devolver antes del ${act.fechaLimite}`;
    card.append(info);
    if (venc) {
      const et = document.createElement("span");
      et.className = "etiqueta-vencido";
      et.textContent = `Vencido (${diasRetraso(act)} días)`;
      card.append(et);
    }
  }

  const acc = document.createElement("div");
  acc.className = "tarjeta-acciones";

  if (act) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "btn btn-primario";
    b.dataset.accion = "devolver"; b.dataset.id = libro.id;
    b.textContent = "Devolver";
    acc.append(b);
  } else {
    const b = document.createElement("button");
    b.type = "button"; b.className = "btn btn-primario";
    b.dataset.accion = "prestar"; b.dataset.id = libro.id;
    b.textContent = "Prestar";
    b.disabled = libro.coleccion;
    acc.append(b);
  }

  const be = document.createElement("button");
  be.type = "button"; be.className = "btn";
  be.dataset.accion = "editar"; be.dataset.id = libro.id;
  be.textContent = "Editar";
  acc.append(be);

  const bd = document.createElement("button");
  bd.type = "button"; bd.className = "btn btn-peligro";
  bd.dataset.accion = "eliminar"; bd.dataset.id = libro.id;
  bd.textContent = "Eliminar";
  acc.append(bd);

  card.append(acc);
  return card;
}

function renderCatalogo() {
  const cont = $("#contenedor-libros");
  cont.textContent = "";
   const msgs = $("#mensajes-catalogo");
  if (msgs) msgs.textContent = "";
  const lista = filtrarYOrdenar();
  for (const l of lista) cont.append(crearTarjeta(l));
  $("#contador-catalogo").textContent = `Mostrando ${lista.length} de ${libros.length} libros`;
}

/* ============ 13. RENDER GLOBAL ============ */
function renderTodo() {
  renderMenu();
  renderSelectGenero();
  renderCatalogo();
  renderPrestamos();
  renderResumen();
}

/* ============ 14. EVENTOS BASE ============ */
function eventosBase() {
  $$(".menu-enlace").forEach((b) => {
    b.addEventListener("click", () => mostrarVista(b.dataset.vista));
  });

  $("#btn-tema").addEventListener("click", () => {
    tema = tema === "oscuro" ? "claro" : "oscuro";
    aplicarTema();
    guardar();
  });

  $("#buscador").addEventListener("input", (e) => {
    busqueda = e.target.value;
    renderCatalogo();
  });

  $$(".btn-filtro").forEach((b) => {
    b.addEventListener("click", () => {
      filtroEstado = b.dataset.filtro;
      $$(".btn-filtro").forEach((x) => x.classList.toggle("activo", x === b));
      renderCatalogo();
    });
  });

  $("#filtro-genero").addEventListener("change", (e) => {
    filtroGenero = e.target.value;
    renderCatalogo();
  });

  $("#orden-catalogo").addEventListener("change", (e) => {
    ordenCatalogo = e.target.value;
    guardar();
    renderCatalogo();
  });

  $("#btn-direccion").addEventListener("click", () => {
    direccionOrden = direccionOrden === "asc" ? "desc" : "asc";
    $("#btn-direccion").textContent = direccionOrden === "asc" ? "Ascendente ↑" : "Descendente ↓";
    guardar();
    renderCatalogo();
  });
}

/* ============ 15. INICIO ============ */
function iniciar() {
  cargar();
  aplicarTema();
  $("#orden-catalogo").value = ordenCatalogo;
  $("#btn-direccion").textContent = direccionOrden === "asc" ? "Ascendente ↑" : "Descendente ↓";
  $("#campo-usuario").value = usuario;
  eventosBase();
  eventos2(); ["modal-prestar", "modal-eliminar", "modal-restablecer"].forEach((id) => {
    const m = document.getElementById(id);
    if (m) m.addEventListener("keydown", (e) => atraparTab(e, m));
  });
  mostrarVista("catalogo");
  renderTodo();
}

document.addEventListener("DOMContentLoaded", iniciar);

/* ============ 16. RENDER PRÉSTAMOS ============ */
function renderPrestamos() {
  const activos = prestamos.filter((p) => p.fechaDevolucion === null)
    .sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite));
  const lp = $("#lista-prestamos");
  lp.textContent = "";
  $("#sin-prestamos").hidden = activos.length > 0;

  for (const p of activos) {
    const l = libroPorId(p.idLibro);
    const li = document.createElement("li");
    li.className = "item-prestamo";
    if (vencido(p)) li.classList.add("item-prestamo-vencido");

    const info = document.createElement("div");
    info.className = "item-info";
    const t = document.createElement("strong");
    t.textContent = l ? l.titulo : "(libro eliminado)";
    info.append(t);
    const d1 = document.createElement("span");
    d1.textContent = `Prestado a ${p.persona}`;
    info.append(d1);
    const d2 = document.createElement("span");
    d2.textContent = `Fecha límite: ${p.fechaLimite}`;
    info.append(d2);
    if (vencido(p)) {
      const et = document.createElement("span");
      et.className = "etiqueta-vencido";
      et.textContent = `Vencido (${diasRetraso(p)} días)`;
      info.append(et);
    }

    const b = document.createElement("button");
    b.type = "button"; b.className = "btn btn-primario";
    b.dataset.accion = "devolver"; b.dataset.id = p.idLibro;
    b.textContent = "Devolver";

    li.append(info, b);
    lp.append(li);
  }

  const dev = prestamos.filter((p) => p.fechaDevolucion !== null)
    .sort((a, b) => b.fechaDevolucion.localeCompare(a.fechaDevolucion));
  const lh = $("#lista-historial");
  lh.textContent = "";
  $("#sin-historial").hidden = dev.length > 0;

  for (const p of dev) {
    const l = libroPorId(p.idLibro);
    const li = document.createElement("li");
    li.className = "item-historial";
    const info = document.createElement("div");
    info.className = "item-info";
    const t = document.createElement("strong");
    t.textContent = l ? l.titulo : "(libro eliminado)";
    info.append(t);
    const d1 = document.createElement("span");
    d1.textContent = `Persona: ${p.persona}`;
    info.append(d1);
    const d2 = document.createElement("span");
    d2.textContent = `Prestado: ${p.fechaPrestamo} · Devuelto: ${p.fechaDevolucion}`;
    info.append(d2);
    const d3 = document.createElement("span");
    const r = diasRetraso(p);
    d3.textContent = r > 0 ? `Con retraso (${r} días)` : "A tiempo";
    info.append(d3);
    li.append(info);
    lh.append(li);
  }
}

/* ============ 17. RENDER RESUMEN ============ */
function renderResumen() {
  const total = libros.length;
  const disp = libros.filter((l) => disponible(l)).length;
  const act = prestamos.filter((p) => p.fechaDevolucion === null);
  const pres = act.length;
  const venc = act.filter((p) => vencido(p)).length;

  $("#resumen-total").textContent = total;
  $("#resumen-disponibles").textContent = disp;
  $("#resumen-prestados").textContent = pres;
  $("#resumen-vencidos").textContent = venc;

  const ul = $("#resumen-generos");
  ul.textContent = "";
  const porGen = {};
  for (const l of libros) porGen[l.genero] = (porGen[l.genero] || 0) + 1;
  for (const [g, n] of Object.entries(porGen).sort((a, b) => a[0].localeCompare(b[0], "es"))) {
    const li = document.createElement("li");
    li.className = "item-genero";
    li.textContent = `${g}: ${n}`;
    ul.append(li);
  }
}

let focoAntesDeModal = null;

function guardarFoco() {
  focoAntesDeModal = document.activeElement;
}

function restaurarFoco() {
  if (focoAntesDeModal && typeof focoAntesDeModal.focus === "function") {
    focoAntesDeModal.focus();
  }
  focoAntesDeModal = null;
}

function atraparTab(e, modal) {
  if (e.key !== "Tab") return;
  const focos = modal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focos.length) return;
  const primero = focos[0];
  const ultimo = focos[focos.length - 1];

  if (e.shiftKey && document.activeElement === primero) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primero.focus();
  }
}

function alAbrirModal() {
  guardarFoco();
  document.body.classList.add("modal-abierto");
}

function alCerrarModal() {
  document.body.classList.remove("modal-abierto");
  restaurarFoco();
}


/* ============ 18. MODAL PRESTAR ============ */
let idPrestar = null;
function abrirPrestar(id) {
  idPrestar = id;
  const l = libroPorId(id);
  $("#modal-prestar-libro").textContent = l ? `«${l.titulo}»` : "";
  $("#campo-persona").value = usuario || "";
  $("#error-persona").textContent = "";
  $("#modal-prestar").hidden = false;
  alAbrirModal();
  $("#campo-persona").focus();
}
function cerrarPrestar() { $("#modal-prestar").hidden = true; idPrestar = null;
  alCerrarModal();
 }
function confirmarPrestar() {
  if (!idPrestar) return;
  const persona = $("#campo-persona").value.trim();
  const l = libroPorId(idPrestar);
  if (!l) { cerrarPrestar(); return; }

  // Validaciones que se muestran DENTRO del modal (como pide el PDF)
  if (l.coleccion) {
    $("#error-persona").textContent = "Los libros de colección no se prestan.";
    return;
  }
  if (prestamoActivo(idPrestar)) {
    $("#error-persona").textContent = "Este libro ya está prestado.";
    return;
  }
  if (persona.length < 2 || persona.length > 40) {
    $("#error-persona").textContent = "El nombre debe tener entre 2 y 40 caracteres.";
    return;
  }

  // Regla de negocio: máximo 3 préstamos activos.
  // Este error SÍ se escribe en la página (Vista 2), no en el modal.
  if (contarActivos() >= 3) {
    cerrarPrestar();                         // 1) cierra el modal
    mostrarVista("prestamos");               // 2) cambia a Vista 2
    const mp = $("#mensaje-prestamos");      // 3) escribe el mensaje DESPUÉS
    if (mp) {
      mp.textContent = "No puedes tener más de 3 préstamos activos a la vez.";
      mp.className = "mensaje error";
    } else {
      // Salvavidas por si el <p> no existiera en el HTML
      console.warn("Falta #mensaje-prestamos en el HTML");
    }
    return;                                  // 4) NO se crea el préstamo
  }

  // Crear el préstamo
  const h = hoyISO();
  const nuevo = {
    id: siguienteId("P", prestamos),
    idLibro: idPrestar,
    persona,
    fechaPrestamo: h,
    fechaLimite: sumarDias(h, 14),
    fechaDevolucion: null
  };
  prestamos.push(nuevo);
  guardar();
  cerrarPrestar();
  renderTodo();
  mostrarVista("catalogo");
}

/* ============ 19. MODAL ELIMINAR ============ */
let idEliminar = null;
function abrirEliminar(id) {
  idEliminar = id;
  const l = libroPorId(id);
  $("#modal-eliminar-texto").textContent = l ? `¿Eliminar «${l.titulo}»? No se puede deshacer.` : "";
  $("#modal-eliminar").hidden = false;
  alAbrirModal();
  $("#btn-confirmar-eliminar").focus();
}
function cerrarEliminar() { $("#modal-eliminar").hidden = true; idEliminar = null; 
  alCerrarModal();
}
function confirmarEliminar() {
  if (!idEliminar) return;
  if (prestamoActivo(idEliminar)) {
    cerrarEliminar();
    alertaCatalogo("No puedes eliminar un libro con préstamo activo.", "error");
    return;
  }
  libros = libros.filter((l) => l.id !== idEliminar);
  prestamos = prestamos.filter((p) => p.idLibro !== idEliminar);
  guardar();
  cerrarEliminar();
  renderTodo(); 
  alertaCatalogo("Libro eliminado.", "exito");
  
}
function alertaCatalogo(texto, tipo) {
  const cont = $("#mensajes-catalogo");
  if (!cont) return;
  const p = document.createElement("p");
  p.className = "mensaje " + (tipo || "");
  p.textContent = texto;
  cont.append(p);
  setTimeout(() => { if (p.isConnected) p.remove(); }, 4000);
}

/* ============ 20. DEVOLVER ============ */
function devolver(idLibro) {
  const a = prestamoActivo(idLibro);
  if (!a) return;
  a.fechaDevolucion = hoyISO();
  guardar();
  const r = diasRetraso(a);
  renderTodo();
  alertaCatalogo(r > 0 ? `Devuelto con ${r} día(s) de retraso.` : "Devuelto a tiempo.", "exito");
}

/* ============ 21. FORMULARIO ============ */
function limpiarForm() {
  editandoId = null;
  $("#form-libro").reset();
  $("#titulo-formulario").textContent = "Agregar libro";
  $("#btn-enviar-formulario").textContent = "Agregar libro";
  $("#btn-cancelar-edicion").hidden = true;
  $("#mensaje-formulario").textContent = "";
  ["titulo", "autor", "anio", "genero"].forEach((k) => $("#error-" + k).textContent = "");
  $("#restantes-comentario").textContent = "120";
}
function leerForm() {
  return {
    titulo: $("#campo-titulo").value,
    autor: $("#campo-autor").value,
    anio: $("#campo-anio").value,
    genero: $("#campo-genero").value,
    comentario: $("#campo-comentario").value,
    coleccion: $("#campo-coleccion").checked
  };
}
function validar(datos, idEdit) {
  const e = {};
  const t = (datos.titulo || "").trim();
  const a = (datos.autor || "").trim();
  const an = parseInt(datos.anio, 10);
  if (t.length < 3 || t.length > 60) e.titulo = "El título debe tener entre 3 y 60 caracteres.";
  if (!a) e.autor = "El autor es obligatorio.";
  if (isNaN(an) || an < 1000 || an > 2026) e.anio = "El año debe estar entre 1000 y 2026.";
  if (!datos.genero) e.genero = "Selecciona un género.";
  const dup = libros.find((l) => {
    if (idEdit && l.id === idEdit) return false;
    return l.titulo.toLowerCase() === t.toLowerCase() && l.autor.toLowerCase() === a.toLowerCase();
  });
  if (dup) e.titulo = "Ya existe un libro con ese título y autor.";
  return e;
}
function iniciarEdicion(id) {
  const l = libroPorId(id);
  if (!l) return;
  editandoId = id;
  $("#campo-titulo").value = l.titulo;
  $("#campo-autor").value = l.autor;
  $("#campo-anio").value = l.anio;
  $("#campo-genero").value = l.genero;
  $("#campo-comentario").value = l.comentario || "";
  $("#campo-coleccion").checked = !!l.coleccion;
  $("#restantes-comentario").textContent = 120 - (l.comentario || "").length;
  $("#titulo-formulario").textContent = "Editar libro";
  $("#btn-enviar-formulario").textContent = "Guardar cambios";
  $("#btn-cancelar-edicion").hidden = false;
  ["titulo", "autor", "anio", "genero"].forEach((k) => $("#error-" + k).textContent = "");
  $("#mensaje-formulario").textContent = "";
  mostrarVista("formulario");
}

/* ============ 22. EVENTOS 2 ============ */
function eventos2() {
  // Delegación en tarjetas
  $("#contenedor-libros").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-accion]");
    if (!b) return;
    const id = b.dataset.id;
    const acc = b.dataset.accion;
    if (acc === "prestar") abrirPrestar(id);
    else if (acc === "devolver") devolver(id);
    else if (acc === "editar") iniciarEdicion(id);
    else if (acc === "eliminar") abrirEliminar(id);
  });

  // Delegación en lista préstamos
  $("#lista-prestamos").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-accion='devolver']");
    if (!b) return;
    devolver(b.dataset.id);
  });

  // Modales
  $("#btn-confirmar-prestar").addEventListener("click", confirmarPrestar);
  $("#btn-cancelar-prestar").addEventListener("click", cerrarPrestar);
  $("#btn-confirmar-eliminar").addEventListener("click", confirmarEliminar);
  $("#btn-cancelar-eliminar").addEventListener("click", cerrarEliminar);

  // Formulario
  $("#form-libro").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = leerForm();
    const err = validar(d, editandoId);
    ["titulo", "autor", "anio", "genero"].forEach((k) => $("#error-" + k).textContent = err[k] || "");
    if (Object.keys(err).length) {
      const primero = ["titulo", "autor", "anio", "genero"].find((k) => err[k]);
      if (primero) $("#campo-" + primero).focus();
      return;
    }
    if (editandoId) {
      const l = libroPorId(editandoId);
      if (prestamoActivo(editandoId) && d.coleccion) {
        $("#mensaje-formulario").textContent = "No puedes marcar como colección un libro prestado.";
        $("#mensaje-formulario").className = "mensaje error";
        return;
      }
      l.titulo = d.titulo.trim(); l.autor = d.autor.trim(); l.anio = parseInt(d.anio, 10);
      l.genero = d.genero; l.comentario = (d.comentario || "").trim(); l.coleccion = !!d.coleccion;
      
    } else {
      libros.push({
  id: siguienteId("L", libros),
  titulo: d.titulo.trim(), autor: d.autor.trim(), anio: parseInt(d.anio, 10),
  genero: d.genero, comentario: (d.comentario || "").trim(), coleccion: !!d.coleccion
      });
     
    }
     const mensajeExito = editandoId ? "Libro actualizado." : "Libro agregado.";
    guardar();
    limpiarForm();
    renderTodo(); 
    mostrarVista("catalogo");
    alertaCatalogo(mensajeExito, "exito");
  });

  $("#btn-cancelar-edicion").addEventListener("click", limpiarForm);
  $("#campo-comentario").addEventListener("input", (e) => {
    $("#restantes-comentario").textContent = 120 - e.target.value.length;
  });

  // Usuario
  $("#campo-usuario").addEventListener("input", (e) => {
    usuario = e.target.value.trim();
    guardar();
    renderMenu();
  });

  // Restablecer con modal
   $("#btn-restablecer").addEventListener("click", () => {
    $("#modal-restablecer").hidden = false;
    alAbrirModal();
    $("#btn-confirmar-restablecer").focus();
  });
  $("#btn-cancelar-restablecer").addEventListener("click", () => {
    $("#modal-restablecer").hidden = true;
    alCerrarModal();
  });
  $("#btn-confirmar-restablecer").addEventListener("click", () => {
    $("#modal-restablecer").hidden = true;
    restablecer();
    limpiarForm();
    $("#campo-usuario").value = "";
    $("#orden-catalogo").value = ordenCatalogo;
    $("#btn-direccion").textContent = direccionOrden === "asc" ? "Ascendente ↑" : "Descendente ↓";
    aplicarTema();
    renderTodo();
    mostrarVista("catalogo");
   
    alCerrarModal();
    $("#buscador").focus();
  });

  // Escape
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("#modal-prestar").hidden) { cerrarPrestar(); return; }
    if (!$("#modal-eliminar").hidden) { cerrarEliminar(); return; }
    if (!$("#modal-restablecer").hidden) { $("#modal-restablecer").hidden = true;
      alCerrarModal();
      return; }
    if (!$("#vista-formulario").hidden) limpiarForm();
  });
}