let classifier;
const imageUpload = document.getElementById('imageUpload');
const uploadedImage = document.getElementById('uploadedImage');
const classifyBtn = document.getElementById('classifyBtn');
const resultText = document.getElementById('classificationText');
const chartCanvas = document.getElementById('resultChart');

imageUpload.addEventListener('change', handleImageUpload);
classifyBtn.addEventListener('click', classifyImage);

// Modell laden
ml5.imageClassifier('MobileNet')
  .then(model => {
    classifier = model;
    console.log('Modell geladen');
  })
  .catch(err => console.error('Fehler beim Laden:', err));

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    uploadedImage.src = URL.createObjectURL(file);
  }
}

function classifyImage() {
  if (!classifier || !uploadedImage.src) return;

  classifier.classify(uploadedImage, (err, results) => {
    if (err) return console.error(err);
    renderResults(results);
  });
}

function renderResults(results) {
  const labels = results.map(r => r.label);
  const confidences = results.map(r => (r.confidence * 100).toFixed(2));

  resultText.innerHTML = results
    .map(r => `<p><strong>${r.label}:</strong> ${ (r.confidence * 100).toFixed(2) }%</p>`)
    .join('');

  new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Confidence (%)',
        data: confidences,
        backgroundColor: '#007acc'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}