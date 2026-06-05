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
// Por ahora coloreamos según Noord-Afrika (para probar)
// En Fase 4 el usuario podrá elegir la categoría

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
    const valor = data ? data[categoriaActiva] : null;

    return {
        fillColor:   getColor(valor),
        fillOpacity: 0.75,
        color:       '#ffffff',
        weight:      1,
    };
}


// ── 3. EVENTOS POR WIJK ──────────────────────────────────────────
let geojsonLayer;

function onEachFeature(feature, layer) {
    const props  = feature.properties;
    const mdzone = props.mdzone;
    const data   = bisaData[mdzone];

    layer.on('mouseover', function () {
        layer.setStyle({ fillOpacity: 1, weight: 2 });
        layer.bringToFront();
    });

    layer.on('mouseout', function () {
        geojsonLayer.resetStyle(layer);
    });

layer.on('click', function () {
    const panel = document.getElementById('panel');

    if (!data) {
        panel.innerHTML = '<p>Geen data beschikbaar</p>';
        return;
    }

    const valor = data[categoriaActiva];
    const nombreCategoria = document.querySelector('.btn-categoria.activo').textContent;

    panel.innerHTML = `
        <p style="font-weight:bold; font-size:16px; margin-bottom:8px">${props.namedut}</p>
        <p>${nombreCategoria}: ${valor}%</p>
    `;
});
}


// ── 4. CARGAR GEOJSON ────────────────────────────────────────────
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
    
    // ── 5. BOTONES DE CATEGORÍA ──────────────────────────────────────
let categoriaActiva = 'noord_afrika';

document.querySelectorAll('.btn-categoria').forEach(btn => {
    btn.addEventListener('click', function () {

        // Actualizar botón activo
        document.querySelectorAll('.btn-categoria').forEach(b => b.classList.remove('activo'));
        this.classList.add('activo');

        // Cambiar categoría activa
        categoriaActiva = this.dataset.categoria;

        // Repintar el mapa
        geojsonLayer.setStyle(estiloWijk);
    });
});