/* =========================================================
   Navegación compartida entre index.html y turnos.html
   Menú móvil, sombra del header al hacer scroll y
   resaltado del enlace de la sección visible.
   ========================================================= */

(() => {
    const encabezado = document.getElementById("encabezado");
    const navegacion = document.getElementById("navegacion");
    const hamburguesa = document.getElementById("hamburguesa");

    /* ---------- Menú móvil ---------- */
    if (hamburguesa && navegacion) {
        const alternarMenu = (abrir) => {
            navegacion.classList.toggle("esta-abierta", abrir);
            hamburguesa.setAttribute("aria-expanded", String(abrir));
            hamburguesa.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
        };

        hamburguesa.addEventListener("click", () => {
            alternarMenu(!navegacion.classList.contains("esta-abierta"));
        });

        // Al tocar un enlace, cerramos el menú.
        navegacion.addEventListener("click", (e) => {
            if (e.target.closest("a")) alternarMenu(false);
        });

        // Escape cierra y devuelve el foco al botón.
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && navegacion.classList.contains("esta-abierta")) {
                alternarMenu(false);
                hamburguesa.focus();
            }
        });

        // Si se agranda la ventana, el menú móvil no debe quedar colgado.
        window.addEventListener("resize", () => {
            if (window.innerWidth > 860) alternarMenu(false);
        });
    }

    /* ---------- Sombra del header ---------- */
    if (encabezado) {
        const actualizarSombra = () => {
            encabezado.classList.toggle("esta-fijo", window.scrollY > 8);
        };
        actualizarSombra();
        window.addEventListener("scroll", actualizarSombra, { passive: true });
    }

    /* ---------- Enlace activo según la sección visible ---------- */
    const enlaces = navegacion
        ? [...navegacion.querySelectorAll('a[href^="#"]')]
        : [];

    const secciones = enlaces
        .map((a) => document.querySelector(a.getAttribute("href")))
        .filter(Boolean);

    if (secciones.length && "IntersectionObserver" in window) {
        const observador = new IntersectionObserver(
            (entradas) => {
                entradas.forEach((entrada) => {
                    if (!entrada.isIntersecting) return;
                    enlaces.forEach((a) => {
                        a.classList.toggle(
                            "esta-activo",
                            a.getAttribute("href") === "#" + entrada.target.id
                        );
                    });
                });
            },
            { rootMargin: "-45% 0px -50% 0px" }
        );
        secciones.forEach((s) => observador.observe(s));
    }
})();
