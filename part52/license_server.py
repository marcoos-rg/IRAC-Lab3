import json
from http.server import HTTPServer, BaseHTTPRequestHandler

USERS = {
    "user1": {"password": "pass1", "allowed": True},
    "user2": {"password": "pass2", "allowed": False}
}

DRM_KEYS = {
    "oW5AK5BW43HzbTSKpiu3SQ": "hyN9IKGfWKdAwFaE5pm0qg"
}

class LicenseHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/get-license':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                user = data.get('user')
                password = data.get('password')
                if user in USERS and USERS[user]['password'] == password and USERS[user]['allowed']:
                    response = json.dumps({"status": "ok", "clearkeys": DRM_KEYS})
                    self.send_response(200)
                else:
                    response = json.dumps({"status": "error", "message": "Access denied"})
                    self.send_response(403)
            except:
                response = json.dumps({"status": "error"})
                self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response.encode())

    def log_message(self, format, *args):
        print(f"[LICENSE SERVER] {args[0]} {args[1]} {args[2]}")

print("License server running on port 8001...")
HTTPServer(('0.0.0.0', 8001), LicenseHandler).serve_forever()
