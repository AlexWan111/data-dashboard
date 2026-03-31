let currentData = null;
let charts = {};

document.addEventListener('DOMContentLoaded', function() {
    setupFileUpload();
});

function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

async function handleFiles(files) {
    if (files.length === 0) return;

    const file = files[0];
    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(2);

    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('fileName').textContent = `文件名: ${fileName}`;
    document.getElementById('fileSize').textContent = `大小: ${fileSize} KB`;

    try {
        if (file.type === 'text/csv' || fileName.endsWith('.csv')) {
            parseCSV(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel' ||
                   fileName.endsWith('.xlsx') ||
                   fileName.endsWith('.xls')) {
            parseExcel(file);
        } else {
            alert('不支持的文件格式，请上传 CSV 或 Excel 文件');
        }
    } catch (error) {
        console.error('文件处理错误:', error);
        alert('文件处理失败: ' + error.message);
    }
}

function parseCSV(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                currentData = results.data;
                generateVisualizations();
            } else {
                alert('CSV 文件为空或格式无效');
            }
        },
        error: function(error) {
            alert('CSV 解析错误: ' + error.message);
        }
    });
}

function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData && jsonData.length > 0) {
                currentData = jsonData;
                generateVisualizations();
            } else {
                alert('Excel 文件为空或格式无效');
            }
        } catch (error) {
            alert('Excel 解析错误: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function generateVisualizations() {
    if (!currentData || currentData.length === 0) return;

    showDataPreview(currentData);

    document.getElementById('chartsContainer').innerHTML = '';
    charts = {};

    const analysis = analyzeData(currentData);

    if (document.getElementById('showBarChart').checked && analysis.barData) {
        createBarChart(analysis.barData);
    }

    if (document.getElementById('showLineChart').checked && analysis.lineData) {
        createLineChart(analysis.lineData);
    }

    if (document.getElementById('showPieChart').checked && analysis.pieData) {
        createPieChart(analysis.pieData);
    }

    if (document.getElementById('chartsContainer').innerHTML === '') {
        document.getElementById('chartsContainer').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>无法从数据生成可视化，请检查数据格式</p>
            </div>
        `;
    }
}

function analyzeData(data) {
    const analysis = {};

    if (data.length === 0) return analysis;

    const headers = Object.keys(data[0]);
    
    let valueColumns = [];
    let categoryColumn = null;

    headers.forEach(header => {
        const values = data.map(row => row[header]);
        const numericValues = values.filter(v => !isNaN(v) && v !== '' && v !== null);
        
        if (numericValues.length > data.length * 0.7) {
            valueColumns.push(header);
        } else if (!categoryColumn && numericValues.length < data.length * 0.3) {
            categoryColumn = header;
        }
    });

    if (!categoryColumn) {
        categoryColumn = headers[0];
    }

    const categories = data.map(row => row[categoryColumn]).slice(0, 20);

    if (valueColumns.length > 0) {
        analysis.barData = {
            labels: categories,
            datasets: valueColumns.slice(0, 2).map((col, idx) => ({
                label: col,
                data: data.map(row => parseFloat(row[col]) || 0).slice(0, 20),
                backgroundColor: [
                    'rgba(74, 144, 226, 0.7)',
                    'rgba(245, 166, 35, 0.7)'
                ][idx % 2],
                borderColor: [
                    'rgba(74, 144, 226, 1)',
                    'rgba(245, 166, 35, 1)'
                ][idx % 2],
                borderWidth: 1
            }))
        };
    }

    if (valueColumns.length > 0) {
        analysis.lineData = {
            labels: categories,
            datasets: valueColumns.slice(0, 2).map((col, idx) => ({
                label: col,
                data: data.map(row => parseFloat(row[col]) || 0).slice(0, 20),
                borderColor: [
                    'rgba(74, 144, 226, 1)',
                    'rgba(245, 166, 35, 1)'
                ][idx % 2],
                backgroundColor: [
                    'rgba(74, 144, 226, 0.1)',
                    'rgba(245, 166, 35, 0.1)'
                ][idx % 2],
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: [
                    'rgba(74, 144, 226, 1)',
                    'rgba(245, 166, 35, 1)'
                ][idx % 2]
            }))
        };
    }

    if (valueColumns.length > 0) {
        const pieValues = data.map(row => parseFloat(row[valueColumns[0]]) || 0).slice(0, 10);
        analysis.pieData = {
            labels: categories.slice(0, 10),
            datasets: [{
                data: pieValues,
                backgroundColor: [
                    'rgba(74, 144, 226, 0.8)',
                    'rgba(245, 166, 35, 0.8)',
                    'rgba(126, 211, 33, 0.8)',
                    'rgba(208, 2, 27, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(230, 126, 34, 0.8)',
                    'rgba(44, 62, 80, 0.8)',
                    'rgba(26, 188, 156, 0.8)',
                    'rgba(241, 196, 15, 0.8)'
                ],
                borderColor: 'white',
                borderWidth: 2
            }]
        };
    }

    return analysis;
}

function createBarChart(data) {
    const chartId = 'barChart_' + Date.now();
    const chartCard = document.createElement('div');
    chartCard.className = 'chart-card';
    chartCard.innerHTML = `
        <h3>📊 柱状图</h3>
        <div class="chart-wrapper">
            <canvas id="${chartId}"></canvas>
        </div>
    `;
    document.getElementById('chartsContainer').appendChild(chartCard);

    const ctx = document.getElementById(chartId).getContext('2d');
    charts[chartId] = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createLineChart(data) {
    const chartId = 'lineChart_' + Date.now();
    const chartCard = document.createElement('div');
    chartCard.className = 'chart-card';
    chartCard.innerHTML = `
        <h3>📈 折线图</h3>
        <div class="chart-wrapper">
            <canvas id="${chartId}"></canvas>
        </div>
    `;
    document.getElementById('chartsContainer').appendChild(chartCard);

    const ctx = document.getElementById(chartId).getContext('2d');
    charts[chartId] = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createPieChart(data) {
    const chartId = 'pieChart_' + Date.now();
    const chartCard = document.createElement('div');
    chartCard.className = 'chart-card';
    chartCard.innerHTML = `
        <h3>🥧 饼图</h3>
        <div class="chart-wrapper">
            <canvas id="${chartId}"></canvas>
        </div>
    `;
    document.getElementById('chartsContainer').appendChild(chartCard);

    const ctx = document.getElementById(chartId).getContext('2d');
    charts[chartId] = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

function showDataPreview(data) {
    const preview = document.getElementById('dataPreview');
    
    if (data.length === 0) {
        preview.innerHTML = '<p style="color: #999;">无数据</p>';
        return;
    }

    const headers = Object.keys(data[0]);
    const rows = data.slice(0, 5);

    let html = '<table><thead><tr>';
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
            html += `<td>${row[header]}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    preview.innerHTML = html;
}

function clearFile() {
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('dataPreview').innerHTML = '<p style="color: #999;">数据加载后显示</p>';
    document.getElementById('chartsContainer').innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📊</div>
            <p>请上传数据文件开始分析</p>
        </div>
    `;
    currentData = null;
    
    Object.keys(charts).forEach(key => {
        if (charts[key]) {
            charts[key].destroy();
        }
    });
    charts = {};
}
