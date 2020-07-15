// Disabling since this is a custom component
/* eslint-disable rulesdir/restrict-non-f36-components */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from 'ui/Components/Icon';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink';
import { css } from 'emotion';
import { WidgetNamespace, isCustomWidget } from 'features/widget-renderer';

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

export default class FieldDialogWidgetItem extends Component {
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
        <NavigationIcon icon="Apps" size="large" />
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
              <StateLink
                path="^.^.^.settings.extensions.detail"
                params={{ extensionId: widget.id }}
                target="_blank"
                rel="noopener noreferrer">
                <Icon name="edit" scale="0.9" />
              </StateLink>
            )}
          </div>
        )}
        {widget.namespace === WidgetNamespace.APP && (
          <div className="field-dialog__widget-item-header">
            <span>App</span>
            {isAdmin && (
              <StateLink
                path="^.^.^.apps.detail"
                params={{ appId: widget.appId }}
                target="_blank"
                rel="noopener noreferrer">
                <Icon name="edit" scale="0.9" />
              </StateLink>
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
