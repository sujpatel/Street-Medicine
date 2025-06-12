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
    description = db.Column(db.String(500))
    items_asked_for = db.Column(db.String(500))
    points_of_contact = db.Column(db.String(500))
    addiction_counseling = db.Column(db.String(500))
    medical_supplies_given = db.Column(db.String(500))
    community_resources_discussed = db.Column(db.String(500))
    hospitality_items_given = db.Column(db.String(500))
    narcan = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    narcan_recipient_name= db.Column(db.String(200))
    narcan_dob = db.Column(db.String(100))
    narcan_doses = db.Column(db.String(50))
    medical_advice_given = db.Column(db.String(100))
    is_complete = db.Column(db.Boolean, default=False)
    
@app.route("/")
def home():
    return "CMSRU Street Med API is Running"

@app.route("/entries", methods=["GET"])
def get_entries():
    entries = Entry.query.all()
    result = []
    
    for e in entries:
        result.append({
            "id": e.id,
            "description": e.description,
            "items_asked_for": e.items_asked_for,
            "points_of_contact": e.points_of_contact,
            "addiction_counseling": e.addiction_counseling,
            "medical_supplies_given": e.medical_supplies_given,
            "community_resources_discussed": e.community_resources_discussed,
            "hospitality_items_given": e.hospitality_items_given,
            "narcan": e.narcan,
            "narcan_recipient_name": e.narcan_recipient_name,
            "narcan_dob": e.narcan_dob,
            "narcan_doses": e.narcan_doses,
            "medical_advice_given": e.medical_advice_given,
            "timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M"),
            "is_complete": e.is_complete
        })
    return jsonify(result)

@app.route("/entries", methods=["POST"])
def create_entry():
    data = request.get_json()
    
    if "description" not in data or "items_asked_for" not in data:
        return jsonify({"error": "Missing description or items_asked_for"}), 400
    
    new_entry = Entry(
    description=data.get("description", ""),
    items_asked_for=data.get("items_asked_for", ""),
    points_of_contact=data.get("points_of_contact", ""),
    addiction_counseling=data.get("addiction_counseling", ""),
    medical_supplies_given=data.get("medical_supplies_given", ""),
    community_resources_discussed=data.get("community_resources_discussed", ""),
    hospitality_items_given=data.get("hospitality_items_given", ""),
    narcan=data.get("narcan", ""),narcan_recipient_name=data.get("narcan_recipient_name", ""),
    narcan_dob=data.get("narcan_dob", ""),
    narcan_doses=data.get("narcan_doses", ""),
    medical_advice_given=data.get("medical_advice_given", ""),
    is_complete=data.get("is_complete", False)
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
    
    entry.description = data.get("description", entry.description)
    entry.items_asked_for = data.get("items_asked_for", entry.items_asked_for)
    entry.points_of_contact = data.get("points_of_contact", entry.points_of_contact)
    entry.addiction_counseling = data.get("addiction_counseling", entry.addiction_counseling)
    entry.medical_supplies_given = data.get("medical_supplies_given", entry.medical_supplies_given)
    entry.community_resources_discussed = data.get("community_resources_discussed", entry.community_resources_discussed)
    entry.hospitality_items_given = data.get("hospitality_items_given", entry.hospitality_items_given)
    entry.narcan = data.get("narcan", entry.narcan)
    entry.narcan_recipient_name = data.get("narcan_recipient_name", entry.narcan_recipient_name)
    entry.narcan_dob = data.get("narcan_dob", entry.narcan_dob)
    entry.narcan_doses = data.get("narcan_doses", entry.narcan_doses)
    entry.medical_advice_given = data.get("medical_advice_given", entry.medical_advice_given)

    entry.is_complete = data.get("is_complete", entry.is_complete)

    
    db.session.commit()
    return jsonify({"message": "Entry updates successfully"})

@app.route("/entries/<int:id>", methods=["DELETE"])
def delete_entry(id):
    entry = Entry.query.get(id)
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Entry deleted successfully"})


@app.route("/export-to-sheets", methods=["POST"])
def export_to_sheets():
    data = request.get_json()
    
    if "name" not in data or "items_given" not in data:
        return jsonify({"error": "Missing name or items_given"}), 400
    
    try:
        sheet = client.open("CMSRU Outreach Log").sheet1
        sheet.append_row([
            data["description"],
            data["items_asked_for"],
            data.get("points_of_contact", ""),
            data.get("addiction_counseling", ""),
            data.get("medical_supplies_given", ""),
            data.get("hospitality_items_given", ""),
            data.get("narcan", ""),
            data.get("narcan_recipient_name", ""),
            data.get("narcan_dob", ""),
            data.get("narcan_doses", ""),
            "Yes" if data.get("is_complete") else "No"
            "Yes" if data.get("is_complete") else "No"
        ])
    
        return jsonify({"message": "Exported to Google Sheets!"}), 200
    except Exception as e:
        return jsonify({"error": f"Sheet export failed: {str(e)}"}), 500




if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)