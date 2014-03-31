{
  function annotate(token, type) {
    return {
      token: token,
      _offset: offset(),
      _type: type
    }
  }
}

Search
  = _ head:Token tail:(__ t:Token {return t})* _
    { return [head].concat(tail) }

Token
  = Pair / Query

Pair
  = key:Key op:Operator value:(Query / Novalue)
    { return { _type: 'pair', key: key, value:value, operator:op, _offset: offset()} }

Operator
  = _ op:":" _
    { return op }

Novalue
  = & (__ / eol)
    { return {_type: 'Novalue', _offset: offset()} }

Key
  = key:($ [a-z0-9_-]i+)
    { return annotate(key, 'Key') }

Query
  = "\"" q:$[^"]+ "\""
    { return annotate(q, 'Query') }
  / q:$[^ "]i+
    { return annotate(q, 'Query') }

_ "whitespace"
  = [ \t]*

__ "whitespace"
  = [ \t]+

eol "EOL"
  = "\r\n" / "\n\r" / "\r" / "\n" / eof

eof "EOF"
  = !.
