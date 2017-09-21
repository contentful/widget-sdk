import resolveTokenLinks from 'data/CMA/resolveTokenLinks';

const makeLink = (type, id) => ({sys: {type: 'Link', linkType: type, id}});

describe('data/CMA/resolveTokenLinks', function () {
  describe('link resolution', function () {
    beforeEach(function () {
      const foo0 = {
        sys: {type: 'Foo', id: '0'},
        myBar: makeLink('Bar', '0')
      };

      const bar0 = {
        sys: {type: 'Bar', id: '0'},
        myNameIs: 'bar0',
        myBaz: makeLink('Baz', '0')
      };

      const bar1 = {
        sys: {type: 'Bar', id: '1'},
        myNameIs: 'bar1',
        myFoo: makeLink('Foo', '0')
      };

      const baz0 = {
        sys: {type: 'Baz', id: '0'},
        baz: 'yes'
      };

      const baz1 = {
        sys: {type: 'Baz', id: '1'},
        baz: 'yes',
        myBrother: makeLink('Baz', '0')
      };

      this.includes = {
        Bar: [bar0, bar1],
        Baz: [baz0, baz1]
      };

      this.tokenData = {
        items: [foo0],
        includes: this.includes
      };
    });

    it('resolves linked items, 1 level deep', function () {
      const resolved = resolveTokenLinks(this.tokenData);
      expect(resolved.myBar).toEqual(this.includes.Bar[0]);
    });

    it('resolves nested linked items', function () {
      const resolved = resolveTokenLinks(this.tokenData);
      expect(resolved.myBar.myBaz).toEqual(this.includes.Baz[0]);
    });

    it('resolves circularly linked items', function () {
      this.includes.Bar[0].myFoo = makeLink('Foo', '0');
      const resolved = resolveTokenLinks(this.tokenData);
      expect(resolved.myBar.myFoo).toEqual(resolved);
    });

    it('resolves circular chains of linked items', function () {
      this.includes.Baz[0].myFoo = makeLink('Foo', '0');
      const resolved = resolveTokenLinks(this.tokenData);
      expect(resolved.myBar.myBaz.myFoo).toEqual(resolved);
    });

    it('resolves links in non-referenced include items', function () {
      resolveTokenLinks(this.tokenData);
      expect(this.includes.Baz[1].myBrother).toEqual(this.includes.Baz[0]);
    });
  });
});
