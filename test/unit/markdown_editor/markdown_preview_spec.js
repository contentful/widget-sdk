import * as K from 'test/helpers/mocks/kefir';
import { $initialize, $apply } from 'test/helpers/helpers';

describe('Markdown preview', () => {
  beforeEach(async function() {
    this.markdown = K.createMockProperty('__test__');

    const PreviewGenerator = await this.system.import('markdown_editor/PreviewGenerator.es6');

    await $initialize(this.system);

    this.makePreview = () => PreviewGenerator.default(this.markdown);
  });

  it('emits preview when markdown changes', function() {
    const preview$ = this.makePreview();
    $apply();
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
