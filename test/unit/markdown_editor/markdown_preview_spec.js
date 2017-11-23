import * as K from 'helpers/mocks/kefir';

describe('Markdown preview', function () {
  beforeEach(function () {
    module('contentful/test');
    this.markdown = K.createMockProperty('__test__');

    const PreviewGenerator = this.$inject('markdown_editor/PreviewGenerator');
    this.makePreview = () => PreviewGenerator.default(this.markdown);

    const LazyLoader = this.$inject('LazyLoader');
    sinon.stub(LazyLoader, 'get').resolves(window.cfLibs.markdown);
  });

  it('has null preview before libs are loaded', function () {
    const LazyLoader = this.$inject('LazyLoader');
    LazyLoader.get.withArgs('markdown').defers();
    const preview$ = this.makePreview();
    this.$apply();
    K.assertMatchCurrentValue(preview$, sinon.match({preview: null}));
  });

  it('emits error when loading library fails', function () {
    const LazyLoader = this.$inject('LazyLoader');
    LazyLoader.get.withArgs('markdown').rejects();
    const preview$ = this.makePreview();
    this.$apply();
    K.assertMatchCurrentValue(preview$, sinon.match({error: true}));
  });

  it('emits preview when markdown changes', function () {
    const preview$ = this.makePreview();
    this.$apply();
    let preview;

    preview = K.getValue(preview$);
    expect(preview.preview.tree.type).toBe('div');
    expect(preview.preview.info.words).toBe(1);

    this.markdown.set(null);
    preview = K.getValue(preview$);
    expect(preview.preview.tree.type).toBe('div');
    expect(preview.preview.info.words).toBe(0);

    this.markdown.set(undefined);
    preview = K.getValue(preview$);
    expect(preview.preview.tree.type).toBe('div');
    expect(preview.preview.info.words).toBe(0);
  });
});
