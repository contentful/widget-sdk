import React, { Component } from 'react';
import { BLOCKS } from '@contentful/rich-text-types';
import ToolbarIcon from '../shared/ToolbarIcon.es6';
import blockToggleDecorator from '../shared/BlockToggleDecorator.es6';
import { applyChange, isSelectionInQuote } from './Util.es6';

class Blockquote extends Component {
  render() {
    return <ToolbarIcon {...this.props} />;
  }
}

// TODO: Currently it seems this is the only place using `blockToggleDecorator` but we still
//  have to inject a custom `applyChange`. Seems like we could get rid of blockToggleDecorator.
export default blockToggleDecorator({
  type: BLOCKS.QUOTE,
  title: 'Blockquote',
  icon: 'Quote',
  applyChange,
  isActive: isSelectionInQuote
})(Blockquote);

export { default as QuotePlugin } from './QuotePlugin.es6';
