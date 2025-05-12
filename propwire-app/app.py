from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/search', methods=['POST'])
def search_properties():
    data = request.json
    payload = {
        "query": {
            "location": data.get("location", ""),
            "filters": {
                "priceMin": int(data.get("min_price", 0)),
                "priceMax": int(data.get("max_price", 9999999)),
                "propertyTypes": [data.get("property_type", "house")]
            }
        },
        "limit": 5
    }

    headers = {
        "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9....",  # Shortened for clarity
        "X-XSRF-Token": "eyJpdiI6Ild2QVRiWDBhbnVSOTJKNDJO...",  # Full token here
        "Content-Type": "application/json",
        "Origin": "https://propwire.com",
        "Referer": "https://propwire.com/",
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "DNT": "1"
    }

    response = requests.post("https://api.propwire.com/v1/properties/search", headers=headers, json=payload)

    if response.ok:
        properties = response.json().get('data', [])
        results = []
        for p in properties:
            address = p.get("address", {}).get("full", "No address")
            price = p.get("listPrice", "N/A")
            lat = p.get("location", {}).get("lat")
            lng = p.get("location", {}).get("lng")
            results.append({
                "address": address,
                "price": price,
                "latitude": lat,
                "longitude": lng
            })
        return jsonify({"results": results})
    else:
        return jsonify({"error": "Failed to fetch from Propwire", "details": response.text}), 500

if __name__ == '__main__':
    app.run(debug=True)

