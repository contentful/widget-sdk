'use strict';

describe('Markdown tree', function () {
  var createTreeBuilder, buildTree;
  var libs = window.cfLibs.markdown;

  function getRoot(source, fn) { return ((fn || buildTree)(source)).root;                               }
  function getChildren(node)   { return dotty.get(node, '_store.props.children');                       }
  function getHTML(node)       { return dotty.get(node, '_store.props.dangerouslySetInnerHTML.__html'); }
  function hash(str)           { return createTreeBuilder._hash(str);                                   }

  beforeEach(function () {
    module('contentful/test');
    createTreeBuilder = this.$inject('MarkdownEditor/tree');
    buildTree = createTreeBuilder(libs);
  });

  it('Creates root div node with incremental key for builders', function () {
    var root = getRoot('__test__');
    expect(root.key).toBe('root/1');
    expect(root.type).toBe('div');
    expect(_.isObject(getChildren(root))).toBe(true);

    root = getRoot('__test2__', createTreeBuilder(libs));
    expect(root.key).toBe('root/2');
    expect(root.type).toBe('div');
  });

  it('Uses hash-derived key for leaf nodes', function () {
    var content = 'simple paragraph';
    var root = getRoot(content);
    var child = getChildren(root);
    expect(child.key).toBe('html/div/' + hash(content));
  });

  it('Handle hash conflicts (for repeated fragments of text)', function () {
    var paras = ['test', 'test2', 'test'];
    var root = getRoot(paras.join('\n\n'));
    var children = getChildren(root);
    expect(children[0].key).toBe('html/div/' + hash(paras[0]));
    expect(children[2].key).toBe('html/div/' + hash(paras[0]) + '/1');
  });

  it('Uses incremental key for single level blocks', function () {
    var root = getRoot('__para1__\n\n__para2__');
    var children = getChildren(root);
    expect(children.length).toBe(2);
    expect(children[0].key).toBe('0');
    expect(children[1].key).toBe('1');
  });

  it('Counts words', function () {
    var result = buildTree('__para1__\n\n- test\n- item2\n\n[test](http://test.com) test');
    expect(result.words).toBe(5);
  });

  it('Sanitizes raw HTML fragments', function () {
    var root = getRoot('<img src="test.jpg" onclick="alert(document.cookie)"/>');
    var html = getHTML(getChildren(root));
    expect(html).toBe('<img src="test.jpg">');
  });
});
