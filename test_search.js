'use strict';
var fs = require('fs');
var PEG = require('pegjs');

var grammar = fs.readFileSync('app/assets/commonjs_modules/user_interface/search.pegjs', 'utf8');
var parser = PEG.buildParser(grammar, {trackLineAndColumn: true});
try {
  var output = parser.parse('updatedAt<="2014-04-15"');
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  console.log(JSON.stringify(e, null, 2, true));
}
