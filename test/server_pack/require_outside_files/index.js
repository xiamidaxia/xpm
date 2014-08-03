module.exports = {
    checkRequireInsidePack: function() {
        require('server_pack/a').should.eql({ INFO: 'this is a in file2.', NAME: 'a' })
    },
    checkRequireOuterPack: function() {
        var outer = {
            outer_exports1: 'outer/pack1 exports1',
            outer_exports2: 'outer/pack1 exports2'
        }
        require('outer/pack1').should.eql(outer)
        require('outer/pack1/lib/file1.js').should.eql("outer/pack1/lib/file1 exports")
    },
    checkUnRequirePack: function() {
        ;
        (function() {
            require('server_pack/b')
        }).should.throw("[server_pack/require_outside_files] no import: server_pack/b")
    },
    checkUnRequireOuterPack: function() {
        ;
        (function() {
            require("other/pack1")
        }).should.throw("[server_pack/require_outside_files] no import: other/pack1")
    }
}