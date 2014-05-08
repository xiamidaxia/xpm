Package.all({
    defaults: {
        "_": "underscore",
        "Xiami": "meteor"
    },
    imports: ["Meteor"]  //you need to add a connect app as a Meteor
})

Package.server({
})

Package.client({
    defaults: {
        //"$": "jquery",
        //"supports": "supports"  //support: json es5
    }
})


