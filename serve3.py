import http.server
import socketserver

# Python3用

# geolonicaのAPIがhttp://localhost:{PORT}/でアクセス元制限かけてあるので注意
PORT = 18000
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
