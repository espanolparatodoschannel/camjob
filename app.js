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
let locations = JSON.parse(localStorage.getItem('work_locations_v4')) || ["Entrada Principal", "Zona de Carga", "Bodega Norte", "Oficina Supervisión"];

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
    locationSelect.innerHTML = locations.map(loc => `<option value="${loc}">${loc}</option>`).join('');
    localStorage.setItem('work_locations_v4', JSON.stringify(locations));
}

function addLocation() {
    const val = newLocationInput.value.trim();
    if (val) {
        locations.unshift(val);
        renderLocations();
        newLocationInput.value = '';
        locationSelect.selectedIndex = 0;
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

    // Diseño del Sello solo con Ubicación
    const padding = canvas.width * 0.04;
    const fontSize = canvas.width * 0.055;

    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    const textWidth = ctx.measureText(locText).width;

    const rectW = textWidth + (padding * 2);
    const rectH = fontSize + (padding * 1.5);
    const x = padding;
    const y = canvas.height - rectH - padding;

    // Dibujar fondo del sello
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, rectW, rectH, 15);
        ctx.fill();
    } else {
        ctx.fillRect(x, y, rectW, rectH);
    }

    // Dibujar Texto: Solo Ubicación
    ctx.fillStyle = "#ffffff";
    ctx.fillText(locText, x + padding, y + fontSize);

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
            await navigator.share({
                files: [file],
                title: 'Foto de Trabajo',
                text: `Ubicación: ${locationSelect.value}`
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
    link.download = `FOTO_${locationSelect.value}.jpg`;
    link.href = photoPreview.src;
    link.click();
}

window.onload = () => {
    startCamera();
    renderLocations();
};
