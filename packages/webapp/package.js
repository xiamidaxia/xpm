Package.describe({
    summary: "Serves a Meteor app over HTTP",
    meteor: "0.8.1.3"
})

Package.server({
    nrequire: ['connect', 'send', 'useragent'],
    require: [
        //"logging",
        //"routepolicy",
        //"application-configuration",
        //"follower-livedata",
    ],
    files: []
})