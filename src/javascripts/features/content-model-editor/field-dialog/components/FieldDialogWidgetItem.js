// Disabling since this is a custom component
/* eslint-disable rulesdir/restrict-non-f36-components */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from 'ui/Components/Icon';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { WidgetNamespace, isCustomWidget } from '@contentful/widget-renderer';
import { ReactRouterLink } from 'core/react-routing';

const styles = {
  appIcon: css({
    margin: 'auto',
    height: '42px',
    width: '42px',
  }),
  widgetTitle: css({
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  }),
  widgetAppIcon: css({
    display: 'flex',
    justifyContent: 'center',
    marginBottom: tokens.spacingXs,
  }),
};

class FieldDialogWidgetItem extends Component {
  static propTypes = {
    onClick: PropTypes.func.isRequired,
    index: PropTypes.number,
    isSelected: PropTypes.bool.isRequired,
    isDefault: PropTypes.bool.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    widget: PropTypes.object.isRequired,
  };

  renderIcon() {
    const { namespace, icon, appIconUrl } = this.props.widget;

    if (namespace === WidgetNamespace.APP && appIconUrl) {
      return <img className={styles.appIcon} src={appIconUrl} />;
    }

    return icon ? (
      <Icon className="field-dialog__widget-icon" name={`${icon}-widget`} />
    ) : (
      <div className={styles.widgetAppIcon}>
        <ProductIcon icon="Apps" size="large" />
      </div>
    );
  }

  render() {
    const { index, isAdmin, isDefault, isSelected, onClick, widget } = this.props;

    return (
      <li
        className={classNames('field-dialog__widget-item', {
          'is-selected': isSelected,
          'is-custom': isCustomWidget(widget.namespace),
        })}
        data-current-widget-index={index}
        onClick={onClick}
        title={widget.name}>
        {widget.namespace === WidgetNamespace.EXTENSION && (
          <div className="field-dialog__widget-item-header">
            <span>UI Extension</span>
            {isAdmin && (
              <ReactRouterLink
                route={{ path: 'extensions.detail', extensionsId: widget.id }}
                target="_blank"
                rel="noopener noreferrer">
                <Icon name="edit" scale="0.9" />
              </ReactRouterLink>
            )}
          </div>
        )}
        {widget.namespace === WidgetNamespace.APP && (
          <div className="field-dialog__widget-item-header">
            <span>App</span>
            {isAdmin && (
              <ReactRouterLink
                route={{ path: 'apps.app-configuration', appId: widget.appId }}
                target="_blank"
                rel="noopener noreferrer">
                <Icon name="edit" scale="0.9" />
              </ReactRouterLink>
            )}
          </div>
        )}
        <div className="field-dialog__widget-item-content">
          {this.renderIcon()}
          <p className={styles.widgetTitle}>{widget.name}</p>
          {isDefault && <div className="field-dialog__widget-default">(default)</div>}
          {isSelected && (
            <div className="field-dialog__checkmark">
              <Icon name="checkmark" />
            </div>
          )}
        </div>
      </li>
    );
  }
}

export { FieldDialogWidgetItem };
