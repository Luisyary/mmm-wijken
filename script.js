// ── 1. CREAR EL MAPA ─────────────────────────────────────────────
const map = L.map('map', {
    center: [50.846, 4.352],
    zoom: 12,
    zoomControl: false,
    minZoom: 12,     // nuevo — no se puede alejar más que esto
    maxZoom: 15,     // nuevo — no se puede acercar más que esto
});


// ── 2. COLOREAR SEGÚN DATOS BISA ─────────────────────────────────

const eraPalettes = {
    '94-01': ['#F2FBFA', '#CDEEEB', '#8ED9D2', '#4FC0B5', '#22A79A', '#0F8F85'],
    '02-09': ['#F1EEFB', '#D8CFF5', '#B3A0EA', '#8E71DE', '#7A5AD5', '#6A4FC0'],
    '10-17': ['#FDF3E8', '#FAE1C2', '#F5C482', '#F0A745', '#EC9520', '#e98300'],
    '18-25': ['#FCEAEC', '#F5C2C8', '#EA929A', '#DD6067', '#D13540', '#C81E3A'],
};

function getColor(value) {
    const era = getEraInfo(anioActivo);
    const key = era.cssVar.replace('--era-', '');
    const scale = eraPalettes[key];

    if (value === null || value === undefined) return '#cfd2d6';
    if (value > 20) return scale[5];
    if (value > 15) return scale[4];
    if (value > 10) return scale[3];
    if (value > 5)  return scale[2];
    if (value > 2)  return scale[1];
    return scale[0];
}

function getEraInfo(anio) {
    if (anio <= 2001) return { label: "'94–'01", cssVar: '--era-94-01' };
    if (anio <= 2009) return { label: "'02–'09", cssVar: '--era-02-09' };
    if (anio <= 2017) return { label: "'10–'17", cssVar: '--era-10-17' };
    return { label: "'18–'25", cssVar: '--era-18-25' };
}

function estiloWijk(feature) {
    const mdzone = feature.properties.mdzone;
    const data = bisaData[anioActivo][mdzone];
    const valor  = data ? data[categoriaActiva] : null;
    return {
        fillColor:   getColor(valor),
        fillOpacity: 1,          // antes 0.75 — colores sólidos, sin transparencia
        color:       '#1F2440',  // antes '#ffffff' — borde en tinta oscura
        weight:      1,
    };
}

function estiloGemeente(feature) {
    return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: '#1F2440',   // papier (blanco) fijo — funciona sobre cualquier color de fondo oscuro o claro
        weight: 2.2,
        dashArray: '6, 5',
    };
}

function estiloWijkSeleccionado() {
    return {
        fillOpacity: 1,
        color: '#1F2440',   // --inkt fijo, no el acento de era
        weight: 2.5,
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

function getAcentoHex() {
    return getComputedStyle(document.documentElement).getPropertyValue('--acento-actief').trim();
}

function actualizarAcentoEra() {
    const era = getEraInfo(anioActivo);
    document.documentElement.style.setProperty('--acento-actief', `var(${era.cssVar})`);
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
    const t      = i18n[idiomaActivo];
    const c      = t.categorias[categoriaActiva];
    const frase  = c.frase.replace('{x}', `<span id="herkomst-woord">${c.acento}</span>`);
    const titulo = document.getElementById('titulo-dinamico');
    titulo.innerHTML = `${t.tituloAntes} ${frase}${t.tituloDespues}`;
}

function actualizarLeyenda() {
    const t = i18n[idiomaActivo];
    document.getElementById('legenda-categorie-naam').textContent = t.categorias[categoriaActiva].boton;
    document.getElementById('legenda-nota').textContent           = t.legendaNota;
}

let idiomaActivo = 'nl';

const i18n = {
    nl: {
        opDe:        '1 op de',
        opDe1000:    'op de 1000',
        menosMil:    'minder dan 1 op de 1000',

        // — Hero
        eyebrow:       'Aandeel van de bevolking · naar nationaliteit',
        tituloAntes:   'Waar wonen Brusselaars met',
        tituloDespues: '?',
        notaFija:      'Wie ook de Belgische nationaliteit heeft, telt hier niet mee.',
        kiesLabel:     'Kies nationaliteit',

        subtitulo: 'Wijkmonitor · Brussels Hoofdstedelijk Gewest',
        klikWijk: 'Klik op een wijk',
        locale: 'nl-BE',
        vanDe: 'van de',
        inwoners: 'inwoners',
        menosDe1: 'te klein om in vakjes te tonen',
        geschat: 'geschat — afgeleid van het percentage',
        sinData: 'Geen data beschikbaar',
        menosDe1Inwoner: 'minder dan 1 inwoner',
        sinDataAnioAntes: 'Geen data voor',
        sinDataAnioDespues: 'vóór',
        gemeenteLabel: 'Gemeente',
        wijkLabel: 'Wijk',
        aandeelLabel: 'Aandeel',

        // — Waffle (plantilla con marcadores)
        waffleTekst:   'Van elke {totaal} inwoners hebben er {n} {frase}.',

        jaarLabel: 'Jaar',
        bronLabel: 'Bron BISA',
        legendaNota: 'Grijs = park · bos · domein · geen data',

       categorias: {
            noord_afrika:    { boton: 'Noord-Afrika',    frase: 'een nationaliteit uit {x}', acento: 'Noord-Afrika' },
            sub_sahara:      { boton: 'Sub-Sahara',      frase: 'een nationaliteit uit {x}', acento: 'Sub-Saharaans Afrika' },
            turken:          { boton: 'Turkije',         frase: 'de {x} nationaliteit',      acento: 'Turkse' },
            fransen:         { boton: 'Frankrijk',       frase: 'de {x} nationaliteit',      acento: 'Franse' },
            europa14:        { boton: 'Europa 14',       frase: 'een nationaliteit uit {x}', acento: 'de Europa 14-landen' },
            oeso:            { boton: 'OESO',            frase: 'een nationaliteit uit {x}', acento: 'een OESO-land' },
            eu_nieuw:        { boton: 'Nieuwe EU',       frase: 'een nationaliteit uit {x}', acento: 'de nieuwe EU-lidstaten' },
            latijns_amerika: { boton: 'Latijns-Amerika', frase: 'een nationaliteit uit {x}', acento: 'Latijns-Amerika' },
            andere_landen:   { boton: 'Andere landen',   frase: 'een nationaliteit uit {x}', acento: 'een ander land' },
        },
    },

    fr: {
        opDe:        '1 sur',
        opDe1000:    'sur 1000',
        menosMil:    'moins de 1 sur 1000',

        // — Hero
        eyebrow:       'Part de la population · par nationalité',
        tituloAntes:   'Où vivent les Bruxellois ayant',
        tituloDespues: '\u202F?',
        notaFija:      'Les personnes ayant aussi la nationalité belge ne sont pas comptées ici.',
        kiesLabel:     'Choisir la nationalité',

        subtitulo: 'Moniteur des quartiers · Région de Bruxelles-Capitale',
        klikWijk: 'Cliquez sur un quartier',
        locale: 'fr-BE',
        vanDe: 'sur',
        inwoners: 'habitants',
        geschat: 'estimation — dérivée du pourcentage',
        menosDe1: 'trop petit pour être affiché en cases',
        sinData: 'Aucune donnée disponible',
        menosDe1Inwoner: "moins d'un habitant",
        sinDataAnioAntes: 'Pas de données pour',
        sinDataAnioDespues: 'avant',
        gemeenteLabel: 'Commune',
        wijkLabel: 'Quartier',
        aandeelLabel: 'Part',

        // — Waffle (plantilla con marcadores)
        waffleTekst:   'Sur {totaal} habitants, {n} ont {frase}.',

        jaarLabel: 'Année',
        bronLabel: 'Source IBSA',
        legendaNota: 'Gris = parc · bois · domaine · sans données',

        categorias: {
            noord_afrika:    { boton: 'Afrique du Nord',  frase: 'une nationalité {x}', acento: "d'Afrique du Nord" },
            sub_sahara:      { boton: 'Afrique subsah.',  frase: 'une nationalité {x}', acento: "d'Afrique subsaharienne" },
            turken:          { boton: 'Turquie',          frase: 'la nationalité {x}',  acento: 'turque' },
            fransen:         { boton: 'France',           frase: 'la nationalité {x}',  acento: 'française' },
            europa14:        { boton: 'Europe 14',        frase: 'une nationalité {x}', acento: "d'un pays de l'Europe des 14" },
            oeso:            { boton: 'OCDE',             frase: 'une nationalité {x}', acento: "d'un pays de l'OCDE" },
            eu_nieuw:        { boton: 'Nouveaux UE',      frase: 'une nationalité {x}', acento: "d'un nouvel État membre de l'UE" },
            latijns_amerika: { boton: 'Amérique latine',  frase: 'une nationalité {x}', acento: "d'Amérique latine" },
            andere_landen:   { boton: 'Autres pays',      frase: 'une nationalité {x}', acento: "d'un autre pays" },
        },
    },
}

function aplicarIdioma() {
    const t = i18n[idiomaActivo];

    // 1. Atributo lang del documento (accesibilidad)
    document.documentElement.lang = idiomaActivo;

    // 2. Textos fijos del header y del hero
    document.getElementById('subtitulo').textContent          = t.subtitulo;
    document.getElementById('eyebrow').textContent            = t.eyebrow;
    document.getElementById('nota-fija').textContent          = t.notaFija;
    document.getElementById('kies-herkomst-label').textContent = t.kiesLabel;

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
    actualizarLeyenda();
    actualizarMensajeAnio(); 

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
    const t         = i18n[idiomaActivo];

    if (!data) {
        panel.innerHTML = '<p>Geen data beschikbaar</p>';
        return;
    }

    if (data[categoriaActiva] == null || data.totale_bevolking == null) {
        panel.innerHTML = `
            <p class="panel-label">${t.gemeenteLabel}</p>
            <p class="panel-gemeente-stamp">${gemeenteActiva}</p>
            <p class="panel-label">${t.wijkLabel}</p>
            <p class="panel-wijk">${props[campoWijk]}</p>
            <p class="panel-nodata">${t.sinData}</p>
        `;
        return;
    }

    const valor           = data[categoriaActiva];
    const nombreCategoria = t.categorias[categoriaActiva].boton;
    const total           = data.totale_bevolking;
    const redondeado      = Math.round(valor);          // ← primero esta
    const personas        = Math.round(valor / 100 * total);
    const era             = getEraInfo(anioActivo);

    const cifraMostrada = redondeado === 0              // ← después esta
        ? valor.toLocaleString(t.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : redondeado;

    const fraseCat = t.categorias[categoriaActiva].frase
        .replace('{x}', t.categorias[categoriaActiva].acento);

    const textoWaffle = redondeado === 0 ? '' : t.waffleTekst
        .replace('{totaal}', '<strong>100</strong>')
        .replace('{n}', `<strong>${redondeado}</strong>`)
        .replace('{frase}', fraseCat);
    panel.innerHTML = `
        <p class="panel-label">${t.gemeenteLabel}</p>
        <p class="panel-gemeente-stamp">${gemeenteActiva}</p>

        <p class="panel-label">${t.wijkLabel}</p>
        <p class="panel-wijk">${props[campoWijk]}</p>

        <div class="panel-cifra-wrap">
            <span class="panel-cifra">${cifraMostrada}</span><span class="panel-cifra-unit">%</span>
            <div class="panel-cifra-caption">
                <span class="panel-label">${t.aandeelLabel}</span>
                <span class="panel-cifra-cat">${nombreCategoria}</span>
            </div>
        </div>

        <div class="waffle-wrap">
            ${construirWaffle(redondeado)}
            <p class="waffle-texto">${textoWaffle}</p>
        </div>

        <p class="panel-personas">± <strong>${personas.toLocaleString(t.locale)}</strong> ${t.vanDe} <strong>${total.toLocaleString(t.locale)}</strong> ${t.inwoners}.</p>
        <p class="panel-nota">${t.geschat}</p>

        <div class="panel-footer">
            <span class="footer-chip" style="background: var(${era.cssVar})">${era.label}</span>
            <span class="footer-meta">${t.jaarLabel} ${anioActivo} · ${t.bronLabel}</span>
        </div>
    `;
}

// ── 4. EVENTOS POR WIJK ──────────────────────────────────────────
function onEachFeature(feature, layer) {

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
    gemeenteLayer.bringToFront();
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

setTimeout(() => {
    map.invalidateSize();
    map.fitBounds(geojsonLayer.getBounds(), {
        padding: [20, 20],
        maxZoom: 13,
    });
}, 300);

// Recalcular una vez más cuando la fuente termine de cargar
document.fonts.ready.then(() => {
    map.invalidateSize();
});

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
        actualizarLeyenda();
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
    anioActivo = Number(slider.value);
    actualizarAcentoEra();
    anioLabel.textContent = anioActivo;
    geojsonLayer.setStyle(estiloWijk);
    if (wijkSeleccionado) {
        wijkSeleccionado.setStyle(estiloWijkSeleccionado());
        actualizarPanel(wijkSeleccionado);
    }
    if (gemeenteLayer) {
        gemeenteLayer.setStyle(estiloGemeente());
    }
    actualizarMensajeAnio();
    actualizarTooltipSlider();   // nuevo
});

function actualizarTooltipSlider() {
    const min = Number(slider.min);
    const max = Number(slider.max);
    const pct = (anioActivo - min) / (max - min);
    const tooltip = document.getElementById('slider-tooltip');
    tooltip.textContent = anioActivo;
    tooltip.style.left = `${pct * 100}%`;
}

actualizarAcentoEra();   // nuevo — inicializa el acento correcto al cargar la página
actualizarTitulo();
actualizarLeyenda();
aplicarIdioma();
actualizarMensajeAnio();
actualizarTooltipSlider();