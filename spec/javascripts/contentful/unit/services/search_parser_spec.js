'use strict';

describe('Search parser', function () {
  var parser;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function (searchParser){
    parser = searchParser;
    pending('still working on the parser');
  }));

  it('should detect a simple search', function () {
    expect(parser.parse('Foobar')).toEqual([{
      'token': 'Foobar',
      '_offset': 0,
      '_type': 'Query'
    }]);
  });

  it('should detect a key-value search', function () {
    expect(parser.parse('foo:bar')).toEqual([{
      '_type': 'pair',
      'key': {
        'token': 'foo',
        '_offset': 0,
        '_type': 'Key'
      },
      'value': {
        'token': 'bar',
        '_offset': 4,
        '_type': 'Query'
      },
      'operator': ':',
      '_offset': 0
    }]);
  });

  it('should detect a double key-value search', function () {
    expect(parser.parse('foo:bar bingo:bongo')).toEqual([{
      '_type': 'pair',
      'key': {
        'token': 'foo',
        '_offset': 0,
        '_type': 'Key'
      },
      'value': {
        'token': 'bar',
        '_offset': 4,
        '_type': 'Query'
      },
      'operator': ':',
      '_offset': 0
    },
    {
      '_type': 'pair',
      'key': {
        'token': 'bingo',
        '_offset': 8,
        '_type': 'Key'
      },
      'value': {
        'token': 'bongo',
        '_offset': 14,
        '_type': 'Query'
      },
      'operator': ':',
      '_offset': 8
    }]);
  });

  it('should detect a key-value search with quotes', function () {
    expect(parser.parse('foo:"Bar Baz"')).toEqual([{
      '_type': 'pair',
      'key': {
        'token': 'foo',
        '_offset': 0,
        '_type': 'Key'
      },
      'value': {
        'token': 'Bar Baz',
        '_offset': 4,
        '_type': 'Query'
      },
      'operator': ':',
      '_offset': 0
    }]);
  });

  it('should detect a key-value search with a search', function () {
    expect(parser.parse('foo:bar Baz')).toEqual(
      [
        {
          '_type': 'pair',
          'key': {
            'token': 'foo',
            '_offset': 0,
            '_type': 'Key'
          },
          'value': {
            'token': 'bar',
            '_offset': 4,
            '_type': 'Query'
          },
          'operator': ':',
          '_offset': 0
        },
        {
          'token': 'Baz',
          '_offset': 8,
          '_type': 'Query'
        }
      ]
    );
  });

  it('should detect a double key-value search with a quoted search', function () {
    expect(parser.parse('foo:"Bar Baz" bingo:bongo "Herp Derp"')).toEqual(
      [
        {
          '_type': 'pair',
          'key': {
            'token': 'foo',
            '_offset': 0,
            '_type': 'Key'
          },
          'value': {
            'token': 'Bar Baz',
            '_offset': 4,
            '_type': 'Query'
          },
          'operator': ':',
          '_offset': 0
        },
        {
          '_type': 'pair',
          'key': {
            'token': 'bingo',
            '_offset': 14,
            '_type': 'Key'
          },
          'value': {
            'token': 'bongo',
            '_offset': 20,
            '_type': 'Query'
          },
          'operator': ':',
          '_offset': 14
        },
        {
          'token': 'Herp Derp',
          '_offset': 26,
          '_type': 'Query'
        }
      ]
            
    );
  });

});
