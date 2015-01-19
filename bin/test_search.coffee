fs  = require 'fs'
PEG = require 'pegjs'

grammar = fs.readFileSync('app/assets/commonjs_modules/user_interface/search.pegjs', 'utf8');
parser  = PEG.buildParser(grammar, trackLineAndColumn: true)
try 
  term   = 'Merp foo:"Bar Baz" bingo:bongo "Herp Derp"'
  output = parser.parse(term)
  result = JSON.stringify(output, null, 2)
  test   = """
    expect(parser.parse('#{term}')).toEqual(#{result.replace(/"/g, '\'')});
  """

  console.log(test)
  # console.log(result);
catch e
  console.log(JSON.stringify(e, null, 2, true));
