// ── Estado ──────────────────────────────────────────────
let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenActual = "normal";
let precioMaximo = 0; // 0 = sin límite

// ── Referencias DOM ─────────────────────────────────────
const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const ordenPrecio = document.querySelector("#ordenPrecio");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const totalPersonas = document.querySelector("#totalPersonas");
const estado = document.querySelector("#estado");
const precioMaximoInput = document.querySelector("#precioMaximo");
const btnVaciar = document.querySelector("#btnVaciar");

// ── Carga asíncrona ─────────────────────────────────────
async function cargarExperiencias() {
  try {
    estado.textContent = "Cargando experiencias...";
    const respuesta = await fetch("./data/experiencias.json");
    if (!respuesta.ok)
      throw new Error("No fue posible cargar las experiencias");
    experiencias = await respuesta.json();
    estado.textContent = `${experiencias.length} experiencias disponibles`;
    actualizarCatalogo();
  } catch (error) {
    estado.textContent = "Error al cargar la información";
    console.error(error);
  }
}

// ── Filtros y orden ─────────────────────────────────────
function obtenerResultados() {
  let resultados = [...experiencias];

  if (categoriaActual !== "todas") {
    resultados = resultados.filter((e) => e.categoria === categoriaActual);
  }

  if (textoBusqueda !== "") {
    resultados = resultados.filter((e) =>
      e.nombre.toLowerCase().includes(textoBusqueda),
    );
  }

  // Reto 2: filtro precio máximo
  if (precioMaximo > 0) {
    resultados = resultados.filter((e) => e.precio <= precioMaximo);
  }

  if (ordenActual === "ascendente")
    resultados.sort((a, b) => a.precio - b.precio);
  if (ordenActual === "descendente")
    resultados.sort((a, b) => b.precio - a.precio);

  return resultados;
}

// ── Renderizar catálogo ──────────────────────────────────
function actualizarCatalogo() {
  const resultados = obtenerResultados();

  if (resultados.length === 0) {
    catalogo.innerHTML = `<p class="sin-resultados">No se encontraron experiencias</p>`;
    estado.textContent = "0 resultados";
    return;
  }

  catalogo.innerHTML = resultados
    .map(
      (e) => `
    <article class="tarjeta">
      <div class="imagen">${e.icono}</div>
      <div class="informacion">
        <span class="categoria">${e.categoria}</span>
        <h3>${e.nombre}</h3>
        <p>Cupo disponible: ${e.cupo}</p>
        <p class="precio">$${e.precio} MXN</p>
        <label>Personas:
          <input type="number" id="cantidad-${e.id}" min="1" max="${e.cupo}" value="1">
        </label>
        <p class="mensaje-error" id="error-${e.id}"></p>
        <button class="btn-reservar" data-id="${e.id}">Agregar</button>
      </div>
    </article>
  `,
    )
    .join("");

  estado.textContent = `${resultados.length} resultados`;
  agregarEventosReservar();
}

function agregarEventosReservar() {
  document.querySelectorAll(".btn-reservar").forEach((boton) => {
    boton.addEventListener("click", () =>
      agregarReserva(Number(boton.dataset.id)),
    );
  });
}

// ── Agregar reserva ──────────────────────────────────────
function agregarReserva(id) {
  const experiencia = experiencias.find((e) => e.id === id);
  const cantidad = Number(document.querySelector(`#cantidad-${id}`).value);
  const msgError = document.querySelector(`#error-${id}`);

  // Reto 6: mensajes en página en lugar de alert()
  if (cantidad < 1 || cantidad > experiencia.cupo) {
    msgError.textContent = "Cantidad no válida.";
    return;
  }

  const existente = reservas.find((r) => r.experienciaId === id);

  if (existente) {
    const nuevaCantidad = existente.cantidad + cantidad;
    if (nuevaCantidad > experiencia.cupo) {
      msgError.textContent = `Supera el cupo disponible (${experiencia.cupo}).`;
      return;
    }
    existente.cantidad = nuevaCantidad;
    existente.subtotal = nuevaCantidad * experiencia.precio;
  } else {
    reservas.push({
      experienciaId: id,
      nombre: experiencia.nombre,
      precio: experiencia.precio,
      cantidad,
      subtotal: experiencia.precio * cantidad,
    });
  }

  if (msgError) msgError.textContent = "";
  mostrarReservas();
}

// ── Mostrar reservas, total dinero y total personas ──────
function mostrarReservas() {
  if (reservas.length === 0) {
    listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
    total.textContent = "$0 MXN";
    totalPersonas.textContent = "0";
    return;
  }

  // Reto 3: botones +/- en la sección Mi reservación
  listaReservas.innerHTML = reservas
    .map(
      (r) => `
    <article class="item-reserva">
      <div>
        <strong>${r.nombre}</strong>
        <p>$${r.precio} MXN por persona</p>
      </div>
      <div>
        <div class="controles-cantidad">
          <button class="btn-menos" data-id="${r.experienciaId}">−</button>
          <span>${r.cantidad}</span>
          <button class="btn-mas" data-id="${r.experienciaId}">+</button>
        </div>
        <strong>$${r.subtotal} MXN</strong>
        <button class="btn-eliminar" data-id="${r.experienciaId}">Eliminar</button>
      </div>
    </article>
  `,
    )
    .join("");

  // Reto 4: total de dinero
  const totalDinero = reservas.reduce((suma, r) => suma + r.subtotal, 0);
  total.textContent = `$${totalDinero} MXN`;

  // Reto 4: total de personas
  const personas = reservas.reduce((suma, r) => suma + r.cantidad, 0);
  totalPersonas.textContent = personas;

  agregarEventosEliminar();
  agregarEventosCantidad();
}

// ── Eventos eliminar ─────────────────────────────────────
function agregarEventosEliminar() {
  document.querySelectorAll(".btn-eliminar").forEach((boton) => {
    boton.addEventListener("click", () =>
      eliminarReserva(Number(boton.dataset.id)),
    );
  });
}

function eliminarReserva(id) {
  reservas = reservas.filter((r) => r.experienciaId !== id);
  mostrarReservas();
}

// ── Reto 3: eventos +/- en reservación ──────────────────
function agregarEventosCantidad() {
  document.querySelectorAll(".btn-menos").forEach((boton) => {
    boton.addEventListener("click", () =>
      cambiarCantidad(Number(boton.dataset.id), -1),
    );
  });
  document.querySelectorAll(".btn-mas").forEach((boton) => {
    boton.addEventListener("click", () =>
      cambiarCantidad(Number(boton.dataset.id), 1),
    );
  });
}

function cambiarCantidad(id, delta) {
  const reserva = reservas.find((r) => r.experienciaId === id);
  const experiencia = experiencias.find((e) => e.id === id);
  const nuevaCantidad = reserva.cantidad + delta;

  if (nuevaCantidad < 1) {
    eliminarReserva(id);
    return;
  }

  if (nuevaCantidad > experiencia.cupo) return; // no hace nada si supera cupo

  reserva.cantidad = nuevaCantidad;
  reserva.subtotal = nuevaCantidad * reserva.precio;
  mostrarReservas();
}

// ── Reto 5: vaciar reservación ───────────────────────────
btnVaciar.addEventListener("click", () => {
  if (reservas.length === 0) return;
  const confirmado = confirm("¿Seguro que quieres vaciar toda la reservación?");
  if (confirmado) {
    reservas = [];
    mostrarReservas();
  }
});

// ── Eventos de controles ─────────────────────────────────
buscador.addEventListener("input", () => {
  textoBusqueda = buscador.value.trim().toLowerCase();
  actualizarCatalogo();
});

filtroCategoria.addEventListener("change", () => {
  categoriaActual = filtroCategoria.value;
  actualizarCatalogo();
});

ordenPrecio.addEventListener("change", () => {
  ordenActual = ordenPrecio.value;
  actualizarCatalogo();
});

// Reto 2: filtro precio máximo
precioMaximoInput.addEventListener("input", () => {
  precioMaximo = Number(precioMaximoInput.value);
  actualizarCatalogo();
});

// ── Inicio ───────────────────────────────────────────────
cargarExperiencias();
