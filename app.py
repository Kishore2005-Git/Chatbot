from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")

if not API_KEY:
    raise ValueError("API_KEY is missing from the .env file! Please add it.")

# API Endpoint
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    try:
        # Get user input from request
        data = request.get_json()
        user_input = data.get("message", "").strip()

        if not user_input:
            return jsonify({"error": "Please enter a message!"}), 400

        # Prepare payload
        payload = {"contents": [{"parts": [{"text": user_input}]}]}

        # Send request to Gemini API
        response = requests.post(
            f"{GEMINI_API_URL}?key={API_KEY}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        # Raise error if API request fails
        response.raise_for_status()
        data = response.json()

        # Extract response text
        generated_content = extract_response_text(data)

        return jsonify({"response": generated_content or "No response received from API."})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"HTTP error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

def extract_response_text(api_response):
    """
    Extracts chatbot response text from the Gemini API response.
    """
    try:
        if "candidates" in api_response and api_response["candidates"]:
            first_candidate = api_response["candidates"][0]
            if "content" in first_candidate:
                content_parts = first_candidate["content"].get("parts", [])
                if content_parts:
                    return content_parts[0].get("text", "No valid response.")
        return "No valid response from API."
    except Exception as e:
        print(f"Error extracting response: {str(e)}")
        return "Error processing response."

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
