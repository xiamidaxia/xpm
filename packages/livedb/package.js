Package.describe({
    summary: "Meteor's latency-compensated distributed data framework",
    meteor: true
})

Package.server({
    nrequire: ['sockjs']
})