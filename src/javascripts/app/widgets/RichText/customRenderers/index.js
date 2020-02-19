import React from 'react';
import EntityBlockEmbed from './EntityBlockEmbed';
import EntryInlineEmbed from './EntryInlineEmbed';
import renderEntityHyperlinkTooltip from './renderEntityHyperlinkTooltip';

export default {
  renderEntityBlockEmbed: (_richTextAPI, props) => <EntityBlockEmbed {...props} />,
  renderEntryInlineEmbed: (_richTextAPI, props) => <EntryInlineEmbed {...props} />,
  renderEntityHyperlinkTooltip
};
