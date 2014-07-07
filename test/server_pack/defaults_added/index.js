exports.checkJquery = function() {
    require('server_pack/default_pack/jquery').should.be.a.Function
}
exports.checkUnderscore = function() {
   require('server_pack/default_pack')['each'].should.be.an.Function
}
