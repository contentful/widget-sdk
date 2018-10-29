import { PasteTextPlugin } from './index.es6';
import { Value, Document, Block, Text } from 'slate';
import {
  document,
  block,
  text,
  leaf,
  createPasteHtmlEvent,
  createPasteEvent
} from './../shared/PasteTestHelpers';

import { BLOCKS } from '@contentful/rich-text-types';
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

describe('PasteText Plugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = PasteTextPlugin();
  });

  it('parses raw text', () => {
    const event = createPasteEvent('text/plain', 'I am a plain old text');
    const change = emptyInitialValue.change();
    const result = plugin.onPaste(event, change);

    expect(result).toBeTruthy();
    expect(change.value.document.toJSON()).toEqual(
      document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf('I am a plain old text'))))
    );
  });

  it('ignores HTML', () => {
    const event = createPasteHtmlEvent('<marquee>I sure am some fancy HTML</marquee>');
    const change = emptyInitialValue.change();
    const result = plugin.onPaste(event, change);

    expect(result).toBeUndefined();
    expect(change.value.document.toJSON()).toEqual(emptyInitialValue.document.toJSON());
  });
});
