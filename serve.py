#!/usr/bin/env python
# -*- coding: utf-8 -*-

# usage:
# $ python2 serve.py
# -> http://localhost:8001/

import SimpleHTTPServer
import SocketServer

# geolonicaのAPIがhttp://localhost:{PORT}/でアクセス元制限かけてあるので注意
PORT = 18000
Handler = SimpleHTTPServer.SimpleHTTPRequestHandler
httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()
