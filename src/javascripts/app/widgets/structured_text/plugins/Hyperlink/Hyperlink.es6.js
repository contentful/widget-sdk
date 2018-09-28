import React from 'react';
import { Tooltip, TextLink } from '@contentful/ui-component-library';
import PropTypes from 'prop-types';
import { INLINES } from '@contentful/structured-text-types';
import RequestStatus from '../shared/RequestStatus.es6';
import FetchEntity from '../shared/FetchEntity/index.es6';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';

const { HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK } = INLINES;

const ICON_MAP = {
  [HYPERLINK]: 'ExternalLink',
  [ENTRY_HYPERLINK]: 'Entry',
  [ASSET_HYPERLINK]: 'Asset'
};

export default class Hyperlink extends React.Component {
  static propTypes = {
    attributes: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    children: PropTypes.node,
    editor: PropTypes.object,
    createHyperlinkDialog: PropTypes.func
  };

  render() {
    const { node } = this.props;
    const uri = node.data.get('uri');
    const target = node.data.get('target');
    // TODO: Use icon once we implement nicer cursor interaction with link.
    const _icon = ICON_MAP[node.type];

    return (
      <span {...this.props.attributes} onClick={this.props.onClick}>
        {target ? this.renderEntityLink(target) : this.renderLink({ tooltip: uri })}
        <Tooltip show={true} />
      </span>
      // TODO: Add contentEditable={false} to tooltip to fix text cursor bug
    );
  }

  renderLink({ tooltip }) {
    const { children, node } = this.props;
    const title = node.data.get('title');
    const uri = node.data.get('uri');
    const href = isUrl(uri) ? uri : 'javascript:void(0)';
    return (
      <TextLink
        href={href} // Allows user to open link in new tab.
        data-tip={tooltip}
        title={title}
        extraClassNames="structured-text__hyperlink">
        {children}
        {/*<Icon icon={icon} extraClassNames="structured-text__hyperlink-icon" />*/}
      </TextLink>
    );
  }

  renderEntityLink(target) {
    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <FetchEntity
            widgetAPI={widgetAPI}
            entityId={target.sys.id}
            entityType={target.sys.linkType}
            localeCode={widgetAPI.field.locale}
            render={({ requestStatus, entityTitle, entityStatus, contentTypeName = 'Asset' }) => {
              let tooltip = '';
              if (requestStatus === RequestStatus.Error) {
                tooltip = `${target.sys.linkType} missing or inaccessible`;
              } else if (requestStatus === RequestStatus.Success) {
                tooltip = `${contentTypeName}: ${entityTitle ||
                'Untitled'} (${entityStatus.toUpperCase()})`;
              } else if (requestStatus === RequestStatus.Pending) {
                tooltip = `Loading ${target.sys.linkType.toLowerCase()}...`;
              }
              return this.renderLink({ tooltip });
            }}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}

function isUrl(string) {
  return /^(?:[a-z]+:)?\/\//i.test(string) || /^mailto:/i.test(string);
}
