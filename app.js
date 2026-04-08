const video = document.getElementById('video');
const canvas = document.getElementById('photoCanvas');
const captureBtn = document.getElementById('captureBtn');
const photoPreview = document.getElementById('photoPreview');
const resultArea = document.getElementById('resultArea');
const locationSelect = document.getElementById('locationSelect');
const newLocationInput = document.getElementById('newLocation');
const flashOverlay = document.getElementById('flashOverlay');

let currentStream = null;
let useFrontCamera = false;

// Estructura de ubicaciones por grupos con colores asignados
const defaultGroups = [
    { label: "Clinique", color: "grp-gray", items: ["Ascenseur 1", "RC"] },
    { label: "Jean-Coutu", color: "grp-pink", items: ["RC", "Ascenseur 1", "Ascenseur 2"] },
    { label: "Sporting Life", color: "grp-pink", items: ["RC", "Ascenseur 1", "Ascenseur 2"] },
    { label: "Siam", color: "grp-orange", items: ["Ascenseur 1", "Ascenseur 2"] },
    { label: "Huston Orange", color: "grp-orange", items: ["Ascenseur 1"] },
    { label: "Banque National", color: "grp-red", items: ["Ascenseur 1", "Ascenseur 2", "RC 1", "RC 2"] },
    { label: "Hôtel Escad", color: "grp-blue", items: ["RC", "Ascenseur 1", "Ascenseur 2"] },
    { label: "Apple & Pottery", color: "grp-blue", items: ["RC", "Ascenseur 1"] },
    { label: "Mon Coco 2e", color: "grp-yellow", items: ["Zamboni"] },
    { label: "Mon Coco RC 1", color: "grp-yellow", items: ["Ascenseur 1", "Ascenseur 2", "RC (A)", "RC (B)", "RC (C)"] },
    { label: "Mon Coco RC 2", color: "grp-yellow", items: ["RC (A)", "RC (B)"] },
    { label: "Huston", color: "grp-gray", items: ["RC"] }
];

// Cargar personalizadas de localStorage
let customLocations = JSON.parse(localStorage.getItem('work_custom_locs_v5')) || [];

// Iniciar cámara
async function startCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            facingMode: useFrontCamera ? "user" : "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        },
        audio: false
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
    } catch (err) {
        console.error("Error cam:", err);
        alert("Error al activar la cámara. Revisa los permisos.");
    }
}

function switchCamera() {
    useFrontCamera = !useFrontCamera;
    startCamera();
}

function renderLocations() {
    let html = '';
    
    // Renderizar grupos predeterminados con clases de color
    defaultGroups.forEach(group => {
        html += `<optgroup label="${group.label}" class="${group.color}">`;
        group.items.forEach(item => {
            html += `<option value="${group.label} - ${item}" class="text-white bg-slate-800">${item}</option>`;
        });
        html += `</optgroup>`;
    });

    // Renderizar grupo de personalizadas si existen
    if (customLocations.length > 0) {
        html += `<optgroup label="Especiales" class="text-slate-400">`;
        customLocations.forEach(loc => {
            html += `<option value="${loc}">${loc}</option>`;
        });
        html += `</optgroup>`;
    }

    locationSelect.innerHTML = html;
}

function addLocation() {
    const val = newLocationInput.value.trim();
    if (val) {
        customLocations.unshift(val);
        localStorage.setItem('work_custom_locs_v5', JSON.stringify(customLocations));
        renderLocations();
        newLocationInput.value = '';
        locationSelect.selectedIndex = locationSelect.options.length - 1;
    }
}

// Efecto de captura
captureBtn.onclick = () => {
    if (navigator.vibrate) navigator.vibrate(50);

    flashOverlay.classList.add('flash');
    setTimeout(() => flashOverlay.classList.remove('flash'), 200);

    const ctx = canvas.getContext('2d');
    const locText = locationSelect.value;

    // Configurar tamaño según el video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Diseño del Sello mejorado
    const padding = canvas.width * 0.04;
    const fontSize = canvas.width * 0.05;

    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    const textWidth = ctx.measureText(locText).width;

    const rectW = textWidth + (padding * 2);
    const rectH = fontSize + (padding * 1.5);
    const x = padding;
    const y = canvas.height - rectH - padding;

    // Dibujar fondo del sello
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, rectW, rectH, 12);
        ctx.fill();
    } else {
        ctx.fillRect(x, y, rectW, rectH);
    }

    // Dibujar Texto
    ctx.fillStyle = "#ffffff";
    ctx.fillText(locText, x + padding, y + (fontSize * 1.05));

    // Mostrar el resultado final
    photoPreview.src = canvas.toDataURL('image/jpeg', 0.85);
    resultArea.classList.remove('hidden');
};

function resetCamera() {
    resultArea.classList.add('hidden');
}

async function sharePhoto() {
    try {
        const response = await fetch(photoPreview.src);
        const blob = await response.blob();
        const file = new File([blob], `Reporte.jpg`, { type: 'image/jpeg' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            // Se eliminó el parámetro 'text' para no enviar mensaje redundante por WhatsApp
            await navigator.share({
                files: [file],
                title: 'Foto de Trabajo'
            });
        } else {
            downloadPhoto();
            alert("Se guardó en tu galería para que la adjuntes manualmente.");
        }
    } catch (err) {
        console.error("Error al compartir:", err);
    }
}

function downloadPhoto() {
    const link = document.createElement('a');
    link.download = `FOTO_${locationSelect.value.replace(/[^a-z0-9]/gi, '_')}.jpg`;
    link.href = photoPreview.src;
    link.click();
}

window.onload = () => {
    startCamera();
    renderLocations();
};
