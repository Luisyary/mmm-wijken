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
    const data   = bisaData[mdzone];
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
        return `1 op de ${n}`;
    }

    // Tramo bajo: entre 0.1% y 1% → "X op de 1000"
    if (valor >= 0.1) {
        const x = Math.round(valor * 10);
        return `${x} op de 1000`;
    }

    // Tramo diminuto: menos de 0.1% → texto fijo
    return 'minder dan 1 op de 1000';
}


// ── 3. ESTADO ────────────────────────────────────────────────────
let geojsonLayer;
let categoriaActiva  = 'noord_afrika';
let wijkSeleccionado = null;
let gemeenteActiva   = null;
let communesData = null;
let gemeenteLayer = null;
const titulosCategoria = {
    noord_afrika:    'Noord-Afrikaanse',
    sub_sahara:      'Sub-Saharaanse',
    turken:          'Turkse',
    fransen:         'Franse',
    europa14:        'Europese (14)',
    oeso:            'OESO-',
    eu_nieuw:        'nieuwe EU-',
    latijns_amerika: 'Latijns-Amerikaanse',
    andere_landen:   'andere',
};

function actualizarTitulo() {
    const texto = titulosCategoria[categoriaActiva];
    const titulo = document.getElementById('titulo-dinamico');
    titulo.textContent = `Waar wonen Brusselaars van ${texto} herkomst?`;
}


// ── 4. EVENTOS POR WIJK ──────────────────────────────────────────
function onEachFeature(feature, layer) {
    const props  = feature.properties;
    const mdzone = props.mdzone;
    const data   = bisaData[mdzone];

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
    gemeenteActiva = communeEncontrada.properties.name_nl;
}

        // Actualizar panel
        const panel = document.getElementById('panel');

        if (!data) {
            panel.innerHTML = '<p>Geen data beschikbaar</p>';
            return;
        }

const valor          = data[categoriaActiva];
const nombreCategoria = document.querySelector('.btn-categoria.activo').textContent;
const total          = data.totale_bevolking;

panel.innerHTML = `
    <p style="font-size:12px; color:#888; margin-bottom:2px">${gemeenteActiva}</p>
    <p style="font-weight:bold; font-size:16px; margin-bottom:8px">${props.namedut}</p>
    <p>${nombreCategoria}: ${valor}% — ${traducirPorcentaje(valor)}</p>
    <p style="font-size:13px; color:#555; margin-top:10px">
        ${total ? total.toLocaleString('nl-BE') + ' inwoners in deze wijk' : ''}
    </p>
`;
    });
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

actualizarTitulo();