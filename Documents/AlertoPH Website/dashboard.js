
// dashboard.js - Real-time dashboard updates for AlertoVolt with AlertoPH API integration

// Constants for API endpoints
const API_ENDPOINTS = {
    VOLTAGE_DATA: '/api/voltage',
    ALERTS: '/api/alerts',
    DEVICE_STATUS: '/api/status'
};

// Polling interval in milliseconds (update every 3 seconds)
const UPDATE_INTERVAL = 3000;

// Elements cache
const elements = {
    // Apartment Info (Box 1)
    statusCircle: document.querySelector('.box1 .circle'),
    statusText: document.querySelector('.box1 .status p'),
    voltmeterValue: document.querySelector('.box1 .property-row:nth-child(1) .property-value'),
    avgConsumptionValue: document.querySelector('.box1 .property-row:nth-child(2) .property-value'),
    powerSourceValue: document.querySelector('.box1 .property-row:nth-child(3) .property-value'),
    
    // DVT Info (Box 2)
    voltageValue: document.querySelector('.box2 .property-row:nth-child(1) .property-value'),
    currentValue: document.querySelector('.box2 .property-row:nth-child(2) .property-value'),
    frequencyValue: document.querySelector('.box2 .property-row:nth-child(3) .property-value'),
    surgeCountValue: document.querySelector('.box2 .property-row:nth-child(4) .property-value span'),
    surgeCircle: document.querySelector('.box2 .circle'),
    
    // Alerts container (Box 3)
    alertsContainer: document.querySelector('.box3')
};

// Last update timestamp
let lastUpdateTime = new Date();
let connectionLost = false;

// Initialize dashboard
function initDashboard() {
    console.log('Initializing AlertoVolt Dashboard with AlertoPH API integration...');
    
    // Create a last sync element
    createLastSyncElement();
    
    // Initial data load
    updateAllData();
    
    // Set up periodic data refresh
    setInterval(updateAllData, UPDATE_INTERVAL);
    
    // Set up connection check
    setInterval(checkConnection, 10000);
    
    console.log('Dashboard initialized, polling every', UPDATE_INTERVAL/1000, 'seconds');
}

// Check connection status
function checkConnection() {
    const currentTime = new Date();
    const timeDiff = (currentTime - lastUpdateTime) / 1000; // in seconds
    
    // If haven't received updates for more than 30 seconds, show disconnected
    if (timeDiff > 30 && !connectionLost) {
        console.log("Connection appears to be lost. Last update was " + timeDiff + " seconds ago");
        connectionLost = true;
        
        // Update UI to show disconnected state
        elements.statusCircle.style.backgroundColor = '#999';
        elements.statusCircle.style.boxShadow = '0 0 8px rgba(153, 153, 153, 0.5)';
        elements.statusText.textContent = 'Disconnected';
        
        // Update last sync message
        const lastSyncElement = document.querySelector('.last-sync');
        if (lastSyncElement) {
            lastSyncElement.textContent = `Connection lost. Last update: ${lastUpdateTime.toLocaleString()}`;
            lastSyncElement.style.color = '#f44336';
        }
    }
}

// Update all dashboard data
function updateAllData() {
    Promise.all([
        fetchVoltageData(),
        fetchAlerts(),
        fetchDeviceStatus()
    ]).then(() => {
        // Update last successful update time
        lastUpdateTime = new Date();
        connectionLost = false;
    }).catch(error => {
        console.error('Error updating dashboard:', error);
    });
}

// Fetch voltage/current data
async function fetchVoltageData() {
    try {
        const response = await fetch(API_ENDPOINTS.VOLTAGE_DATA);
        if (!response.ok) {
            throw new Error('Network response failed');
        }
        const data = await response.json();
        updateVoltageDisplay(data);
        return data;
    } catch (error) {
        console.error('Error fetching voltage data:', error);
        throw error;
    }
}

// Update voltage display with new data
function updateVoltageDisplay(data) {
    // Update Box 1 (Apartment Info)
    elements.voltmeterValue.textContent = `${data.voltage_range.min}V - ${data.voltage_range.max}V`;
    elements.avgConsumptionValue.textContent = `${data.consumption_range.min}-${data.consumption_range.max} kWh/day`;
    elements.powerSourceValue.textContent = data.power_source;
    
    // Update Box 2 (DVT Info)
    elements.voltageValue.textContent = `${data.voltage_range.min}V-${data.voltage_range.max}V`;
    elements.currentValue.textContent = `${data.current_range.min}A-${data.current_range.max}A`;
    elements.frequencyValue.textContent = `${data.frequency} Hz`;
    elements.surgeCountValue.textContent = data.surge_count;
    
    // Update status indicators based on thresholds
    updateStatusIndicator(data.voltage_range.current);
}

// Update status indicator colors based on voltage values
function updateStatusIndicator(currentVoltage) {
    const LOW_THRESHOLD = 210;
    const HIGH_THRESHOLD = 240;
    
    if (currentVoltage < LOW_THRESHOLD) {
        // Low voltage warning
        elements.statusCircle.style.backgroundColor = '#ff9800';
        elements.statusCircle.style.boxShadow = '0 0 8px rgba(255, 152, 0, 0.5)';
        elements.statusText.textContent = 'Warning (Low Voltage)';
    } else if (currentVoltage > HIGH_THRESHOLD) {
        // High voltage warning
        elements.statusCircle.style.backgroundColor = '#f44336';
        elements.statusCircle.style.boxShadow = '0 0 8px rgba(244, 67, 54, 0.5)';
        elements.statusText.textContent = 'Warning (High Voltage)';
    } else {
        // Normal voltage
        elements.statusCircle.style.backgroundColor = '#53bd4e';
        elements.statusCircle.style.boxShadow = '0 0 8px rgba(83, 189, 78, 0.5)';
        elements.statusText.textContent = 'Optimal';
    }
    
    // Update surge count indicator
    const surgeCount = parseInt(elements.surgeCountValue.textContent);
    if (surgeCount > 5) {
        elements.surgeCircle.style.backgroundColor = '#f44336';
        elements.surgeCircle.style.boxShadow = '0 0 8px rgba(244, 67, 54, 0.5)';
    } else if (surgeCount > 0) {
        elements.surgeCircle.style.backgroundColor = '#ff9800';
        elements.surgeCircle.style.boxShadow = '0 0 8px rgba(255, 152, 0, 0.5)';
    } else {
        elements.surgeCircle.style.backgroundColor = '#53bd4e';
        elements.surgeCircle.style.boxShadow = '0 0 8px rgba(83, 189, 78, 0.5)';
    }
}

// Fetch alerts from the server
async function fetchAlerts() {
    try {
        const response = await fetch(API_ENDPOINTS.ALERTS);
        if (!response.ok) {
            throw new Error('Network response failed');
        }
        const data = await response.json();
        updateAlertsDisplay(data);
        return data;
    } catch (error) {
        console.error('Error fetching alerts:', error);
        throw error;
    }
}

// Update alerts display with new data
function updateAlertsDisplay(alerts) {
    // Clear existing alerts except the title
    const alertTitle = elements.alertsContainer.querySelector('h2');
    elements.alertsContainer.innerHTML = '';
    elements.alertsContainer.appendChild(alertTitle);
    
    if (alerts.length === 0) {
        // Display "No alerts" message if there are no alerts
        const noAlertsMsg = document.createElement('div');
        noAlertsMsg.className = 'alert';
        noAlertsMsg.innerHTML = `
            <h3>No Alerts</h3>
            <p>All systems are operating normally.</p>
            <div class="status">
                <div class="circle"></div>
                <p>Status: Optimal</p>
            </div>
        `;
        elements.alertsContainer.appendChild(noAlertsMsg);
        return;
    }
    
    // Add each alert to the container
    alerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert';
        
        // Determine status class based on alert type
        let statusClass = 'warning';
        if (alert.type === 'high_voltage' || alert.type === 'critical') {
            statusClass = 'danger';
        }
        
        // Format the timestamp
        const timestamp = new Date(alert.timestamp);
        const formattedTime = timestamp.toLocaleString();
        
        alertElement.innerHTML = `
            <h3>${alert.title}</h3>
            <p>${alert.value}</p>
            <div class="status ${statusClass}">
                <div class="circle"></div>
                <p>Status: ${alert.status}</p>
            </div>
            <p class="alert-time">${formattedTime}</p>
        `;
        
        elements.alertsContainer.appendChild(alertElement);
    });
    
    // Add some CSS for the timestamp
    if (!document.getElementById('alert-time-style')) {
        const style = document.createElement('style');
        style.id = 'alert-time-style';
        style.textContent = `
            .alert-time {
                font-size: 12px;
                color: #777;
                margin-top: 10px;
                text-align: right;
            }
        `;
        document.head.appendChild(style);
    }
}

// Fetch device status
async function fetchDeviceStatus() {
    try {
        const response = await fetch(API_ENDPOINTS.DEVICE_STATUS);
        if (!response.ok) {
            throw new Error('Network response failed');
        }
        const data = await response.json();
        updateDeviceStatus(data);
        return data;
    } catch (error) {
        console.error('Error fetching device status:', error);
        throw error;
    }
}

// Update device status display
function updateDeviceStatus(status) {
    // Check device connection status
    if (!status.connected) {
        // Show disconnected status
        elements.statusCircle.style.backgroundColor = '#999';
        elements.statusCircle.style.boxShadow = '0 0 8px rgba(153, 153, 153, 0.5)';
        elements.statusText.textContent = 'Disconnected';
    }
    
    // Update last sync time if available
    if (status.last_sync) {
        const lastSyncElement = document.querySelector('.last-sync');
        const syncDate = new Date(status.last_sync);
        
        if (lastSyncElement) {
            lastSyncElement.textContent = `Last Updated: ${syncDate.toLocaleString()}`;
            lastSyncElement.style.color = status.connected ? '#333' : '#f44336';
        }
    }
}

// Create a last sync element if it doesn't exist
function createLastSyncElement() {
    if (!document.querySelector('.last-sync')) {
        const lastSyncElement = document.createElement('p');
        lastSyncElement.className = 'last-sync';
        lastSyncElement.textContent = 'Connecting...';
        document.querySelector('.box1-info').appendChild(lastSyncElement);
        return lastSyncElement;
    }
    return document.querySelector('.last-sync');
}

// Add event listener for online/offline events
window.addEventListener('online', () => {
    console.log('Browser is online, updating data...');
    updateAllData();
});

window.addEventListener('offline', () => {
    console.log('Browser is offline, pausing updates');
    elements.statusCircle.style.backgroundColor = '#999';
    elements.statusCircle.style.boxShadow = '0 0 8px rgba(153, 153, 153, 0.5)';
    elements.statusText.textContent = 'Network Disconnected';
    
    const lastSyncElement = document.querySelector('.last-sync');
    if (lastSyncElement) {
        lastSyncElement.textContent = 'Internet connection lost';
        lastSyncElement.style.color = '#f44336';
    }
});

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);