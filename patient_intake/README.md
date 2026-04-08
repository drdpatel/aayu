# Patient Intake System

This example demonstrates a simple patient intake workflow with a React front-end and Python Flask back-end. It is designed to be deployable on Azure and provides stub endpoints for FHIR integration and real-time patient eligibility checks.

## Backend (Flask)

- **/api/questions** – returns a list of rule-based questions.
- **/api/submit** – accepts questionnaire answers and simulates a call to the Learning House API for eligibility verification.
- **/api/fhir/patient** – basic endpoint to create a FHIR Patient resource in memory.

To run the back-end locally:

```bash
pip install -r requirements.txt
python app.py
```

## Frontend (React)

The front-end is a lightweight React app using CDN scripts. Open `frontend/index.html` after the back-end is running or serve it via any HTTP server so that the API requests are proxied to the Flask server.

## Deploying to Azure

1. Create an Azure App Service for the Flask app and configure the startup command to run `python app.py`.
2. Serve the contents of `frontend/` via Azure Storage static website hosting or another web server.
3. Ensure the front-end API URLs point to the deployed Flask app.

This basic setup can be extended with proper authentication, database support, and full FHIR compatibility as needed.
