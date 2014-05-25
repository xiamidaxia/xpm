should = require "should"
util = require "../util"

describe "xpm - util", ->
    it "xpm - util - extend", (done) ->
        a = {a: 99}; b = {b:44,c:55}; c = {a:33}
        util.extend(a,b,c).should.be.exactly(a)
        a.should.eql({a:33,b:44,c:55})
        done()
    it "xpm - util - assertType", (done) ->
        a = ()->
        b = ""
        assertType = util.assertType
        assertType("test...", "Function | String")
        assertType(a, "Function")
        ()->assertType(b, "Array", "Error...").should.throw("Error...")
        done()