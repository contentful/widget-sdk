import React from 'react';
import EntityBlockEmbed from './EntityBlockEmbed';
import EntryInlineEmbed from './EntryInlineEmbed';

export default {
  renderEntityBlockEmbed: (_richTextAPI, props) => <EntityBlockEmbed {...props} />,
  renderEntryInlineEmbed: (_richTextAPI, props) => <EntryInlineEmbed {...props} />,
};
