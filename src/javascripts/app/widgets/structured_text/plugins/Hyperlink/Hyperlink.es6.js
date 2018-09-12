import React from 'react';
import { Icon, Tooltip, TextLink } from '@contentful/ui-component-library';
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
    const uri = node.data.get('uri');
    const title = node.data.get('title');

    return (
      <span>
        <TextLink
          href="javascript:void(0)"
          data-tip={uri}
          title={title}
          extraClassNames="structured-text__hyperlink">
          {children}
          <Icon icon="ExternalLinkTrimmed" extraClassNames="structured-text__hyperlink-icon" />
        </TextLink>

        <Tooltip show={true} />
      </span>
      // TODO: Add contentEditable={false} to tooltip to fix text cursor bug
    );
  }
}
