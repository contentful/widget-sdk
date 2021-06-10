/* eslint-disable rulesdir/restrict-non-f36-components */

import React, { useState } from 'react';
import keycodes from 'utils/keycodes';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  Tooltip,
  Tag,
  Icon,
} from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import { NavigationItemTag } from './NavigationItemTag';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { noop } from 'lodash';
import { NavigationItemType } from './NavigationItem';

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
  tooltip: css({
    textTransform: 'none',
    fontWeight: tokens.fontWeightNormal,
    marginLeft: tokens.spacing2Xs,
  }),
  dropdownList: css({
    minWidth: 250,
  }),
  question: css({
    marginLeft: tokens.spacingXs,
    color: tokens.colorElementMid,
    cursor: 'pointer',
  }),
  dropdownItem: css({
    display: 'flex',
  }),
  separator: css({
    margin: `${tokens.spacingXs} ${tokens.spacing2Xs} 0`,
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

    '&:focus': css({
      outline: 0,
      backgroundColor: tokens.colorContrastDark,
    }),
  }),
  navBarListLabel: css({
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    color: tokens.colorWhite,
  }),
  navBarProductIcon: css({
    marginRight: tokens.spacingXs,
  }),
  tag: css({
    marginLeft: tokens.spacingXs,
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

type NavigationDropdownProps = {
  onOpen?: () => void;
  item: NavigationItemType;
};

export function NavigationDropdown({
  item,
  onOpen: onDropdownOpen = noop,
}: NavigationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => {
    setIsOpen(true);
    onDropdownOpen();
  };

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <li className={cx(styles.appTopBarAction, styles.navBarListItem)}>
      <Dropdown
        isOpen={isOpen}
        onClose={onClose}
        isAutoalignmentEnabled={false}
        className={cx('app-top-bar__action', styles.dropdown)}
        position="bottom-left"
        toggleElement={
          <a
            className={cx(styles.navBarLink, {
              'is-active': Navigator.includes({ path: item.rootSref || item.sref }),
            })}
            role="button"
            tabIndex={0}
            data-view-type={item.dataViewType}
            onClick={onOpen}
            onKeyDown={(e) => {
              if (e.keyCode === keycodes.ENTER) {
                onOpen();
              }
            }}>
            <span className={styles.navBarListLabel}>
              {item.navIcon && (
                <ProductIcon
                  icon={item.navIcon as any}
                  size="medium"
                  color="white"
                  className={styles.navBarProductIcon}
                />
              )}
              {item.title}
              {item.tagLabel && <NavigationItemTag label={item.tagLabel} />}
            </span>
            <span className={cx(styles.triangleArrow, 'border-color')} />
          </a>
        }>
        <DropdownList className={styles.dropdownList} testId="navbar-dropdown-menu">
          {item.children?.map((subitem, index) => {
            if (subitem.separator) {
              return (
                <DropdownListItem
                  key={subitem.label}
                  isTitle={subitem.isTitle !== false}
                  className={index !== 0 ? styles.separator : styles.dropdownItem}>
                  {subitem.render ? subitem.render(subitem) : subitem.label}
                  {subitem.tooltip && (
                    <Tooltip place="bottom" content={subitem.tooltip} className={styles.tooltip}>
                      <Icon icon="InfoCircle" color="muted" className={styles.question} />
                    </Tooltip>
                  )}
                </DropdownListItem>
              );
            }

            const navigationProps = getNavigationProps(subitem);

            let href = Navigator.href(navigationProps);
            // When using PathSuffix in the matching url, Navigator.href returns a wrongly encoded url.
            // A method `formatUrl` can be passed in to fix that url.
            if (subitem.formatUrl) {
              href = subitem.formatUrl(href);
            }

            return (
              <DropdownListItem
                data-view-type={subitem.dataViewType}
                key={subitem.title}
                href={href}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    return;
                  }
                  e.preventDefault();
                  Navigator.go(navigationProps);
                  onClose();
                }}>
                {subitem.render ? subitem.render(subitem) : subitem.title}
                {subitem.tagLabel && (
                  <Tag tagType="primary-filled" size="small" className={styles.tag}>
                    {subitem.tagLabel}
                  </Tag>
                )}
              </DropdownListItem>
            );
          })}
        </DropdownList>
      </Dropdown>
    </li>
  );
}
