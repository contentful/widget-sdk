import { PasteHtmlPlugin } from './index.es6';
import { Value, Document, Block, Text, Editor } from 'slate';
import {
  document,
  block,
  text,
  leaf,
  mark,
  createPasteHtmlEvent,
  createPasteEvent
} from './../shared/PasteTestHelpers';

import { BLOCKS, MARKS } from '@contentful/rich-text-types';
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
  it('ignores raw text', () => {
    const event = createPasteEvent('text/plain', 'text');
    const editor = new Editor({ value: emptyInitialValue });
    const next = jest.fn();

    const result = PasteHtmlPlugin().onPaste(event, editor, next);

    expect(next).toHaveBeenCalled();
    expect(result).toBeUndefined();
    expect(editor.value.document.toJSON()).toEqual(emptyInitialValue.document.toJSON());
  });

  it('parses html', () => {
    const event = createPasteHtmlEvent('<b>Text</b>');
    const editor = new Editor({ value: emptyInitialValue });
    const next = jest.fn();

    const result = PasteHtmlPlugin().onPaste(event, editor, next);

    expect(result).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
    expect(editor.value.document.toJSON()).toEqual(
      document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf(`Text`, mark(MARKS.BOLD)))))
    );
  });
});
