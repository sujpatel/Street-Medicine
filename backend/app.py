import os 
from flask import Flask #imports flask 
from flask_sqlalchemy import SQLAlchemy 
from datetime import datetime
from flask import request, jsonify
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'entries.db')}"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app) 

scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

creds = ServiceAccountCredentials.from_json_keyfile_name("google-credentials.json", scope)


client = gspread.authorize(creds)




class Entry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    items_given = db.Column(db.String(200))
    appearance = db.Column(db.String(200))
    notes = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_complete = db.Column(db.Boolean, default=False)
    
@app.route("/")
def home():
    return "CMSRU Street Med API is Running"

@app.route("/ping")
def ping():
    return "pong"


@app.route("/entries", methods=["GET"])
def get_entries():
    entries = Entry.query.all()
    result = []
    
    for e in entries:
        result.append({
            "id": e.id,
            "name": e.name,
            "items_given": e.items_given,
            "appearance": e.appearance,
            "notes": e.notes,
            "timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M"),
            "is_complete": e.is_complete
        })
    return jsonify(result)

@app.route("/entries", methods=["POST"])
def create_entry():
    data = request.get_json()
    
    if "name" not in data or "items_given" not in data:
        return jsonify({"error": "Missing name or items_given"}), 400
    
    new_entry = Entry(
        name=data["name"],
        items_given=data["items_given"],
        appearance=data.get("appearance", ""),
        notes=data.get("notes","")
    )
    db.session.add(new_entry)
    db.session.commit()
    
    return jsonify({"message": "Entry added successfully"}), 201

@app.route("/entries/<int:id>", methods=["PUT"])
def update_entry(id):
    data = request.get_json()
    entry = Entry.query.get(id)
    
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    
    entry.name = data.get("name", entry.name)
    entry.items_given = data.get("items_given", entry.items_given)
    entry.appearance = data.get("appearance", entry.appearance)
    entry.notes = data.get("notes", entry.notes)
    entry.is_complete = data.get("is_complete", entry.is_complete)
    
    db.session.commit()
    return jsonify({"message": "Entry updates successfully"})

@app.route("/export-to-sheets", methods=["POST"])
def export_to_sheets():
    data = request.get_json()
    
    if "name" not in data or "items_given" not in data:
        return jsonify({"error": "Missing name or items_given"}), 400
    
    try:
        sheet = client.open("CMSRU Outreach Log").sheet1
        sheet.append_row([
            data["name"],
            data["items_given"],
            data.get("appearance", ""),
            data.get("notes", ""),
            "Yes" if data.get("is_complete") else "No"
        ])
    
        return jsonify({"message": "Exported to Google Sheets!"}), 200
    except Exception as e:
        return jsonify({"error": f"Sheet export failed: {str(e)}"}), 500



if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)