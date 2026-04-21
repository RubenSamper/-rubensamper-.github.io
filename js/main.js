let categorias = document.querySelector('.categorias');
const CLAVE_TEMA = "tema-preferencia";

let io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.01,
    rootMargin: "0px 0px -20% 0px"
});

if (categorias) io.observe(categorias);

function onReady(initFn) {
    document.addEventListener("DOMContentLoaded", initFn);
}

// Inicio general de modulos por pagina
onReady(iniciarControlTema);
onReady(iniciarPestanasHome);
onReady(iniciarSimuladorEstrellas);
onReady(iniciarLeerMasHome);
onReady(iniciarComparador);
onReady(iniciarCestaLateral);
onReady(iniciarPestanasColorProducto);
onReady(iniciarFormularioBoletin);
onReady(inicializarEventosCarrito);
onReady(iniciarBusquedaProductos);
onReady(iniciarProductoDinamico);

function iniciarControlTema() {
    const boton = document.getElementById("theme-toggle");
    const mediaTema = window.matchMedia("(prefers-color-scheme: dark)");
    const temaGuardado = localStorage.getItem(CLAVE_TEMA);
    const temaInicial = temaGuardado || (mediaTema.matches ? "dark" : "light");

    aplicarTema(temaInicial, Boolean(temaGuardado));

    mediaTema.addEventListener("change", function (e) {
        if (localStorage.getItem(CLAVE_TEMA)) return;
        aplicarTema(e.matches ? "dark" : "light", false);
    });

    if (!boton) return;

    boton.addEventListener("click", function () {
        const temaActual = document.documentElement.getAttribute("data-theme") || "light";
        const nuevoTema = temaActual === "dark" ? "light" : "dark";
        aplicarTema(nuevoTema, true);
    });
}

function iniciarPestanasHome() {
    const tabs = Array.from(document.querySelectorAll(".home-tab"));
    const panels = Array.from(document.querySelectorAll(".tab-panel"));

    if (tabs.length === 0 || panels.length === 0) return;

    function activarTab(tab) {
        tabs.forEach((item) => {
            const activa = item === tab;
            item.classList.toggle("active", activa);
            item.setAttribute("aria-selected", activa ? "true" : "false");
            item.tabIndex = activa ? 0 : -1;
        });

        panels.forEach((panel) => {
            const visible = panel.id === tab.getAttribute("aria-controls");
            panel.classList.toggle("active", visible);
            panel.hidden = !visible;
        });
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activarTab(tab));

        tab.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (index + direction + tabs.length) % tabs.length;
            tabs[nextIndex].focus();
            activarTab(tabs[nextIndex]);
        });
    });
}

function iniciarSimuladorEstrellas() {
    const bloquesValoracion = Array.from(document.querySelectorAll(".valoracion-producto"));

    if (bloquesValoracion.length === 0) return;

    bloquesValoracion.forEach((bloque) => {
        const estrellas = Array.from(bloque.querySelectorAll(".estrella-btn"));
        const texto = bloque.querySelector(".simulador-estrellas-texto");
        const nombreProducto = (bloque.getAttribute("data-producto") || "este producto").trim();

        if (estrellas.length === 0 || !texto) return;

        function pintar(valor) {
            estrellas.forEach((estrella, i) => {
                const activa = i < valor;
                estrella.textContent = activa ? "★" : "☆";
                estrella.classList.toggle("activa", activa);
                estrella.setAttribute("aria-checked", String(activa && i === valor - 1));
            });

            texto.textContent = `Has valorado ${nombreProducto} con ${valor} estrella${valor > 1 ? "s" : ""}`;
        }

        estrellas.forEach((estrella) => {
            estrella.addEventListener("click", () => {
                const valor = Number(estrella.getAttribute("data-valor"));
                pintar(valor);
            });
        });
    });
}

function iniciarLeerMasHome() {
    const boton = document.getElementById("hero-leer-mas-btn");
    const texto = document.getElementById("hero-leer-mas-texto");

    if (!boton || !texto) return;

    boton.addEventListener("click", function () {
        const abierto = boton.getAttribute("aria-expanded") === "true";
        const nuevoEstado = !abierto;
        boton.setAttribute("aria-expanded", nuevoEstado ? "true" : "false");
        boton.textContent = nuevoEstado ? "Leer menos" : "Leer mas";
        texto.hidden = !nuevoEstado;
    });
}

function aplicarTema(tema, forzar) {
    const temaSeguro = tema === "dark" ? "dark" : "light";
    const boton = document.getElementById("theme-toggle");
    const styleId = "theme-runtime-style";
    const styleRuntime = document.getElementById(styleId) || (() => {
        const style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
        return style;
    })();
    const linkPrincipal = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((link) => {
        const href = link.getAttribute("href") || "";
        return href.includes("css/styles.css");
    }) || null;

    document.documentElement.setAttribute("data-theme", temaSeguro);

    if (forzar) {
        localStorage.setItem(CLAVE_TEMA, temaSeguro);
    } else {
        if (linkPrincipal) linkPrincipal.disabled = false;
        styleRuntime.textContent = "";
    }

    if (forzar) {
        if (!aplicarTema.cssBaseCache) {
            try {
                const hoja = linkPrincipal?.sheet || Array.from(document.styleSheets).find((sheet) => {
                    try {
                        const owner = sheet.ownerNode;
                        const href = owner && owner.getAttribute ? owner.getAttribute("href") : "";
                        return href && href.includes("css/styles.css");
                    } catch {
                        return false;
                    }
                });

                if (hoja) {
                    aplicarTema.cssBaseCache = Array.from(hoja.cssRules || []).map((regla) => regla.cssText).join("\n");
                }
            } catch {
                aplicarTema.cssBaseCache = "";
            }
        }

        if (aplicarTema.cssBaseCache) {
            const css = aplicarTema.cssBaseCache;
            const regexMediaDark = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/g;
            let resultado = "";
            let cursor = 0;
            let match;

            const encontrarFinBloque = (texto, indiceApertura) => {
                let profundidad = 0;
                for (let i = indiceApertura; i < texto.length; i++) {
                    if (texto[i] === "{") profundidad++;
                    if (texto[i] === "}") {
                        profundidad--;
                        if (profundidad === 0) return i;
                    }
                }
                return -1;
            };

            while ((match = regexMediaDark.exec(css)) !== null) {
                const inicioBloque = match.index;
                const apertura = regexMediaDark.lastIndex - 1;
                const cierre = encontrarFinBloque(css, apertura);
                if (cierre === -1) break;

                resultado += css.slice(cursor, inicioBloque);
                if (temaSeguro === "dark") {
                    const interior = css.slice(apertura + 1, cierre);
                    resultado += `\n${interior}\n`;
                }

                cursor = cierre + 1;
                regexMediaDark.lastIndex = cursor;
            }

            resultado += css.slice(cursor);
            styleRuntime.textContent = resultado;
            if (linkPrincipal) linkPrincipal.disabled = true;
        }
    }

    if (!boton) return;

    const etiqueta = temaSeguro === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    boton.setAttribute("title", etiqueta);
    boton.setAttribute("aria-label", etiqueta);
    boton.setAttribute("aria-pressed", temaSeguro === "dark" ? "true" : "false");
}

function iniciarComparador() {
    var canvas = document.getElementById("myChart");
    if (!canvas) return;

    crearGrafico(canvas);
}

async function cargarCatalogoProductos() {
    const respuesta = await fetch("sources/productos.json", { cache: "no-cache" });
    if (!respuesta.ok) {
        throw new Error("No se pudo cargar sources/productos.json");
    }

    const datos = await respuesta.json();
    if (!datos || typeof datos !== "object" || Object.keys(datos).length === 0) {
        throw new Error("El catalogo de productos JSON esta vacio o no es valido");
    }

    return datos;
}

function crearGrafico(canvas) {
    var chart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["ACE68", "G75 PRO", "X75 PRO", "K728 PRO"],
            datasets: [
                {
                    label: "Precio (€)",
                    data: [89.99, 59.99, 99.99, 79.99],
                    yAxisID: "yPrice",
                    borderWidth: 1
                },
                {
                    label: "Latencia (ms)",
                    data: [2.4, 3.8, 3.0, 2.0],
                    yAxisID: "yLatency",
                    type: "line",
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800 },
            scales: {
                yPrice: {
                    type: "linear",
                    position: "left",
                    beginAtZero: true,
                    title: { display: true, text: "€" },
                    ticks: { padding: 6 }
                },
                yLatency: {
                    type: "linear",
                    position: "right",
                    beginAtZero: true,
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: "ms" },
                    ticks: { padding: 6 }
                }
            }
        }
    });

    return chart;
}

document.addEventListener("keydown", atajoCesta);

function atajoCesta(e) {
    if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        window.location.href = "carrito.html";
    }
}

let btn = document.getElementById("topBtn");

if (btn) {
    window.addEventListener("scroll", function () {
        if (window.scrollY > 200) {
            btn.style.display = "block";
        } else {
            btn.style.display = "none";
        }
    });

    btn.addEventListener("click", subirPrincipio);
}

function subirPrincipio() {
    window.scrollTo({ top: 0, behavior: "smooth" })
};

let cestaLateralAbierta = false;

function iniciarCestaLateral() {
    if (document.getElementById("cesta-lateral")) return;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "cesta-toggle";
    boton.id = "cesta-toggle";
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-controls", "cesta-lateral");
    boton.setAttribute("aria-label", "Mostrar cesta");
    boton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H9.2a2 2 0 0 1-2-1.7L5.5 4.5H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="10" cy="20" r="1.5" fill="currentColor"/>
            <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
        </svg>
        <span class="cesta-count" id="cesta-count">0</span>
    `;

    const panel = document.createElement("aside");
    panel.className = "cesta-lateral";
    panel.id = "cesta-lateral";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
        <div class="cesta-header">
            <h3>Tu cesta</h3>
            <button type="button" class="cesta-cerrar" id="cesta-cerrar" aria-label="Cerrar cesta">&times;</button>
        </div>
        <ul class="cesta-lista" id="cesta-lista"></ul>
        <div class="cesta-footer">
            <div class="cesta-total">
                <span>Total</span>
                <span id="cesta-total">0.00 EUR</span>
            </div>
            <a href="carrito.html" class="cesta-ir-carrito">Ir al carrito completo</a>
        </div>
    `;

    document.body.appendChild(boton);
    document.body.appendChild(panel);

    boton.addEventListener("click", () => alternarCestaLateral());

    const botonCerrar = document.getElementById("cesta-cerrar");
    if (botonCerrar) {
        botonCerrar.addEventListener("click", () => alternarCestaLateral(false));
    }

    panel.addEventListener("click", function (e) {
        e.stopPropagation();
        gestionarAccionesCestaLateral(e);
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && cestaLateralAbierta) {
            alternarCestaLateral(false);
        }
    });

    document.addEventListener("click", function (e) {
        if (!cestaLateralAbierta) return;

        const clickEnPanel = panel.contains(e.target);
        const clickEnBoton = boton.contains(e.target);

        if (!clickEnPanel && !clickEnBoton) {
            alternarCestaLateral(false);
        }
    });

    renderizarCestaLateral();
}

function alternarCestaLateral(forzarEstado) {
    const panel = document.getElementById("cesta-lateral");
    const boton = document.getElementById("cesta-toggle");
    if (!panel || !boton) return;

    if (typeof forzarEstado === "boolean") {
        cestaLateralAbierta = forzarEstado;
    } else {
        cestaLateralAbierta = !cestaLateralAbierta;
    }

    panel.setAttribute("aria-hidden", cestaLateralAbierta ? "false" : "true");
    boton.setAttribute("aria-expanded", cestaLateralAbierta ? "true" : "false");
}

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

function mostrarToast(mensaje) {
    let toast = document.getElementById("app-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "app-toast";
        toast.className = "app-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
    }

    toast.textContent = mensaje;
    toast.classList.add("show");

    clearTimeout(mostrarToast.temporizador);
    mostrarToast.temporizador = setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
}

function confirmarAccion(mensaje, opciones = {}) {
    const titulo = opciones.titulo || "Confirmar accion";
    const textoConfirmar = opciones.textoConfirmar || "Eliminar";
    const textoCancelar = opciones.textoCancelar || "Cancelar";

    return new Promise((resolve) => {
        const modalExistente = document.getElementById("app-confirm-overlay");
        if (modalExistente) {
            modalExistente.remove();
        }

        const elementoActivo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        const overlay = document.createElement("div");
        overlay.className = "app-confirm-overlay";
        overlay.id = "app-confirm-overlay";
        overlay.innerHTML = `
            <div class="app-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="app-confirm-title" aria-describedby="app-confirm-message">
                <h3 id="app-confirm-title">${titulo}</h3>
                <p id="app-confirm-message">${mensaje}</p>
                <div class="app-confirm-actions">
                    <button type="button" class="app-confirm-btn app-confirm-cancel">${textoCancelar}</button>
                    <button type="button" class="app-confirm-btn app-confirm-accept">${textoConfirmar}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.classList.add("modal-open");

        const botonCancelar = overlay.querySelector(".app-confirm-cancel");
        const botonAceptar = overlay.querySelector(".app-confirm-accept");

        const alPulsarTecla = (e) => {
            if (e.key === "Escape") {
                cerrarModal(false);
            }
        };

        const cerrarModal = (resultado) => {
            document.removeEventListener("keydown", alPulsarTecla);
            overlay.remove();
            document.body.classList.remove("modal-open");

            if (elementoActivo) {
                elementoActivo.focus();
            }

            resolve(resultado);
        };

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                cerrarModal(false);
            }
        });

        document.addEventListener("keydown", alPulsarTecla);

        if (botonCancelar) {
            botonCancelar.addEventListener("click", () => cerrarModal(false));
        }

        if (botonAceptar) {
            botonAceptar.addEventListener("click", () => cerrarModal(true));
            botonAceptar.focus();
        }
    });
}

function formatearPrecio(valor) {
    return `${valor.toFixed(2)} EUR`;
}

function renderizarCestaLateral() {
    const lista = document.getElementById("cesta-lista");
    const totalNode = document.getElementById("cesta-total");
    const contadorNode = document.getElementById("cesta-count");

    if (!lista || !totalNode || !contadorNode) return;

    const carrito = obtenerCarrito();
    let total = 0;
    let unidades = 0;

    if (carrito.length === 0) {
        lista.innerHTML = '<li class="cesta-vacia">Tu cesta esta vacia</li>';
    } else {
        lista.innerHTML = carrito.map((producto) => {
            const subtotal = Number(producto.precio) * Number(producto.cantidad);
            total += subtotal;
            unidades += Number(producto.cantidad);
            return `
                <li class="cesta-item">
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                    <div>
                        <h4>${producto.nombre}</h4>
                        <p>${formatearPrecio(Number(producto.precio))}</p>
                        <div class="cesta-item-acciones">
                            <button type="button" data-accion="restar" data-id="${producto.id}" aria-label="Restar cantidad">-</button>
                            <span>${producto.cantidad}</span>
                            <button type="button" data-accion="sumar" data-id="${producto.id}" aria-label="Sumar cantidad">+</button>
                            <button type="button" class="cesta-eliminar" data-accion="eliminar" data-id="${producto.id}" aria-label="Eliminar producto">x</button>
                        </div>
                    </div>
                </li>
            `;
        }).join("");
    }

    if (carrito.length > 0 && total > 0) {
        totalNode.textContent = formatearPrecio(total);
    } else {
        totalNode.textContent = "0.00 EUR";
    }

    if (carrito.length === 0) {
        unidades = 0;
    }
    contadorNode.textContent = String(unidades);
}

async function gestionarAccionesCestaLateral(e) {
    const objetivo = e.target;
    if (!(objetivo instanceof HTMLElement)) return;

    const accion = objetivo.getAttribute("data-accion");
    const id = objetivo.getAttribute("data-id");

    if (!accion || !id) return;

    let carrito = obtenerCarrito();
    const producto = carrito.find((item) => String(item.id) === String(id));

    if (!producto) return;

    if (accion === "sumar") {
        producto.cantidad += 1;
    }

    if (accion === "restar") {
        producto.cantidad -= 1;
    }

    if (accion === "eliminar") {
        await eliminarDelCarrito(id);
        return;
    }

    if (producto.cantidad <= 0) {
        const confirmar = await confirmarAccion(`Seguro que quieres eliminar \"${producto.nombre}\" de la cesta?`, {
            titulo: "Eliminar producto",
            textoConfirmar: "Eliminar",
            textoCancelar: "Cancelar"
        });
        if (!confirmar) {
            producto.cantidad = 1;
        } else {
            carrito = carrito.filter((item) => String(item.id) !== String(id));
            mostrarToast("Producto eliminado de la cesta");
        }
    }

    guardarCarrito(carrito);
    renderizarCestaLateral();
    cargarCarrito();
}

function iniciarPestanasColorProducto() {
    const colorTabs = document.querySelectorAll(".color-tab");
    const productImage = document.querySelector(".producto-imagen a img");
    const productLink = document.querySelector(".producto-imagen a");

    if (colorTabs.length > 0 && productImage) {
        colorTabs.forEach(tab => {
            tab.addEventListener("click", function () {
                // Remover la clase active de todos los botones
                colorTabs.forEach(t => t.classList.remove("active"));

                // Agregar la clase active al botón clickeado
                this.classList.add("active");

                // Obtener las imágenes del data attribute
                const newImage = this.getAttribute("data-image");
                const newImageGrande = this.getAttribute("data-grande");
                const newImagePequenio = this.getAttribute("data-pequenio");

                // Actualizar la imagen principal
                productImage.src = newImage;
                productImage.srcset = `${newImagePequenio} 450w, ${newImage} 1200w, ${newImageGrande} 2000w`;

                // Actualizar el link del href
                productLink.href = newImageGrande;
            });
        });
    }
}

// Carrusel de imágenes del Hero
let heroCarouselIndex = 0;
const heroPictures = document.querySelectorAll('.hero-picture');
const heroCarouselBtnPrev = document.querySelector('.hero-prev');
const heroCarouselBtnNext = document.querySelector('.hero-next');
const heroMontaje = document.querySelector('.carrusel');

if (heroPictures.length > 1) {
    // Botones de navegación
    heroCarouselBtnPrev.addEventListener('click', () => {
        heroCarouselIndex = (heroCarouselIndex - 1 + heroPictures.length) % heroPictures.length;
        updateHeroCarousel();
    });

    heroCarouselBtnNext.addEventListener('click', () => {
        heroCarouselIndex = (heroCarouselIndex + 1) % heroPictures.length;
        updateHeroCarousel();
    });

    // Pasa la imágen cada 5 segundos
    let autoplayInterval = setInterval(() => {
        heroCarouselIndex = (heroCarouselIndex + 1) % heroPictures.length;
        updateHeroCarousel();
    }, 5000);

    // Pausa el autoplay al dejar el ratón encima
    heroMontaje.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
    heroMontaje.addEventListener('mouseleave', () => {
        autoplayInterval = setInterval(() => {
            heroCarouselIndex = (heroCarouselIndex + 1) % heroPictures.length;
            updateHeroCarousel();
        }, 5000);
    });
}

function updateHeroCarousel() {
    heroPictures.forEach((picture, index) => {
        if (index === heroCarouselIndex) {
            picture.classList.add('active');
        } else {
            picture.classList.remove('active');
        }
    });
}

// Validación del formulario de suscripción
function iniciarFormularioBoletin() {
    const formulario = document.querySelector('.boletin form');

    if (formulario) {
        formulario.addEventListener('submit', function (e) {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value.trim();
            const correo = document.getElementById('correo').value.trim();

            // Validar que los campos no estén vacíos
            if (nombre === '' || correo === '') {
                alert('Por favor, completa todos los campos.');
                return;
            }

            // Validar formato de correo electrónico
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regexEmail.test(correo)) {
                alert('Por favor, ingresa un correo electrónico válido.');
                return;
            }

            // Si todo es correcto, mostrar alerta de éxito
            alert('¡Te has suscrito correctamente!');

            // Limpiar el formulario
            formulario.reset();
        });
    }
}


// Esta función se está encargando de agregar el producto al carrito
function agregarAlCarrito(id, nombre, precio, imagen) {
    let carrito = obtenerCarrito();

    // Verifica si el producto ya existe en el carrito
    const productoExistente = carrito.find(item => item.id === id);

    if (productoExistente) {
        // Aumentar la cantidad si existe
        productoExistente.cantidad++;
    } else {
        // Si no existe agrega el nuevo producto
        carrito.push({
            id: id,
            nombre: nombre,
            precio: parseFloat(precio),
            imagen: imagen,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    renderizarCestaLateral();
    mostrarToast("Producto añadido a la cesta");
}

// Esta función se encarga de eliminar el producto del carrito
async function eliminarDelCarrito(id) {
    id = String(id);
    let carrito = obtenerCarrito();
    const producto = carrito.find(item => String(item.id) === id);

    if (!producto) return;

    const confirmar = await confirmarAccion(`Seguro que quieres eliminar \"${producto.nombre}\" de la cesta?`, {
        titulo: "Eliminar producto",
        textoConfirmar: "Eliminar",
        textoCancelar: "Cancelar"
    });
    if (!confirmar) return;

    carrito = carrito.filter(item => String(item.id) !== id);
    guardarCarrito(carrito);
    renderizarCestaLateral();
    cargarCarrito();
    mostrarToast("Producto eliminado de la cesta");
}

// Cambiar cantidad de producto
async function cambiarCantidad(id, cantidad) {
    id = String(id);
    let carrito = obtenerCarrito();
    const producto = carrito.find(item => item.id === id);

    if (producto) {
        producto.cantidad = parseInt(cantidad);
        if (producto.cantidad <= 0) {
            await eliminarDelCarrito(id);
        } else {
            guardarCarrito(carrito);
            renderizarCestaLateral();
            cargarCarrito();
        }
    }
}

async function cambiarCantidadConDelta(id, delta) {
    id = String(id);
    const carrito = obtenerCarrito();
    const producto = carrito.find(item => String(item.id) === id);

    if (!producto) return;

    const nuevaCantidad = Number(producto.cantidad) + Number(delta);
    await cambiarCantidad(id, nuevaCantidad);
}

// Cargar carrito en la página
function cargarCarrito() {
    const carritoContainer = document.querySelector('.carrito-productos');
    const resumenContainer = document.querySelector('.resumen-carrito');
    renderizarCestaLateral();

    if (!carritoContainer) return;

    let carrito = obtenerCarrito();

    if (carrito.length === 0) {
        carritoContainer.innerHTML = '<p class="text-center py-8 text-gray-600">Tu carrito está vacío</p>';
        if (resumenContainer) {
            resumenContainer.innerHTML = '<p class="text-gray-600">Total: 0,00 €</p>';
        }
        return;
    }

    let html = '';
    let total = 0;

    carrito.forEach(producto => {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        html += `
            <article class="flex flex-col sm:flex-row gap-4 items-start sm:items-center border border-gray-100 rounded-xl p-4">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="w-32 h-24 object-cover rounded-lg">
                
                <div class="flex-1">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <h3 class="font-semibold text-lg text-gray-900">${producto.nombre}</h3>
                            <p class="text-sm text-gray-500">Producto en carrito</p>
                        </div>
                        
                        <button type="button" 
                            class="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                            aria-label="Eliminar producto"
                            onclick="eliminarDelCarrito('${producto.id}')">
                            <svg width="8mm" height="8mm" version="1.1" viewBox="0 0 198 181" xmlns="http://www.w3.org/2000/svg">
                                <g fill-opacity="0" stroke="currentColor" stroke-width="8.9216">
                                    <ellipse cx="98.99" cy="90.483" rx="94.519" ry="86.019" />
                                    <path d="m156.24 92.477h-117.91" />
                                </g>
                            </svg>
                            Eliminar
                        </button>
                    </div>
                    
                    <div class="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div class="inline-flex items-center gap-2">
                            <span class="text-sm font-semibold text-gray-700">Cantidad</span>
                            <div class="cesta-item-acciones" role="group" aria-label="Control de cantidad">
                                <button type="button" aria-label="Restar cantidad" onclick="cambiarCantidadConDelta('${producto.id}', -1)">-</button>
                                <span>${producto.cantidad}</span>
                                <button type="button" aria-label="Sumar cantidad" onclick="cambiarCantidadConDelta('${producto.id}', 1)">+</button>
                            </div>
                        </div>
                        
                        <div class="text-right">
                            <p class="text-sm text-gray-500">Subtotal</p>
                            <p class="text-lg font-bold text-[#00695C]">${subtotal.toFixed(2)} €</p>
                        </div>
                    </div>
                </div>
            </article>
        `;
    });

    carritoContainer.innerHTML = html;

    // Actualizar resumen
    if (resumenContainer) {
        resumenContainer.innerHTML = `
            <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">Subtotal</span>
                    <span class="font-semibold">${total.toFixed(2)} €</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Envío</span>
                    <span class="font-semibold">Gratis</span>
                </div>
                <div class="border-t pt-3 flex justify-between text-base">
                    <span class="font-semibold">Total</span>
                    <span class="font-bold text-[#00695C]">${total.toFixed(2)} €</span>
                </div>
            </div>
        `;
    }
}

// Agregar evento a botones de añadir carrito
function inicializarEventosCarrito() {
    const botonesCarrito = document.querySelectorAll('.btn-agregar-carrito');

    botonesCarrito.forEach(boton => {
        boton.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const nombre = this.getAttribute('data-nombre');
            const precio = this.getAttribute('data-precio');
            const imagen = this.getAttribute('data-imagen');

            agregarAlCarrito(id, nombre, precio, imagen);
        });
    });

    // Cargar carrito si estamos en la página de carrito
    cargarCarrito();
}

// Búsqueda real de productos en la página de búsqueda
async function iniciarBusquedaProductos() {
    const paginaBusqueda = document.querySelector("main.busqueda");
    if (!paginaBusqueda) return;

    const inputBusqueda = document.getElementById("busqueda-productos") || document.querySelector('header input[type="search"]');
    const contenedorResultados = document.querySelector(".resultados");
    const tituloResultados = document.getElementById("titulo-resultados");

    if (contenedorResultados) {
        try {
            const productos = await cargarCatalogoProductos();
            const tarjetasHtml = Object.entries(productos).map(([clave, producto]) => {
                const descripcionCorta = Array.isArray(producto.caracteristicas) && producto.caracteristicas.length > 0
                    ? producto.caracteristicas[0]
                    : producto.descripcion;

                return `
                    <article class="tarjeta bg-[#F8F9FB] rounded-lg shadow-md hover:shadow-lg transition p-4 text-center w-72" aria-label="${producto.nombre}">
                        <img src="${producto.imagenMed}" alt="${producto.descripcion}" class="rounded-md w-full h-48 object-cover mb-3" loading="lazy">
                        <h3 class="text-[#31326F] font-semibold text-lg">${producto.nombre}</h3>
                        <p class="text-gray-700 mt-1">${descripcionCorta}</p>
                        <span class="font-bold block mt-2 text-[#004d44] dark:text-[#4FFFD7]">${producto.precio}</span>
                        <a class="btn-ver" href="producto.html?product=${clave}">Ver producto</a>
                    </article>
                `;
            }).join("");

            contenedorResultados.innerHTML = tarjetasHtml;
        } catch (error) {
            contenedorResultados.innerHTML = '<p class="text-red-700 font-semibold">No se pudieron cargar los productos desde JSON.</p>';
            console.error(error);
            return;
        }
    }

    const tarjetas = Array.from(document.querySelectorAll(".resultados .tarjeta"));

    if (!inputBusqueda || tarjetas.length === 0) return;

    function normalizar(texto) {
        return texto
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function obtenerTextoTarjeta(tarjeta) {
        const nombre = tarjeta.querySelector("h3")?.textContent || "";
        const descripcion = tarjeta.querySelector("p")?.textContent || "";
        return normalizar(`${nombre} ${descripcion}`);
    }

    function filtrarProductos() {
        const termino = normalizar(inputBusqueda.value.trim());
        let visibles = 0;

        tarjetas.forEach((tarjeta) => {
            const contenido = obtenerTextoTarjeta(tarjeta);
            const mostrar = termino === "" || contenido.includes(termino);
            tarjeta.style.display = mostrar ? "" : "none";
            if (mostrar) visibles++;
        });

        if (tituloResultados) {
            tituloResultados.textContent = termino === ""
                ? "Resultados de búsqueda"
                : `Resultados para: "${inputBusqueda.value.trim()}" (${visibles})`;
        }
    }

    inputBusqueda.addEventListener("input", filtrarProductos);
    filtrarProductos();
}

// Carga dinámica de producto según parámetro URL
async function iniciarProductoDinamico() {
    const paginaProducto = document.querySelector("main.producto");
    if (!paginaProducto) return;

    let productos;
    try {
        productos = await cargarCatalogoProductos();
    } catch (error) {
        const nombre = document.getElementById("producto-nombre");
        const precio = document.getElementById("producto-precio");
        const lista = document.getElementById("producto-caracteristicas");

        if (nombre) nombre.textContent = "Error al cargar producto";
        if (precio) precio.textContent = "";
        if (lista) {
            lista.innerHTML = "<li>No se pudo cargar el catalogo desde JSON.</li>";
        }

        console.error(error);
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const productKey = params.get("product") || "rgbpro";
    const productoPorDefecto = Object.values(productos)[0];
    const producto = productos[productKey] || productoPorDefecto;
    if (!producto) return;
    const claveProductoActual = productos[productKey] ? productKey : Object.keys(productos)[0];
    const galeriaColores = document.querySelector(".galeria-producto");
    const miniaturasColores = galeriaColores ? galeriaColores.querySelector(".miniaturas") : null;
    const mostrarColores = producto.mostrarColores === true;
    const mostrarMultiplesColores = claveProductoActual === "rgbpro";

    const nombre = document.getElementById("producto-nombre");
    const precio = document.getElementById("producto-precio");
    const lista = document.getElementById("producto-caracteristicas");
    const imagen = document.getElementById("producto-imagen-principal");
    const enlaceImagen = document.getElementById("producto-imagen-link");
    const botonCarrito = document.getElementById("btn-agregar-carrito");

    if (nombre) nombre.textContent = producto.nombre;
    if (precio) precio.textContent = producto.precio;

    if (lista) {
        lista.innerHTML = producto.caracteristicas.map((item) => `<li>${item}</li>`).join("");
    }

    if (imagen) {
        imagen.src = producto.imagenMed;
        imagen.srcset = `${producto.imagenPeq} 450w, ${producto.imagenMed} 1200w, ${producto.imagenGra} 2000w`;
        imagen.alt = producto.descripcion;
    }

    if (enlaceImagen) {
        enlaceImagen.href = producto.imagenGra;
    }

    if (galeriaColores) {
        if (miniaturasColores) {
            const tabsColor = Array.from(miniaturasColores.querySelectorAll(".color-tab"));

            tabsColor.forEach((tab) => {
                const etiqueta = tab.querySelector("span:last-child");
                const muestra = tab.querySelector(".tab-color");

                if (etiqueta && !etiqueta.dataset.originalLabel) {
                    etiqueta.dataset.originalLabel = etiqueta.textContent || "";
                }

                if (muestra && !muestra.dataset.originalStyle) {
                    muestra.dataset.originalStyle = muestra.getAttribute("style") || "";
                }
            });

            if (mostrarMultiplesColores) {
                tabsColor.forEach((tab) => {
                    const etiqueta = tab.querySelector("span:last-child");
                    const muestra = tab.querySelector(".tab-color");

                    tab.hidden = false;
                    tab.disabled = false;
                    tab.style.display = "";

                    if (etiqueta?.dataset.originalLabel) {
                        etiqueta.textContent = etiqueta.dataset.originalLabel;
                    }

                    if (muestra) {
                        const estiloOriginal = muestra.dataset.originalStyle || "";
                        if (estiloOriginal) {
                            muestra.setAttribute("style", estiloOriginal);
                        }
                    }
                });
            } else if (tabsColor.length > 0) {
                const tabUnica = tabsColor[0];
                const etiquetaUnica = tabUnica.querySelector("span:last-child");
                const muestraUnica = tabUnica.querySelector(".tab-color");

                tabsColor.forEach((tab, index) => {
                    tab.hidden = index !== 0;
                    tab.disabled = index !== 0;
                    tab.classList.toggle("active", index === 0);
                    tab.style.display = index === 0 ? "" : "none";
                });

                tabUnica.setAttribute("data-color", "unico");
                tabUnica.setAttribute("data-image", producto.imagenMed);
                tabUnica.setAttribute("data-grande", producto.imagenGra);
                tabUnica.setAttribute("data-pequenio", producto.imagenPeq);
                tabUnica.setAttribute("aria-label", "Color unico disponible");

                if (etiquetaUnica) {
                    etiquetaUnica.textContent = "Unico";
                }

                if (muestraUnica) {
                    muestraUnica.setAttribute("style", "background-color: #31326F;");
                }
            }
        }

        galeriaColores.hidden = !mostrarColores;
        galeriaColores.setAttribute("aria-hidden", mostrarColores ? "false" : "true");
    }

    if (botonCarrito) {
        botonCarrito.setAttribute("data-id", producto.id);
        botonCarrito.setAttribute("data-nombre", producto.nombre);
        botonCarrito.setAttribute("data-precio", producto.precioNumero);
        botonCarrito.setAttribute("data-imagen", producto.imagenPeq);
        botonCarrito.setAttribute("aria-label", `Añadir ${producto.nombre} al carrito`);
    }
}

