should = require 'should'
Package = require '../lib/Package'
XpmServer = require '../lib/xpm_server'
XpmClient = require '../lib/xpm_client'
inspect = require('util').inspect
_ = require 'underscore'
path = require 'path'

describe "xpm", ()->
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
        xpm = new XpmServer({cwd: __dirname})
        it 'xpm - XpmServer - main path', (done) ->
            ret = xpm.require('server_pack/check_main_path')
            ret.should.be.eql("this is in default-main-file")
            ret2 = xpm.require('server_pack/check_main_path/requireInsideMain')
            ret2.should.eql("this is in default-main-file")
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
            ).should.throw('[server_pack/require_inside_files] not add file：' + __dirname + "/server_pack/require_inside_files/unaddFile.js")
            done()
        it 'xpm - XpmServer - require ouside files', (done) ->
            ret = xpm.require('server_pack/require_outside_files')
            ret.checkRequireInsidePack()
            ret.checkRequireOuterPack()
            ret.checkUnRequirePack()
            ret.checkUnRequireOuterPack()
            done()
        it 'xpm - XpmServer - create unknow cwd path', (done) ->
            (()->
                xpm = new XpmServer({cwd: "/unknow/path"})
            ).should.throw("xpm unknow cwd path: /unknow/path")
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
            p._fileCache['index.js'].should.not.be.empty
            curfilepath = __dirname + "/outer/pack1/index.js"
            detail = xpm._getRequirePathDetail("./lib/file1", curfilepath)
            xpm._execFile(detail)
            p._fileCache['lib/file1.js'].ret.should.be.eql('outer/pack1/lib/file1 exports')
            done()
        it 'xpm - XpmServer - method _getRequirePathDetail', (done) ->
            _path = __dirname + "/pack1/a/file1.js"
            checkPath = (str, checkstr, family, packname) ->
                detail = xpm._getRequirePathDetail(str, _path)
                _p = path.relative(__dirname, detail.path)
                _p.should.eql(checkstr)
                detail.family.should.eql(family)
                detail.packname.should.eql(packname)
                return detail
            checkPath("pack2/bb/a.js", "pack2/bb/a.js",'pack2','bb')
            checkPath("./lib/file2.js", "pack1/a/lib/file2.js",'pack1','a')
            checkPath("../b/file1.js", "pack1/b/file1.js",'pack1','b')
            checkPath("../file1.js", "pack1/file1.js", 'pack1', 'file1.js')
            checkPath("pack2/a/","pack2/a",'pack2','a')
            checkPath("pack2/a","pack2/a",'pack2','a').ismain.should.be.ok
            checkPath('./','pack1/a','pack1','a').ismain.should.be.ok
            checkPath('.','pack1/a','pack1','a').ismain.should.be.ok
            xpm._getRequirePathDetail("pack2/a").should.be.an.Object
            xpm._getRequirePathDetail("pack2/a/file.js").should.be.an.Object
            (()->
                xpm._getRequirePathDetail("../pac3/a")
            ).should.throw("require('../pac3/a'): can not use '.' or '..' out of package")
            (()->
                xpm._getRequirePathDetail("/pack2/a", _path)
            ).should.throw("["+_path+"] require('/pack2/a'): can not use root path.")
            (()->
                xpm._getRequirePathDetail("../../../b/file1.js", _path)
            ).should.throw("["+_path+"] require('../../../b/file1.js'): outer workspace.")
            (()->
                xpm._getRequirePathDetail("pack2", _path)
            ).should.throw("["+_path+"] require('pack2'): uncorrect.")
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
            xpm2 = new XpmServer({cwd: __dirname})
            (->
                xpm2.require('check_recurse/a')
            ).should.be.throw('Recursive dependencies detected: check_recurse/a -> check_recurse/b -> check_recurse/c -> check_recurse/a')
            done()
        it 'xpm - XpmServer - check test imports', (done) ->
            xpm.require('server_pack/check_test_imports')
            xpm2 = new XpmServer({cwd: __dirname, production:true})
            (->
                xpm2.require('server_pack/check_test_imports')
            ).should.be.throw()
            done()
    describe 'xpm - XpmClient', ->
        it 'xpm - client - add packages', (done) ->
            xpm = new XpmClient({cwd: __dirname, dest: __dirname + "/dest"})
            xpm.add(["client_pack"], null, ()->
                done()
            )
