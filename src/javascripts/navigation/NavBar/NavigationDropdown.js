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
  Tag,
  Tooltip,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import * as Navigator from 'states/Navigator';
import NavigationItemTag from './NavigationItemTag';
import Icon from 'ui/Components/Icon';
import NavigationIcon from 'ui/Components/NavigationIcon';
import { noop } from 'lodash';

const styles = {
  dropdown: css({
    paddingLeft: '0 !important',
  }),
  triangleArrow: css({
    margin: '2px 0 0 12px',
    border: `4px solid ${tokens.colorWhite}`,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    transition: 'border-top-color 0.1s ease-in-out',
  }),
  dropdownList: css({
    minWidth: 250,
  }),
  question: css({
    marginLeft: '10px',
    color: tokens.colorElementMid,
    cursor: 'pointer',
  }),
  separator: css({
    marginTop: tokens.spacingM,
  }),
  appTopBarAction: css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',

    '&:first-child': css({
      paddingLeft: tokens.spacingM,
    }),
    '&:last-child': css({
      paddingRight: tokens.spacingM,
    }),
    a: css({
      color: tokens.colorWhite,
      padding: `0 ${tokens.spacingM}`,
    }),
  }),
  navBarListItem: css({
    margin: 0,
    '.icon-component': css({
      marginRight: tokens.spacingS,

      svg: css({
        transition: 'all 0.1s ease-in-out',
      }),
    }),
  }),
  navBarLink: css({
    color: tokens.colorWhite,
    padding: `0 ${tokens.spacingM}`,
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    transition: 'color .1s ease-in-out',
    position: 'relative',
    cursor: 'pointer',

    '&:hover': css({
      backgroundColor: tokens.colorContrastDark,
    }),
    '&.is-active': css({
      backgroundColor: tokens.colorContrastMid,
    }),

    '&.is-disabled, &.is-disabled:hover': css({
      color: tokens.colorTextLight,
      cursor: 'not-allowed',
    }),
  }),
  navBarListLabel: css({
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    color: tokens.colorWhite,

    div: css({
      marginRight: '10px',
    }),
  }),
  tag: css({
    top: tokens.spacingXs,
    background: tokens.colorBlueDark,
    color: tokens.colorWhite,
    padding: '3px 5px',
    fontSize: '10px',
    lineHeight: '10px',
    borderRadius: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.05rem',
    marginLeft: tokens.spacingS,
  }),
};

function getNavigationProps(item) {
  return {
    path: item.sref,
    params: item.srefParams || {},
    options: {
      inherit: true,
      ...(item.srefOptions || {}),
    },
  };
}

export default function NavigationDropdown({
  item,
  onOpen: onDropdownOpen = noop,
  disableHighlight = false,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => {
    setIsOpen(true);
    onDropdownOpen();
  };

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <li className={cn(styles.appTopBarAction, styles.navBarListItem)}>
      <Dropdown
        isOpen={isOpen}
        onClose={onClose}
        isAutoalignmentEnabled={false}
        className={cn('app-top-bar__action', styles.dropdown)}
        position="bottom-left"
        toggleElement={
          <a
            className={cn(styles.navBarLink, styles.appTopBarMenuTrigger, {
              'is-active':
                !disableHighlight && Navigator.includes({ path: item.rootSref || item.sref }),
            })}
            role="button"
            tabIndex="0"
            data-view-type={item.dataViewType}
            onClick={onOpen}
            onKeyDown={(e) => {
              if (e.keyCode === keycodes.ENTER) {
                onOpen();
              }
            }}>
            <span className={styles.navBarListLabel}>
              {item.navIcon ? (
                <NavigationIcon icon={item.navIcon} size="medium" color="white" inNavigation />
              ) : (
                <Icon name={item.icon} />
              )}
              {item.title}
              {item.tagLabel && <NavigationItemTag label={item.tagLabel} />}
            </span>
            <span className={cn(styles.triangleArrow, 'border-color')} />
          </a>
        }>
        <DropdownList className={styles.dropdownList} testId="navbar-dropdown-menu">
          {item.children.map((subitem, index) => {
            if (subitem.separator) {
              return (
                <DropdownListItem
                  key={subitem.label}
                  isTitle={subitem.isTitle !== false}
                  className={index !== 0 ? styles.separator : ''}>
                  {subitem.render ? subitem.render(subitem) : subitem.label}
                  {subitem.tooltip && (
                    <Tooltip place="bottom" content={subitem.tooltip} className={styles.tooltip}>
                      <i className={cn('fa', 'fa-question-circle', styles.question)}></i>
                    </Tooltip>
                  )}
                </DropdownListItem>
              );
            }
            const navigationProps = getNavigationProps(subitem);

            return (
              <DropdownListItem
                data-view-type={subitem.dataViewType}
                key={subitem.title}
                href={Navigator.href(navigationProps)}
                isActive={
                  !disableHighlight &&
                  Navigator.includes({ path: subitem.rootSref || subitem.sref })
                }
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    return;
                  }
                  e.preventDefault();
                  Navigator.go(navigationProps);
                  onClose();
                }}>
                {subitem.render ? subitem.render(subitem) : subitem.title}
                {subitem.tagLabel && <Tag className={styles.tag}>{subitem.tagLabel}</Tag>}
              </DropdownListItem>
            );
          })}
        </DropdownList>
      </Dropdown>
    </li>
  );
}

NavigationDropdown.propTypes = {
  onOpen: PropTypes.func,
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    icon: PropTypes.string,
    tagLabel: PropTypes.string,
    navIcon: PropTypes.string,
    rootSref: PropTypes.string,
    sref: PropTypes.string,
    srefParams: PropTypes.object,
    srefOptions: PropTypes.object,
    dataViewType: PropTypes.string,
    disabled: PropTypes.bool,
    children: PropTypes.arrayOf(
      PropTypes.shape({
        separator: PropTypes.bool,
        isTitle: PropTypes.bool,
        tooltip: PropTypes.string,
        rootSref: PropTypes.string,
        sref: PropTypes.string,
        title: PropTypes.string,
        label: PropTypes.string,
        dataViewType: PropTypes.string,
        reload: PropTypes.bool,
        render: PropTypes.func,
      })
    ).isRequired,
  }).isRequired,
  disableHighlight: PropTypes.bool,
};
