module.exports = {
    checkRequireInsidePack: function() {
        require('a').should.eql({ INFO: 'this is a in file2.', NAME: 'a' })
    },
    checkRequireOuterPack: function() {
        var outer = {
            outer_exports1: 'outer/pack1 exports1',
            outer_exports2: 'outer/pack1 exports2'
        }
        require('../../outer/pack1').should.eql(outer)
        require('@/outer/pack1').should.eql(outer)
        require('@/outer/pack1/lib/file1.js').should.eql("outer/pack1/lib/file1 exports")
    },
    checkUnRequirePack: function() {
        ;
        (function() {
            require('b')
        }).should.throw("[server_pack/require_outside_files] unrequire: server_pack/b")
    },
    checkUnImportsPack: function() {
        ;
        (function() {
            require("@/unimports/pack1")
        }).should.throw("[server_pack/require_outside_files] unimport family: 'unimports'")
    }
}