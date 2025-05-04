let classifier;
let previewImg;

window.addEventListener('DOMContentLoaded', async () => {
  classifier = await ml5.imageClassifier('MobileNet');
  console.log('✅ Modell geladen');

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

    showLoadingIndicator(imgObj.canvas);

    try {
      const results = await classifier.classify(img);
      console.log(`✅ Ergebnisse für ${imgObj.id}:`, results);
      createChart(imgObj.canvas, results.slice(0, 3));
    } catch (error) {
      console.error(`❌ Fehler bei ${imgObj.id}:`, error);
    }
  });

  await Promise.all(promises); // Warte auf alle
}


function createChart(canvasId, results) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  cancelAnimationFrame(ctx._loadingFrame || 0);
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

function setupUploadHandler() {
  const input = document.getElementById('fileElem');
  const previewArea = document.getElementById('preview-area');

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleFile(file);
  });

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      previewArea.innerHTML = '';
      previewImg = new Image();
      previewImg.src = event.target.result;
      previewImg.classList.add('classify-image');
      previewArea.appendChild(previewImg);

      // 👉 Drop-Zone ausblenden
      ///document.getElementById('drop-zone').classList.add('hidden');

      // Klassifizieren, sobald Bild geladen
      previewImg.onload = async () => {
        try {
          const results = await classifier.classify(previewImg);
          console.log('✅ Upload-Ergebnis:', results);

          const chartCanvas = document.createElement('canvas');
          chartCanvas.id = 'userChart';
          previewArea.appendChild(chartCanvas);

          createChart('userChart', results.slice(0, 3));
        } catch (err) {
          console.error('❌ Fehler bei Klassifikation:', err);
        }
      };
    };
    reader.readAsDataURL(file);
  }
}

function setupDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('fileElem');

  // Drag-Events
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

  // Drop-Event
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      fileInput.files = e.dataTransfer.files;
      const event = new Event('change');
      fileInput.dispatchEvent(event); // Löst Upload-Handler aus
    }
  });

  // Klick auf Drop-Zone = Klick auf File Input
  dropZone.addEventListener('click', () => fileInput.click());
}

function showLoadingIndicator(canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  let angle = 0;

  const radius = 30;
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  function draw() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, angle, angle + Math.PI * 1.5);
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    angle += 0.1;
    if (angle > Math.PI * 2) angle = 0;

    ctx._loadingFrame = requestAnimationFrame(draw);
  }

  draw();
}
