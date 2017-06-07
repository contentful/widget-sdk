'use strict';

describe('Markdown tree', function () {
  let treeBuilder, buildTree;
  const libs = window.cfLibs.markdown;

  function getRoot (source, fn) {
    return ((fn || buildTree)(source)).root;
  }

  function getChildren (node) {
    return dotty.get(node, '_store.props.children');
  }

  function getHTML (node) {
    return dotty.get(node, '_store.props.dangerouslySetInnerHTML.__html');
  }

  function hash (str) {
    return treeBuilder.getHashCode(str);
  }

  beforeEach(function () {
    module('contentful/test');
    treeBuilder = this.$inject('markdown_editor/PreviewRender');
    buildTree = treeBuilder.default(libs);
  });

  it('Creates root div node with incremental key for builders', function () {
    let root = getRoot('__test__');
    expect(root.key).toBe('root/1');
    expect(root.type).toBe('div');
    expect(_.isObject(getChildren(root))).toBe(true);

    root = getRoot('__test2__', treeBuilder.default(libs));
    expect(root.key).toBe('root/2');
    expect(root.type).toBe('div');
  });

  it('Uses hash-derived key for leaf nodes', function () {
    const content = 'simple paragraph';
    const root = getRoot(content);
    const child = getChildren(root);
    expect(child.key).toBe('html/div/' + hash(content));
  });

  it('Handle hash conflicts (for repeated fragments of text)', function () {
    const paras = ['test', 'test2', 'test'];
    const root = getRoot(paras.join('\n\n'));
    const children = getChildren(root);
    expect(children[0].key).toBe('html/div/' + hash(paras[0]));
    expect(children[2].key).toBe('html/div/' + hash(paras[0]) + '/1');
  });

  it('Uses incremental key for single level blocks', function () {
    const root = getRoot('__para1__\n\n__para2__');
    const children = getChildren(root);
    expect(children.length).toBe(2);
    expect(children[0].key).toBe('0');
    expect(children[1].key).toBe('1');
  });

  it('Counts words', function () {
    const result = buildTree('__para1__\n\n- test\n- item2\n\n[test](http://test.com) test');
    expect(result.words).toBe(5);
  });

  it('Sanitizes raw HTML fragments', function () {
    const root = getRoot('<img src="test.jpg" onclick="alert(document.cookie)"/>');
    const html = getHTML(getChildren(root));
    expect(html).toBe('<img src="test.jpg">');
  });

  it('Sanitizes data: and js: URIs', function () {
    const BAD_URIS = [
      'data:text/html;base64,SomEtHiGBad+',
      'javascript:something_bad'
    ];

    BAD_URIS.forEach((uri) => {
      const root = getRoot(`[test](${uri})`);
      // paragraph is created -> getting children twice to get the anchor
      const anchor = getChildren(getChildren(root));
      expect(getHTML(anchor)).toBe('test');
      expect(anchor._store.props.href).toBe(null);
    });
  });

  it('Handles different image srcs', function () {
    const tests = [
      ['![img1](//images.contentful.com/x.jpg)', 'h=200'],
      ['![img2](//images.contentful.com/x.jpg?w=100)', 'w=100&h=200'],
      ['![img3](//images.contentful.com/x.jpg?h=123)', 'h=123'],
      ['![img4](//images.contentful.com/x.jpg?w=100&h=123)', 'w=100&h=123'],
      ['![img5](//images.wat.io/y.jpg)', ''],
      ['![img6](//images.wat.io/y.jpg?w=100)', 'w=100'],
      ['![img7](//images.wat.io/y.jpg?h=300)', 'h=300'],
      ['![img8](//images.wat.io/y.jpg?w=99&h=66)', 'w=99&h=66']
    ];

    const root = getRoot(tests.map(t => t[0]).join('\n\n'));

    getChildren(root).forEach((paragraph, i) => {
      const imgWrapperDiv = getChildren(paragraph);
      const img = getChildren(imgWrapperDiv);
      const qs = img._store.props.src.split('?')[1] || '';
      expect(qs).toBe(tests[i][1]);
    });
  });
});
