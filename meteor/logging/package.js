Package.describe({
    summary:"",
    meteor: "0.8.1.3"
})

Package.all({
    "require": ["ejson"],
    "files": ["logging"],
    "exports": ["Log"],
    "tests": ['logging_test']
})

