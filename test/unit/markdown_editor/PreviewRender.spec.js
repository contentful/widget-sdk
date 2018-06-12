'use strict';

describe('markdown_editor/PreviewRender', () => {
  let treeBuilder, buildTree;

  function getRoot (source, fn) {
    return ((fn || buildTree)(source)).root;
  }

  function getChildren (node) {
    return _.get(node, 'props.children');
  }

  function getHTML (node) {
    return _.get(node, 'props.dangerouslySetInnerHTML.__html');
  }

  function hash (str) {
    return treeBuilder.getHashCode(str);
  }

  beforeEach(function () {
    module('contentful/test');
    treeBuilder = this.$inject('markdown_editor/PreviewRender');
    buildTree = treeBuilder.default();
  });

  it('Creates root div node with incremental key for builders', () => {
    let root = getRoot('__test__');
    expect(root.key).toBe('root/1');
    expect(root.type).toBe('div');
    expect(_.isObject(getChildren(root))).toBe(true);

    root = getRoot('__test2__', treeBuilder.default());
    expect(root.key).toBe('root/2');
    expect(root.type).toBe('div');
  });

  it('Uses hash-derived key for leaf nodes', () => {
    const content = 'simple paragraph';
    const root = getRoot(content);
    const child = getChildren(root);
    expect(child.key).toBe('html/div/' + hash(content));
  });

  it('Handle hash conflicts (for repeated fragments of text)', () => {
    const paras = ['test', 'test2', 'test'];
    const root = getRoot(paras.join('\n\n'));
    const children = getChildren(root);
    expect(children[0].key).toBe('html/div/' + hash(paras[0]));
    expect(children[2].key).toBe('html/div/' + hash(paras[0]) + '/1');
  });

  it('Uses incremental key for single level blocks', () => {
    const root = getRoot('__para1__\n\n__para2__');
    const children = getChildren(root);
    expect(children.length).toBe(2);
    expect(children[0].key).toBe('0');
    expect(children[1].key).toBe('1');
  });

  it('Counts words', () => {
    const result = buildTree('__para1__\n\n- test\n- item2\n\n[test](http://test.com) test');
    expect(result.words).toBe(5);
  });

  it('sanitizes img onlick', () => {
    const root = getRoot('<img src="test.jpg" onclick="alert(document.cookie)"/>');
    const html = getHTML(getChildren(root));
    expect(html).toBe('<img src="test.jpg" />');
  });

  it('adds rel=noopener on target=_blank', () => {
    const blankAnchor = getHTML(getChildren(getRoot('<a target=_blank></a>')));
    expect(blankAnchor).toBe('<a target="_blank" rel="noopener noreferrer"></a>');

    const normalAnchor = getHTML(getChildren(getRoot('<a></a>')));
    expect(normalAnchor).toBe('<a></a>');
  });

  it('extends embedly anchors with attributes', () => {
    const embedlyAnchor = getHTML(getChildren(getRoot('<a class="embedly-card" data-card-width="100%"></a>')));
    expect(embedlyAnchor).toBe('<a class="embedly-card markdown-block" data-card-width="100%" data-card-controls="0"></a>');
  });

  it('Sanitizes data: and js: URIs', () => {
    const BAD_URIS = [
      'javascript:something_bad',
      'data:text/html;base64,SomEtHiGBad+',
      'java\nscript:it_would_work_with_nl'
    ];

    BAD_URIS.forEach((uri) => {
      const root = getRoot(`[test](${uri})`);
      // paragraph is created -> getting children twice to get the anchor
      const anchor = getChildren(getChildren(root));
      expect(getHTML(anchor)).toBe('test');
      expect(anchor.props.href).toBe(null);
    });
  });

  it('Handles different image srcs', () => {
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
      const qs = img.props.src.split('?')[1] || '';
      expect(qs).toBe(tests[i][1]);
    });
  });
});
