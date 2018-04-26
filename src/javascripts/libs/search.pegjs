{
  function offset() {
    return peg$savedPos;
  }

  function annotate(content, type) {
    return {
      type:     type,
      text:     text(),
      offset:   offset(),
      length:   text().length,
      end:      offset() + text().length,
      content:  content,
    }
  }
}

Search
  = _ head:Token tail:(t:Token {return t})* _
    { return [head].concat(tail) }
  / _
    { return [] }

Token
  = Pair / Query

Pair
  = key:Key op:Operator value:Value
    { return annotate({
        key: key,
        operator: op,
        value: value,
      }, 'Pair')
    }

Operator
  = op:$(":" / [<>!=] "=" / "=" / [<>]) _
    { return annotate(op, 'Operator') }

Value
  = val:(Expression_ / Novalue)
    { return annotate(val, 'Value') }

Novalue
  = & (__ / eol)
    { return '' }

Key
  = key:($ [a-z0-9_-]i+) _
    { return annotate(key, 'Key') }

Query
  = exp:Expression_
    { return annotate(exp, 'Query') }

Expression_
  = x:Expression _
    {return x}

Expression
  = "\"" q:$[^"]+ ("\"" / eof)
    { return q }
  / $[^ "]i+

_ "whitespace*"
  = [ \t]*

__ "whitespace+"
  = [ \t]+

eol "EOL"
  = "\r\n" / "\n\r" / "\r" / "\n" / eof

eof "EOF"
  = !.
