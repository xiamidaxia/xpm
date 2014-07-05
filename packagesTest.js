var xpm = require('./index')
var xpmServer = xpm.createServerXpm({ cwd: __dirname})

//xpmServer.require("meteor/underscore")
var deps = xpmServer.require('meteor/deps')
xpmServer.test(["meteor/meteor"])
