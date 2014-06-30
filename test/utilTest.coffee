should = require "should"
util = require "../lib/util"

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
    it "xpm - util - execFileByContext", (done) ->
        global.gOut = 333
        d = new Date
        sandbox = {_out1:333, _out2:{obj:333}, _out3: d}
        ret = util.execFileByContext(__dirname + "/pack3/sandboxfile.js", sandbox)
        ret = ret.ret
        should(global._out1).eql(undefined)
        should(global._out2).eql(undefined)
        should(global._out3).eql(undefined)
        should(global.gOut).eql(444)
        should(global.newGlobalVal).eql(444)
        should(sandbox).eql({_out1:333, _out2:{obj:444}, _out3: d})
        should(ret.testDate).eql(true)
        should(ret.testObject).eql(true)
        should(ret.testArray).eql(true)
        should(ret.testRegExp).eql(true)
        should(ret.dateObj).instanceOf(Date)
        done()