/* eslint-disable rulesdir/restrict-non-f36-components */

import React, { useState } from 'react';
import cn from 'classnames';
import keycodes from 'utils/keycodes';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  Tooltip
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import * as Navigator from 'states/Navigator';
import NavigationItemTag from './NavigationItemTag';
import Icon from 'ui/Components/Icon';
import IconPoc from 'ui/Components/IconPoc';

const styles = {
  dropdown: css({
    paddingLeft: '0 !important'
  }),
  triangleArrow: css({
    margin: '2px 0 0 12px'
  }),
  dropdownList: css({
    minWidth: 250
  }),
  question: css({
    marginLeft: '10px',
    color: tokens.colorElementMid,
    cursor: 'pointer'
  }),
  separator: css({
    marginTop: tokens.spacingM
  })
};

function getNavigationProps(item) {
  return {
    path: item.sref,
    params: item.srefParams || {},
    options: {
      inherit: true,
      ...(item.srefOptions || {})
    }
  };
}

export default function NavigationDropdown(props) {
  const { item } = props;
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => {
    setIsOpen(true);
  };

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <li className="app-top-bar__action nav-bar__list-item">
      <Dropdown
        isOpen={isOpen}
        onClose={onClose}
        isAutoalignmentEnabled={false}
        className={cn('app-top-bar__action', styles.dropdown)}
        position="bottom-left"
        toggleElement={
          <a
            className={cn('nav-bar__link', 'app-top-bar__menu-trigger', {
              'is-active': Navigator.includes({ path: item.rootSref || item.sref })
            })}
            role="button"
            tabIndex="0"
            data-view-type={item.dataViewType}
            onClick={onOpen}
            onKeyDown={e => {
              if (e.keyCode === keycodes.ENTER) {
                onOpen();
              }
            }}>
            <span className="nav-bar__list-label">
              {item.iconPoc ? (
                <IconPoc name={item.iconPoc} size="medium" color="white" />
              ) : (
                <Icon name={item.icon} />
              )}
              {item.title}
              {item.tagLabel && <NavigationItemTag label={item.tagLabel} />}
            </span>
            <span className={cn('triangle-down', styles.triangleArrow)} />
          </a>
        }>
        <DropdownList className={styles.dropdownList} testId="navbar-dropdown-menu">
          {item.children.map((subitem, index) => {
            if (subitem.separator) {
              return (
                <DropdownListItem
                  key={subitem.label}
                  isTitle
                  className={index !== 0 ? styles.separator : ''}>
                  {subitem.label}
                  {subitem.tooltip && (
                    <Tooltip place="bottom" content={subitem.tooltip} className={styles.tooltip}>
                      <i className={cn('fa', 'fa-question-circle', styles.question)}></i>
                    </Tooltip>
                  )}
                </DropdownListItem>
              );
            }
            return (
              <DropdownListItem
                data-view-type={subitem.dataViewType}
                key={subitem.title}
                href={Navigator.href(getNavigationProps(subitem))}
                isActive={Navigator.includes({ path: subitem.rootSref || subitem.sref })}
                onClick={e => {
                  if (e.ctrlKey || e.metaKey) {
                    return;
                  }
                  e.preventDefault();
                  Navigator.go(getNavigationProps(subitem));
                  onClose();
                }}>
                {subitem.title}
              </DropdownListItem>
            );
          })}
        </DropdownList>
      </Dropdown>
    </li>
  );
}

NavigationDropdown.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    tagLabel: PropTypes.string,
    iconPoc: PropTypes.string,
    rootSref: PropTypes.string,
    sref: PropTypes.string,
    srefParams: PropTypes.object,
    srefOptions: PropTypes.object,
    dataViewType: PropTypes.string,
    disabled: PropTypes.boolean,
    children: PropTypes.arrayOf(
      PropTypes.shape({
        separator: PropTypes.boolean,
        tooltip: PropTypes.string,
        rootSref: PropTypes.string,
        sref: PropTypes.string,
        title: PropTypes.string,
        label: PropTypes.string,
        dataViewType: PropTypes.string,
        reload: PropTypes.boolean
      })
    ).isRequired
  }).isRequired
};
