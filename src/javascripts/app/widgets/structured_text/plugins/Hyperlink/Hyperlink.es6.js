import React from 'react';
import { Icon, Tooltip } from '@contentful/ui-component-library';
import PropTypes from 'prop-types';

export default class Hyperlink extends React.Component {
  static propTypes = {
    attributes: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    children: PropTypes.node,
    onClick: PropTypes.func
  };

  render() {
    const { children, node } = this.props;
    const url = node.data.get('url');
    const title = node.data.get('title');

    return (
      <span>
        <a data-tip={url} title={title}>
          {children}
          <Icon icon="ExternalLink" style={{ position: 'relative', top: '3px' }} />
        </a>
        <Tooltip show={true} />
      </span>
      // TODO: Use TextLink instead, this messes up cursor behavior though,
      //  apparently because of `display: inline-flex`.
      //  See bug report: https://github.com/ianstormtaylor/slate/issues/2148
      //
      //<TextLink href="javascript:void(0)" disabled={false} data-tip={url}>
      //  {children}
      //  <Icon icon="ExternalLink" />
      //</TextLink>
    );
  }
}
