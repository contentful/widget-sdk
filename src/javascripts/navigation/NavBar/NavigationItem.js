/* eslint-disable rulesdir/restrict-non-f36-components */

import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import cn from 'classnames';
import PropTypes from 'prop-types';
import { Tooltip } from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import NavigationItemTag from './NavigationItemTag';
import Icon from 'ui/Components/Icon';
import NavigationIcon from 'ui/Components/NavigationIcon';

import keycodes from 'utils/keycodes';

const styles = {
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
      color: '#fff',
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
    borderTop: '3px solid transparent',
    transition: 'color .1s ease-in-out',
    position: 'relative',
    cursor: 'pointer',

    '&:hover, &.is-active': css({
      color: tokens.colorBlueMid,

      svg: css({
        fill: tokens.colorBlueMid,
      }),

      '.border-bottom--active': css({
        borderBottomColor: tokens.colorBlueMid,
      }),
    }),

    '&.is-disabled, &.is-disabled:hover': css({
      color: tokens.colorTextLight,
      cursor: 'not-allowed',
    }),
  }),
  navBarListLabel: css({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '3px solid transparent',
  }),
};

function Label({ hasTooptip, children, ...rest }) {
  if (hasTooptip) {
    return (
      <Tooltip
        {...rest}
        targetWrapperClassName={cn(styles.navBarListLabel, 'border-bottom--active')}>
        {children}
      </Tooltip>
    );
  }
  return <span className={cn(styles.navBarListLabel, 'border-bottom--active')}>{children}</span>;
}

Label.propTypes = {
  hasTooptip: PropTypes.bool.isRequired,
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

export default function NavigationItem(props) {
  const { item } = props;

  const onClick = () => {
    if (item.disabled) {
      return;
    }

    Navigator.go(getNavigationProps(item));
  };

  const isActive = Navigator.includes({ path: item.rootSref || item.sref });
  return (
    <li
      key={item.title}
      className={cn(styles.appTopBarAction, styles.navBarListItem)}
      {...{
        'data-ui-tour-step': item.dataViewType ? `nav-item-${item.dataViewType}` : undefined,
      }}>
      <a
        data-view-type={item.dataViewType}
        href={Navigator.href(getNavigationProps(item))}
        className={cn(styles.navBarLink, {
          'is-disabled': item.disabled,
          'is-active': item.disabled ? false : isActive,
        })}
        role="button"
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) {
            return;
          }
          e.preventDefault();
          onClick();
        }}
        onKeyDown={(e) => {
          if (e.keyCode === keycodes.ENTER) {
            onClick();
          }
        }}
        {...{
          tabIndex: item.disabled ? undefined : '0',
        }}>
        <Label hasTooptip={Boolean(item.tooltip)} content={item.tooltip} placement="bottom">
          {item.navIcon ? (
            <NavigationIcon icon={item.navIcon} size="medium" mono color="white" inNavigation />
          ) : (
            <Icon name={item.icon} />
          )}
          {item.tagLabel && <NavigationItemTag label={item.tagLabel} />}
          {item.title}
        </Label>
      </a>
    </li>
  );
}

NavigationItem.propTypes = {
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
    disabled: PropTypes.boolean,
    tooltip: PropTypes.string,
  }).isRequired,
};
