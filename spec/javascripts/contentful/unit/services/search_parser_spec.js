'use strict';

describe('Search parser', function () {
  var parser;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function (searchParser){
    parser = searchParser;
  }));

  it('should detect a simple search', function () {
    expect(parser.parse('Foobar')).toEqual({
      pairs: [],
      search: 'Foobar'
    });
  });

  it('should detect a key-value search', function () {
    expect(parser.parse('foo:bar')).toEqual({
      pairs: [{key: 'foo', exp: 'bar'}],
      search: null
    });
  });

  it('should detect a double key-value search', function () {
    expect(parser.parse('foo:bar bingo:bongo')).toEqual({
      pairs: [{key: 'foo', exp: 'bar'}, {key: 'bingo', exp: 'bongo'}],
      search: null
    });
  });

  it('should detect a key-value search with quotes', function () {
    expect(parser.parse('foo:"Bar Baz"')).toEqual({
      pairs: [{key: 'foo', exp: 'Bar Baz'}],
      search: null
    });
  });

  it('should detect a key-value search with a search', function () {
    expect(parser.parse('foo:bar Baz')).toEqual({
      pairs: [{key: 'foo', exp: 'bar'}],
      search: 'Baz'
    });
  });

  it('should detect a double key-value search with a quoted search', function () {
    expect(parser.parse('foo:"Bar Baz" bingo:bongo "Herp Derp"')).toEqual({
      pairs: [{key: 'foo', exp: 'Bar Baz'}, {key: 'bingo', exp: 'bongo'}],
      search: 'Herp Derp'
    });
  });

});
