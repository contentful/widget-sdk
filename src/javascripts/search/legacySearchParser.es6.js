/* eslint-disable no-control-regex */

function peg$subclass(child, parent) {
  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function peg$SyntaxError(message, expected, found, location) {
  this.message = message;
  this.expected = expected;
  this.found = found;
  this.location = location;
  this.name = 'SyntaxError';

  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(this, peg$SyntaxError);
  }
}

peg$subclass(peg$SyntaxError, Error);

peg$SyntaxError.buildMessage = function(expected, found) {
  const DESCRIBE_EXPECTATION_FNS = {
    literal: function(expectation) {
      return '"' + literalEscape(expectation.text) + '"';
    },

    class: function(expectation) {
      let escapedParts = '',
        i;

      for (i = 0; i < expectation.parts.length; i++) {
        escapedParts +=
          expectation.parts[i] instanceof Array
            ? classEscape(expectation.parts[i][0]) + '-' + classEscape(expectation.parts[i][1])
            : classEscape(expectation.parts[i]);
      }

      return '[' + (expectation.inverted ? '^' : '') + escapedParts + ']';
    },

    any: function() {
      return 'any character';
    },

    end: function() {
      return 'end of input';
    },

    other: function(expectation) {
      return expectation.description;
    }
  };

  function hex(ch) {
    return ch
      .charCodeAt(0)
      .toString(16)
      .toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g, function(ch) {
        return '\\x0' + hex(ch);
      })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
        return '\\x' + hex(ch);
      });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^')
      .replace(/-/g, '\\-')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g, function(ch) {
        return '\\x0' + hex(ch);
      })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
        return '\\x' + hex(ch);
      });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    const descriptions = new Array(expected.length);
    let i, j;

    for (i = 0; i < expected.length; i++) {
      descriptions[i] = describeExpectation(expected[i]);
    }

    descriptions.sort();

    if (descriptions.length > 0) {
      i = 1;
      j = 1;
      for (; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + ' or ' + descriptions[1];

      default:
        return (
          descriptions.slice(0, -1).join(', ') + ', or ' + descriptions[descriptions.length - 1]
        );
    }
  }

  function describeFound(found) {
    return found ? '"' + literalEscape(found) + '"' : 'end of input';
  }

  return 'Expected ' + describeExpected(expected) + ' but ' + describeFound(found) + ' found.';
};

export default function peg$parse(input, options) {
  options = options !== void 0 ? options : {};

  const peg$FAILED = {};
  const peg$startRuleFunctions = { Search: peg$parseSearch };

  let peg$startRuleFunction = peg$parseSearch;

  const peg$c0 = function(_head, t) {
      return t;
    },
    peg$c1 = function(head, tail) {
      return [head].concat(tail);
    },
    peg$c2 = function() {
      return [];
    },
    peg$c3 = function(key, op, value) {
      return annotate(
        {
          key: key,
          operator: op,
          value: value
        },
        'Pair'
      );
    },
    peg$c4 = ':',
    peg$c5 = peg$literalExpectation(':', false),
    peg$c6 = /^[<>!=]/,
    peg$c7 = peg$classExpectation(['<', '>', '!', '='], false, false),
    peg$c8 = '=',
    peg$c9 = peg$literalExpectation('=', false),
    peg$c10 = /^[<>]/,
    peg$c11 = peg$classExpectation(['<', '>'], false, false),
    peg$c12 = function(op) {
      return annotate(op, 'Operator');
    },
    peg$c13 = function(val) {
      return annotate(val, 'Value');
    },
    peg$c14 = function() {
      return '';
    },
    peg$c15 = /^[a-z0-9_-]/i,
    peg$c16 = peg$classExpectation([['a', 'z'], ['0', '9'], '_', '-'], false, true),
    peg$c17 = function(key) {
      return annotate(key, 'Key');
    },
    peg$c18 = function(exp) {
      return annotate(exp, 'Query');
    },
    peg$c19 = function(x) {
      return x;
    },
    peg$c20 = '"',
    peg$c21 = peg$literalExpectation('"', false),
    peg$c22 = /^[^"]/,
    peg$c23 = peg$classExpectation(['"'], true, false),
    peg$c24 = function(q) {
      return q;
    },
    peg$c25 = /^[^ "]/i,
    peg$c26 = peg$classExpectation([' ', '"'], true, true),
    peg$c27 = peg$otherExpectation('whitespace*'),
    peg$c28 = /^[ \t]/,
    peg$c29 = peg$classExpectation([' ', '\t'], false, false),
    peg$c30 = peg$otherExpectation('whitespace+'),
    peg$c31 = peg$otherExpectation('EOL'),
    peg$c32 = '\r\n',
    peg$c33 = peg$literalExpectation('\r\n', false),
    peg$c34 = '\n\r',
    peg$c35 = peg$literalExpectation('\n\r', false),
    peg$c36 = '\r',
    peg$c37 = peg$literalExpectation('\r', false),
    peg$c38 = '\n',
    peg$c39 = peg$literalExpectation('\n', false),
    peg$c40 = peg$otherExpectation('EOF'),
    peg$c41 = peg$anyExpectation();

  const peg$posDetailsCache = [{ line: 1, column: 1 }];

  let peg$currPos = 0,
    peg$savedPos = 0,
    peg$maxFailPos = 0,
    peg$maxFailExpected = [],
    peg$silentFails = 0;

  if ('startRule' in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error('Can\'t start parsing from rule "' + options.startRule + '".');
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: 'literal', text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: 'class', parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: 'any' };
  }

  function peg$endExpectation() {
    return { type: 'end' };
  }

  function peg$otherExpectation(description) {
    return { type: 'other', description: description };
  }

  function peg$computePosDetails(pos) {
    let details = peg$posDetailsCache[pos],
      p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;
      return details;
    }
  }

  function peg$computeLocation(startPos, endPos) {
    const startPosDetails = peg$computePosDetails(startPos);
    const endPosDetails = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) {
      return;
    }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$parseSearch() {
    let s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parse_();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseToken();
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$currPos;
        s5 = peg$parseToken();
        if (s5 !== peg$FAILED) {
          peg$savedPos = s4;
          s5 = peg$c0(s2, s5);
        }
        s4 = s5;
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$currPos;
          s5 = peg$parseToken();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s4;
            s5 = peg$c0(s2, s5);
          }
          s4 = s5;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c1(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c2();
      }
      s0 = s1;
    }

    return s0;
  }

  function peg$parseToken() {
    let s0;

    s0 = peg$parsePair();
    if (s0 === peg$FAILED) {
      s0 = peg$parseQuery();
    }

    return s0;
  }

  function peg$parsePair() {
    let s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parseKey();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseOperator();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseValue();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c3(s1, s2, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseOperator() {
    let s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 58) {
      s2 = peg$c4;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c5);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = peg$currPos;
      if (peg$c6.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c7);
        }
      }
      if (s3 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 61) {
          s4 = peg$c8;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c9);
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 61) {
          s2 = peg$c8;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c9);
          }
        }
        if (s2 === peg$FAILED) {
          if (peg$c10.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c11);
            }
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c12(s1);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseValue() {
    let s0, s1;

    s0 = peg$currPos;
    s1 = peg$parseExpression_();
    if (s1 === peg$FAILED) {
      s1 = peg$parseNovalue();
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c13(s1);
    }
    s0 = s1;

    return s0;
  }

  function peg$parseNovalue() {
    let s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    s2 = peg$parse__();
    if (s2 === peg$FAILED) {
      s2 = peg$parseeol();
    }
    peg$silentFails--;
    if (s2 !== peg$FAILED) {
      peg$currPos = s1;
      s1 = void 0;
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c14();
    }
    s0 = s1;

    return s0;
  }

  function peg$parseKey() {
    let s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = [];
    if (peg$c15.test(input.charAt(peg$currPos))) {
      s3 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c16);
      }
    }
    if (s3 !== peg$FAILED) {
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (peg$c15.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c16);
          }
        }
      }
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c17(s1);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseQuery() {
    let s0, s1;

    s0 = peg$currPos;
    s1 = peg$parseExpression_();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c18(s1);
    }
    s0 = s1;

    return s0;
  }

  function peg$parseExpression_() {
    let s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$parseExpression();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c19(s1);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseExpression() {
    let s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 34) {
      s1 = peg$c20;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c21);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = [];
      if (peg$c22.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c23);
        }
      }
      if (s4 !== peg$FAILED) {
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$c22.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c23);
            }
          }
        }
      } else {
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        s2 = input.substring(s2, peg$currPos);
      } else {
        s2 = s3;
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 34) {
          s3 = peg$c20;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c21);
          }
        }
        if (s3 === peg$FAILED) {
          s3 = peg$parseeof();
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c24(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = [];
      if (peg$c25.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c26);
        }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c25.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c26);
            }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }
    }

    return s0;
  }

  function peg$parse_() {
    const s0 = [];
    let s1;

    peg$silentFails++;
    if (peg$c28.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c29);
      }
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      if (peg$c28.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c29);
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c27);
      }
    }

    return s0;
  }

  function peg$parse__() {
    let s0, s1;

    peg$silentFails++;
    s0 = [];
    if (peg$c28.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c29);
      }
    }
    if (s1 !== peg$FAILED) {
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        if (peg$c28.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c29);
          }
        }
      }
    } else {
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c30);
      }
    }

    return s0;
  }

  function peg$parseeol() {
    let s0;

    peg$silentFails++;
    if (input.substr(peg$currPos, 2) === peg$c32) {
      s0 = peg$c32;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c33);
      }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c34) {
        s0 = peg$c34;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c35);
        }
      }
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 13) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c37);
          }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 10) {
            s0 = peg$c38;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c39);
            }
          }
          if (s0 === peg$FAILED) {
            s0 = peg$parseeof();
          }
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      if (peg$silentFails === 0) {
        peg$fail(peg$c31);
      }
    }

    return s0;
  }

  function peg$parseeof() {
    let s0, s1;

    peg$silentFails++;
    s0 = peg$currPos;
    peg$silentFails++;
    if (input.length > peg$currPos) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c41);
      }
    }
    peg$silentFails--;
    if (s1 === peg$FAILED) {
      s0 = void 0;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c40);
      }
    }

    return s0;
  }

  function offset() {
    return peg$savedPos;
  }

  function annotate(content, type) {
    return {
      type: type,
      text: text(),
      offset: offset(),
      length: text().length,
      end: offset() + text().length,
      content: content
    };
  }

  const peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}
