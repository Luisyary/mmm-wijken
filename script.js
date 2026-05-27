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

function estiloNormal() {
    return {
        fillColor:   '#29c6b4',
        fillOpacity: 0.55,
        color:       '#ffffff',
        weight:      1,
    };
}

function estiloHover() {
    return {
        fillColor:   '#cd0909',
        fillOpacity: 0.85,
        color:       '#ffffff',
        weight:      2,
    };
}

let geojsonLayer;

function onEachFeature(feature, layer) {
    const props = feature.properties;

    layer.on('mouseover', function () {
        layer.setStyle(estiloHover());
        layer.bringToFront();
    });

    layer.on('mouseout', function () {
        geojsonLayer.resetStyle(layer);
    });

    layer.on('click', function () {
        console.log('── Wijk seleccionado ──');
        console.log('mdzone:   ', props.mdzone);
        console.log('Naam NL:  ', props.namedut);
        console.log('Naam FR:  ', props.namefre);
        console.log('Gemeente: ', props.gemeentenaam);
    });
}

fetch('data/quartiers.geojson')
    .then(response => {
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    })
    .then(geojsonData => {
        geojsonLayer = L.geoJSON(geojsonData, {
            style:         estiloNormal,
            onEachFeature: onEachFeature,
        }).addTo(map);

        map.fitBounds(geojsonLayer.getBounds());
        console.log('✅ GeoJSON cargado:', geojsonData.features.length, 'wijken');
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
    });