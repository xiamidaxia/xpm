should = require 'should'
Package = require '../lib/Package'
XpmServer = require '../lib/xpm_server'
XpmClient = require '../lib/xpm_client'
inspect = require('util').inspect
_ = require 'underscore'
path = require 'path'

describe "xpm", ()->
    describe 'xpm - package', (done) ->
        xpm = new XpmServer({cwd: __dirname})
        it 'xpm - package - _addData', (done) ->
            a = new Package({path: __dirname + "/server_pack/a", type: "server", xpm:xpm})
            a.all(
                imports: ['a','a','b','b']
                exports: ['a','a','b','b']
                require: ["a",'a','b','b']
                defaults: ['c','c','pack2/d','pack2/d'],
                files: ['/style/*.css','/img/*.jpg']
                alias:
                    a: "A"
                    b: "B"
                main: "main"
                auto: false
            )
            a._data.should.eql(
                require: [ 'server_pack/a', 'server_pack/b', 'server_pack/c', 'pack2/d' ],
                exports: [ 'INFO', 'NAME', 'a', 'b' ],
                imports: ["outer", 'a', 'b' ],
                files: [ '*.js', '/style/*.css','/img/*.jpg']
                tests: ["*+(T|t)est*", "test/**/*"]
                alias: { a: 'A', b: 'B' },
                main: 'main',
                auto: false
            )
            done()
        it 'xpm - package - check config: files/tests', (done) ->
            p = xpm.addPackage('server_pack','check_files')
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
            done()
        it 'xpm - package - execServer - main file', (done) ->
            p = xpm.addPackage('server_pack','has_default_main')
            p.getExports().should.eql({ default_main: 'this is in default-main-file' })
            done()
        it 'xpm - package - execServer - require inside file', (done) ->
            p = xpm.addPackage('server_pack', 'require_inside_files')
            ret = p.getExports()
            ret.add_core1_file.should.ok
            ret.add_core2_file.should.ok
            ret.addFileCheck().should.ok
            (()->
                ret.unaddFileCheck()
            ).should.throw('[server_pack/require_inside_files] 未加入文件：' + __dirname + "/server_pack/require_inside_files/unaddFile.js")
            done()
        it 'xpm - package - check require params that have not extname', (done) ->
            p = xpm.addPackage('server_pack', 'require_extname_check')
            p.getExports().should.eql(
                 lib1: 'lib1 load success',
                 mainfile: "main file load success"
            )
            done()
        it 'xpm - package - check module_exports', (done) ->
            p = xpm.addPackage('server_pack', 'module_exports')
            p.getExports().should.eql("this is from module_exports")
            done()
        it 'xpm - package - exportsToContext', (done) ->
            p = xpm.addPackage('server_pack', 'export_context')
            p.getExports().should.eql([ 'this is in default-main-file',
                                        'this is from module_exports' ])
            done()
        it 'xpm - package - alias', (done) ->
            p = xpm.addPackage('server_pack', 'alias')
            p.getExports().should.eql([ 'this is in default-main-file',
                                        'this is from module_exports' ])
            done()
        it 'xpm - package - coffee files', (done) ->
            p = xpm.addPackage('server_pack', 'coffeefile')
            p.getExports().should.eql("this is in coffee file.")
            done()
        it 'xpm - package - check default', (done) ->
            p = xpm.addPackage('server_pack', 'check_default')
            p.getExports().should.eql('added default package')
            done()
        it 'xpm - package - check imports', (done) ->
            p = xpm.addPackage('server_pack', 'check_imports')
            p.getExports().should.eql(
                outer1: 'outer/pack1 exports1'
                outer2: 'outer/pack1 exports2'
            )
            (()->
                p = xpm.addPackage('server_pack', 'check_un_imports')
            ).should.throw('package `server_pack/check_un_imports` need to imports family: outer2')
            done()
        it 'xpm - package - check require ouside files', (done) ->
            ret = xpm.addPackage('server_pack', 'require_outside_files').getExports()
            ret.checkRequireInsidePack()
            ret.checkRequireOuterPack()
            ret.checkUnRequirePack()
            ret.checkUnImportsPack()
            done()
        it 'xpm - package - check auto close', (done) ->
            p = xpm.addPackage('server_pack', 'auto_closed')
            should(p.getExports()).not.be.ok
            done()
    describe 'xpm - XpmServer', ->
        xpm = new XpmServer({cwd: __dirname})
        it 'xpm - XpmServer - create unknow cwd path', (done) ->
            (()->
                xpm = new XpmServer({cwd: "/unknow/path"})
            ).should.throw("xpm unknow cwd path: /unknow/path")
            done()
        it 'xpm - XpmServer - _checkNativeRequire', (done) ->
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
        it 'xpm - XpmServer - _getRequirePathDetail', (done) ->
            _path = __dirname + "/pack1/a/file1.js"
            checkPath = (str, checkstr, family, packname) ->
                detail = xpm._getRequirePathDetail(str, _path)
                _p = path.relative(__dirname, detail.path)
                _p.should.eql(checkstr)
                detail.family.should.eql(family)
                detail.packname.should.eql(packname)
            checkPath("@/pack2/bb/a.js", "pack2/bb/a.js",'pack2','bb')
            checkPath("./lib/file2.js", "pack1/a/lib/file2.js",'pack1','a')
            checkPath("../b/file1.js", "pack1/b/file1.js",'pack1','b')
            checkPath("b/file1.js","pack1/b/file1.js",'pack1','b')
            checkPath("@/pack2/a/","pack2/a",'pack2','a')
            checkPath("@/pack2/a","pack2/a",'pack2','a')
            ret1 = xpm._getRequirePathDetail("a", _path)
            ret2 = xpm._getRequirePathDetail("@/pac3/a", _path)
            ret1.ismain.should.be.ok
            ret2.ismain.should.be.ok
            (()->
                xpm._getRequirePathDetail("/pack2/a", _path)
            ).should.throw()
            (()->
                xpm._getRequirePathDetail("../../../b/file1.js", _path)
            ).should.throw()
            (()->
                xpm._getRequirePathDetail("@/pack2", _path)
            ).should.throw()
            done()
        it 'xpm - XpmServer - require', (done) ->
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
            xpm._checkPackageSequency(p, p._data.require).should.eql([ 'check_sequence/a', 'check_sequence/d','check_sequence/b' ])
            done()
        it 'xpm - XpmServer - check package require recurse', (done) ->
            xpm2 = new XpmServer({cwd: __dirname})
            (->
                xpm2.require('check_recurse/a')
            ).should.be.throw('Recursive dependencies detected: check_recurse/a -> check_recurse/b -> check_recurse/c -> check_recurse/a')
            done()
    describe 'xpm - XpmClient', ->
        it.skip 'xpm - client - add packages', (done) ->
            xpm = new XpmClient({cwd: __dirname, dest: __dirname + "/dest"})
            xpm.add(["client_pack"], null, ()->
                done()
            )
