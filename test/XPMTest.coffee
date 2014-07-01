should = require 'should'
Package = require '../lib/Package'
XpmServer = require '../lib/xpm_server'
XpmClient = require '../lib/xpm_client'
inspect = require('util').inspect
_ = require 'underscore'

describe "xpm", ()->
    describe 'xpm - Package', (done) ->
        a = null; b = null; _b = null
        it 'xpm - package -> exports扩展', (done) ->
            a = new Package({path:__dirname + "/pack1/a", type:"server"})
            a.execServer()
            a.getExports().should.eql({ INFO: 'this is a in file2.', NAME:'a'})
            done()
        it 'xpm - package -> module.exports扩展', (done) ->
            b = new Package({path:__dirname + "/pack1/b",type:"server"})
            b.execServer()
            b.getExports().should.eql("b module exports info")
            done()
        it 'xpm - package.execServer -> exports数组只有一个选项的扩展', (done) ->
            _b = new Package({path:__dirname + "/pack1/b_", type:"server"})
            _b.execServer()
            _b.getExports().should.eql("b file2 info")
            done()
        it 'xpm - package.execServer -> exports不存在的选项', (done) ->
            c = new Package({path:__dirname + "/pack1/c",type:"server"})
            _c = new Package({path:__dirname + "/pack1/c_",type:"server"})
            (()->
                c.execServer()
            ).should.throw("[pack1/c] exports扩展 ‘unknowname1’ 不存在")
            (()->
                _c.execServer()
            ).should.throw("[pack1/c_] exports扩展 ‘name2’ 不存在")
            done()
        it 'xpm - package.exportsToContext', (done) ->
            a.exportsToContext({}).should.eql({ INFO: 'this is a in file2.', NAME: 'a' })
            b.exportsToContext({}).should.eql({info: "b module exports info"})
            _b.exportsToContext({}).should.eql({_bfile2: "b file2 info"})
            done()
        it 'xpm - package alias', (done) ->
            d = new Package({path:__dirname + "/pack1/d",type:"server"})
            (()->
                d.execServer()
            ).should.throw("[pack1/d] exports扩展 ‘_’ 不存在")
            _d = new Package({path:__dirname + "/pack1/d",type:"server"})
            _d.execServer({underscore:"out underscore."})
            _d.getExports().should.eql({ name: 'd', _: 'out underscore.' })
            done()
        it 'xpm - package - coffee files', (done) ->
            f = new Package({path:__dirname + "/pack1/f",type:"server"})
            f.execServer()
            f.getExports().should.eql 'this is in coffee'
            done()
    describe 'xpm - XpmServer', ->
        xpm = null
        it 'xpm - 创建Xpm', (done) ->
            xpm = new XpmServer({cwd: __dirname})
            done()
        it 'xpm - Xpm.require', (done) ->
            c = xpm.require("pack2/c")
            c.should.eql(
                name: 'c',
                c: 'this is c in file1.',
                A: 'this is a in file1.',
                b1: 'this is b in file1.',
                b2: 'this is b in file2.'
                d: 'this is d in file1.'
            )
            done()
        it 'xpm - XPM包的依赖顺序正确', (done) ->
            p = xpm.use('pack2/c')
            xpm._checkPackageSequency(p, p._data.require).should.eql([ 'pack2/a', 'pack2/d', 'pack2/b' ])
            done()
        it 'xpm - 测试循环依赖是否报错', (done) ->
            xpm2 = new XpmServer({cwd: __dirname})
            (->
                xpm2.require('pack3/a')
            ).should.be.throw()
            done()
    describe 'xpm - XpmClient', ->
        it.only 'xpm - client - add packages', (done) ->
            xpm = new XpmClient({cwd: __dirname, dest: __dirname + "/dest"})
            xpm.add(["client-pack"])
            done()
