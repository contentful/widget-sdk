{
  function annotate2(content, type) {
    return {
      type: type,
      text: text(),
      offset: offset(),
      length: text().length,
      end: offset() + text().length,
      content: content,
    }
  }
}

Search
  = _ head:Token tail:(__ t:Token {return t})* _
    { return [head].concat(tail) }
  / _
    { return [] }

Token
  = Pair / Query

Pair
  = key:Key op:Operator value:(Query / Novalue)
    { return annotate2({
        key: key,
        operator: op,
        value: value,
      }, 'Pair')
    }

Operator
  = _ op:":" _
    { return annotate2(op, 'Operator') }

Novalue
  = & (__ / eol)
    { return annotate2(null, 'Novalue') }

Key
  = key:($ [a-z0-9_-]i+)
    { return annotate2(key, 'Key') }

Query
  = "\"" q:$[^"]+ "\""
    { return annotate2(q, 'Query') }
  / q:$[^ "]i+
    { return annotate2(q, 'Query') }

_ "whitespace"
  = [ \t]*

__ "whitespace"
  = [ \t]+

eol "EOL"
  = "\r\n" / "\n\r" / "\r" / "\n" / eof

eof "EOF"
  = !.
