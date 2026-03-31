// script.js

// Functionality for file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            const parsedData = parseData(data);
            visualizeData(parsedData);
        };
        reader.readAsText(file);
    }
}

// Functionality to parse data
function parseData(data) {
    // Assuming data is in CSV format
    const rows = data.split('\n');
    const parsedData = rows.map(row => row.split(','));
    return parsedData;
}

// Functionality for chart visualization
function visualizeData(parsedData) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const labels = parsedData.map(row => row[0]); // Assuming first column is labels
    const dataValues = parsedData.map(row => parseFloat(row[1])); // Assuming second column is values

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Dataset',
                data: dataValues,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Event listener for file input
document.getElementById('fileInput').addEventListener('change', handleFileUpload);
