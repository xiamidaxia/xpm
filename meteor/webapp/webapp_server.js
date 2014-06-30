var fs = require('fs')
var http = require('http')
var os = require('os')
var path = require('path')


var runWebAppServer = function() {
    //webserver
    var app = connect()

    // Auto-compress any json, javascript, or text.
    app.use(connect.compress())
}