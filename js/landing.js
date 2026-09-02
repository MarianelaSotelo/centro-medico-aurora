/* =========================================================
   Interacciones de la landing: revelado al scrollear,
   contadores animados y carrusel de testimonios.
   ========================================================= */

(() => {
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* =====================================================
       1. Revelado progresivo de secciones
       ===================================================== */
    const revelables = document.querySelectorAll("[data-revelar]");

    if (sinMovimiento || !("IntersectionObserver" in window)) {
        revelables.forEach((el) => el.classList.add("esta-visible"));
    } else {
        const observador = new IntersectionObserver(
            (entradas, obs) => {
                entradas.forEach((entrada, i) => {
                    if (!entrada.isIntersecting) return;
                    // Escalonamos los elementos que entran juntos.
                    entrada.target.style.transitionDelay = `${Math.min(i * 70, 350)}ms`;
                    entrada.target.classList.add("esta-visible");
                    obs.unobserve(entrada.target);
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
        );
        revelables.forEach((el) => observador.observe(el));
    }

    /* =====================================================
       2. Contadores
       ===================================================== */
    const contadores = document.querySelectorAll("[data-contador]");

    const animarContador = (el) => {
        const destino = Number(el.dataset.contador);
        const sufijo = el.dataset.sufijo || "";

        if (sinMovimiento) {
            el.textContent = destino + sufijo;
            return;
        }

        const duracion = 1400;
        const inicio = performance.now();

        const paso = (ahora) => {
            const avance = Math.min((ahora - inicio) / duracion, 1);
            // Curva de desaceleración, para que frene suave al final.
            const suave = 1 - Math.pow(1 - avance, 3);
            el.textContent = Math.round(destino * suave) + sufijo;
            if (avance < 1) requestAnimationFrame(paso);
        };

        requestAnimationFrame(paso);
    };

    if (contadores.length) {
        if (!("IntersectionObserver" in window)) {
            contadores.forEach(animarContador);
        } else {
            const obsContadores = new IntersectionObserver(
                (entradas, obs) => {
                    entradas.forEach((entrada) => {
                        if (!entrada.isIntersecting) return;
                        animarContador(entrada.target);
                        obs.unobserve(entrada.target);
                    });
                },
                { threshold: 0.6 }
            );
            contadores.forEach((el) => obsContadores.observe(el));
        }
    }

    /* =====================================================
       3. Carrusel de testimonios
       ===================================================== */
    const carrusel = document.getElementById("carrusel");
    const pista = document.getElementById("carrusel-pista");
    const contenedorPuntos = document.getElementById("carrusel-puntos");

    if (carrusel && pista && contenedorPuntos) {
        const laminas = [...pista.children];
        let actual = 0;
        let reloj = null;

        // Un punto por testimonio.
        const puntos = laminas.map((_, i) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.setAttribute("role", "tab");
            boton.setAttribute("aria-label", `Testimonio ${i + 1} de ${laminas.length}`);
            boton.addEventListener("click", () => {
                ir(i);
                reiniciarReloj();
            });
            contenedorPuntos.appendChild(boton);
            return boton;
        });

        function ir(indice) {
            actual = (indice + laminas.length) % laminas.length;
            pista.style.transform = `translateX(-${actual * 100}%)`;
            puntos.forEach((p, i) => {
                p.classList.toggle("esta-activo", i === actual);
                p.setAttribute("aria-selected", String(i === actual));
            });
            laminas.forEach((l, i) => {
                // Las láminas ocultas no deben ser alcanzables por teclado.
                l.inert = i !== actual;
            });
        }

        function reiniciarReloj() {
            if (sinMovimiento) return;
            clearInterval(reloj);
            reloj = setInterval(() => ir(actual + 1), 6000);
        }

        // Pausa mientras el mouse o el foco están encima.
        carrusel.addEventListener("mouseenter", () => clearInterval(reloj));
        carrusel.addEventListener("mouseleave", reiniciarReloj);
        carrusel.addEventListener("focusin", () => clearInterval(reloj));
        carrusel.addEventListener("focusout", reiniciarReloj);

        // Flechas del teclado.
        carrusel.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight") { ir(actual + 1); reiniciarReloj(); }
            if (e.key === "ArrowLeft") { ir(actual - 1); reiniciarReloj(); }
        });

        ir(0);
        reiniciarReloj();
    }
})();
