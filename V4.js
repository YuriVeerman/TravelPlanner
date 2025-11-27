// Mapbox maps initialisation

//background map
mapboxgl.accessToken =
'pk.eyJ1IjoieXVyaXZlZXJtYW4iLCJhIjoiY21kOXhtcXN2MGJicTJqc2c4MXJhbzkwaSJ9.RiC65G-3PXdkipZM_abm4g';
const mapCoordinates = [5.3878, 52.1561]; // Coördinaten
const miniMap = new mapboxgl.Map({
  container: 'mini-map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: mapCoordinates,
  zoom: 0,
  interactive: false // maakt de minimap niet interactief
});

//minimap
window.mainMap = new mapboxgl.Map({
  container: 'mainMap',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: mapCoordinates,
  zoom: 10
});
window.mainMap.setProjection('globe');
//END MAPBOX----------------------------------------------------------------------------------------

//STAGE SWITCHING-----------------------------------------------------------------------------------

// screen switch from stage 1 to stage 2
const saveButton = document.getElementById('save-route-button');
const editButton = document.getElementById('edit-route-button');
const searchBlocker = document.getElementById('search-blocker');
const scrollBehavior = "smooth";

// Save: scroll to right, search blocker visible
saveButton.onclick = function() {
    window.scrollTo({
        left: document.body.scrollWidth,
        behavior: scrollBehavior
    });
    searchBlocker.style.height = document.getElementById('search-center').offsetHeight + 'px';
    searchBlocker.style.zIndex = 0;
};

// Edit: scroll to left, search bloker invisible 
editButton.onclick = function() {
    window.scrollTo({
        left: 0,
        behavior: scrollBehavior
    });
    searchBlocker.style.zIndex = -1;
};

const stepMeter = document.getElementById('step_meter');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');


const scrollX = window.scrollX;
if (scrollX > 0, scrollX < window.innerWidth) {
    step1.style.flexGrow = 4;
}

//STAGE SWITCHING END---------------------------------------------------------------------------------



// Clear buttons for search lines to clear text
// Nu: verwijder ook de marker als het veld wordt geleegd
function setupClearButtons() {
    document.querySelectorAll('.search-line').forEach(line => {
        const input = line.querySelector('input');
        const clearBtn = line.querySelector('.clear-button');
        if (input && clearBtn) {
            clearBtn.onclick = function() {
                input.value = '';
                // Verwijder marker op mainMap
                if (inputMarkers.has(input)) {
                    inputMarkers.get(input).remove();
                    inputMarkers.delete(input);
                }
                // Verwijder marker op miniMap
                if (miniMapMarkers.has(input)) {
                    miniMapMarkers.get(input).remove();
                    miniMapMarkers.delete(input);
                }
                updateRouteLine();
            };
        }
    });
}


// Add new search line for a stop
document.getElementById('add-stop-button').onclick = function() {
    // Maak de nieuwe search-line div
    const newLine = document.createElement('div');
    newLine.className = 'search-line';
    newLine.style.display = 'flex';
    newLine.style.alignItems = 'center';

    // Maak het inputveld
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Stop';
    input.className = 'location-search-input';

    // Maak het prullenbakje
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-stop-button';
    removeBtn.title = 'Verwijder deze stop';
    removeBtn.innerHTML = '🗑️';
    removeBtn.style.cursor = 'pointer';
    removeBtn.onclick = function() {
        // Verwijder marker op mainMap
        if (inputMarkers.has(input)) {
            inputMarkers.get(input).remove();
            inputMarkers.delete(input);
        }
        // Verwijder marker op miniMap
        if (miniMapMarkers.has(input)) {
            miniMapMarkers.get(input).remove();
            miniMapMarkers.delete(input);
        }
        newLine.remove();
    searchBlocker.style.height = document.getElementById('search-center').offsetHeight + 'px';
    updateRouteLine();
    };

    // Maak de clear-knop
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'clear-button';
    clearBtn.textContent = 'x';
    clearBtn.onclick = function() {
        input.value = '';
    };

    // Voeg input, prullenbak en clear toe aan de nieuwe div
    newLine.appendChild(input);
    newLine.appendChild(removeBtn);
    newLine.appendChild(clearBtn);

    // Zoek de end search-line
    const searchingDiv = document.getElementById('search-line-container');
    const endLine =
Array.from(searchingDiv.getElementsByClassName('search-line'))
        .find(div =>
div.querySelector('input')?.placeholder.toLowerCase() === 'end');

    // Voeg de nieuwe search-line toe vóór de end search-line
    if (endLine) {
        searchingDiv.insertBefore(newLine, endLine);
    }
    setupAutocompleteForSearchLines();
    setupClearButtons();
}

// Globale opslag voor markers per input
const inputMarkers = new Map();
const miniMapMarkers = new Map();
let routeLineId = 'route-line';

function focusMainMapOnInput(input) {
    if (input && inputMarkers.has(input)) {
        const marker = inputMarkers.get(input);
        const lngLat = marker.getLngLat();
        window.mainMap.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 12 });
    }
}

function updateMiniMapMarkersAndLine() {
    // Markers op minimap updaten
    miniMapMarkers.forEach(marker => marker.remove());
    miniMapMarkers.clear();
    // Verzamel de inputvelden in volgorde: start, stop(s), end
    const searchLines = Array.from(document.querySelectorAll('.search-line'));
    const coords = [];
    searchLines.forEach(line => {
        const input = line.querySelector('input');
        if (input && inputMarkers.has(input)) {
            const mainMarker = inputMarkers.get(input);
            const lngLat = mainMarker.getLngLat();
            coords.push([lngLat.lng, lngLat.lat]);
            // Zet marker op minimap
            const miniMarker = new mapboxgl.Marker({color: '#e74c3c'})
                .setLngLat([lngLat.lng, lngLat.lat])
                .addTo(miniMap);
            miniMarker.getElement().style.cursor = 'pointer'; // cursor fix
            miniMapMarkers.set(input, miniMarker);
            // Klik: focus mainMap op deze marker
            miniMarker.getElement().addEventListener('click', () => {
                focusMainMapOnInput(input);
            });
        }
    });
    console.log('Aantal markers op minimap:', miniMapMarkers.size);
    // Verwijder oude lijnlaag en bron indien aanwezig op minimap
    if (miniMap.getLayer(routeLineId)) {
        miniMap.removeLayer(routeLineId);
    }
    if (miniMap.getSource(routeLineId)) {
        miniMap.removeSource(routeLineId);
    }
    // Voeg nieuwe lijn toe als er minstens 2 punten zijn
    if (coords.length >= 2) {
        // Genereer geodetische lijn (great circle) tussen punten
        const turfLine = turf.greatCircle(coords[0], coords[coords.length-1], { npoints: 128 });
        // Voeg tussenpunten toe voor alle stops
        if (coords.length > 2) {
            let allCoords = [coords[0]];
            for (let i = 1; i < coords.length; i++) {
                const seg = turf.greatCircle(coords[i-1], coords[i], { npoints: 64 });
                allCoords = allCoords.concat(seg.geometry.coordinates.slice(1));
            }
            turfLine.geometry.coordinates = allCoords;
        }
        miniMap.addSource(routeLineId, {
            type: 'geojson',
            data: turfLine
        });
        miniMap.addLayer({
            id: routeLineId,
            type: 'line',
            source: routeLineId,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': '#0074D9',
                'line-width': 4
            }
        });
    }
    // Zoom de minimap zodat alle markers zichtbaar zijn
    if (coords.length > 0) {
        const bounds = coords.reduce((b, coord) => b.extend(coord), new mapboxgl.LngLatBounds(coords[0], coords[0]));
        miniMap.fitBounds(bounds, { padding: 40, maxZoom: 10, duration: 800 });
    }
}

function updateRouteLine() {
    // Alleen markers en lijn op minimap updaten
    updateMiniMapMarkersAndLine();
    updateTotalDistance();
}

function updateTotalDistance() {
    // Verzamel de inputvelden in volgorde: start, stop(s), end
    const searchLines = Array.from(document.querySelectorAll('.search-line'));
    const coords = [];
    searchLines.forEach(line => {
        const input = line.querySelector('input');
        if (input && inputMarkers.has(input)) {
            const marker = inputMarkers.get(input);
            const lngLat = marker.getLngLat();
            coords.push([lngLat.lng, lngLat.lat]);
        }
    });
    let total = 0;
    if (coords.length >= 2) {
        for (let i = 1; i < coords.length; i++) {
            total += turf.distance(coords[i-1], coords[i], {units: 'kilometers'});
        }
        total = Math.round(total);
    } else {
        total = 0;
    }
    const el = document.getElementById('total-distance');
    if (el) {
        el.textContent = total > 0 ? total.toLocaleString('nl-NL') : '-';
    }
}

// Autocomplete functionaliteit voor alle searchbars in .search-line
// Gebruikt Mapbox Geocoding API voor wereldwijde locatiesuggesties
function setupAutocompleteForSearchLines() {
    document.querySelectorAll('.search-line input[type="search"], .search-line input[type="text"]').forEach(input => {
        let suggestionBox = document.createElement('div');
        suggestionBox.className = 'suggestion-box';
        suggestionBox.style.position = 'absolute';
        suggestionBox.style.zIndex = 10000;
        suggestionBox.style.background = '#fff';
        suggestionBox.style.border = '1px solid #ccc';
        suggestionBox.style.width = input.offsetWidth + 'px';
        suggestionBox.style.maxHeight = '200px';
        suggestionBox.style.overflowY = 'auto';
        suggestionBox.style.display = 'none';
        suggestionBox.style.borderBottomLeftRadius =  '10px';
        suggestionBox.style.borderBottomRightRadius =  '10px';
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(suggestionBox);

        let lastFeatures = [];
        let selectedSuggestionIndex = -1;

        // Helper: update visuele selectie
        function updateSuggestionHighlight() {
            const items = suggestionBox.querySelectorAll('div');
            items.forEach((item, idx) => {
                item.style.background = (idx === selectedSuggestionIndex) ? '#eee' : '#fff';
            });
        }

        // Helper: selecteer suggestie (door klik, enter of pijltje)
        function selectSuggestion(feature) {
            input.value = feature.place_name;
            suggestionBox.style.display = 'none';
            // Center kaart en zet marker
            if (window.mainMap) {
                window.mainMap.flyTo({ center: feature.center, zoom: 12 });
                if (inputMarkers.has(input)) {
                    inputMarkers.get(input).remove();
                }
                // Zet nieuwe marker op mainMap, nu draggable
                const marker = new mapboxgl.Marker({color: '#e74c3c', draggable: true})
                    .setLngLat(feature.center)
                    .addTo(window.mainMap);
                // Update input en route als marker wordt versleept
                marker.on('dragend', function() {
                    const lngLat = marker.getLngLat();
                    input.value = `${lngLat.lng.toFixed(5)}, ${lngLat.lat.toFixed(5)}`;
                    updateRouteLine();
                });
                inputMarkers.set(input, marker);
                updateRouteLine();
            }
        }

        // Helper: toggle border-radius van zoekbalk onderhoeken
        function setSearchLineRadius(active) {
            const parent = input.parentNode;
            if (parent && parent.classList.contains('search-line')) {
                if (active) {
                    parent.style.borderBottomLeftRadius = '0px';
                    parent.style.borderBottomRightRadius = '0px';
                } else {
                    parent.style.borderBottomLeftRadius = '';
                    parent.style.borderBottomRightRadius = '';
                }
            }
        }

        input.addEventListener('input', function(e) {
            const query = input.value.trim();
            if (!query) {
                suggestionBox.style.display = 'none';
                suggestionBox.innerHTML = '';
                lastFeatures = [];
                selectedSuggestionIndex = -1;
                setSearchLineRadius(false);
                return;
            }
            suggestionBox.style.left = input.offsetLeft + 'px';
            suggestionBox.style.top = (input.offsetTop + input.offsetHeight) + 'px';
            suggestionBox.style.width = input.offsetWidth + 'px';
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?autocomplete=true&access_token=${mapboxgl.accessToken}`)
                .then(res => res.json())
                .then(data => {
                    suggestionBox.innerHTML = '';
                    lastFeatures = data.features || [];
                    selectedSuggestionIndex = -1;
                    if (lastFeatures.length > 0) {
                        lastFeatures.forEach((feature, idx) => {
                            const item = document.createElement('div');
                            item.textContent = feature.place_name;
                            item.style.padding = '8px';
                            item.style.cursor = 'pointer';
                            item.addEventListener('mouseenter', () => {
                                selectedSuggestionIndex = idx;
                                updateSuggestionHighlight();
                            });
                            item.addEventListener('mouseleave', () => {
                                selectedSuggestionIndex = -1;
                                updateSuggestionHighlight();
                            });
                            item.addEventListener('mousedown', (e) => {
                                e.preventDefault();
                                selectSuggestion(feature);
                            });
                            suggestionBox.appendChild(item);
                        });
                        suggestionBox.style.display = 'block';
                        setSearchLineRadius(true);
                        updateSuggestionHighlight();
                    } else {
                        suggestionBox.style.display = 'none';
                        setSearchLineRadius(false);
                    }
                });
        });
        // Enter/pijltjes: selecteer suggestie
        input.addEventListener('keydown', function(e) {
            const items = suggestionBox.querySelectorAll('div');
            if (suggestionBox.style.display === 'block' && lastFeatures.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedSuggestionIndex = (selectedSuggestionIndex + 1) % lastFeatures.length;
                    updateSuggestionHighlight();
                    items[selectedSuggestionIndex]?.scrollIntoView({block: 'nearest'});
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedSuggestionIndex = (selectedSuggestionIndex - 1 + lastFeatures.length) % lastFeatures.length;
                    updateSuggestionHighlight();
                    items[selectedSuggestionIndex]?.scrollIntoView({block: 'nearest'});
                } else if (e.key === 'Enter') {
                    if (selectedSuggestionIndex >= 0) {
                        e.preventDefault();
                        selectSuggestion(lastFeatures[selectedSuggestionIndex]);
                    } else {
                        selectSuggestion(lastFeatures[0]);
                    }
                }
            }
        });
        // Suggestiebox verbergen bij verlies van focus
        input.addEventListener('blur', () => setTimeout(() => {
            suggestionBox.style.display = 'none';
            setSearchLineRadius(false);
        }, 200));
        input.addEventListener('focus', () => { if (suggestionBox.innerHTML) suggestionBox.style.display = 'block'; });

        // Focus/click: focus mainMap op corresponderende marker
        input.addEventListener('focus', function() {
            focusMainMapOnInput(input);
        });
        input.addEventListener('click', function() {
            focusMainMapOnInput(input);
            // Selecteer de hele tekst in het inputveld
            setTimeout(() => { input.select(); }, 0);
        });
    });
}

// Controleer na elke input of het veld leeg is en verwijder dan de marker
function setupInputEmptyCheck() {
    document.querySelectorAll('.search-line input[type="search"], .search-line input[type="text"]').forEach(input => {
        input.addEventListener('input', function() {
            if (!input.value.trim()) {
                // Verwijder marker op mainMap
                if (inputMarkers.has(input)) {
                    inputMarkers.get(input).remove();
                    inputMarkers.delete(input);
                }
                // Verwijder marker op miniMap
                if (miniMapMarkers.has(input)) {
                    miniMapMarkers.get(input).remove();
                    miniMapMarkers.delete(input);
                }
                updateRouteLine();
            }
        });
    });
}

// Initialiseer autocomplete na DOM load
window.addEventListener('DOMContentLoaded', function() {
    setupAutocompleteForSearchLines();
    setupClearButtons();
    setupInputEmptyCheck();

    // Zoom controls mainMap
    const zoomInBtn = document.getElementById('mainMap-zoom-in');
    const zoomOutBtn = document.getElementById('mainMap-zoom-out');
    if (zoomInBtn && zoomOutBtn && window.mainMap) {
        zoomInBtn.onclick = () => window.mainMap.zoomTo(window.mainMap.getZoom() + 1, {duration: 400});
        zoomOutBtn.onclick = () => window.mainMap.zoomTo(window.mainMap.getZoom() - 1, {duration: 400});
    }
});

miniMap.scrollZoom.disable();
miniMap.boxZoom.disable();
miniMap.dragRotate.disable();
miniMap.dragPan.disable();
miniMap.keyboard.disable();
miniMap.doubleClickZoom.disable();
miniMap.touchZoomRotate.disable();

    setupAutocompleteForSearchLines();
    setupClearButtons();
    setupInputEmptyCheck();