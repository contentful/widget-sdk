'use strict';

export default function extractTypeTransform () {
  var TYPE_EXPRESSION_START = /\{[^@]/;
  return function (doc, tag, value) {
    var start, position, count, length;

    start = value.search(TYPE_EXPRESSION_START);
    length = value.length;
    if (start !== -1) {
      // advance to the first character in the type expression
      position = start + 1;
      count = 1;

      while (position < length) {
        switch (value[position]) {
          case '\\':
            // backslash is an escape character, so skip the next character
            position++;
            break;
          case '{':
            count++;
            break;
          case '}':
            count--;
            break;
          default:
            // do nothing
        }

        if (count === 0) {
          break;
        }
        position++;
      }

      tag.typeExpression = value.slice(start+1, position).trim()
                           .replace('\\}', '}').replace('\\{', '{');
      tag.description = (value.substring(0, start) +
                         value.substring(position+1)).trim();
      return tag.description;
    } else {
      return value;
    }
  };
}
