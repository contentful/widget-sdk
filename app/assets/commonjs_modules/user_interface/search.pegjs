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
  = key:Key op:Operator value:Value
    { return annotate2({
        key: key,
        operator: op,
        value: value,
      }, 'Pair')
    }

Operator
  = _ op:":" _
    { return annotate2(op, 'Operator') }

Value
  = val:(Expression / Novalue)
    { return annotate2(val, 'Value') }

Novalue
  = & (__ / eol)
    { return '' }

Key
  = key:($ [a-z0-9_-]i+)
    { return annotate2(key, 'Key') }

Query
  = exp:Expression
    { return annotate2(exp, 'Query') }

Expression
  = "\"" q:$[^"]+ "\""
  / q:$[^ "]i+

_ "whitespace"
  = [ \t]*

__ "whitespace"
  = [ \t]+

eol "EOL"
  = "\r\n" / "\n\r" / "\r" / "\n" / eof

eof "EOF"
  = !.
