import os
import logging
from flask import Flask, render_template, send_from_directory

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "glicelivre-secret-key-development")

@app.route('/')
def index():
    """Main page - Glicelivre glucose monitoring app"""
    return render_template('index.html')

@app.route('/manifest.json')
def manifest():
    """Serve PWA manifest file"""
    return send_from_directory('static', 'manifest.json', mimetype='application/json')

@app.route('/sw.js')
def service_worker():
    """Serve service worker file"""
    return send_from_directory('static', 'sw.js', mimetype='application/javascript')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
