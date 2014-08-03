should = require 'should'
Package = require '../lib/Package'
XpmServer = require '../lib/xpm_server'
XpmClient = require '../lib/xpm_client'
inspect = require('util').inspect
_ = require 'underscore'
path = require 'path'

describe "xpm", ()->
    addFamilies = (xpm)->
        _arr = ["check_recurse","check_sequence","server_pack","client_pack","outer"]
        _obj = {}
        _arr.forEach((item)->
            _obj[item] = path.join(__dirname,item)
        )
        xpm.addFamily(_obj)
    describe 'xpm - package', (done) ->
        it 'xpm - package - _addData', (done) ->
            a = new Package({path: __dirname + "/server_pack/a", type: "server"})
            a.all(
                imports: ["a",'a','b','b']
                files: ['/style/*.css','/img/*.jpg']
                main: "main"
            )
            a._data.should.eql(
                imports: [  "server_pack/default_pack", 'server_pack/b' ],
                files: [ '*.js', '/style/*.css', '/img/*.jpg' ],
                test_files: [],
                test_imports: []
                main: 'main'
            )
            done()
        it 'xpm - package - getFiles, getTestFiles, getFilesSplitingByExtname', (done) ->
            p = new Package({path: __dirname + "/server_pack/check_files", type: "server"})
            p.getTestFiles().should.be.eql(
                [ 'fileTest.js',
                  'test',
                  'test.js',
                  'test/libs',
                  'test/libs/file.js' ]
            )
            p.getFiles().should.be.eql(
                [ 'file.js', 'libs', 'libs/file.js', 'libs/libTest.js' ]
            )
            p.getFilesSplitingByExtname().should.be.eql(
                '.js': [ 'file.js', 'libs/file.js', 'libs/libTest.js' ],
                __unknown__: [ 'libs' ]
            )
            done()
    describe 'xpm - XpmServer', ->
        xpm = new XpmServer()
        addFamilies(xpm)
        it 'xpm - XpmServer - unknow family', (done) ->
            (()->
                xpm.addFamily({'unknow': __dirname + "/unknow"})
            ).should.throw('xpm family `unknow` unknow path: ' + __dirname + '/unknow')
            (()->
                xpm.require('unknown/aa')
            ).should.throw('unknow family name: unknown')
            done()
        it 'xpm - XpmServer - main path', (done) ->
            ret = xpm.require('server_pack/check_main_path')
            ret.should.be.eql("this is in default-main-file")
            ret2 = xpm.require('server_pack/check_main_path/requireInsideMain')
            ret2.should.eql("this is in default-main-file")
            done()
        it 'xpm - XpmServer - main preload', (done) ->
            p = xpm.addPackage('server_pack','main_preload')
            p._fileCache['index.js'].ret.should.be.eql("main preloaded")
            done()
        it 'xpm - XpmServer - default package.js', (done) ->
            ret = xpm.require('server_pack/defaults_added')
            ret.checkJquery()
            ret.checkUnderscore()
            done()
        it 'xpm - XpmServer - check require params that have not extname', (done) ->
            ret = xpm.require('server_pack/require_extname_check')
            ret.should.eql(
                lib1: 'lib1 load success',
                mainfile: "main file load success"
            )
            done()
        it 'xpm - XpmServer - coffee files', (done) ->
            ret = xpm.require('server_pack/coffeefile')
            ret.should.eql("this is in coffee file.")
            done()
        it 'xpm - XpmServer - require inside file', (done) ->
            ret = xpm.require('server_pack/require_inside_files')
            ret.add_core1_file.should.ok
            ret.add_core2_file.should.ok
            ret.addFileCheck().should.ok
            (()->
                ret.unaddFileCheck()
            ).should.throw('[server_pack/require_inside_files] not add file：' + "unaddFile.js")
            done()
        it 'xpm - XpmServer - require ouside files', (done) ->
            ret = xpm.require('server_pack/require_outside_files')
            ret.checkRequireInsidePack()
            ret.checkRequireOuterPack()
            ret.checkUnRequirePack()
            ret.checkUnRequireOuterPack()
            done()
        it 'xpm - XpmServer - create unknow family path', (done) ->
            (()->
                xpm.require('unknow/packname')
            ).should.throw("unknow family name: unknow")
            done()
        it 'xpm - XpmServer - method _checkNativeRequire', (done) ->
            _require = XpmServer.prototype._checkNativeRequire
            _require('fs', __filename).should.be.eql(require('fs'))
            _require('./fs',__filename).should.not.be.ok
            _require('../fs',__filename).should.not.be.ok
            _require('aa/bb',__filename).should.not.be.ok
            _require('underscore',__filename).should.be.eql(require('underscore'))
            _require('unknow',__filename).should.not.be.ok
            done()
        it 'xpm - XpmServer - check _execFile caching', (done) ->
            p = xpm.addPackage("outer","pack1")
            ret1 = xpm.require('outer/pack1')
            ret2 = xpm.require('outer/pack1/index.js')
            ret3 = p._fileCache['index.js'].ret
            ret1.should.eql(ret2)
            ret1.should.eql(ret3)
            detail = xpm._getRequirePathDetail("./lib/file1", "./index.js", p)
            xpm._execFile(detail)
            p._fileCache['lib/file1.js'].ret.should.be.eql('outer/pack1/lib/file1 exports')
            done()
        it 'xpm - XpmServer - method _getRequirePathDetail', (done) ->
            p1 = xpm.addPackage('outer', 'pack1')
            checkPath = (str, checkstr, family, packname) ->
                detail = xpm._getRequirePathDetail(str, "lib/file1.js", p1)
                detail.path.should.eql(checkstr)
                detail.family.should.eql(family)
                detail.packname.should.eql(packname)
                return detail
            checkPath("outer/pack1/a.js", "a.js",'outer','pack1')
            checkPath("outer/pack2/a.js", "a.js",'outer','pack2')
            checkPath("outer2/a/","",'outer2','a')
            checkPath("outer2/a","",'outer2','a').ismain.should.be.ok
            checkPath("./file1.js", "lib/file1.js",'outer','pack1')
            checkPath("../lib2/file1.js", "lib2/file1.js",'outer','pack1')
            checkPath("../index.js", "index.js", 'outer', 'pack1')
            checkPath('./','lib','outer','pack1')
            checkPath('.','lib','outer','pack1')
            checkPath('../','','outer','pack1').ismain.should.be.ok
            (()->
                checkPath("../../outer3/a")
            ).should.throw("[outer/pack1] [lib/file1.js] require('../../outer3/a'): outer current package workspace.")
            (()->
                checkPath("/pack2/a")
            ).should.throw("[outer/pack1] [lib/file1.js] require('/pack2/a'): can not use root path.")
            (()->
                checkPath("pack2")
            ).should.throw("[outer/pack1] [lib/file1.js] require('pack2'): uncorrect.")
            done()
        it 'xpm - XpmServer - method require', (done) ->
            a1 = xpm.require('server_pack/a')
            a2 = xpm.require('server_pack/a/file2.js')
            a1.should.be.eql(a2)
            xpm.require('server_pack/a/file1').should.be.eql({ INFO: 'this is a in file1.' })
            (()->
                xpm.require('gg/')
            ).should.throw()
            (()->
                xpm.require('../gg')
            ).should.throw()
            (()->
                xpm.require("/gg/gg")
            ).should.throw()
            done()
        it 'xpm - XpmServer - check package require sequence', (done) ->
            p = xpm.addPackage('check_sequence','c')
            xpm._checkPackageSequency(p, p._data.imports).should.eql([ 'check_sequence/a', 'check_sequence/d','check_sequence/b' ])
            done()
        it 'xpm - XpmServer - check package require recurse', (done) ->
            xpm2 = new XpmServer()
            xpm2.addFamily({check_recurse: __dirname + "/check_recurse"})
            (->
                xpm2.require('check_recurse/a')
            ).should.be.throw('Recursive dependencies detected: check_recurse/a -> check_recurse/b -> check_recurse/c -> check_recurse/a')
            done()
        it 'xpm - XpmServer - check test imports', (done) ->
            xpm.require('server_pack/check_test_imports')
            xpm2 = new XpmServer({production:true})
            (->
                xpm2.require('server_pack/check_test_imports')
            ).should.be.throw()
            done()
    describe 'xpm - XpmClient', ->
        it 'xpm - client - add packages', (done) ->
            xpm = new XpmClient({dest: __dirname + "/dest"})
            xpm.addFamily(
                client_pack: __dirname + "/client_pack"
            )
            xpm.add(["client_pack/*"], ()->
                done()
            )
