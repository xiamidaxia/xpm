module.exports = {
    dest: __dirname + "/dest",
    family: {
        client_pack: __dirname + "/test/client_pack"
    },
    add: ["client_pack/*"],
    production: false,
    static_url: "/static",  //
    test: ["client_pack/*"], //this will auto run all test files
    mocha_opts: {},
    watch: true
}
