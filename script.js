
// ==========================================================================
// 1. INITIALISATION ET PANES
// ==========================================================================
var map = L.map('map', { preferCanvas: true }).setView([43.61, 3.87], 13);

map.createPane('paneCadastre').style.zIndex = 400;
map.createPane('paneBati').style.zIndex = 450;
map.createPane('paneRoutes').style.zIndex = 500;
map.createPane('paneQuartiers').style.zIndex = 600; 
map.createPane('paneCommune').style.zIndex = 650;

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

var coucheCommune, coucheQuartiers, coucheIlots, coucheRoutes, coucheBati, coucheCadastre;

// ==========================================================================
// 2. FONCTIONS DE STYLE (Synchronisées avec la légende)
// ==========================================================================

function styleCommune() {
    return { color: "#000", weight: 4, fillOpacity: 0, dashArray: "5,10", pane: 'paneCommune' };
}

function styleQuartiers(f) {
    var c = { "RESIDENTIEL": "#ff5757", "ECONOMIQUE": "#3fb9ff", "CENTRE": "#ffa601", "PERIPHERIE": "#cbff8f" };
    return { fillColor: c[f.properties.type] || "#686868", weight: 2, color: 'white', fillOpacity: 0.5, pane: 'paneQuartiers' };
}

// 5 CLASSES D'ILOTS
function styleIlots(f) {
    var d = f.properties.NUMPOINTS || f.properties.NUMPOINT;
    var col = d > 80 ? '#d53e4f' : d > 60 ? '#f46d43' : d > 40 ? '#fdae61' : d > 20 ? '#abdda4' : '#66c2a5';
    return { fillColor: col, weight: 0, fillOpacity: 0.8 };
}

// 5 CLASSES DE ROUTES
function styleRoutes(f) {
    var l = f.properties.LARGEUR || 1;
    var col, w;
    if (l > 8)      { col = '#66c2a5'; w = 5.3; } 
    else if (l > 5) { col = '#abdda4'; w = 3.8; } 
    else if (l > 3) { col = '#fdae61'; w = 2.4; } 
    else if (l > 1.5){ col = '#f46d43'; w = 1.4; } 
    else            { col = '#d53e4f'; w = 1.0; } 
    return { color: col, weight: w, opacity: 0.9, lineCap: 'round', pane: 'paneRoutes' };
}

// 6 CLASSES DE BÂTI
function styleBati(f) {
    var h = f.properties.height || 0;
    var col = h > 30 ? '#d53e4f' : h > 20 ? '#f46d43' : h > 15 ? '#fdae61' : h > 10 ? '#e6f598' : h > 5 ? '#66c2a5' : '#3288bd';
    return { fillColor: col, fillOpacity: 0.9, weight: 0, pane: 'paneBati' };
}

// ==========================================================================
// 3. LOGIQUE D'AFFICHAGE
// ==========================================================================

function rafraichirAffichage() {
    var z = map.getZoom();
    mettreAJourLegende(z);

    if (z < 14.5) {
        if (coucheQuartiers && !map.hasLayer(coucheQuartiers)) map.addLayer(coucheQuartiers);
        if (coucheIlots) coucheIlots.setStyle({ fillOpacity: 0.8 });
        [coucheRoutes, coucheBati, coucheCadastre].forEach(c => { if(c) map.removeLayer(c); });
    } 
    else if (z >= 14.5 && z < 17) {
        if (coucheQuartiers) map.removeLayer(coucheQuartiers);
        if (coucheIlots && !map.hasLayer(coucheIlots)) map.addLayer(coucheIlots);
        if (coucheIlots) coucheIlots.setStyle({ fillOpacity: 0.8 });
        if (coucheRoutes && !map.hasLayer(coucheRoutes)) map.addLayer(coucheRoutes);
        [coucheBati, coucheCadastre].forEach(c => { if(c) map.removeLayer(c); });
    } 
    else {
        if (coucheIlots) coucheIlots.setStyle({ fillOpacity: 0.1 });
        if (coucheRoutes && !map.hasLayer(coucheRoutes)) map.addLayer(coucheRoutes);
        if (coucheCadastre && !map.hasLayer(coucheCadastre)) map.addLayer(coucheCadastre);
        if (coucheBati && !map.hasLayer(coucheBati)) map.addLayer(coucheBati);
    }
}

// ==========================================================================
// 4. LÉGENDE (Totalement fonctionnelle et synchronisée)
// ==========================================================================

function mettreAJourLegende(zoom) {
    var div = document.getElementById('contenu-legende');
    if(!div) return;
    div.innerHTML = '';

    // Bloc Route réutilisable (5 classes)
    var legRoutes = '<strong>Réseau Routier</strong>' +
        '<div class="item-legende"><div class="symbole" style="background:#66c2a5; height:6px; border:none;"></div>Avenue (>8m)</div>' +
        '<div class="item-legende"><div class="symbole" style="background:#abdda4; height:4px; border:none;"></div>Large (5-8m)</div>' +
        '<div class="item-legende"><div class="symbole" style="background:#fdae61; height:3px; border:none;"></div>Moyenne (3-5m)</div>' +
        '<div class="item-legende"><div class="symbole" style="background:#f46d43; height:2px; border:none;"></div>Étroite (1.5-3m)</div>' +
        '<div class="item-legende"><div class="symbole" style="background:#d53e4f; height:1px; border:none;"></div>Ruelle (<1.5m)</div>';

    if (zoom < 14.5) {
        div.innerHTML = '<strong>Usage des Quartiers</strong>' +
            '<div class="item-legende"><div class="symbole" style="background:#ff5757"></div>Résidentiel</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#3fb9ff"></div>Économique</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#ffa601"></div>Centre Urbain</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#cbff8f"></div>Périphérie</div>' +
            '<strong>Limites</strong>' +
            '<div class="item-legende"><div class="symbole" style="border:1px dashed #000; background:none"></div>Commune</div>';
    } 
    else if (zoom >= 14.5 && zoom < 17) {
        div.innerHTML = '<strong>Densité ICU (5 classes)</strong>' +
            '<div class="item-legende"><div class="symbole" style="background:#d53e4f"></div>Très Forte (>80)</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#f46d43"></div>Forte (60-80)</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#fdae61"></div>Moyenne (40-60)</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#abdda4"></div>Faible (20-40)</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#66c2a5"></div>Très Faible (<20)</div>' +
            '<hr>' + legRoutes;
    } 
    else {
        div.innerHTML = '<strong>Hauteur du Bâti (6 classes)</strong>' +
            '<div class="item-legende"><div class="symbole" style="background:#d53e4f"></div>+30m</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#f46d43"></div>20-30m</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#fdae61"></div>15-20m</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#e6f598"></div>10-15m</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#66c2a5"></div>5-10m</div>' +
            '<div class="item-legende"><div class="symbole" style="background:#3288bd"></div>0-5m</div>' +
            '<strong>Foncier</strong>' +
            '<div class="item-legende"><div class="symbole" style="border:1px solid #999; background:none"></div>Parcelles</div>' +
            '<hr>' + legRoutes;
    }
}

// ==========================================================================
// 5. CHARGEMENT ET ÉVÉNEMENTS
// ==========================================================================

fetch('GeoJson_data/Montpellier_com.geojson').then(r => r.json()).then(data => { 
    coucheCommune = L.geoJSON(data, { style: styleCommune }).addTo(map); 
});

fetch('GeoJson_data/Montpellier_densité_ICU.geojson').then(r => r.json()).then(data => { 
    coucheIlots = L.geoJSON(data, { style: styleIlots }).addTo(map); 
    rafraichirAffichage();
});

fetch('GeoJson_data/Montpellier_quartier_use.geojson').then(r => r.json()).then(data => {
    coucheQuartiers = L.geoJSON(data, { 
        style: styleQuartiers,
        onEachFeature: (f,l) => { 
            l.bindTooltip(f.properties.type, { permanent: true, direction: 'center', className: 'label-quartier' }); 
        }
    });
    rafraichirAffichage();
});

fetch('GeoJson_data/Montpellier_route.geojson').then(r => r.json()).then(data => { 
    coucheRoutes = L.geoJSON(data, { style: styleRoutes }); 
    rafraichirAffichage();
});

fetch('GeoJson_data/Montpellier_parcelle.geojson').then(r => r.json()).then(data => { 
    coucheCadastre = L.geoJSON(data, { style: {color:'#fff', weight:0.8, pane:'paneCadastre', fillColor:'none'} }); 
});

fetch('GeoJson_data/Montpellier_building_height.geojson').then(r => r.json()).then(data => { 
    coucheBati = L.geoJSON(data, { style: styleBati }); 
});

map.on('zoomend', rafraichirAffichage);
mettreAJourLegende(map.getZoom());