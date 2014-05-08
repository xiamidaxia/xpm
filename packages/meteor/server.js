Meteor.isServer = true
Meteor.isClient = false
Meteor.debug = Meteor.debug || function(msg) { console.log(msg);}
Meteor.app = Meteor.app || Meteor        //a server side app