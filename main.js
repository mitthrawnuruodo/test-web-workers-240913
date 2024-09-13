// Register the Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
    .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
    }).catch(function(error) {
        console.error('Service Worker registration failed:', error);
    });
}

// Create a new Web Worker instance
const worker = new Worker('worker.js');

// Specify the API URL for fetching the amiibo data
const apiUrl = 'https://www.amiiboapi.com/api/amiibo/';

// Send the API URL to the worker
worker.postMessage(apiUrl);

// Listen for messages from the worker
worker.onmessage = function(event) {
    const data = event.data;

    if (data.error) {
        console.error('Error fetching data:', data.error);
        return;
    }

    // Store the full data for filtering
    amiiboData = data;

    // Display the processed data on the page
    displayData(data);
};

// Function to display the processed data in the DOM
function displayData(data) {
    const output = document.getElementById('output');
    output.innerHTML = '';

    data.forEach(item => {
        const div = document.createElement('div');
        div.textContent = `Name: ${item.name}, Game Series: ${item.gameSeries}, Amiibo Series: ${item.amiiboSeries}`;

        // Create an image element for each Amiibo
        const img = document.createElement('img');
        img.src = item.image; // Amiibo image URL from the API
        img.alt = item.name;

        div.appendChild(img);
        output.appendChild(div);
    });
}

// Add event listener for search input
document.getElementById('search').addEventListener('input', function(event) {
    const searchTerm = event.target.value.toLowerCase();

    // Filter the amiibo data based on the search term
    const filteredData = amiiboData.filter(amiibo =>
        amiibo.name.toLowerCase().includes(searchTerm) ||
        amiibo.gameSeries.toLowerCase().includes(searchTerm) ||
        amiibo.amiiboSeries.toLowerCase().includes(searchTerm)
    );

    // Display the filtered data
    displayData(filteredData);
});