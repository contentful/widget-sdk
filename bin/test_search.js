'use strict'
const fs = require('fs')
const PEG = require('pegjs')

const grammar = fs.readFileSync('app/assets/commonjs_modules/user_interface/search.pegjs', 'utf8')
const parser = PEG.buildParser(grammar, {trackLineAndColumn: true})
try {
  const output = parser.parse('George Clooney ')
  console.log(JSON.stringify(output, null, 2))
} catch (e) {
  console.log(JSON.stringify(e, null, 2, true))
}
