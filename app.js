const video = document.getElementById('video');
const canvas = document.getElementById('photoCanvas');
const captureBtn = document.getElementById('captureBtn');
const photoPreview = document.getElementById('photoPreview');
const resultArea = document.getElementById('resultArea');
const newLocationInput = document.getElementById('newLocation');
const flashOverlay = document.getElementById('flashOverlay');

// Elementos del selector custom
const selectorTrigger = document.getElementById('selectorTrigger');
const selectedLabel = document.getElementById('selectedLabel');
const selectedColorDot = document.getElementById('selectedColorDot');
const previewDot = document.getElementById('previewDot');
const selectorPanel = document.getElementById('selectorPanel');
const sheetContent = document.getElementById('sheetContent');
const groupsList = document.getElementById('groupsList');

let currentStream = null;
let useFrontCamera = false;

// Configuración de ubicaciones y colores HEX para el estampado
const defaultGroups = [
    { label: "Clinique", color: "#94a3b8", dotClass: "dot-gray", items: ["Ascenseur 1", "RC"] },
    { label: "Jean-Coutu", color: "#ff00ff", dotClass: "dot-pink", items: ["RC", "Ascenseur 1", "Ascenseur 2"] },
    { label: "Sporting Life", color: "#ff00ff", dotClass: "dot-pink", items: ["RC", "Ascenseur 1", "Ascenseur 2"] },
    { label: "Siam", color: "#fb923c", dotClass: "dot-orange", items: ["Ascenseur 1", "Ascenseur 2"] },
    { label: "Huston Orange", color: "#fb923c", dotClass: "dot-orange", items: ["Ascenseur 1"] },
    { label: "Banque National", color: "#ef4444", dotClass: "dot-red", items: ["Ascenseur 1", "Ascenseur 2", "RC 1", "RC 2"] },
    { label: "Hôtel Escad", color: "#3b82f6", dotClass: "dot-blue", items: ["RC", "Ascenseur 1", "Ascenseur 2"] },
    { label: "Apple & Pottery", color: "#3b82f6", dotClass: "dot-blue", items: ["RC", "Ascenseur 1"] },
    { label: "Mon Coco 2e", color: "#facc15", dotClass: "dot-yellow", items: ["Zamboni"] },
    { label: "Mon Coco RC 1", color: "#facc15", dotClass: "dot-yellow", items: ["Ascenseur 1", "Ascenseur 2", "RC (A)", "RC (B)", "RC (C)"] },
    { label: "Mon Coco RC 2", color: "#facc15", dotClass: "dot-yellow", items: ["RC (A)", "RC (B)"] },
    { label: "Huston", color: "#94a3b8", dotClass: "dot-gray", items: ["RC"] }
];

let customLocations = JSON.parse(localStorage.getItem('work_custom_locs_v6')) || [];
let currentSelection = {
    group: defaultGroups[0].label,
    item: defaultGroups[0].items[0],
    color: defaultGroups[0].color,
    dotClass: defaultGroups[0].dotClass
};

// Iniciar cámara
async function startCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    const constraints = {
        video: { facingMode: useFrontCamera ? "user" : "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
    };
    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
    } catch (err) { alert("Permisos de cámara denegados."); }
}

function switchCamera() {
    useFrontCamera = !useFrontCamera;
    startCamera();
}

// Lógica del Selector
function openSelector() {
    selectorPanel.classList.remove('hidden');
    setTimeout(() => sheetContent.classList.add('sheet-open'), 10);
}

function closeSelector() {
    sheetContent.classList.remove('sheet-open');
    setTimeout(() => selectorPanel.classList.add('hidden'), 300);
}

function selectLocation(group, item, color, dotClass) {
    currentSelection = { group, item, color, dotClass };
    selectedLabel.innerText = `${group} - ${item}`;
    selectedColorDot.className = `dot ${dotClass}`;
    previewDot.className = `w-3 h-3 rounded-full ${dotClass}`;
    closeSelector();
}

function renderSelector() {
    let html = '';
    defaultGroups.forEach(g => {
        html += `<div class="group-header" style="color:${g.color}">
                    <div class="dot ${g.dotClass}"></div>${g.label}
                 </div>`;
        g.items.forEach(i => {
            html += `<div class="location-item" onclick="selectLocation('${g.label}', '${i}', '${g.color}', '${g.dotClass}')">
                        <span>${i}</span>
                        <div class="text-slate-600 text-xs">Seleccionar</div>
                    </div>`;
        });
    });

    if (customLocations.length > 0) {
        html += `<div class="group-header text-slate-400">📍 Especiales</div>`;
        customLocations.forEach(loc => {
            html += `<div class="location-item" onclick="selectLocation('Especial', '${loc}', '#94a3b8', 'dot-gray')">
                        <span>${loc}</span>
                    </div>`;
        });
    }
    groupsList.innerHTML = html;
}

function addLocation() {
    const val = newLocationInput.value.trim();
    if (val) {
        customLocations.unshift(val);
        localStorage.setItem('work_custom_locs_v6', JSON.stringify(customLocations));
        renderSelector();
        newLocationInput.value = '';
        selectLocation('Especial', val, '#94a3b8', 'dot-gray');
    }
}

// CAPTURA Y ESTAMPADO
captureBtn.onclick = () => {
    if (navigator.vibrate) navigator.vibrate(60);
    flashOverlay.classList.add('flash');
    setTimeout(() => flashOverlay.classList.remove('flash'), 150);

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const locText = `${currentSelection.group} - ${currentSelection.item}`;
    
    // Diseño del sello
    const padding = canvas.width * 0.04;
    const fontSize = canvas.width * 0.045;
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    
    const circleRadius = fontSize * 0.35;
    const textMetrics = ctx.measureText(locText);
    const rectW = textMetrics.width + (padding * 2.5) + (circleRadius * 2);
    const rectH = fontSize * 1.8;
    
    const x = padding;
    const y = canvas.height - rectH - padding;

    // Fondo
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, rectW, rectH, 15);
        ctx.fill();
    } else {
        ctx.fillRect(x, y, rectW, rectH);
    }

    // Dibujar CÍRCULO de color (Fucsia, Azul, etc)
    const circleX = x + padding + circleRadius;
    const circleY = y + (rectH / 2);
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = currentSelection.color;
    ctx.fill();

    // Dibujar Texto
    ctx.fillStyle = "white";
    ctx.fillText(locText, circleX + circleRadius + (padding * 0.5), y + (fontSize * 1.25));

    photoPreview.src = canvas.toDataURL('image/jpeg', 0.85);
    resultArea.classList.remove('hidden');
};

function resetCamera() { resultArea.classList.add('hidden'); }

async function sharePhoto() {
    try {
        const response = await fetch(photoPreview.src);
        const blob = await response.blob();
        const file = new File([blob], `Reporte_${Date.now()}.jpg`, { type: 'image/jpeg' });
        if (navigator.share) {
            await navigator.share({ files: [file], title: 'Foto de Trabajo' });
        } else {
            downloadPhoto();
        }
    } catch (e) { alert("Error al compartir."); }
}

function downloadPhoto() {
    const link = document.createElement('a');
    link.download = `IMG_${Date.now()}.jpg`;
    link.href = photoPreview.src;
    link.click();
}

window.onload = () => {
    startCamera();
    renderSelector();
    selectLocation(defaultGroups[0].label, defaultGroups[0].items[0], defaultGroups[0].color, defaultGroups[0].dotClass);
};
