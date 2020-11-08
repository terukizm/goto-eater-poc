#!/usr/bin/env python
# -*- coding: utf-8 -*-

# usage:
# $ python2 serve.py
# -> http://localhost:8000/

import SimpleHTTPServer
import SocketServer

PORT = 8000
Handler = SimpleHTTPServer.SimpleHTTPRequestHandler
httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()
