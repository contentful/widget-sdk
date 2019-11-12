import { BLOCKS } from '@contentful/rich-text-types';
import { BoldPlugin } from './Bold/index';
import { ItalicPlugin } from './Italic/index';
import { UnderlinedPlugin } from './Underlined/index';
import { CodePlugin } from './Code/index';
import { QuotePlugin } from './Quote/index';
import { HyperlinkPlugin } from './Hyperlink/index';
import {
  Heading1Plugin,
  Heading2Plugin,
  Heading3Plugin,
  Heading4Plugin,
  Heading5Plugin,
  Heading6Plugin
} from './Heading/index';

import NewLinePlugin from './NewLinePlugin/index';
import { ParagraphPlugin } from './Paragraph/index';
import {
  EmbeddedAssetBlockPlugin,
  EmbeddedEntryBlockPlugin
} from './EmbeddedEntityBlock/index';
import { EmbeddedEntryInlinePlugin } from './EmbeddedEntryInline/index';

import { ListPlugin } from './List/index';
import { HrPlugin } from './Hr/index';

import TrailingBlock from '@wikifactory/slate-trailing-block';
import { PastePlugin } from './Paste/index';
import { PasteHtmlPlugin } from './PasteHtml/index';
import { PasteTextPlugin } from './PasteText/index';

import { CommandPalettePlugin } from './CommandPalette/index';
import { InsertBeforeFirstVoidBlockPlugin } from './InsertBeforeFirstVoidBlock/index';

import schema from '../constants/Schema';

export function buildPlugins(richTextAPI) {
  return [
    { schema },
    InsertBeforeFirstVoidBlockPlugin({ richTextAPI }),
    BoldPlugin({ richTextAPI }),
    ItalicPlugin({ richTextAPI }),
    UnderlinedPlugin({ richTextAPI }),
    CodePlugin({ richTextAPI }),
    QuotePlugin({ richTextAPI }),
    HyperlinkPlugin({ richTextAPI }),
    Heading1Plugin({ richTextAPI }),
    Heading2Plugin({ richTextAPI }),
    Heading3Plugin({ richTextAPI }),
    Heading4Plugin({ richTextAPI }),
    Heading5Plugin({ richTextAPI }),
    Heading6Plugin({ richTextAPI }),
    ParagraphPlugin(),
    HrPlugin({ richTextAPI }),
    EmbeddedEntryInlinePlugin({ richTextAPI }),
    EmbeddedEntryBlockPlugin({ richTextAPI }),
    EmbeddedAssetBlockPlugin({ richTextAPI }),
    ListPlugin({ richTextAPI }),
    PastePlugin({ richTextAPI }),
    PasteHtmlPlugin(),
    PasteTextPlugin(),
    CommandPalettePlugin({ richTextAPI }),
    TrailingBlock({ type: BLOCKS.PARAGRAPH }),
    NewLinePlugin()
  ];
}
