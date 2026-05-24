# MMM Kiosk Project — Fase 1: Análisis GeoJSON BISA
**MigratieMuseumMigration Brussels**
Fecha análisis: 2026-05-24

---

## Archivo analizado

**Nombre:** `quartiers-du-monitoring-des-quartiers-ibsa-perspective-rbc.geojson`
**Fuente:** [wijkmonitoring.brussels](https://wijkmonitoring.brussels) / BISA – Perspective.brussels
**Tamaño:** 765 KB
**Tipo:** FeatureCollection (GeoJSON estándar RFC 7946)

---

## Estructura del archivo

```
{
  "type": "FeatureCollection",
  "features": [ ... 145 features ... ]
}
```

Cada feature contiene:
- `geometry.type` → `MultiPolygon` (WGS84 lon/lat — compatible Leaflet ✅)
- `properties` → metadatos del quartier

### Propiedades por feature

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `mdzone` | number | **ID único del quartier** → clave de join con datos BISA |
| `inspire_id` | string | URI oficial: `https://databrussels.be/id/monitoringdistrict/{id}` |
| `namefre` | string | Nombre en francés |
| `namedut` | string | Nombre en neerlandés |
| `area` | number | Superficie en m² |
| `nom_commune` | string | Municipio (francés) |
| `gemeentenaam` | string | Municipio (neerlandés) |
| `google_maps` | string | URL de Google Maps |
| `google_street_view` | string | URL de Street View |
| `geo_point_2d` | object | `{ lon, lat }` — centroide del quartier |

---

## Estadísticas del dataset

### Total de features: 145

| Categoría | Rango mdzone | Cantidad |
|-----------|-------------|---------|
| Quartiers residenciales | 1 – 699 | **118** |
| Cementerios | 700 – 799 | 3 |
| Zonas industriales / infraestructura | 800 – 899 | 6 |
| Parques / dominios | 900 – 917 | 18 |

> ⚠️ **Nota importante para el kiosk:**  
> Los datos de población/origen de BISA probablemente solo cubren los **118 quartiers residenciales** (mdzone 1–699). Las zonas 700+ (parques, cementerios, industria) no tienen población residente → filtrar o tratar diferente en la visualización.

### Municipios representados: 8

| Municipio | Quartiers |
|-----------|-----------|
| Bruxelles | 27 |
| Anderlecht | 20 |
| Uccle | 20 |
| Saint-Josse-ten-Noode | 19 |
| Ixelles | 18 |
| Molenbeek-Saint-Jean | 18 |
| Schaerbeek | 18 |
| Saint-Gilles | 5 |

> ⚠️ Solo se incluyen **8 de los 19 municipios** de la RBC. El archivo cubre únicamente el área del "monitoring des quartiers" de BISA — no todo Bruselas.

---

## Sistema de coordenadas

- **Proyección:** WGS84 (EPSG:4326) — lon/lat decimal
- **Rango longitud:** 4.2438 → 4.4823
- **Rango latitud:** 50.7637 → 50.9139
- **Compatible con Leaflet:** ✅ Sin conversión necesaria

---

## Clave de join con datos BISA

El campo **`mdzone`** (número entero) es el identificador único de cada quartier.  
Este mismo código aparece en los archivos de datos del wijkmonitoring → **es la clave para cruzar geometría + datos de origen**.

Ejemplo de join en JavaScript:
```javascript
// Cada feature del GeoJSON tiene:
feature.properties.mdzone  // ej: 36

// Los datos BISA tendrán algo como:
bisaData[36] = {
  be: 45.2,
  eu: 12.1,
  africa: 18.3,
  // ... 9 categorías de origen
}
```

---

## Verificación para el proyecto MMM

| Requisito | Estado |
|-----------|--------|
| 145 wijken | ✅ Confirmado |
| Geometría MultiPolygon válida | ✅ Confirmado |
| Coordenadas WGS84 (Leaflet-ready) | ✅ Confirmado |
| ID único por quartier (`mdzone`) | ✅ Confirmado |
| Nombres FR + NL | ✅ Confirmado |
| Municipio por quartier | ✅ Confirmado |
| Centroide disponible (`geo_point_2d`) | ✅ Confirmado |

---

## Próximos pasos — Fase 2

1. **Obtener datos BISA de origen** (las 9 categorías) por `mdzone`
   - Descargar desde wijkmonitoring.brussels en formato Excel/CSV
   - Identificar los nombres de columna exactos para cada categoría

2. **Crear `bisa_data.js`** — objeto JS con los datos de origen indexados por `mdzone`

3. **Filtrar GeoJSON** — separar los 118 quartiers residenciales de los 27 no-residenciales

4. **Integración Leaflet:**
   ```javascript
   L.geoJSON(geojsonData, {
     style: feature => ({
       fillColor: getColor(bisaData[feature.properties.mdzone]),
       weight: 1,
       opacity: 1,
       fillOpacity: 0.7
     }),
     onEachFeature: (feature, layer) => {
       layer.bindPopup(feature.properties.namefre);
     }
   }).addTo(map);
   ```

5. **Tooltip/popup** — mostrar nombre del quartier + porcentajes de las 9 categorías

---

## Notas técnicas

- El archivo pesa **765 KB** — aceptable para carga directa en el kiosk (no necesita tiles)
- `geo_point_2d` puede usarse para centrar labels o tooltips sin calcular centroides
- `inspire_id` es una URI permanente — útil si en el futuro BISA ofrece API linked data

## Archivo Excel BISA — Datos de origen

**Nombre:** mq_data_export_2026-05-24.xlsx
**Fuente:** wijkmonitoring.brussels
**Estructura:** Una hoja "Gegevens" con 323 columnas

### Las 9 categorías de origen (año 2025)

| Key JS | Descripción | Columna Excel |
|--------|-------------|--------------|
| andere_landen | Otros países | ... |
| fransen | Francia | ... |
| turken | Turquía | ... |
| ... | ... | ... |

### Validación de join
- Campo clave: `Code` (Excel) = `mdzone` (GeoJSON)
- 118 wijken residenciales con datos ✅
- 27 wijken sin datos (mdzone 700+) = null ✅
