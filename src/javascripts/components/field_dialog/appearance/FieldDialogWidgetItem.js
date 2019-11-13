// Disabling since this is a custom component
/* eslint-disable rulesdir/restrict-non-f36-components */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from 'ui/Components/Icon';
import StateLink from 'app/common/StateLink';
import { css } from 'emotion';

const styles = {
  appIcon: css({
    margin: 'auto',
    height: '42px',
    width: '42px'
  }),
  widgetTitle: css({
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  })
};

export default class FieldDialogWidgetItem extends Component {
  static propTypes = {
    isCustom: PropTypes.bool.isRequired,
    isSelected: PropTypes.bool.isRequired,
    isDefault: PropTypes.bool.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    isApp: PropTypes.bool,
    appId: PropTypes.string,
    name: PropTypes.string.isRequired,
    appIconUrl: PropTypes.string,
    icon: PropTypes.string,
    id: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    index: PropTypes.number
  };

  renderIcon() {
    const { isApp, icon, appIconUrl } = this.props;

    if (isApp && appIconUrl) {
      return <img className={styles.appIcon} src={appIconUrl} />;
    } else if (icon) {
      return <Icon className="field-dialog__widget-icon" name={`${icon}-widget`} />;
    }

    return null;
  }

  render() {
    const {
      name,
      isDefault,
      isCustom,
      id,
      isSelected,
      onClick,
      index,
      isAdmin,
      isApp,
      appId
    } = this.props;

    return (
      <li
        className={classNames('field-dialog__widget-item', {
          'is-selected': isSelected,
          'is-custom': isCustom
        })}
        data-current-widget-index={index}
        onClick={onClick}
        title={name}>
        {isCustom && !isApp && (
          <div className="field-dialog__widget-item-header">
            <span>UI Extension</span>
            {isAdmin && (
              <StateLink
                to="^.^.^.settings.extensions.detail"
                params={{ extensionId: id }}
                target="_blank">
                <Icon name="edit" scale="0.9" />
              </StateLink>
            )}
          </div>
        )}
        {isApp && (
          <div className="field-dialog__widget-item-header">
            <span>App</span>
            {isAdmin && (
              <StateLink to="^.^.^.apps.detail" params={{ appId }} target="_blank">
                <Icon name="edit" scale="0.9" />
              </StateLink>
            )}
          </div>
        )}
        <div className="field-dialog__widget-item-content">
          {this.renderIcon()}
          <p className={styles.widgetTitle}>{name}</p>
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
