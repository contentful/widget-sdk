import { PasteHtmlPlugin } from '../index.es6';
import { Value, Document, Block, Text } from 'slate';
import {
  document,
  block,
  text,
  leaf,
  mark,
  createPasteHtmlEvent,
  createPasteEvent
} from './helpers';

import { BLOCKS, MARKS } from '@contentful/structured-text-types';
import { List } from 'immutable';

const emptyInitialValue = Value.create({
  document: Document.create({
    nodes: [
      Block.create({
        type: BLOCKS.PARAGRAPH,
        nodes: List([Text.create('')])
      })
    ]
  })
});

describe('PasteHtml Plugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = PasteHtmlPlugin();
  });

  it('parses html', () => {
    const event = createPasteHtmlEvent('<b>Text</b>');
    const change = emptyInitialValue.change();
    const result = plugin.onPaste(event, change);

    expect(result).toBeTruthy();
    expect(change.value.document.toJSON()).toEqual(
      document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf(`Text`, mark(MARKS.BOLD)))))
    );
  });

  it('ignores raw text', () => {
    const event = createPasteEvent('text/plain', 'text');
    const change = emptyInitialValue.change();
    const result = plugin.onPaste(event, change);

    expect(result).toBeUndefined();
    expect(change.value.document.toJSON()).toEqual(emptyInitialValue.document.toJSON());
  });
});
