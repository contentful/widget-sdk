const { once } = require('lodash');
const { watch } = require('./tools/tasks/js');
const { Server, config: { parseConfig } } = require('karma');
const { resolve } = require('path');

const config = parseConfig(resolve('./karma.conf.js'));

// we need to wait for the first webpack's build
watch(null, { onSuccess: once(runTests) });

function runTests () {
  var server = new Server(config, (exitCode) => {
    console.log(`Karma has exited with ${exitCode}`);
    process.exit(exitCode);
  });
  server.start();
}
