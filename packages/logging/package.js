Package.describe({
    summary:"",
    meteor: "0.8.1.3"
})

Package.all({
    "nrequire": ["cli-color"],
    "alias": {
        "cli-color": "cliColor"
    },
    "require": ["ejson"],
    "files": ["logging"],
    "exports": ["Log"]
})

Package.test({
    "files": ['logging_test']
})