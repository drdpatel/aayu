from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Example rule-based questionnaire
QUESTIONS = [
    {"id": 1, "text": "Do you have any allergies?"},
    {"id": 2, "text": "Are you currently taking medication?"},
    {"id": 3, "text": "Describe your primary symptoms."}
]

FHIR_PATIENTS = []

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Return the list of questionnaire questions."""
    return jsonify(QUESTIONS)

@app.route('/api/submit', methods=['POST'])
def submit_answers():
    data = request.get_json()
    # Call Learning House API for eligibility verification (stub)
    # response = requests.post('https://learninghouse.example.com/api/verify', json=data)
    eligibility = {"eligible": True}
    return jsonify({"status": "received", "eligibility": eligibility})

@app.route('/api/fhir/patient', methods=['POST'])
def create_patient():
    patient = request.get_json()
    FHIR_PATIENTS.append(patient)
    return jsonify(patient), 201

@app.route('/api/fhir/patient/<int:idx>', methods=['GET'])
def get_patient(idx):
    if 0 <= idx < len(FHIR_PATIENTS):
        return jsonify(FHIR_PATIENTS[idx])
    return jsonify({"error": "Not found"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
