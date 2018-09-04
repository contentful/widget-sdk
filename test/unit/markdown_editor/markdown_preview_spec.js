import * as K from 'helpers/mocks/kefir';

describe('Markdown preview', () => {
  beforeEach(function() {
    module('contentful/test');
    this.markdown = K.createMockProperty('__test__');

    const PreviewGenerator = this.$inject('markdown_editor/PreviewGenerator.es6');
    this.makePreview = () => PreviewGenerator.default(this.markdown);
  });

  it('emits preview when markdown changes', function() {
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
