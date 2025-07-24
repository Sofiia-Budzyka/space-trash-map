from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from skyfield.api import load, EarthSatellite
from datetime import datetime, timezone, timedelta
import numpy as np
import sqlite3

# --- Config ---
DB_NAME = "debris.db"

# --- Flask Setup ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

current_objects_data = []
cached_tle_data = {}

# --- DB Functions ---
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS debris (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            tle1 TEXT,
            tle2 TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def load_debris_from_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT id, name, tle1, tle2 FROM debris")
    data = c.fetchall()
    conn.close()
    return data

# --- TLE Processing ---
def calculate_and_format_objects(debris_data):
    ts = load.timescale()
    now = ts.utc(datetime.now(timezone.utc))

    formatted_objects = []
    cached_tle_data.clear()

    for obj_id, name, tle1, tle2 in debris_data:
        try:
            satellite = EarthSatellite(tle1, tle2, name, ts)
            geocentric = satellite.at(now)
            x, y, z = geocentric.position.km

            obj_type = "satellite" if any(keyword in name.upper() for keyword in
                ["ISS", "STARLINK", "COSMOS", "SPUTNIK", "IRIDIUM", "INTELSAT", "GOES", "GPS", "GALILEO", "GLONASS"]) else "debris"

            # Вычисляем орбиту на 90 точек вперёд (90 минут)
            orbit_points = []
            for i in range(90):
                t_future = ts.utc(datetime.utcnow() + timedelta(minutes=i))
                pos = satellite.at(t_future).position.km
                orbit_points.append([round(pos[0], 2), round(pos[1], 2), round(pos[2], 2)])

            space_object = {
                "id": obj_id,
                "name": name,
                "description": f"{obj_type.capitalize()}: {name}",
                "type": obj_type,
                "position": [round(x, 2), round(y, 2), round(z, 2)],
                "orbit": orbit_points
            }

            formatted_objects.append(space_object)
            cached_tle_data[name] = (tle1, tle2, obj_type)

        except Exception as e:
            print(f"[ERROR] Failed to process {name}: {e}")
            continue

    return formatted_objects

# --- API Routes ---
@app.route('/api/objects', methods=['GET'])
def get_objects():
    obj_type = request.args.get('type')
    if obj_type:
        filtered = [obj for obj in current_objects_data if obj["type"] == obj_type]
        return jsonify(filtered)
    return jsonify(current_objects_data)

@app.route('/api/object/<string:object_name>', methods=['GET'])
def get_object_parameters(object_name):
    tle_info = cached_tle_data.get(object_name)
    if not tle_info:
        return jsonify({"message": f"Object '{object_name}' not found."}), 404

    tle1, tle2, object_type = tle_info
    ts = load.timescale()
    now = ts.utc(datetime.now(timezone.utc))

    try:
        satellite = EarthSatellite(tle1, tle2, object_name, ts)
        geocentric = satellite.at(now)
        subpoint = geocentric.subpoint()

        x, y, z = geocentric.position.km
        vx, vy, vz = geocentric.velocity.km_per_s
        velocity_mag = np.linalg.norm(geocentric.velocity.km_per_s)
        altitude_km = geocentric.distance().km - 6371.0

        return jsonify({
            "name": object_name,
            "type": object_type,
            "tle1": tle1,
            "tle2": tle2,
            "current_position_km": [round(x, 2), round(y, 2), round(z, 2)],
            "velocity_km_s": [round(vx, 2), round(vy, 2), round(vz, 2), round(velocity_mag, 2)],
            "altitude_km": round(altitude_km, 2),
            "subpoint": {
                "latitude_deg": round(subpoint.latitude.degrees, 2),
                "longitude_deg": round(subpoint.longitude.degrees, 2)
            }
        })

    except Exception as e:
        return jsonify({"message": f"Calculation error: {e}"}), 500

@app.route('/')
def serve_frontend():
    return render_template('index.html')

# --- Main ---
if __name__ == '__main__':
    print("\U0001F6F8 Initializing Space Debris Tracker backend...")
    init_db()
    debris_data = load_debris_from_db()
    if debris_data:
        print(f"✅ Loaded {len(debris_data)} TLE entries from DB.")
        current_objects_data = calculate_and_format_objects(debris_data)
    else:
        print("⚠️ No TLE data found in database.")
    app.run(host='127.0.0.1', port=5000, debug=True)