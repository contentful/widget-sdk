import React, { Component } from 'react';
import { BLOCKS } from '@contentful/structured-text-types';
import ToolbarIcon from '../shared/ToolbarIcon.es6';
import blockDecorator from '../shared/BlockToggleDecorator.es6';

class Quote extends Component {
  render() {
    return <ToolbarIcon {...this.props} />;
  }
}

export default blockDecorator({
  type: BLOCKS.QUOTE,
  title: 'Quote',
  icon: 'Quote'
})(Quote);

export { default as QuotePlugin } from './QuotePlugin.es6';
