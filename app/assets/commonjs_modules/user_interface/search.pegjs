{
  function annotate(value) {
    return {
      value: value,
      _offset: offset()
    }
  }
}


Search "search"
  = pairs:Pairs fulltext:(_ e:Expression {return e})?
    { return {pairs: pairs, search: fulltext} }

Pairs
  = head:Pair tail:(__ p:Pair {return p})*
    { return [head].concat(tail) }
  / _
    { return [] }

Pair "key-value pair"
  = key:Key ":" exp:Expression
    { return {key: key, exp:exp, _offset: offset()} }

Key "key"
  = key:($ [a-z]i+)
    { return annotate(key) }

Expression "term"
  = "\"" exp:$[^"]+ "\""
    { return annotate(exp) }
  / exp:$[^ "]i+
    { return annotate(exp) }
 

_ "whitespace"
  = [ \t]*

__ "whitespace"
  = [ \t]+

eol "EOL"
  = "\r\n" / "\n\r" / "\r" / "\n" / eof

eof "EOF"
  = !.
