// Disabling since this is a custom component
/* eslint-disable rulesdir/restrict-non-f36-components */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from 'ui/Components/Icon.es6';
import StateLink from 'app/common/StateLink.es6';

export default class FieldDialogWidgetItem extends Component {
  static propTypes = {
    isCustom: PropTypes.bool.isRequired,
    isSelected: PropTypes.bool.isRequired,
    isDefault: PropTypes.bool.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    isApp: PropTypes.bool.isRequired,
    appId: PropTypes.string,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string,
    id: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    index: PropTypes.number
  };

  render() {
    const {
      icon,
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
        onClick={onClick}>
        {isCustom && !isApp && (
          <div className="field-dialog__widget-item-header">
            <span>Extension</span>
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
              <StateLink to="^.^.^.appsBeta.detail" params={{ appId }} target="_blank">
                <Icon name="edit" scale="0.9" />
              </StateLink>
            )}
          </div>
        )}
        <div className="field-dialog__widget-item-content">
          {icon && <Icon className="field-dialog__widget-icon" name={`${icon}-widget`} />}
          <p>{name}</p>
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
