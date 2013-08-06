var system = require('system');

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001, //< Default Max Timeout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    //console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 100); //< repeat check every 100ms
};


if (system.args.length !== 2) {
    console.log('Usage: run-jasmine.js URL');
    phantom.exit(1);
}

var page = require('webpage').create();

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.open(system.args[1], function(status){
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit(1);
    } else {
        waitFor(function(){
            return page.evaluate(function(){
                return document.body.querySelector('.symbolSummary .pending') === null
            });
        }, function(){
            var exitCode = page.evaluate(function(){
                var ANSI = {}
                ANSI.color_map = {
                    "green" : 32,
                    "red"   : 31
                }

                ANSI.colorize_text = function(text, color) {
                  var color_code = this.color_map[color];
                  return "\033[" + color_code + "m" + text + "\033[0m";
                }
 
                //console.log('');
                //console.log(document.body.querySelector('.description').innerText);
                var htmlReporter = document.body.querySelectorAll('#HTMLReporter')[0];
                var trivialReporter = document.body.querySelectorAll('#TrivialReporter')[0];
                if(!htmlReporter && !trivialReporter){
                  console.log('\n\n'+
                              ANSI.colorize_text('ERROR: The reporters failed to load. Maybe the tests didn\'t run at all?', 'red')+
                              '\n\n');
                  return 1;
                }
                var list = document.body.querySelectorAll('.results > #details > .specDetail.failed');
                if (list && list.length > 0) {
                  /*
                  console.log('');
                  console.log(list.length + ' test(s) FAILED:');
                  for (i = 0; i < list.length; ++i) {
                      var el = list[i],
                          desc = el.querySelector('.description'),
                          msg = el.querySelector('.resultMessage.fail');
                      console.log('');
                      console.log(desc.innerText);
                      console.log(msg.innerText);
                      console.log('');
                  }
                 */
                  return 1;
                } else {
                  //console.log(document.body.querySelector('.alert > .passingAlert.bar').innerText);
                  return 0;
                }
            });
            phantom.exit(exitCode);
        });
    }
});
