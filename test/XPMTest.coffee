should = require 'should'
Package = require '../Package'
XPM = require '../XPM'
inspect = require('util').inspect
_ = require 'underscore'

describe "xpm", ()->
    describe 'server package', (done) ->
        #nrequire use
        a = null; b = null; c = null;
        it 'server package exports', (done) ->
            a = new Package({cwd:__dirname + "/pack1",name:"a",type:"server"})
            a.exec({"info":"this will be cover", "name":"bala"})
            a.getExports().should.eql({ info: 'this is a in file2.', name:'a'})
            done()
        it 'server package module_exports', (done) ->
            b = new Package({cwd:__dirname + "/pack1",name:"b",type:"server"})
            b.exec({"info":"this will be cover"})
            b.getExports().should.eql("b module exports info")
            done()
        it 'server package require', (done) ->
            c = new Package({cwd:__dirname + "/pack1",name:"c",type:"server"})
            c._data.require.should.eql({a:"a",b:"b"})
            done()
    describe 'server xpm', ->
        xpm = null
        it '创建XPM', (done) ->
            xpm = new XPM({cwd: __dirname + "/pack1"})
            done()
        it 'XPM.require', (done) ->
            c = xpm.require("c")
            c.should.eql(
                B: 'b module exports info'
                A: { info: 'this is a in file2.', name: 'a' }
                NAME: 'c'
            )
            done()
        it 'XPM包的依赖顺序正确', (done) ->
            xpm.require("c")
            xpm.getMap("server")['c'].getSequencyRequire().should.eql(['a','b'])
            done()
        it '测试循环依赖是否报错', (done) ->
            xpm2 = new XPM({cwd: __dirname + '/pack2'})
            (->
                xpm2.require('a')
            ).should.be.throw()
            done()
    describe 'check defaults', ->
        xpm = null
        it '创建包含default的xpm', (done) ->
            xpm = new XPM({cwd: __dirname + '/pack1',default: true, outs:{outs1: "this is in outs1."}})
            done()
        it 'default默认加载的require可直接调用', (done) ->
            d = xpm.require('d')
            d.should.eql({ name: 'd', 'this is from b extend': 'b module exports info' })
            done()
        it 'default outs 参数是否可调用', (done) ->
            e = xpm.require('e')
            e.should.eql({ name: 'e', 'this is from outs1': 'this is in outs1.' })
            done()



