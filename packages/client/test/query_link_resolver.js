var {expect} = require('chai');
var {resolveQueryLinks} = require('../lib/query_link_resolver.js');

describe('resolveQueryLinks', function () {
  var barIncludes, barLink, foo, fooWithLinks;

  beforeEach(function () {
    barIncludes = [{
      sys: {
        id: '1',
        type: 'Bar'
      },
      myNameIs: 'bar'
    }];

    barLink = {
      sys: {
        type: 'Link',
        linkType: 'Bar',
        id: '1'
      }
    };

    foo = {
      sys: {
        id: '0',
        type: 'Foo'
      },
      myBar: barLink
    };

    fooWithLinks = {
      items: [foo],
      includes: {
        Bar: barIncludes
      }
    };
  });

  it('resolves linked resource', function () {
    var [resolvedFoo] = resolveQueryLinks(fooWithLinks);
    expect(resolvedFoo.myBar).to.deep.equal(barIncludes[0]);
  });

  it('wraps items', function () {
    var wrapper = function (instance) {
      return { o: instance };
    };
    var [wrappedFoo] = resolveQueryLinks(fooWithLinks, wrapper);
    expect(wrappedFoo).to.have.property('o');
    expect(wrappedFoo.o.myBar).to.have.property('o');
    expect(wrappedFoo.o.myBar.o).to.deep.equal(barIncludes[0]);
  });

  describe('circular', function () {
    beforeEach(function () {
      barIncludes[0].myFoo = {sys: {
        type: 'Link',
        linkType: 'Foo',
        id: '0'
      }};
    });

    it('resolves linked resources', function () {
      var [resolvedFoo] = resolveQueryLinks(fooWithLinks);
      expect(resolvedFoo.myBar).to.deep.equal(barIncludes[0]);
      expect(resolvedFoo.myBar.myFoo).to.deep.equal(resolvedFoo);
    });

    it('wraps items', function () {
      var wrapper = function (instance) {
        return { o: instance };
      };
      var [wrappedFoo] = resolveQueryLinks(fooWithLinks, wrapper);
      expect(wrappedFoo).to.have.property('o');
      expect(wrappedFoo.o.myBar).to.have.property('o');
      expect(wrappedFoo.o.myBar.o).to.deep.equal(barIncludes[0]);
      expect(wrappedFoo.o.myBar.o).to.deep.equal(barIncludes[0]);
      expect(wrappedFoo.o.myBar.o.myFoo).to.deep.equal(wrappedFoo);
    });
  });
});
