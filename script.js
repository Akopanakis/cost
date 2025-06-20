// Παγκόσμιες μεταβλητές
let chartInstances = {};
let savedTemplates = JSON.parse(localStorage.getItem('costTemplates')) || {};
let currentCalculation = null;

// Αρχικοποίηση
document.addEventListener('DOMContentLoaded', function() {
    loadDefaultValues();
    updateAllSliderValues();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Ενημέρωση εργασίας σε πραγματικό χρόνο
    ['workerCount', 'laborHours', 'laborCost'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateLaborSummary);
        }
    });

    // Ενημέρωση μεταφοράς σε πραγματικό χρόνο
    ['distance', 'fuelCost', 'tolls', 'parkingCost'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateTransportSummary);
        }
    });
}

// Διαχείριση tabs
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
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

// Ενημέρωση περίληψης εργασίας
function updateLaborSummary() {
    const workerCount = parseFloat(document.getElementById('workerCount').value) || 0;
    const laborHours = parseFloat(document.getElementById('laborHours').value) || 0;
    const laborCost = parseFloat(document.getElementById('laborCost').value) || 0;
    
    const totalHours = workerCount * laborHours;
    const totalCost = totalHours * laborCost;
    
    document.getElementById('totalLaborHours').textContent = totalHours.toFixed(1);
    document.getElementById('totalLaborCost').textContent = totalCost.toFixed(2) + '€';
}

// Ενημέρωση περίληψης μεταφοράς
function updateTransportSummary() {
    const distance = parseFloat(document.getElementById('distance').value) || 0;
    const fuelCost = parseFloat(document.getElementById('fuelCost').value) || 0;
    const tolls = parseFloat(document.getElementById('tolls').value) || 0;
    const parkingCost = parseFloat(document.getElementById('parkingCost').value) || 0;
    
    const totalCost = (distance * fuelCost) + tolls + parkingCost;
    
    document.getElementById('totalTransportCost').textContent = totalCost.toFixed(2) + '€';
}

// Εμφάνιση/απόκρυψη επιπλέον κοστών
function toggleAdditionalCosts() {
    document.getElementById('additionalCostsModal').style.display = 'block';
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
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Κύριος υπολογισμός
function calculate() {
    const data = collectFormData();
    const results = performCalculations(data);
    
    currentCalculation = { data, results };
    displayResults(results, data);
    renderCharts(results, data);
    analyzeCompetitors(results);
    
    document.getElementById('result').classList.add('show');
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
        workerCount: parseFloat(document.getElementById('workerCount').value) || 1,
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
        rentCost: parseFloat(document.getElementById('rentCost').value) || 0,
        communicationCost: parseFloat(document.getElementById('communicationCost').value) || 0,
        otherCosts: parseFloat(document.getElementById('otherCosts').value) || 0,
        profitMargin: parseFloat(document.getElementById('profitMargin').value) || 0
    };
}

function performCalculations(data) {
    // Βασικοί υπολογισμοί
    const cleanCost = data.purchasePrice / (1 - data.waste / 100);
    const totalLaborHours = data.workerCount * data.laborHours;
    const laborTotal = totalLaborHours * data.laborCost;
    const packagingCost = data.boxCost + data.bagCost;
    const transportCost = (data.distance * data.fuelCost) + data.tolls + data.parkingCost;
    const additionalCosts = data.electricityCost + data.equipmentCost + data.insuranceCost + 
                           data.rentCost + data.communicationCost + data.otherCosts;
    
    // Υπολογισμός κόστους ανά κιλό καθαρού προϊόντος
    const totalCostPerKg = cleanCost + (laborTotal / data.quantity) + (packagingCost / data.quantity) + 
                          (transportCost / data.quantity) + (additionalCosts / data.quantity);
    
    // Υπολογισμός τελικού βάρους με πάγο
    const finalWeight = data.quantity * (1 + data.icePercent / 100);
    const costPerKgWithIce = totalCostPerKg / (1 + data.icePercent / 100);
    
    const totalCostForQuantity = totalCostPerKg * data.quantity;
    
    const finalPricePerKg = totalCostPerKg * (1 + data.profitMargin / 100);
    const finalPriceForQuantity = finalPricePerKg * data.quantity;
    
    const profitPerKg = finalPricePerKg - totalCostPerKg;
    const profitForQuantity = finalPriceForQuantity - totalCostForQuantity;
    
    const profitMarginActual = (profitPerKg / totalCostPerKg) * 100;
    
    // Υπολογισμός εσόδων
    const revenue = finalPriceForQuantity;
    const netProfit = revenue - totalCostForQuantity;
    
    return {
        cleanCost,
        laborTotal,
        totalLaborHours,
        packagingCost,
        transportCost,
        additionalCosts,
        totalCostPerKg,
        costPerKgWithIce,
        finalWeight,
        totalCostForQuantity,
        finalPricePerKg,
        finalPriceForQuantity,
        profitPerKg,
        profitForQuantity,
        profitMarginActual,
        revenue,
        netProfit,
        breakdown: {
            'Καθαρό Κόστος Προϊόντος': cleanCost * data.quantity,
            'Εργασία': laborTotal,
            'Συσκευασία': packagingCost,
            'Μεταφορά': transportCost,
            'Επιπλέον Κόστη': additionalCosts
        }
    };
}

function displayResults(results, data) {
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
            
            ${data.icePercent > 0 ? `
            <div class="result-card">
                <div class="result-label">Τελικό Βάρος (με πάγο)</div>
                <div class="result-value">${results.finalWeight.toFixed(2)} κιλά</div>
            </div>
            
            <div class="result-card">
                <div class="result-label">Κόστος/κιλό (με πάγο)</div>
                <div class="result-value">${results.costPerKgWithIce.toFixed(2)}€</div>
            </div>
            ` : ''}
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
                <div class="breakdown-item">
                    <span class="breakdown-label">Συνολικές Εργατοώρες:</span>
                    <span class="breakdown-value">${results.totalLaborHours.toFixed(1)} ώρες</span>
                </div>
            </div>
        </div>
        
        <div class="recommendations">
            <h4><i class="fas fa-lightbulb"></i> Συστάσεις</h4>
            ${generateRecommendations(results, data)}
        </div>
    `;
}

function generateRecommendations(results, data) {
    const recommendations = [];
    
    if (results.profitMarginActual < 15) {
        recommendations.push('<div class="recommendation warning"><i class="fas fa-exclamation-triangle"></i> Το περιθώριο κέρδους είναι χαμηλό. Σκεφτείτε αύξηση τιμής ή μείωση κόστους.</div>');
    }
    
    if (results.profitMarginActual > 50) {
        recommendations.push('<div class="recommendation success"><i class="fas fa-check-circle"></i> Εξαιρετικό περιθώριο κέρδους! Μπορείτε να είστε ανταγωνιστικοί στην τιμή.</div>');
    }
    
    if (results.breakdown['Μεταφορά'] > results.totalCostForQuantity * 0.2) {
        recommendations.push('<div class="recommendation info"><i class="fas fa-truck"></i> Το κόστος μεταφοράς είναι υψηλό. Εξετάστε βελτιστοποίηση διαδρομών.</div>');
    }
    
    if (results.breakdown['Εργασία'] > results.totalCostForQuantity * 0.3) {
        recommendations.push('<div class="recommendation info"><i class="fas fa-users"></i> Το κόστος εργασίας είναι σημαντικό. Εξετάστε αυτοματοποίηση διαδικασιών.</div>');
    }
    
    if (data.icePercent > 20) {
        recommendations.push('<div class="recommendation warning"><i class="fas fa-snowflake"></i> Το ποσοστό πάγου είναι υψηλό. Βεβαιωθείτε ότι συμμορφώνεστε με τους κανονισμούς.</div>');
    }
    
    if (results.totalLaborHours > 8 * data.workerCount) {
        recommendations.push('<div class="recommendation warning"><i class="fas fa-clock"></i> Οι εργατοώρες υπερβαίνουν το κανονικό ωράριο. Υπολογίστε υπερωρίες.</div>');
    }
    
    return recommendations.length > 0 ? recommendations.join('') : '<div class="recommendation success"><i class="fas fa-thumbs-up"></i> Η κοστολόγηση φαίνεται ισορροπημένη!</div>';
}

function renderCharts(results, data) {
    renderProfitChart(results);
    renderCostBreakdownChart(results);
    renderRevenueChart(results, data);
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
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2563eb',
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
        '#ef4444', '#3b82f6', '#f59e0b', '#10b981', 
        '#8b5cf6', '#f97316', '#ec4899', '#6b7280'
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
                            const percentage = ((context.parsed / results.totalCostForQuantity) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed.toFixed(2)}€ (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderRevenueChart(results, data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    if (chartInstances.revenue) {
        chartInstances.revenue.destroy();
    }
    
    const chartData = {
        labels: ['Κόστος', 'Κέρδος'],
        datasets: [{
            label: 'Ανάλυση Εσόδων (€)',
            data: [results.totalCostForQuantity, results.profitForQuantity],
            backgroundColor: [
                '#ef4444',
                '#10b981'
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };
    
    chartInstances.revenue = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Γράφημα Κόστους - Εσόδων',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = results.revenue;
                            const percentage = ((context.parsed.y / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed.y.toFixed(2)}€ (${percentage}%)`;
                        },
                        footer: function(tooltipItems) {
                            return `Συνολικά Έσοδα: ${results.revenue.toFixed(2)}€`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ποσό (€)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Κατηγορία'
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
        const color1 = diff1 > 0 ? '#dc2626' : '#059669';
        
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
        const color2 = diff2 > 0 ? '#dc2626' : '#059669';
        
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
        showNotification('Παρακαλώ εισάγετε όνομα προτύπου', 'warning');
        return;
    }
    
    const templateData = collectFormData();
    savedTemplates[templateName] = {
        ...templateData,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('costTemplates', JSON.stringify(savedTemplates));
    closeModal('saveModal');
    
    showNotification('Το πρότυπο αποθηκεύτηκε επιτυχώς!', 'success');
}

function displayTemplateList() {
    const templateList = document.getElementById('templateList');
    
    if (Object.keys(savedTemplates).length === 0) {
        templateList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Δεν υπάρχουν αποθηκευμένα πρότυπα</p>';
        return;
    }
    
    templateList.innerHTML = Object.entries(savedTemplates).map(([name, data]) => `
        <div class="template-item" onclick="loadTemplateData('${name}')">
            <div>
                <strong>${name}</strong>
                <br>
                <small style="color: var(--text-muted);">Αποθηκεύτηκε: ${new Date(data.savedAt).toLocaleDateString('el-GR')}</small>
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
    
    Object.entries(template).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element && key !== 'savedAt') {
            element.value = value;
        }
    });
    
    updateAllSliderValues();
    updateLaborSummary();
    updateTransportSummary();
    
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

// Εξαγωγή PDF με υποστήριξη ελληνικών
function exportPDF() {
    if (!currentCalculation) {
        showNotification('Παρακαλώ κάντε πρώτα έναν υπολογισμό', 'warning');
        return;
    }
    
    // Δημιουργία HTML για εκτύπωση
    const printContent = generatePrintContent();
    
    // Δημιουργία νέου παραθύρου για εκτύπωση
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="el">
        <head>
            <meta charset="UTF-8">
            <title>Αναφορά Κοστολόγησης - ${currentCalculation.data.productName}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    color: #333;
                    line-height: 1.6;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 2px solid #2563eb; 
                    padding-bottom: 20px; 
                    margin-bottom: 30px;
                }
                .section { 
                    margin-bottom: 25px; 
                    page-break-inside: avoid;
                }
                .section h3 { 
                    color: #2563eb; 
                    border-bottom: 1px solid #e2e8f0; 
                    padding-bottom: 5px;
                }
                .grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: 15px; 
                    margin: 15px 0;
                }
                .item { 
                    display: flex; 
                    justify-content: space-between; 
                    padding: 8px; 
                    background: #f8fafc; 
                    border-radius: 4px;
                }
                .highlight { 
                    background: #dbeafe; 
                    font-weight: bold;
                }
                .footer { 
                    margin-top: 40px; 
                    text-align: center; 
                    font-size: 12px; 
                    color: #666;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Αναμονή φόρτωσης και εκτύπωση
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
    
    showNotification('Η αναφορά PDF ετοιμάζεται για εκτύπωση!', 'success');
}

function generatePrintContent() {
    const { data, results } = currentCalculation;
    const now = new Date();
    
    return `
        <div class="header">
            <h1>Αναφορά Κοστολόγησης</h1>
            <p>Προϊόν: ${data.productName} | Ημερομηνία: ${now.toLocaleDateString('el-GR')} ${now.toLocaleTimeString('el-GR')}</p>
        </div>
        
        <div class="section">
            <h3>Βασικά Στοιχεία</h3>
            <div class="grid">
                <div class="item"><span>Προϊόν:</span><span>${data.productName}</span></div>
                <div class="item"><span>Ποσότητα:</span><span>${data.quantity} κιλά</span></div>
                <div class="item"><span>Τιμή Αγοράς:</span><span>${data.purchasePrice.toFixed(2)}€/κιλό</span></div>
                <div class="item"><span>Φύρα:</span><span>${data.waste}%</span></div>
                ${data.icePercent > 0 ? `<div class="item"><span>Πάγος:</span><span>${data.icePercent}%</span></div>` : ''}
            </div>
        </div>
        
        <div class="section">
            <h3>Κόστη</h3>
            <div class="grid">
                <div class="item"><span>Εργαζόμενοι:</span><span>${data.workerCount} άτομα</span></div>
                <div class="item"><span>Ώρες/άτομο:</span><span>${data.laborHours} ώρες</span></div>
                <div class="item"><span>Κόστος/ώρα:</span><span>${data.laborCost.toFixed(2)}€</span></div>
                <div class="item"><span>Συνολικές ώρες:</span><span>${results.totalLaborHours.toFixed(1)} ώρες</span></div>
            </div>
        </div>
        
        <div class="section">
            <h3>Αποτελέσματα</h3>
            <div class="grid">
                <div class="item highlight"><span>Συνολικό Κόστος:</span><span>${results.totalCostPerKg.toFixed(2)}€/κιλό</span></div>
                <div class="item highlight"><span>Τελική Τιμή:</span><span>${results.finalPricePerKg.toFixed(2)}€/κιλό</span></div>
                <div class="item highlight"><span>Κέρδος:</span><span>${results.profitPerKg.toFixed(2)}€/κιλό</span></div>
                <div class="item highlight"><span>Περιθώριο:</span><span>${results.profitMarginActual.toFixed(1)}%</span></div>
            </div>
        </div>
        
        <div class="section">
            <h3>Ανάλυση Κόστους</h3>
            <div class="grid">
                ${Object.entries(results.breakdown).map(([key, value]) => 
                    `<div class="item"><span>${key}:</span><span>${value.toFixed(2)}€</span></div>`
                ).join('')}
            </div>
        </div>
        
        <div class="footer">
            <p>Υπολογιστής Κοστολόγησης Pro - Αναφορά δημιουργήθηκε στις ${now.toLocaleString('el-GR')}</p>
        </div>
    `;
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
        
        // Ειδικές περιπτώσεις
        document.getElementById('quantity').value = '1';
        document.getElementById('workerCount').value = '1';
        document.getElementById('profitSlider').value = '20';
        
        updateAllSliderValues();
        updateLaborSummary();
        updateTransportSummary();
        
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
    
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle',
        info: 'fa-info-circle'
    };
    
    const colors = {
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#2563eb'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function loadDefaultValues() {
    const defaults = {
        quantity: 1,
        workerCount: 1,
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
`;
document.head.appendChild(style);