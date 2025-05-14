from flask import Flask, request, jsonify

app = Flask(__name__)




@app.route('/test', methods=['GET', 'POST'])
def test_api():
    if request.method == 'GET':
        return jsonify({"message": "GET request successful!", "data": request.args})
    
    if request.method == 'POST':
        data = request.get_json()
        return jsonify({"message": "POST request successful!", "received_data": data})
        
if __name__ == '__main__':
    app.run(debug=True)
