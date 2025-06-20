
function calculate() {
  const price = parseFloat(document.getElementById("purchasePrice").value) || 0;
  const waste = parseFloat(document.getElementById("waste").value) || 0;
  const laborHours = parseFloat(document.getElementById("laborHours").value) || 0;
  const laborCost = parseFloat(document.getElementById("laborCost").value) || 0;
  const box = parseFloat(document.getElementById("boxCost").value) || 0;
  const bag = parseFloat(document.getElementById("bagCost").value) || 0;
  const distance = parseFloat(document.getElementById("distance").value) || 0;
  const fuel = parseFloat(document.getElementById("fuelCost").value) || 0;
  const tolls = parseFloat(document.getElementById("tolls").value) || 0;
  const ice = parseFloat(document.getElementById("icePercent").value) || 0;
  const profit = parseFloat(document.getElementById("profitMargin").value) || 0;

  const cleanCost = price / (1 - waste / 100);
  const transport = distance * fuel + tolls;
  const totalCost = cleanCost + laborHours * laborCost + box + bag + (ice / 100) + transport;
  const finalPrice = totalCost * (1 + profit / 100);
  const gain = finalPrice - totalCost;

  let color = gain < 0 ? "red" : gain < 0.5 ? "orange" : "blue";

  document.getElementById("result").innerHTML = `
    <p><strong>Συνολικό Κόστος:</strong> ${totalCost.toFixed(2)} €</p>
    <p><strong>Τελική Τιμή Πώλησης:</strong> ${finalPrice.toFixed(2)} €</p>
    <p style="color:${color}"><strong>${gain >= 0 ? "Κέρδος" : "Ζημιά"} ανά κιλό:</strong> ${gain.toFixed(2)} €</p>
  `;

  renderChart(totalCost);
}

function renderChart(cost) {
  const ctx = document.getElementById('chart').getContext('2d');
  if (window.chartInstance) window.chartInstance.destroy();
  const data = [];
  const labels = [];
  for (let p = 0; p <= 100; p += 5) {
    const price = cost * (1 + p / 100);
    data.push(price - cost);
    labels.push(p + "%");
  }
  window.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Κέρδος ανά κιλό (€)',
        data: data,
        fill: true,
        borderColor: 'blue',
        backgroundColor: 'rgba(0,123,255,0.2)'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
