import {h} from 'utils/hyperscript';

describe('hyperscript', function () {
  describe('generating HTML strings', function () {
    it('creates for a single empty element', function () {
      expect(h('div')).toBe('<div></div>');
    });

    it('recognizes hyperscript-defined tags', function () {
      expect(h('p')).toBe('<p></p>');
      expect(h('section')).toBe('<section></section>');
    });

    it('uses ID from hyperscript definition', function () {
      expect(h('div#boom')).toBe('<div id="boom"></div>');
    });

    it('overrides ID attribute with hyperscript-defined ID', function () {
      expect(h('div#better', {id: 'worse'})).toBe('<div id="better"></div>');
    });

    it('uses hyperscript-defined classes', function () {
      expect(h('div.one.two.three')).toBe('<div class="one two three"></div>');
    });

    it('defaults to div when omitted', function () {
      expect(h('#test')).toBe('<div id="test"></div>');
      expect(h('.test')).toBe('<div class="test"></div>');
    });

    it('merges class attribute and hyperscript-defined classes', function () {
      expect(h('.one.two', {class: 'three'})).toBe('<div class="one two three"></div>');
    });

    it('uses passed attributes', function () {
      const attrs = {one: '', two: 'test'};
      expect(h('div', attrs)).toBe('<div one="" two="test"></div>');
    });

    it('uses dashed attributes "as is"', function () {
      const attrs = {'dashed-attr': 'test', 'x-y': 'z'};
      expect(h('div', attrs)).toBe('<div dashed-attr="test" x-y="z"></div>');
    });

    it('converts camel-cased attributes to dashed attributes', function () {
      const attrs = {camelCase: 'test', xY: 'z'};
      expect(h('div', attrs)).toBe('<div camel-case="test" x-y="z"></div>');
    });

    it('does not close void elements', function () {
      ['br', 'hr', 'img', 'input'].forEach((tag) => {
        const html = `<${tag} some-attr="test">`;
        expect(h(tag, {someAttr: 'test'})).toBe(html);
      });
    });

    it('includes only attribute name when true', function () {
      const attrs = {test: true, camelCase: true, other: 'test'};
      const html = '<div test camel-case other="test"></div>';
      expect(h('div', attrs)).toBe(html);
    });

    it('escapes attribute values', function () {
      const attrs = {test: true, toEscape: '"boom"', 'some-attr': 'x"x"x'};
      const html = '<div test to-escape="&quot;boom&quot;" some-attr="x&quot;x&quot;x"></div>';
      expect(h('div', attrs)).toBe(html);
    });

    it('throws if children are not array or undefined', function () {
      expect(() => h('div', 'test')).toThrow();
      expect(() => h('div', {}, 'test')).toThrow();
      expect(() => h('div', 123)).toThrow();
      expect(() => h('div', {}, 123)).toThrow();
    });

    it('creates for a single child element', function () {
      expect(h('div', {}, ['test'])).toBe('<div>test</div>');
    });

    it('creates also when attributes are skipped', function () {
      expect(h('div', ['test'])).toBe('<div>test</div>');
    });

    it('ignores children that are falsy', function () {
      expect(h('p', ['test', false, undefined])).toBe('<p>test</p>');
    });

    it('creates for multiple child elements', function () {
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

    it('rewrites styles provided as an object', function () {
      const styles = {
        color: 'red',
        fontSize: '12px',
        fontFamily: 'Comic Sans',
        'z-index': 100
      };

      const inline = 'color: red;font-size: 12px;font-family: Comic Sans;z-index: 100';

      expect(h('div', {style: styles})).toBe(`<div style="${inline}"></div>`);
    });
  });
});
