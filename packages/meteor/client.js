module.exports = Meteor = {}

Meteor.isServer = false
Meteor.isClient = true
Meteor.debug = function(msg) {
    console.log(msg)
}
