Package.describe({
    summary: "Serves a Meteor app over HTTP",
    meteor: "0.8.1.3"
})

Package.server({
    require: [
        "logging",
        "routepolicy"
        //"application-configuration",
        //"follower-livedata",
    ],
    files: ["webapp_server"]
})