// ── 1. CREAR EL MAPA ─────────────────────────────────────────────
const map = L.map('map', {
    center: [50.846, 4.352],
    zoom: 12,
    zoomControl: false,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
}).addTo(map);


// ── 2. COLOREAR SEGÚN DATOS BISA ─────────────────────────────────
function getColor(value) {
    if (value === null || value === undefined) return '#cccccc';
    if (value > 20) return '#08306b';
    if (value > 15) return '#2171b5';
    if (value > 10) return '#4292c6';
    if (value > 5)  return '#9ecae1';
    if (value > 2)  return '#deebf7';
    return '#f7fbff';
}

function estiloWijk(feature) {
    const mdzone = feature.properties.mdzone;
    const data = bisaData[anioActivo][mdzone];
    const valor  = data ? data[categoriaActiva] : null;
    return {
        fillColor:   getColor(valor),
        fillOpacity: 0.75,
        color:       '#ffffff',
        weight:      1,
    };
}

function estiloGemeente(feature) {
    return {
        fillColor:   'transparent',
        fillOpacity: 0,
        color:       '#f5a623',
        weight:      3,
    };
}

function estiloWijkSeleccionado() {
    return {
        fillOpacity: 0.9,
        color:       '#088b0f',
        weight:      3,
    };
}

function traducirPorcentaje(valor) {
    if (!valor) return '';

    // Tramo alto y medio: 1% o más → "1 op de N"
    if (valor >= 1) {
        const n = Math.round(100 / valor);
        return `${i18n[idiomaActivo].opDe} ${n}`;
    }

    // Tramo bajo: entre 0.1% y 1% → "X op de 1000"
    if (valor >= 0.1) {
        const x = Math.round(valor * 10);
        return `${x} ${i18n[idiomaActivo].opDe1000}`;
    }

    // Tramo diminuto: menos de 0.1% → texto fijo
    return i18n[idiomaActivo].menosMil;
}


// ── 3. ESTADO ────────────────────────────────────────────────────
let geojsonLayer;
let categoriaActiva  = 'noord_afrika';
let anioActivo = 2025;
let wijkSeleccionado = null;
let gemeenteActiva   = null;
let communesData = null;
let gemeenteLayer = null;

function actualizarTitulo() {
    const t = i18n[idiomaActivo];
    const adjetivo = t.categorias[categoriaActiva].gentilicio;
    const titulo = document.getElementById('titulo-dinamico');
    titulo.textContent = `${t.tituloAntes} ${adjetivo} ${t.tituloDespues}`;
}

let idiomaActivo = 'nl';

const i18n = {
    nl: {
        opDe:        '1 op de',      // → "1 op de 16"
        opDe1000:    'op de 1000',   // → "3 op de 1000"
        menosMil:    'minder dan 1 op de 1000',
        tituloAntes: 'Waar wonen Brusselaars van',
        tituloDespues: 'herkomst?',
        subtitulo: 'Wijkmonitor · Brussels Hoofdstedelijk Gewest',
        klikWijk: 'Klik op een wijk',
        locale: 'nl-BE',
        vanDe: 'van de',
        inwoners: 'inwoners',          // puede que ya lo tengas
        menosDe1: 'te klein om in vakjes te tonen',
        geschat: 'geschat — afgeleid van het afgeronde percentage',
        sinData: 'Geen data beschikbaar',
        menosDe1Inwoner: 'minder dan 1 inwoner',
        sinDataAnioAntes: 'Geen data voor',
        sinDataAnioDespues: 'vóór',
        categorias: {
            noord_afrika:    { boton: 'Noord-Afrika',   adjetivo: 'Noord-Afrikaanse', gentilicio: 'Noord-Afrikaanse' },
            sub_sahara:      { boton: 'Sub-Sahara',     adjetivo: 'Sub-Saharaanse', gentilicio: 'Sub-Saharaanse' },
            turken:          { boton: 'Turken',         adjetivo: 'Turkse', gentilicio: 'Turkse'},
            fransen:         { boton: 'Fransen',        adjetivo: 'Franse', gentilicio: 'Franse' },
            europa14:        { boton: 'Europa 14',      adjetivo: 'Europese (14)', gentilicio: 'Europese (14)' },
            oeso:            { boton: 'OESO',           adjetivo: 'OESO-', gentilicio: 'OESO-' },
            eu_nieuw:        { boton: 'Nieuwe EU',      adjetivo: 'nieuwe EU-', gentilicio: 'nieuwe EU-' },
            latijns_amerika: { boton: 'Latijns-Amerika', adjetivo: 'Latijns-Amerikaanse', gentilicio: 'Latijns-Amerikaanse' },
            andere_landen:   { boton: 'Andere landen',  adjetivo: 'andere', gentilicio: 'andere'},
        },
    },
    
    fr: {
        opDe:        '1 sur',
        opDe1000:    'sur 1000',
        menosMil:    'moins de 1 sur 1000',
        tituloAntes: "Où habitent les Bruxellois d'origine",
        tituloDespues: '?',
        subtitulo: 'Moniteur des quartiers · Région de Bruxelles-Capitale',
        klikWijk: 'Cliquez sur un quartier',
        locale: 'fr-BE',
        vanDe: 'sur',
        inwoners: 'habitants',
        geschat: 'estimation — dérivée du pourcentage arrondi',
        menosDe1: 'trop petit pour être affiché en cases',
        sinData: 'Aucune donnée disponible',
        menosDe1Inwoner: "moins d'un habitant",
        sinDataAnioAntes: "Pas de données pour",
        sinDataAnioDespues: 'avant',
        categorias: {
            noord_afrika:    { boton: 'Afrique du Nord', adjetivo: "Part de l'Afrique du Nord", gentilicio: 'nord-africaine' },
            sub_sahara:      { boton: 'Afrique subsah.', adjetivo: "Part de l'Afrique subsaharienne", gentilicio: 'subsaharienne' },
            turken:          { boton: 'Turquie', adjetivo: 'Part de la Turquie', gentilicio: 'turque' },
            fransen:         { boton: 'Français', adjetivo: 'Part des Français', gentilicio: 'française' },
            europa14:        { boton: 'Europe 14', adjetivo: "Part de l'Europe des 14 (hors Belgique)", gentilicio: "de l'Europe des 14" },
            oeso:            { boton: 'OCDE', adjetivo: 'Part des pays OCDE', gentilicio: "des pays de l'OCDE" },
            eu_nieuw:        { boton: 'Nouvelle UE', adjetivo: "Part des nouveaux états membres de l'U.E.", gentilicio: "des nouveaux États membres de l'UE" },
            latijns_amerika: { boton: 'Amérique latine', adjetivo: "Part de l'Amérique latine", gentilicio: 'latino-américaine' },
            andere_landen:   { boton: 'Autres pays', adjetivo: 'Part des autres pays', gentilicio: "d'autres pays" },
        },
    },
}

function aplicarIdioma() {
    const t = i18n[idiomaActivo];

    // 1. Atributo lang del documento (accesibilidad)
    document.documentElement.lang = idiomaActivo;

    // 2. Subtítulo del header
    document.getElementById('subtitulo').textContent = t.subtitulo;

    // 3. Texto de los 9 botones de categoría
    document.querySelectorAll('.btn-categoria').forEach(btn => {
        const clave = btn.dataset.categoria;
        btn.textContent = t.categorias[clave].boton;
    });

    // 4. Botones de idioma: marcar el activo
    document.querySelectorAll('.btn-idioma').forEach(btn => {
        btn.classList.toggle('activo', btn.dataset.idioma === idiomaActivo);
    });

    // 5. Título dinámico
    actualizarTitulo();

    // 6. Limpiar la selección (igual que al cambiar de categoría)
    if (gemeenteLayer) {
        map.removeLayer(gemeenteLayer);
        gemeenteLayer = null;
    }
    if (wijkSeleccionado) {
        geojsonLayer.resetStyle(wijkSeleccionado);
        wijkSeleccionado = null;
    }
    gemeenteActiva = null;
    document.getElementById('panel').innerHTML = `<p id="panel-naam">${t.klikWijk}</p>`;
}

function construirWaffle(celdas) {
    // Regla del umbral: si redondea a 0, no hay grid
    if (celdas === 0) {
        return `<p class="waffle-umbral">${i18n[idiomaActivo].menosDe1}</p>`;
    }

    // Grid de 100 casillas
    let casillas = '';
    for (let i = 0; i < 100; i++) {
        const clase = i < celdas ? 'pintada' : 'vacia';
        casillas += `<span class="casilla ${clase}"></span>`;
    }
    return `<div class="waffle">${casillas}</div>`;
}

function actualizarPanel(layer) {
    const props   = layer.feature.properties;
    const mdzone  = props.mdzone;
    const data    = bisaData[anioActivo][mdzone];

    const panel     = document.getElementById('panel');
    const campoWijk = idiomaActivo === 'fr' ? 'namefre' : 'namedut';

    if (!data) {
        panel.innerHTML = '<p>Geen data beschikbaar</p>';
        return;
    }

    if (data[categoriaActiva] == null || data.totale_bevolking == null) {
        panel.innerHTML = `
            <p class="panel-gemeente">${gemeenteActiva}</p>
            <p class="panel-wijk">${props[campoWijk]}</p>
            <p class="panel-nodata">${i18n[idiomaActivo].sinData}</p>
        `;
        return;
    }

    const valor          = data[categoriaActiva];
    const nombreCategoria = i18n[idiomaActivo].categorias[categoriaActiva].boton;
    const total          = data.totale_bevolking;
    const redondeado = Math.round(valor);
    const personas   = Math.round(valor / 100 * total);

    panel.innerHTML = `
        <p class="panel-gemeente">${gemeenteActiva}</p>
        <p class="panel-wijk">${props[campoWijk]}</p>
        <p class="panel-cat"><strong>${valor.toLocaleString(i18n[idiomaActivo].locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</strong> ${nombreCategoria}</p>
        ${construirWaffle(redondeado)}
        <p class="panel-personas">± <strong>${personas}</strong> ${i18n[idiomaActivo].vanDe} ${total.toLocaleString(i18n[idiomaActivo].locale)} ${i18n[idiomaActivo].inwoners}</p>
        <p class="panel-nota">${i18n[idiomaActivo].geschat}</p>
    `;
}

// ── 4. EVENTOS POR WIJK ──────────────────────────────────────────
function onEachFeature(feature, layer) {

    layer.on('mouseover', function () {
        if (layer !== wijkSeleccionado) {
            layer.setStyle({ fillOpacity: 1, weight: 2 });
        }
        layer.bringToFront();
         if (gemeenteLayer) {
        gemeenteLayer.bringToFront();
    }
    });

    layer.on('mouseout', function () {
        if (layer !== wijkSeleccionado) {
            geojsonLayer.resetStyle(layer);
        }
    });

    layer.on('click', function () {

        // Resetear selección anterior
        if (wijkSeleccionado) {
            geojsonLayer.resetStyle(wijkSeleccionado);
        }

        // Resetear gemeente anterior
if (gemeenteLayer) {
    map.removeLayer(gemeenteLayer);
    gemeenteLayer = null;
}

        // Marcar wijk seleccionado
        wijkSeleccionado = layer;
        layer.setStyle(estiloWijkSeleccionado());
        layer.bringToFront();

// Buscar commune correcta con Turf.js
var center = layer.getBounds().getCenter();
var punto = turf.point([center.lng, center.lat]);
var communeEncontrada = null;

communesData.features.forEach(function(commune) {
    if (turf.booleanPointInPolygon(punto, commune)) {
        communeEncontrada = commune;
    }
});

// Dibujar contorno commune
if (gemeenteLayer) {
    map.removeLayer(gemeenteLayer);
}
if (communeEncontrada) {
    gemeenteLayer = L.geoJSON(communeEncontrada, {
        style: estiloGemeente,
        interactive: false
    }).addTo(map);
    const campoGemeente = idiomaActivo === 'fr' ? 'name_fr' : 'name_nl';
    gemeenteActiva = communeEncontrada.properties[campoGemeente];
}

    // Actualizar panel
 actualizarPanel(layer);
    });
}

function actualizarMensajeAnio() {
    const mensaje    = document.getElementById('mensaje-anio');
    const primerAnio = rangosCategoria[categoriaActiva][0];

    if (anioActivo < primerAnio) {
        mensaje.textContent = `${i18n[idiomaActivo].sinDataAnioAntes} ${i18n[idiomaActivo].categorias[categoriaActiva].boton} ${i18n[idiomaActivo].sinDataAnioDespues} ${primerAnio}`;
    } else {
        mensaje.textContent = '';
    }
}

// — CARGAR COMMUNES ————————————————————————————
fetch('data/communes.geojson')
    .then(response => response.json())
    .then(data => {
        communesData = data;
        console.log('✅ Communes cargadas');
    })
    .catch(error => {
        console.error('❌ Error communes:', error.message);
    });

// ── 5. CARGAR GEOJSON ────────────────────────────────────────────
fetch('data/quartiers.geojson')
    .then(response => {
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    })
    .then(geojsonData => {
        geojsonLayer = L.geoJSON(geojsonData, {
            style:         estiloWijk,
            onEachFeature: onEachFeature,
        }).addTo(map);

        map.fitBounds(geojsonLayer.getBounds());
        console.log('✅ GeoJSON + BISA conectados');
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
    });


// ── 6. BOTONES DE CATEGORÍA ──────────────────────────────────────
document.querySelectorAll('.btn-categoria').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.btn-categoria').forEach(b => b.classList.remove('activo'));
        this.classList.add('activo');
        categoriaActiva = this.dataset.categoria;
        geojsonLayer.setStyle(estiloWijk);
        actualizarTitulo();
        actualizarMensajeAnio();

        // Limpiar selección al cambiar categoría
if (gemeenteLayer) {
    map.removeLayer(gemeenteLayer);
    gemeenteLayer = null;
}
if (wijkSeleccionado) {
    geojsonLayer.resetStyle(wijkSeleccionado);
    wijkSeleccionado = null;
}
gemeenteActiva = null;
document.getElementById('panel').innerHTML = '<p id="panel-naam">Klik op een wijk</p>';

        // Restaurar resaltado de gemeente y wijk seleccionado
        if (wijkSeleccionado) {
            wijkSeleccionado.setStyle(estiloWijkSeleccionado());
            wijkSeleccionado.bringToFront();
        }
    });
});

// ── LISTENER DE LOS BOTONES DE IDIOMA ────────────────────────────
document.querySelectorAll('.btn-idioma').forEach(btn => {
    btn.addEventListener('click', function () {
        idiomaActivo = this.dataset.idioma;
        aplicarIdioma();
    });
});

// ── 7. SLIDER DE AÑOS ────────────────────────────────────────────
const slider     = document.getElementById('slider-año');
const anioLabel  = document.getElementById('año-label');

slider.addEventListener('input', function () {
    anioActivo = Number(slider.value);          // 1. guardar el año (texto → número)
    anioLabel.textContent = anioActivo;         // 2. actualizar el número visible
    geojsonLayer.setStyle(estiloWijk);          // 3. repintar el mapa con el año nuevo
    if (wijkSeleccionado) {                      // 4. si hay wijk seleccionado,
        actualizarPanel(wijkSeleccionado);      //    repintar el panel con el año nuevo
    }
    actualizarMensajeAnio(); 
});

actualizarTitulo();
aplicarIdioma();
actualizarMensajeAnio(); 