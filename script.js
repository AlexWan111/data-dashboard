// script.js

// Function to handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = e.target.result;
        visualizeData(data);
    };

    reader.readAsText(file);
}

// Function to visualize data
function visualizeData(data) {
    const jsonData = JSON.parse(data);
    const chartData = jsonData.map(item => ({
        x: item.label,
        y: item.value
    }));

    // Example visualization using Chart.js
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: [{
                label: 'Data Visualization',
                data: chartData,
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

// Attach the file input change event listener
document.getElementById('fileInput').addEventListener('change', handleFileUpload);