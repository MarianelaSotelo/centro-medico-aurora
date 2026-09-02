/* =========================================================
   App de turnos — Centro Médico Aurora
   Login de demostración, reserva de turnos contra
   data/especialistas.json y persistencia en localStorage.
   ========================================================= */

// ---------- CREDENCIALES DE LA DEMO ----------
const usuarioValido = "marianela";
const claveValida = "4444";

// ---------- REFERENCIAS AL DOM ----------
const loginDiv = document.getElementById("login");
const panelDiv = document.getElementById("panelPrincipal");
const btnLogin = document.getElementById("botonLogin");
const mensajeLogin = document.getElementById("mensajeLogin");

const formTurno = document.getElementById("formTurno");
const listaTurnos = document.getElementById("listaTurnos");

const selEspecialidad = document.getElementById("especialidad");
const selEspecialista = document.getElementById("especialista");
const selHorario = document.getElementById("horario");
const inputNombre = document.getElementById("nombre");
const inputFecha = document.getElementById("fecha");

// ---------- ESTADO ----------
let turnos = JSON.parse(localStorage.getItem("turnos")) || [];
let especialistasData = [];

// =========================================================
// LOGIN
// =========================================================
btnLogin.addEventListener("click", () => {
    const usuario = document.getElementById("inputUsuario").value.trim();
    const clave = document.getElementById("inputClave").value.trim();

    if (usuario === usuarioValido && clave === claveValida) {
        loginDiv.style.display = "none";
        panelDiv.classList.remove("panelOculto");
        mensajeLogin.textContent = "";
        cargarEspecialistas();
        mostrarTurnos();
    } else {
        Swal.fire({
            icon: "error",
            title: "Error de inicio de sesión",
            text: "Usuario o clave incorrectos. Intentá de nuevo.",
            confirmButtonColor: "#6F58C9",
        });
    }
});

// Enter en cualquiera de los dos campos dispara el login.
[document.getElementById("inputUsuario"), document.getElementById("inputClave")].forEach((campo) => {
    campo.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btnLogin.click();
    });
});

// =========================================================
// RESERVA
// =========================================================
formTurno.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const especialista = selEspecialista.value;
    const fecha = inputFecha.value;
    const hora = selHorario.value;

    if (!nombre || !especialista || !fecha || !hora) return;

    const duplicado = turnos.some(
        (t) => t.especialista === especialista && t.fecha === fecha && t.hora === hora
    );

    if (duplicado) {
        Swal.fire({
            icon: "error",
            title: "Horario ocupado",
            text: "Ese profesional ya tiene un turno en ese horario. Elegí otro.",
            confirmButtonColor: "#6F58C9",
        });
        return;
    }

    turnos.push({
        id: Date.now(),
        nombre,
        especialidad: selEspecialidad.value,
        especialista,
        fecha,
        hora,
    });

    guardar();
    formTurno.reset();

    // El nombre queda cargado para la próxima reserva.
    inputNombre.value = localStorage.getItem("nombreUsuario") || "";
    selEspecialista.innerHTML = '<option value="">-- Seleccioná un especialista --</option>';
    selHorario.innerHTML = '<option value="">-- Elegí un horario --</option>';

    mostrarTurnos();

    Swal.fire({
        icon: "success",
        title: "Turno reservado",
        text: "¡El turno fue registrado correctamente!",
        confirmButtonColor: "#6F58C9",
    });
});

// =========================================================
// LISTADO
// =========================================================
function guardar() {
    localStorage.setItem("turnos", JSON.stringify(turnos));
}

function formatearFecha(iso) {
    // El constructor Date con "AAAA-MM-DD" interpreta UTC y puede correr un día;
    // partimos la cadena para construir la fecha en horario local.
    const [anio, mes, dia] = iso.split("-").map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

function mostrarTurnos() {
    listaTurnos.innerHTML = "";

    if (turnos.length === 0) {
        listaTurnos.innerHTML =
            '<li class="turno-vacio">Todavía no reservaste ningún turno.</li>';
        return;
    }

    // Los más próximos primero.
    const ordenados = [...turnos].sort((a, b) =>
        (a.fecha + a.hora).localeCompare(b.fecha + b.hora)
    );

    ordenados.forEach((turno) => {
        const li = document.createElement("li");
        li.className = "turno";
        li.innerHTML = `
            <div class="turno__hora">
                <strong>${turno.hora}</strong>
                <small>${formatearFecha(turno.fecha)}</small>
            </div>
            <div class="turno__datos">
                <strong>${turno.especialista}</strong>
                ${turno.especialidad ? `<small>${turno.especialidad}</small>` : ""}
                <small>Paciente: ${turno.nombre}</small>
            </div>
            <button class="turno__cancelar" type="button" data-cancelar="${turno.id}"
                aria-label="Cancelar el turno de ${turno.nombre}">
                <svg><use href="#i-tacho" /></svg>
            </button>`;
        listaTurnos.appendChild(li);
    });
}

// Delegación: un solo listener para todos los botones de cancelar.
listaTurnos.addEventListener("click", (e) => {
    const boton = e.target.closest("[data-cancelar]");
    if (!boton) return;

    const id = Number(boton.dataset.cancelar);

    Swal.fire({
        icon: "warning",
        title: "¿Cancelar el turno?",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "No, dejarlo",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6E6C86",
    }).then((resultado) => {
        if (!resultado.isConfirmed) return;
        turnos = turnos.filter((t) => t.id !== id);
        guardar();
        mostrarTurnos();
    });
});

// =========================================================
// CARGA DE ESPECIALISTAS (data/especialistas.json)
// =========================================================
function cargarEspecialistas() {
    fetch("data/especialistas.json")
        .then((res) => {
            if (!res.ok) throw new Error(res.status);
            return res.json();
        })
        .then((data) => {
            especialistasData = data;

            const especialidadesUnicas = [...new Set(data.map((esp) => esp.especialidad))].sort(
                (a, b) => a.localeCompare(b, "es")
            );

            especialidadesUnicas.forEach((es) => {
                const option = document.createElement("option");
                option.value = es;
                option.textContent = es;
                selEspecialidad.appendChild(option);
            });
        })
        .catch(() => {
            Swal.fire({
                icon: "error",
                title: "No pudimos cargar las especialidades",
                text: "Revisá tu conexión y volvé a intentar en unos minutos.",
                confirmButtonColor: "#6F58C9",
            });
        });
}

// Especialidad -> profesionales de esa especialidad
selEspecialidad.addEventListener("change", (e) => {
    const seleccionada = e.target.value;
    selEspecialista.innerHTML = '<option value="">-- Seleccioná un especialista --</option>';
    selHorario.innerHTML = '<option value="">-- Elegí un horario --</option>';

    especialistasData
        .filter((esp) => esp.especialidad === seleccionada)
        .forEach((esp) => {
            const option = document.createElement("option");
            option.value = esp.nombre;
            option.textContent = esp.nombre;
            selEspecialista.appendChild(option);
        });
});

// Profesional -> sus horarios
selEspecialista.addEventListener("change", (e) => {
    const seleccionado = e.target.value;
    selHorario.innerHTML = '<option value="">-- Elegí un horario --</option>';

    const especialista = especialistasData.find((esp) => esp.nombre === seleccionado);
    if (!especialista) return;

    especialista.horarios.forEach((h) => {
        const option = document.createElement("option");
        option.value = h;
        option.textContent = h;
        selHorario.appendChild(option);
    });
});

// =========================================================
// PREFERENCIAS DEL PACIENTE
// =========================================================
inputNombre.value = localStorage.getItem("nombreUsuario") || "";
inputNombre.addEventListener("input", (e) => {
    localStorage.setItem("nombreUsuario", e.target.value);
});

// No se puede reservar en una fecha pasada (fecha local, no UTC).
const hoy = new Date();
const fechaLocal = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);
const hoyISO = fechaLocal.toISOString().split("T")[0];

inputFecha.min = hoyISO;
// El campo arranca con la fecha de hoy para que el paciente no tenga que
// tipear el año. Va en defaultValue y no en value: así el reset() del
// formulario, después de cada reserva, lo vuelve a dejar cargado.
inputFecha.defaultValue = hoyISO;
