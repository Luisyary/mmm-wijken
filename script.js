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
        color:       '#ffffff',
        weight:      3,
    };
}


// ── 3. ESTADO ────────────────────────────────────────────────────
let geojsonLayer;
let categoriaActiva  = 'noord_afrika';
let wijkSeleccionado = null;
let gemeenteActiva   = null;


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
        if (gemeenteActiva) {
            geojsonLayer.eachLayer(l => geojsonLayer.resetStyle(l));
        }

        // Marcar wijk seleccionado
        wijkSeleccionado = layer;
        layer.setStyle(estiloWijkSeleccionado());
        layer.bringToFront();

        // Resaltar gemeente completo
        gemeenteActiva = props.gemeentenaam;
        geojsonLayer.eachLayer(l => {
            if (l.feature.properties.gemeentenaam === gemeenteActiva && l !== layer) {
                l.setStyle(estiloGemeente());
            }
        });

        // Actualizar panel
        const panel = document.getElementById('panel');

        if (!data) {
            panel.innerHTML = '<p>Geen data beschikbaar</p>';
            return;
        }

        const valor          = data[categoriaActiva];
        const nombreCategoria = document.querySelector('.btn-categoria.activo').textContent;

        panel.innerHTML = `
            <p style="font-size:12px; color:#888; margin-bottom:2px">${props.gemeentenaam}</p>
            <p style="font-weight:bold; font-size:16px; margin-bottom:8px">${props.namedut}</p>
            <p>${nombreCategoria}: ${valor}%</p>
        `;
    });
}


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

        // Restaurar resaltado de gemeente y wijk seleccionado
        if (gemeenteActiva) {
            geojsonLayer.eachLayer(l => {
                if (l.feature.properties.gemeentenaam === gemeenteActiva && l !== wijkSeleccionado) {
                    l.setStyle(estiloGemeente());
                }
            });
        }
        if (wijkSeleccionado) {
            wijkSeleccionado.setStyle(estiloWijkSeleccionado());
            wijkSeleccionado.bringToFront();
        }
    });
});