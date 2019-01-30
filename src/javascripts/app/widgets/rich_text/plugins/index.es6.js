import { BLOCKS } from '@contentful/rich-text-types';
import { BoldPlugin } from './Bold/index.es6';
import { ItalicPlugin } from './Italic/index.es6';
import { UnderlinedPlugin } from './Underlined/index.es6';
import { CodePlugin } from './Code/index.es6';
import { QuotePlugin } from './Quote/index.es6';
import { HyperlinkPlugin } from './Hyperlink/index.es6';
import {
  Heading1Plugin,
  Heading2Plugin,
  Heading3Plugin,
  Heading4Plugin,
  Heading5Plugin,
  Heading6Plugin
} from './Heading/index.es6';

import NewLinePlugin from './NewLinePlugin/index.es6';
import { ParagraphPlugin } from './Paragraph/index.es6';
import {
  EmbeddedAssetBlockPlugin,
  EmbeddedEntryBlockPlugin
} from './EmbeddedEntityBlock/index.es6';
import { EmbeddedEntryInlinePlugin } from './EmbeddedEntryInline/index.es6';

import { ListPlugin } from './List/index.es6';
import { HrPlugin } from './Hr/index.es6';

import TrailingBlock from '@wikifactory/slate-trailing-block';
import { PastePlugin } from './Paste/index.es6';
import { PasteHtmlPlugin } from './PasteHtml/index.es6';
import { PasteTextPlugin } from './PasteText/index.es6';

export function buildPlugins(richTextAPI) {
  return [
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
    TrailingBlock({ type: BLOCKS.PARAGRAPH }),
    NewLinePlugin()
  ];
}
