describe('hyperscript', function () {
  beforeEach(function () {
    module('contentful/test');
    this.h = this.$inject('utils/hyperscript').h;
  });

  describe('generating HTML strings', function () {
    it('creates for a single empty element', function () {
      expect(this.h('div')).toBe('<div></div>');
    });

    it('recognizes hyperscript-defined tags', function () {
      expect(this.h('p')).toBe('<p></p>');
      expect(this.h('section')).toBe('<section></section>');
    });

    it('uses ID from hyperscript definition', function () {
      expect(this.h('div#boom')).toBe('<div id="boom"></div>');
    });

    it('overrides ID attribute with hyperscript-defined ID', function () {
      expect(this.h('div#better', {id: 'worse'})).toBe('<div id="better"></div>');
    });

    it('uses hyperscript-defined classes', function () {
      expect(this.h('div.one.two.three')).toBe('<div class="one two three"></div>');
    });

    it('defaults to div when omitted', function () {
      expect(this.h('#test')).toBe('<div id="test"></div>');
      expect(this.h('.test')).toBe('<div class="test"></div>');
    });

    it('merges class attribute and hyperscript-defined classes', function () {
      expect(this.h('.two.three', {class: 'one'})).toBe('<div class="one two three"></div>');
    });

    it('uses passed attributes', function () {
      const attrs = {one: 123, two: 'test'};
      expect(this.h('div', attrs)).toBe('<div one="123" two="test"></div>');
    });

    it('uses dashed attributes "as is"', function () {
      const attrs = {'dashed-attr': 'test', 'x-y': 'z'};
      expect(this.h('div', attrs)).toBe('<div dashed-attr="test" x-y="z"></div>');
    });

    it('converts camel-cased attributes to dashed attributes', function () {
      const attrs = {camelCase: 'test', xY: 'z'};
      expect(this.h('div', attrs)).toBe('<div camel-case="test" x-y="z"></div>');
    });

    it('does not close void elements', function () {
      ['br', 'hr', 'img', 'input'].forEach((tag) => {
        const html = `<${tag} some-attr="test">`;
        expect(this.h(tag, {someAttr: 'test'})).toBe(html);
      });
    });

    it('includes only attribute name when true', function () {
      const attrs = {test: true, camelCase: true, other: 'test'};
      const html = '<div test camel-case other="test"></div>';
      expect(this.h('div', attrs)).toBe(html);
    });

    it('escapes attribute values', function () {
      const attrs = {test: true, toEscape: '"boom"', 'some-attr': 'x"x"x'};
      const html = '<div test to-escape="&quot;boom&quot;" some-attr="x&quot;x&quot;x"></div>';
      expect(this.h('div', attrs)).toBe(html);
    });

    it('throws if children are not array or undefined', function () {
      expect(() => this.h('div', 'test')).toThrow();
      expect(() => this.h('div', {}, 'test')).toThrow();
      expect(() => this.h('div', 123)).toThrow();
      expect(() => this.h('div', {}, 123)).toThrow();
    });

    it('creates for a single child element', function () {
      expect(this.h('div', {}, ['test'])).toBe('<div>test</div>');
    });

    it('creates also when attributes are skipped', function () {
      expect(this.h('div', ['test'])).toBe('<div>test</div>');
    });

    it('creates for multiple child elements', function () {
      const h = this.h;

      const generated = h('div', {foo: 'bar'}, [
        h('p', {foo: 'baz'}, ['test']),
        h('span', ['lol']),
        h('br'),
        h('p', ['test 2'])
      ]);

      const expected = [
        '<div foo="bar">',
        '<p foo="baz">test</p>',
        '<span>lol</span>',
        '<br>',
        '<p>test 2</p>',
        '</div>'
      ].join('');

      expect(generated).toBe(expected);
    });

    it('creates for multiple nested elements', function () {
      const h = this.h;

      const generated = h('div', {foo: 'bar'}, [
        h('.hello', [
          h('p', ['hello']),
          h('img', {src: 'wave.png'})
        ]),
        h('.bye', [
          h('hr'),
          h('span', {foo: 'doo'}, ['(c) lol'])
        ])
      ]);

      const expected = [
        '<div foo="bar">',
        '<div class="hello">',
        '<p>hello</p>',
        '<img src="wave.png">',
        '</div>',
        '<div class="bye">',
        '<hr>',
        '<span foo="doo">(c) lol</span>',
        '</div>',
        '</div>'
      ].join('');

      expect(generated).toBe(expected);
    });

    it('uses inline styles provided as a string', function () {
      expect(this.h('div', {style: 'color: red'})).toBe('<div style="color: red"></div>');
    });

    it('rewrites styles provided as an object', function () {
      const styles = {
        color: 'red',
        fontSize: '12px',
        fontFamily: 'Comic Sans',
        'z-index': 100
      };

      const inline = 'color: red; font-size: 12px; font-family: Comic Sans; z-index: 100';

      expect(this.h('div', {style: styles})).toBe(`<div style="${inline}"></div>`);
    });
  });
});
