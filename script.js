// Παγκόσμιες μεταβλητές
let chartInstances = {};
let savedTemplates = JSON.parse(localStorage.getItem('costTemplates')) || {};
let currentCalculation = null;

// Αρχικοποίηση
document.addEventListener('DOMContentLoaded', function() {
    loadDefaultValues();
    updateAllSliderValues();
});

// Διαχείριση tabs
function showTab(tabName) {
    // Απόκρυψη όλων των tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Εμφάνιση επιλεγμένου tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Ενημέρωση slider values
function updateSliderValue(type, value) {
    document.getElementById(type + 'Value').textContent = value + '%';
    document.getElementById(type + (type === 'profit' ? 'Margin' : type === 'waste' ? '' : 'Percent')).value = value;
}

function updateAllSliderValues() {
    const sliders = ['waste', 'ice', 'profit'];
    sliders.forEach(slider => {
        const sliderElement = document.getElementById(slider + 'Slider');
        if (sliderElement) {
            updateSliderValue(slider, sliderElement.value);
        }
    });
}

// Σενάρια τιμολόγησης
function setScenario(scenario) {
    const scenarios = {
        conservative: 15,
        balanced: 25,
        aggressive: 40
    };
    
    const profitSlider = document.getElementById('profitSlider');
    profitSlider.value = scenarios[scenario];
    updateSliderValue('profit', scenarios[scenario]);
    
    // Ενημέρωση UI
    document.querySelectorAll('.btn-scenario').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = '#666';
    });
    event.target.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    event.target.style.color = 'white';
}

// Κύριος υπολογισμός
function calculate() {
    const data = collectFormData();
    const results = performCalculations(data);
    
    currentCalculation = { data, results };
    displayResults(results);
    renderCharts(results, data);
    analyzeCompetitors(results);
    
    // Εμφάνιση αποτελεσμάτων
    document.getElementById('result').classList.add('show');
    
    // Smooth scroll στα αποτελέσματα
    document.getElementById('result').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function collectFormData() {
    return {
        productName: document.getElementById('productName').value || 'Προϊόν',
        purchasePrice: parseFloat(document.getElementById('purchasePrice').value) || 0,
        quantity: parseFloat(document.getElementById('quantity').value) || 1,
        waste: parseFloat(document.getElementById('waste').value) || 0,
        laborHours: parseFloat(document.getElementById('laborHours').value) || 0,
        laborCost: parseFloat(document.getElementById('laborCost').value) || 0,
        boxCost: parseFloat(document.getElementById('boxCost').value) || 0,
        bagCost: parseFloat(document.getElementById('bagCost').value) || 0,
        icePercent: parseFloat(document.getElementById('icePercent').value) || 0,
        distance: parseFloat(document.getElementById('distance').value) || 0,
        fuelCost: parseFloat(document.getElementById('fuelCost').value) || 0,
        tolls: parseFloat(document.getElementById('tolls').value) || 0,
        parkingCost: parseFloat(document.getElementById('parkingCost').value) || 0,
        electricityCost: parseFloat(document.getElementById('electricityCost').value) || 0,
        equipmentCost: parseFloat(document.getElementById('equipmentCost').value) || 0,
        insuranceCost: parseFloat(document.getElementById('insuranceCost').value) || 0,
        profitMargin: parseFloat(document.getElementById('profitMargin').value) || 0
    };
}

function performCalculations(data) {
    // Βασικοί υπολογισμοί
    const cleanCost = data.purchasePrice / (1 - data.waste / 100);
    const laborTotal = data.laborHours * data.laborCost;
    const packagingCost = data.boxCost + data.bagCost;
    const iceCost = (data.icePercent / 100) * data.purchasePrice;
    const transportCost = (data.distance * data.fuelCost) + data.tolls + data.parkingCost;
    const additionalCosts = data.electricityCost + data.equipmentCost + data.insuranceCost;
    
    const totalCostPerKg = cleanCost + laborTotal + packagingCost + iceCost + transportCost + additionalCosts;
    const totalCostForQuantity = totalCostPerKg * data.quantity;
    
    const finalPricePerKg = totalCostPerKg * (1 + data.profitMargin / 100);
    const finalPriceForQuantity = finalPricePerKg * data.quantity;
    
    const profitPerKg = finalPricePerKg - totalCostPerKg;
    const profitForQuantity = finalPriceForQuantity - totalCostForQuantity;
    
    const profitMarginActual = (profitPerKg / totalCostPerKg) * 100;
    
    return {
        cleanCost,
        laborTotal,
        packagingCost,
        iceCost,
        transportCost,
        additionalCosts,
        totalCostPerKg,
        totalCostForQuantity,
        finalPricePerKg,
        finalPriceForQuantity,
        profitPerKg,
        profitForQuantity,
        profitMarginActual,
        breakdown: {
            'Καθαρό Κόστος Προϊόντος': cleanCost,
            'Εργασία': laborTotal,
            'Συσκευασία': packagingCost,
            'Πάγος': iceCost,
            'Μεταφορά': transportCost,
            'Επιπλέον Κόστη': additionalCosts
        }
    };
}

function displayResults(results) {
    const profitClass = results.profitPerKg >= 0 ? 'profit' : 'loss';
    const profitIcon = results.profitPerKg >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    document.getElementById('result').innerHTML = `
        <h3><i class="fas fa-chart-bar"></i> Αποτελέσματα Κοστολόγησης</h3>
        
        <div class="result-grid">
            <div class="result-card">
                <div class="result-label">Συνολικό Κόστος/κιλό</div>
                <div class="result-value">${results.totalCostPerKg.toFixed(2)}€</div>
            </div>
            
            <div class="result-card">
                <div class="result-label">Τελική Τιμή/κιλό</div>
                <div class="result-value">${results.finalPricePerKg.toFixed(2)}€</div>
            </div>
            
            <div class="result-card ${profitClass}">
                <div class="result-label">${results.profitPerKg >= 0 ? 'Κέρδος' : 'Ζημιά'}/κιλό</div>
                <div class="result-value">
                    <i class="fas ${profitIcon}"></i> ${results.profitPerKg.toFixed(2)}€
                </div>
            </div>
            
            <div class="result-card">
                <div class="result-label">Περιθώριο Κέρδους</div>
                <div class="result-value">${results.profitMarginActual.toFixed(1)}%</div>
            </div>
        </div>
        
        <div class="result-summary">
            <h4><i class="fas fa-info-circle"></i> Λεπτομερής Ανάλυση</h4>
            <div class="breakdown-grid">
                ${Object.entries(results.breakdown).map(([key, value]) => `
                    <div class="breakdown-item">
                        <span class="breakdown-label">${key}:</span>
                        <span class="breakdown-value">${value.toFixed(2)}€</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="recommendations">
            <h4><i class="fas fa-lightbulb"></i> Συστάσεις</h4>
            ${generateRecommendations(results)}
        </div>
    `;
}

function generateRecommendations(results) {
    const recommendations = [];
    
    if (results.profitMarginActual < 15) {
        recommendations.push('<div class="recommendation warning"><i class="fas fa-exclamation-triangle"></i> Το περιθώριο κέρδους είναι χαμηλό. Σκεφτείτε αύξηση τιμής ή μείωση κόστους.</div>');
    }
    
    if (results.profitMarginActual > 50) {
        recommendations.push('<div class="recommendation success"><i class="fas fa-check-circle"></i> Εξαιρετικό περιθώριο κέρδους! Μπορείτε να είστε ανταγωνιστικοί στην τιμή.</div>');
    }
    
    if (results.breakdown['Μεταφορά'] > results.totalCostPerKg * 0.2) {
        recommendations.push('<div class="recommendation info"><i class="fas fa-truck"></i> Το κόστος μεταφοράς είναι υψηλό. Εξετάστε βελτιστοποίηση διαδρομών.</div>');
    }
    
    if (results.breakdown['Εργασία'] > results.totalCostPerKg * 0.3) {
        recommendations.push('<div class="recommendation info"><i class="fas fa-users"></i> Το κόστος εργασίας είναι σημαντικό. Εξετάστε αυτοματοποίηση διαδικασιών.</div>');
    }
    
    return recommendations.length > 0 ? recommendations.join('') : '<div class="recommendation success"><i class="fas fa-thumbs-up"></i> Η κοστολόγηση φαίνεται ισορροπημένη!</div>';
}

function renderCharts(results, data) {
    renderProfitChart(results);
    renderCostBreakdownChart(results);
}

function renderProfitChart(results) {
    const ctx = document.getElementById('profitChart').getContext('2d');
    
    if (chartInstances.profit) {
        chartInstances.profit.destroy();
    }
    
    const margins = [];
    const profits = [];
    const labels = [];
    
    for (let margin = 0; margin <= 60; margin += 5) {
        const price = results.totalCostPerKg * (1 + margin / 100);
        const profit = price - results.totalCostPerKg;
        margins.push(margin);
        profits.push(profit);
        labels.push(margin + '%');
    }
    
    chartInstances.profit = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Κέρδος ανά κιλό (€)',
                data: profits,
                borderColor: 'rgb(102, 126, 234)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(102, 126, 234)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ανάλυση Κέρδους ανά Περιθώριο',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Κέρδος (€)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Περιθώριο Κέρδους (%)'
                    }
                }
            }
        }
    });
}

function renderCostBreakdownChart(results) {
    const ctx = document.getElementById('costBreakdownChart').getContext('2d');
    
    if (chartInstances.breakdown) {
        chartInstances.breakdown.destroy();
    }
    
    const labels = Object.keys(results.breakdown);
    const data = Object.values(results.breakdown);
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    
    chartInstances.breakdown = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ανάλυση Κόστους',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed / results.totalCostPerKg) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed.toFixed(2)}€ (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function analyzeCompetitors(results) {
    const competitor1 = parseFloat(document.getElementById('competitor1').value) || 0;
    const competitor2 = parseFloat(document.getElementById('competitor2').value) || 0;
    
    if (competitor1 === 0 && competitor2 === 0) {
        document.getElementById('competitorAnalysis').innerHTML = '';
        return;
    }
    
    let analysis = '<div class="competitor-comparison">';
    
    if (competitor1 > 0) {
        const diff1 = results.finalPricePerKg - competitor1;
        const percentage1 = ((diff1 / competitor1) * 100).toFixed(1);
        const status1 = diff1 > 0 ? 'ακριβότερη' : 'φθηνότερη';
        const color1 = diff1 > 0 ? '#dc3545' : '#28a745';
        
        analysis += `
            <div class="competitor-card">
                <h5>Ανταγωνιστής 1</h5>
                <div class="competitor-price">${competitor1.toFixed(2)}€</div>
                <div class="competitor-diff" style="color: ${color1}">
                    ${Math.abs(diff1).toFixed(2)}€ ${status1} (${Math.abs(percentage1)}%)
                </div>
            </div>
        `;
    }
    
    if (competitor2 > 0) {
        const diff2 = results.finalPricePerKg - competitor2;
        const percentage2 = ((diff2 / competitor2) * 100).toFixed(1);
        const status2 = diff2 > 0 ? 'ακριβότερη' : 'φθηνότερη';
        const color2 = diff2 > 0 ? '#dc3545' : '#28a745';
        
        analysis += `
            <div class="competitor-card">
                <h5>Ανταγωνιστής 2</h5>
                <div class="competitor-price">${competitor2.toFixed(2)}€</div>
                <div class="competitor-diff" style="color: ${color2}">
                    ${Math.abs(diff2).toFixed(2)}€ ${status2} (${Math.abs(percentage2)}%)
                </div>
            </div>
        `;
    }
    
    analysis += '</div>';
    document.getElementById('competitorAnalysis').innerHTML = analysis;
}

// Διαχείριση προτύπων
function saveTemplate() {
    document.getElementById('saveModal').style.display = 'block';
}

function loadTemplate() {
    displayTemplateList();
    document.getElementById('loadModal').style.display = 'block';
}

function saveTemplateData() {
    const templateName = document.getElementById('templateName').value.trim();
    if (!templateName) {
        alert('Παρακαλώ εισάγετε όνομα προτύπου');
        return;
    }
    
    const templateData = collectFormData();
    savedTemplates[templateName] = {
        ...templateData,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('costTemplates', JSON.stringify(savedTemplates));
    closeModal('saveModal');
    
    // Εμφάνιση μηνύματος επιτυχίας
    showNotification('Το πρότυπο αποθηκεύτηκε επιτυχώς!', 'success');
}

function displayTemplateList() {
    const templateList = document.getElementById('templateList');
    
    if (Object.keys(savedTemplates).length === 0) {
        templateList.innerHTML = '<p style="text-align: center; color: #666;">Δεν υπάρχουν αποθηκευμένα πρότυπα</p>';
        return;
    }
    
    templateList.innerHTML = Object.entries(savedTemplates).map(([name, data]) => `
        <div class="template-item" onclick="loadTemplateData('${name}')">
            <div>
                <strong>${name}</strong>
                <br>
                <small>Αποθηκεύτηκε: ${new Date(data.savedAt).toLocaleDateString('el-GR')}</small>
            </div>
            <button class="delete-template" onclick="deleteTemplate('${name}', event)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function loadTemplateData(templateName) {
    const template = savedTemplates[templateName];
    if (!template) return;
    
    // Φόρτωση δεδομένων στη φόρμα
    Object.entries(template).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element && key !== 'savedAt') {
            element.value = value;
        }
    });
    
    // Ενημέρωση sliders
    updateAllSliderValues();
    
    closeModal('loadModal');
    showNotification('Το πρότυπο φορτώθηκε επιτυχώς!', 'success');
}

function deleteTemplate(templateName, event) {
    event.stopPropagation();
    
    if (confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε το πρότυπο "${templateName}";`)) {
        delete savedTemplates[templateName];
        localStorage.setItem('costTemplates', JSON.stringify(savedTemplates));
        displayTemplateList();
        showNotification('Το πρότυπο διαγράφηκε επιτυχώς!', 'success');
    }
}

// Εξαγωγή PDF
function exportPDF() {
    if (!currentCalculation) {
        alert('Παρακαλώ κάντε πρώτα έναν υπολογισμό');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Ρυθμίσεις PDF
    doc.setFont('helvetica');
    
    // Τίτλος
    doc.setFontSize(20);
    doc.text('Αναφορά Κοστολόγησης', 20, 30);
    
    // Στοιχεία προϊόντος
    doc.setFontSize(14);
    doc.text('Στοιχεία Προϊόντος:', 20, 50);
    doc.setFontSize(12);
    doc.text(`Προϊόν: ${currentCalculation.data.productName}`, 20, 60);
    doc.text(`Ποσότητα: ${currentCalculation.data.quantity} κιλά`, 20, 70);
    doc.text(`Τιμή Αγοράς: ${currentCalculation.data.purchasePrice.toFixed(2)}€/κιλό`, 20, 80);
    
    // Αποτελέσματα
    doc.setFontSize(14);
    doc.text('Αποτελέσματα:', 20, 100);
    doc.setFontSize(12);
    doc.text(`Συνολικό Κόστος: ${currentCalculation.results.totalCostPerKg.toFixed(2)}€/κιλό`, 20, 110);
    doc.text(`Τελική Τιμή: ${currentCalculation.results.finalPricePerKg.toFixed(2)}€/κιλό`, 20, 120);
    doc.text(`Κέρδος: ${currentCalculation.results.profitPerKg.toFixed(2)}€/κιλό`, 20, 130);
    doc.text(`Περιθώριο: ${currentCalculation.results.profitMarginActual.toFixed(1)}%`, 20, 140);
    
    // Ανάλυση κόστους
    doc.setFontSize(14);
    doc.text('Ανάλυση Κόστους:', 20, 160);
    doc.setFontSize(12);
    let yPos = 170;
    Object.entries(currentCalculation.results.breakdown).forEach(([key, value]) => {
        doc.text(`${key}: ${value.toFixed(2)}€`, 20, yPos);
        yPos += 10;
    });
    
    // Ημερομηνία
    doc.setFontSize(10);
    doc.text(`Δημιουργήθηκε: ${new Date().toLocaleDateString('el-GR')} ${new Date().toLocaleTimeString('el-GR')}`, 20, 280);
    
    // Αποθήκευση
    const filename = `kostologisi_${currentCalculation.data.productName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    showNotification('Η αναφορά PDF εξήχθη επιτυχώς!', 'success');
}

// Επαναφορά φόρμας
function resetForm() {
    if (confirm('Είστε σίγουροι ότι θέλετε να επαναφέρετε όλα τα πεδία;')) {
        document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.value = slider.min;
        });
        
        // Ειδική περίπτωση για quantity και profit
        document.getElementById('quantity').value = '1';
        document.getElementById('profitSlider').value = '20';
        
        updateAllSliderValues();
        
        // Απόκρυψη αποτελεσμάτων
        document.getElementById('result').classList.remove('show');
        
        // Καταστροφή γραφημάτων
        Object.values(chartInstances).forEach(chart => {
            if (chart) chart.destroy();
        });
        chartInstances = {};
        
        currentCalculation = null;
        
        showNotification('Η φόρμα επαναφέρθηκε επιτυχώς!', 'info');
    }
}

// Βοηθητικές λειτουργίες
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'saveModal') {
        document.getElementById('templateName').value = '';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    // Στυλ notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function loadDefaultValues() {
    // Φόρτωση προεπιλεγμένων τιμών
    const defaults = {
        quantity: 1,
        laborCost: 12,
        fuelCost: 0.15,
        profitMargin: 20
    };
    
    Object.entries(defaults).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element && !element.value) {
            element.value = value;
        }
    });
}

// Event listeners για κλείσιμο modals
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// CSS για animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .breakdown-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-top: 15px;
    }
    
    .breakdown-item {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 3px solid #667eea;
    }
    
    .breakdown-label {
        font-weight: 600;
        color: #555;
    }
    
    .breakdown-value {
        font-weight: 700;
        color: #2c3e50;
    }
    
    .recommendations {
        margin-top: 25px;
    }
    
    .recommendation {
        padding: 15px;
        margin: 10px 0;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
    }
    
    .recommendation.success {
        background: #d4edda;
        color: #155724;
        border-left: 4px solid #28a745;
    }
    
    .recommendation.warning {
        background: #fff3cd;
        color: #856404;
        border-left: 4px solid #ffc107;
    }
    
    .recommendation.info {
        background: #d1ecf1;
        color: #0c5460;
        border-left: 4px solid #17a2b8;
    }
    
    .competitor-price {
        font-size: 1.5rem;
        font-weight: 700;
        color: #2c3e50;
        margin: 10px 0;
    }
    
    .competitor-diff {
        font-weight: 600;
        font-size: 14px;
    }
`;
document.head.appendChild(style);