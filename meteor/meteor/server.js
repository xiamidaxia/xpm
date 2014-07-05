var Meteor = {}
Meteor.isServer = true
Meteor.isClient = false
//Meteor.app = app        //a server side app


Meteor.boot = function(fn) {
    return Fiber(fn).run()
}

exports.Meteor = Meteor
