var Fiber = require('fibers');

it("fibers - synchronous queue", function (done) {
    //work inside the Fiber
    Fiber(function() {
        var q = new Meteor._SynchronousQueue;
        var output = [];
        var pusher = function (n) {
            return function () {
                output.push(n);
            };
        };
        var outputIsUpTo = function (n) {
            expect(output).to.be.eql(_.range(1, n+1));
        };

        // Queue a task. It cannot run until we yield.
        q.queueTask(pusher(1));
        outputIsUpTo(0);

        // Run another task. After queueing it, the fiber constructed here will yield
        // back to this outer function. No task can have run yet since the main test
        // fiber still will not have yielded.
        var runTask2Done = false;
        Fiber(function () {
            q.runTask(pusher(2));
            runTask2Done = true;
        }).run();
        outputIsUpTo(0);
        expect(runTask2Done).to.not.ok();

        // Queue a third task. Still no outer yields, so still no runs.
        q.queueTask(function () {
            output.push(3);
            // This task gets queued once we actually start running functions, which
            // isn't until the runTask(pusher(4)), so it gets queued after Task #4.
            q.queueTask(pusher(5));
        });
        outputIsUpTo(0);
        expect(runTask2Done).to.not.ok();

        // Run a task and block for it to be done. All queued tasks up to this one
        // will now be run.
        q.runTask(pusher(4));
        outputIsUpTo(4);
        expect(runTask2Done).to.ok();

        // Task #5 is still in the queue. Run another task synchronously.
        q.runTask(pusher(6));
        outputIsUpTo(6);

        // Queue a task that throws. It'll write some debug output, but that's it.
        Meteor._suppress_log(1);
        q.queueTask(function () {
            throw new Error("bla");
        });
        // let it run.
        q.runTask(pusher(7));
        outputIsUpTo(7);

        // Run a task that throws. It should throw from runTask.
        Meteor._suppress_log(1);
        expect(function () {
            q.runTask(function () {
                throw new Error("this is thrown");
            });
        }).to.throwError()
    }).run()
    done()
});
