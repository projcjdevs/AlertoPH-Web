from flask import Flask, jsonify, send_from_directory
import random
import datetime
import os

app = Flask(__name__)

# Serve static files (HTML, CSS, JS)
@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

# Serve main page
@app.route('/')
def index():
    return send_from_directory('.', 'dashboard.html')

# API endpoints
@app.route('/api/voltage')
def voltage_data():
    current_voltage = random.uniform(215, 245)
    return jsonify({
        'voltage_range': {
            'min': round(current_voltage - random.uniform(5, 10), 1),
            'max': round(current_voltage + random.uniform(5, 10), 1),
            'current': round(current_voltage, 1)
        },
        'current_range': {
            'min': round(random.uniform(8, 10), 1),
            'max': round(random.uniform(15, 18), 1)
        },
        'consumption_range': {
            'min': round(random.uniform(7, 9), 1),
            'max': round(random.uniform(10, 14), 1)
        },
        'frequency': 60,
        'surge_count': random.randint(0, 8),
        'power_source': 'Main Grid Supply'
    })

@app.route('/api/alerts')
def alerts():
    num_alerts = random.randint(0, 3)
    alerts_list = []
    
    alert_types = [
        {
            'title': 'Voltage Dropped',
            'type': 'low_voltage',
            'value': f"{round(random.uniform(190, 210), 1)}V",
            'status': 'Warning (Low V)'
        },
        {
            'title': 'Voltage Hiked',
            'type': 'high_voltage',
            'value': f"{round(random.uniform(240, 250), 1)}V",
            'status': 'Warning (High V)'
        }
    ]
    
    for i in range(min(num_alerts, len(alert_types))):
        alert = alert_types[i].copy()
        timestamp = datetime.datetime.now() - datetime.timedelta(minutes=random.randint(0, 60))
        alert['timestamp'] = timestamp.isoformat()
        alerts_list.append(alert)
    
    return jsonify(alerts_list)

@app.route('/api/status')
def device_status():
    connected = random.random() < 0.95
    last_sync = datetime.datetime.now() - datetime.timedelta(minutes=random.randint(0, 30))
    
    return jsonify({
        'connected': connected,
        'last_sync': last_sync.isoformat(),
        'device_id': 'DVT-A1B2C3'
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("ALERTOVOLT MOCK SERVER")
    print("="*50)
    print("\n1. Make sure your HTML file is named 'AlertoVolt.html'")
    print("2. Make sure dashboard.js is in the same folder")
    print("3. Open your browser to: http://127.0.0.1:5000/")
    print("\nServer starting...\n")
    app.run(debug=True)