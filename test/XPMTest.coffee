should = require 'should'
Package = require '../Package'
XPM = require '../XPM'
inspect = require('util').inspect
_ = require 'underscore'

describe "xpm", ()->
    describe 'Package', (done) ->
        #nrequire use
        a = null; b = null; _b = null
        it 'package.exec -> exports扩展', (done) ->
            a = new Package({cwd:__dirname + "/pack1",name:"a",type:"server"})
            a.exec()
            a.getExports().should.eql({ INFO: 'this is a in file2.', NAME:'a'})
            done()
        it 'package.exec -> module.exports扩展', (done) ->
            b = new Package({cwd:__dirname + "/pack1",name:"b",type:"server"})
            b.exec()
            b.getExports().should.eql("b module exports info")
            done()
        it 'package.exec -> exports数组只有一个选项的扩展', (done) ->
            _b = new Package({cwd:__dirname + "/pack1",name:"b_",type:"server"})
            _b.exec()
            _b.getExports().should.eql("b file2 info")
            done()
        it 'package.exec -> exports不存在的选项', (done) ->
            c = new Package({cwd:__dirname + "/pack1",name:"c",type:"server"})
            _c = new Package({cwd:__dirname + "/pack1",name:"c_",type:"server"})
            (()->
                c.exec()
            ).should.throw("包 'c' 的exports扩展 ‘unknowname1’ 不存在")
            (()->
                _c.exec()
            ).should.throw("包 'c_' 的exports扩展 ‘name2’ 不存在")
            done()
        it 'package.exportsToContext', (done) ->
            a.exportsToContext({}).should.eql({ INFO: 'this is a in file2.', NAME: 'a' })
            b.exportsToContext({}).should.eql({info: "b module exports info"})
            _b.exportsToContext({}).should.eql({_bfile2: "b file2 info"})
            done()
        it 'package alias', (done) ->
            d = new Package({cwd:__dirname + "/pack1",name:"d",type:"server"})
            (()->
                d.exec()
            ).should.throw("unknow alias name: underscore")
            _d = new Package({cwd:__dirname + "/pack1",name:"d",type:"server"})
            _d.exec({underscore:"out underscore."})
            _d.getExports().should.eql({ name: 'd', _: 'out underscore.' })
            done()
    describe 'Xpm', ->
        xpm = null
        it '创建Xpm', (done) ->
            xpm = new XPM({cwd: __dirname + "/pack2"})
            done()
        it 'Xpm.require', (done) ->
            c = xpm.require("c")
            c.should.eql(
                name: 'c',
                c: 'this is c in file1.',
                a: 'this is a in file1.',
                b1: 'this is b in file1.',
                b2: 'this is b in file2.'
                d: 'this is d in file1.'
            )
            done()
        it 'XPM包的依赖顺序正确', (done) ->
            xpm.require("c")
            xpm.getMap("server")['c'].getSequencyRequire().should.eql(['a','d', 'b'])
            done()
        it '测试循环依赖是否报错', (done) ->
            xpm2 = new XPM({cwd: __dirname + '/pack3'})
            (->
                xpm2.require('a')
            ).should.be.throw()
            done()
    describe 'check defaults', ->
        xpm = null
        it '创建default的xpm, 并使用defaults, alias, imports配置', (done) ->
            xpm = new XPM({cwd: __dirname + '/pack2',default: true, imports:{outs1: "this is in outs1."}})
            defaultContext =
                outs1: 'this is in outs1.',
                A: 'this is a in file1.',
                name: 'b',
                b1: 'this is b in file1.',
                b2: 'this is b in file2.',
                d: 'this is d in file1.'
            defaultPack = xpm.getMap("server")["__default__"]
            defaultPack.getExports().should.eql(defaultContext)
            defaultPack.exportsToContext({}).should.eql(defaultContext)
            done()
        it 'default默认加载模块可直接调用', (done) ->
            e = xpm.require('e')
            e.should.eql(
                e: 'this is e in file1.',
                name: 'e',
                b1: 'this is b in file1.',
                b2: 'this is b in file2.',
                A: 'this is a in file1.',
                d: 'this is d in file1.'
                outs1: "this is in outs1."
            )
            done()



