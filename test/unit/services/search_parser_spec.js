'use strict';

describe('Search parser', function () {
  let parser;
  afterEach(function () {
    parser = null;
  });

  beforeEach(function () {
    module('contentful/test');
    parser = this.$inject('searchParser');
  });

  it('should detect a simple search', function () {
    expect(parser.parse('Foobar')).toEqual([
      {
        'type': 'Query',
        'text': 'Foobar',
        'offset': 0,
        'length': 6,
        'end': 6,
        'content': 'Foobar'
      }
    ]);
  });

  it('should detect two queries', function () {
    expect(parser.parse('George Clooney ')).toEqual([{
      'type': 'Query',
      'text': 'George ',
      'offset': 0,
      'length': 7,
      'end': 7,
      'content': 'George'
    },
    {
      'type': 'Query',
      'text': 'Clooney ',
      'offset': 7,
      'length': 8,
      'end': 15,
      'content': 'Clooney'
    }]);
  });


  it('should detect a key-value search', function () {
    expect(parser.parse('foo:bar')).toEqual([
      {
        'type': 'Pair',
        'text': 'foo:bar',
        'offset': 0,
        'length': 7,
        'end': 7,
        'content': {
          'key': {
            'type': 'Key',
            'text': 'foo',
            'offset': 0,
            'length': 3,
            'end': 3,
            'content': 'foo'
          },
          'operator': {
            'type': 'Operator',
            'text': ':',
            'offset': 3,
            'length': 1,
            'end': 4,
            'content': ':'
          },
          'value': {
            'type': 'Value',
            'text': 'bar',
            'offset': 4,
            'length': 3,
            'end': 7,
            'content': 'bar'
          }
        }
      }
    ]);
  });

  it('should detect a double key-value search', function () {
    expect(parser.parse('foo:bar bingo:bongo')).toEqual([
      {
        'type': 'Pair',
        'text': 'foo:bar ',
        'offset': 0,
        'length': 8,
        'end': 8,
        'content': {
          'key': {
            'type': 'Key',
            'text': 'foo',
            'offset': 0,
            'length': 3,
            'end': 3,
            'content': 'foo'
          },
          'operator': {
            'type': 'Operator',
            'text': ':',
            'offset': 3,
            'length': 1,
            'end': 4,
            'content': ':'
          },
          'value': {
            'type': 'Value',
            'text': 'bar ',
            'offset': 4,
            'length': 4,
            'end': 8,
            'content': 'bar'
          }
        }
      },
      {
        'type': 'Pair',
        'text': 'bingo:bongo',
        'offset': 8,
        'length': 11,
        'end': 19,
        'content': {
          'key': {
            'type': 'Key',
            'text': 'bingo',
            'offset': 8,
            'length': 5,
            'end': 13,
            'content': 'bingo'
          },
          'operator': {
            'type': 'Operator',
            'text': ':',
            'offset': 13,
            'length': 1,
            'end': 14,
            'content': ':'
          },
          'value': {
            'type': 'Value',
            'text': 'bongo',
            'offset': 14,
            'length': 5,
            'end': 19,
            'content': 'bongo'
          }
        }
      }
    ]);
  });

  it('should detect a key-value search with quotes', function () {
    expect(parser.parse('foo:"Bar Baz"')).toEqual([
      {
        'type': 'Pair',
        'text': 'foo:"Bar Baz"',
        'offset': 0,
        'length': 13,
        'end': 13,
        'content': {
          'key': {
            'type': 'Key',
            'text': 'foo',
            'offset': 0,
            'length': 3,
            'end': 3,
            'content': 'foo'
          },
          'operator': {
            'type': 'Operator',
            'text': ':',
            'offset': 3,
            'length': 1,
            'end': 4,
            'content': ':'
          },
          'value': {
            'type': 'Value',
            'text': '"Bar Baz"',
            'offset': 4,
            'length': 9,
            'end': 13,
            'content': 'Bar Baz'
          }
        }
      }
    ]);
  });

  it('should detect a key-value search with a search', function () {
    expect(parser.parse('foo:bar Baz')).toEqual([
      {
        'type': 'Pair',
        'text': 'foo:bar ',
        'offset': 0,
        'length': 8,
        'end': 8,
        'content': {
          'key': {
            'type': 'Key',
            'text': 'foo',
            'offset': 0,
            'length': 3,
            'end': 3,
            'content': 'foo'
          },
          'operator': {
            'type': 'Operator',
            'text': ':',
            'offset': 3,
            'length': 1,
            'end': 4,
            'content': ':'
          },
          'value': {
            'type': 'Value',
            'text': 'bar ',
            'offset': 4,
            'length': 4,
            'end': 8,
            'content': 'bar'
          }
        }
      },
      {
        'type': 'Query',
        'text': 'Baz',
        'offset': 8,
        'length': 3,
        'end': 11,
        'content': 'Baz'
      }
    ]);
  });

  it('should detect a double key-value search with a quoted search', function () {
    expect(parser.parse('Merp foo:"Bar Baz" bingo:bongo "Herp Derp"')).toEqual([
      {
        'type': 'Query',
        'text': 'Merp ',
        'offset': 0,
        'length': 5,
        'end': 5,
        'content': 'Merp'
      },
      {
        'type': 'Pair',
        'text': 'foo:"Bar Baz" ',
        'offset': 5,
        'length': 14,
        'end': 19,
        'content': {
          'key': {
            'type': 'Key',
            'text': 'foo',
            'offset': 5,
            'length': 3,
            'end': 8,
            'content': 'foo'
          },
          'operator': {
            'type': 'Operator',
            'text': ':',
            'offset': 8,
            'length': 1,
            'end': 9,
            'content': ':'
          },
          'value': {
            'type': 'Value',
            'text': '"Bar Baz" ',
            'offset': 9,
            'length': 10,
            'end': 19,
            'content': 'Bar Baz'
          }
        }
      },
      {
        'type': 'Pair',
        'text': 'bingo:bongo ',
        'offset': 19,
        'length': 12,
        'end': 31,
        'content': {
          'key': {
            'type': 'Key',
            'text': 'bingo',
            'offset': 19,
            'length': 5,
            'end': 24,
            'content': 'bingo'
          },
          'operator': {
            'type': 'Operator',
            'text': ':',
            'offset': 24,
            'length': 1,
            'end': 25,
            'content': ':'
          },
          'value': {
            'type': 'Value',
            'text': 'bongo ',
            'offset': 25,
            'length': 6,
            'end': 31,
            'content': 'bongo'
          }
        }
      },
      {
        'type': 'Query',
        'text': '"Herp Derp"',
        'offset': 31,
        'length': 11,
        'end': 42,
        'content': 'Herp Derp'
      }
    ]);
  });
});
