let classifier;
let previewImg;

window.addEventListener('DOMContentLoaded', async () => {
  classifier = await ml5.imageClassifier('MobileNet');
  console.log('Modell geladen');

  classifyExampleImages();
  setupUploadHandler();
  setupDragAndDrop();
});

const exampleImages = [
  { id: 'img-0', canvas: 'chart-0' },
  { id: 'img-1', canvas: 'chart-1' },
  { id: 'img-2', canvas: 'chart-2' },
  { id: 'img-3', canvas: 'chart-3' },
  { id: 'img-4', canvas: 'chart-4' },
  { id: 'img-5', canvas: 'chart-5' },
];

async function classifyExampleImages() {
  const promises = exampleImages.map(async (imgObj) => {
    const img = document.getElementById(imgObj.id);
    if (!img) {
      console.warn(`⚠️ Bild ${imgObj.id} nicht gefunden.`);
      return;
    }

    showCircularSpinner(imgObj.canvas);

    try {
      const results = await classifier.classify(img);
      console.log(`Ergebnisse für ${imgObj.id}:`, results);
      createChart(imgObj.canvas, results.slice(0, 3));
    } catch (error) {
      console.error(`Fehler bei ${imgObj.id}:`, error);
    }
  });

  await Promise.all(promises); // Warte auf alle
}


function createChart(canvasId, results) {
  hideLoadingIndicator(canvasId);  // 🔁 HIER wird der Spinner gestoppt

  const ctx = document.getElementById(canvasId).getContext('2d');
  cancelAnimationFrame(ctx._loadingFrame || 0); // Falls du auch AnimationFrames benutzt hast
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: results.map((r) => r.label.split(',')[0].trim()),
      datasets: [{
        label: 'Confidence',
        data: results.map(r => r.confidence),
        backgroundColor: [
          'hsl(110, 90.80%, 38.40%)',
          'rgb(118, 56, 244)',
          'rgba(255, 160, 64, 0.92)',
        ],
        borderColor: [
          'hsl(110, 91.40%, 18.20%)',
          'rgb(65, 34, 128)',
          'rgba(160, 102, 44, 0.92)',
        ],
        borderWidth: 3,
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
        },
        legend: {
          labels: {
            font: {
              size: 14,
              weight: 'bold',
            },
            color: 'rgba(0, 0, 0, 0.8)',
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 1,
          ticks: {
            stepSize: 0.2,
            font: {
              size: 14,
              family: 'Arial, sans-serif',
            },
          },
        },
        x: {
          ticks: {
            font: {
              size: 14,
              family: 'Arial, sans-serif',
            },
          },
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuad',
      },
    },
  });
}


function isValidImageFile(file) {
  return file && file.type.startsWith('image/');
}

function setupUploadHandler() {
  const input = document.getElementById('fileElem');
  const previewArea = document.getElementById('preview-area');
  const errorElem = document.getElementById('upload-error');

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      showError('❌ Ungültiges Format. Bitte lade ein Bild hoch (z. B. JPG, PNG, GIF, BMP, WebP).');
      input.value = ''; // Reset für erneutes Hochladen
      return;
    }

    errorElem.textContent = '';
    handleFile(file);
  });

  async function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      previewArea.innerHTML = '';
      previewImg = new Image();
      previewImg.src = event.target.result;
      previewImg.classList.add('classify-image');
      previewArea.appendChild(previewImg);

      previewImg.onload = async () => {
        try {
          const results = await classifier.classify(previewImg);
          console.log('Upload-Ergebnis:', results);

          const chartCanvas = document.createElement('canvas');
          chartCanvas.id = 'userChart';
          previewArea.appendChild(chartCanvas);

          createChart('userChart', results.slice(0, 3));
        } catch (err) {
          console.error('Fehler bei Klassifikation:', err);
          showError('❌ Fehler bei der Klassifikation.');
        }
      };
    };
    reader.readAsDataURL(file);
  }

  function showError(message) {
    errorElem.textContent = message;
    setTimeout(() => {
      errorElem.textContent = '';
    }, 5000);
  }
}


function setupDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('fileElem');
  const errorElem = document.getElementById('upload-error');

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      errorElem.textContent = '❌ Ungültiges Format. Bitte ziehe ein Bild (JPG, PNG, etc.) in die Dropzone.';
      setTimeout(() => errorElem.textContent = '', 5000);
      return;
    }

    errorElem.textContent = '';
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  });

  dropZone.addEventListener('click', () => fileInput.click());
}



function showCircularSpinner(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const radius = 30;
  let angle = 0;

  const interval = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);

    for (let i = 0; i < 12; i++) {
      const alpha = i / 12;
      ctx.beginPath();
      ctx.arc(0, -radius, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(79, 70, 229, ${alpha})`;
      ctx.fill();
      ctx.rotate((Math.PI * 2) / 12);
    }

    ctx.restore();
    angle += 0.1;
  }, 50);

  canvas.dataset.loadingInterval = interval;
}

function hideLoadingIndicator(canvasId) {
  const canvas = document.getElementById(canvasId);
  const interval = canvas.dataset.loadingInterval;
  if (interval) {
    clearInterval(interval);
    delete canvas.dataset.loadingInterval;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}



