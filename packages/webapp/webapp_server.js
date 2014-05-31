var runWebAppServer = function() {
    //webserver
    var app = connect()

    // Auto-compress any json, javascript, or text.
    app.use(connect.compress())
}