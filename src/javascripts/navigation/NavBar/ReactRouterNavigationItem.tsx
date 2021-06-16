/* eslint-disable rulesdir/restrict-non-f36-components */

import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import cn from 'classnames';
import { Tooltip, Icon, ModalLauncher } from '@contentful/forma-36-react-components';
import { NavigationItemTag } from './NavigationItemTag';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { RouteType } from 'core/react-routing/routes';
import { useRouteNavigate, RouteLink } from 'core/react-routing';

import keycodes from 'utils/keycodes';

import {
  TEAMS_CONTENT_ENTRY_ID,
  FeatureModal,
  handleHighValueLabelTracking,
  TEAMS_TRACKING_NAME,
} from 'features/high-value-modal';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';

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
    height: '100%',
    display: 'flex',
    alignItems: 'center',
  }),
  navIcon: css({
    marginRight: tokens.spacingXs,
  }),
  navHighValueIcon: css({
    marginLeft: tokens.spacingXs,
  }),
  navHighValueIconTrial: css({
    fill: tokens.colorPurpleMid,
    borderRadius: '50%',

    '& path:first-child': css({
      fill: 'white',
    }),
  }),
};

function Label({
  hasTooptip,
  children,
  highValueLabel,
  isOrganizationOnTrial,
  ...rest
}: {
  hasTooptip: boolean;
  highValueLabel?: boolean;
  isOrganizationOnTrial?: boolean;
  content?: string;
  placement?: string;
  children: React.ReactNode | React.ReactNodeArray;
}) {
  if (hasTooptip) {
    return (
      <Tooltip
        {...rest}
        targetWrapperClassName={cn(styles.navBarListLabel, 'border-bottom--active')}
        onMouseOver={
          highValueLabel
            ? () =>
                handleHighValueLabelTracking('hover', TEAMS_TRACKING_NAME, !!isOrganizationOnTrial)
            : undefined
        }>
        {children}
      </Tooltip>
    );
  }
  return <span className={cn(styles.navBarListLabel, 'border-bottom--active')}>{children}</span>;
}

const openDialog = (modalData) => {
  handleHighValueLabelTracking('click', TEAMS_TRACKING_NAME, false);

  ModalLauncher.open(({ onClose, isShown }) => (
    <FeatureModal
      isShown={isShown}
      onClose={() => onClose()}
      {...modalData}
      featureTracking={TEAMS_TRACKING_NAME}
    />
  ));
};

const initialFetch = async () => await fetchWebappContentByEntryID(TEAMS_CONTENT_ENTRY_ID);

export type ReactRouterNavigationSubitemType = {
  route: RouteType;
  separator?: boolean;
  isTitle?: boolean;
  tooltip?: string;
  title?: string;
  label?: string;
  navIcon?: string;
  dataViewType?: string;
  reload?: boolean;
  render?: (item: ReactRouterNavigationSubitemType) => React.ReactNode;
  formatUrl?: (item: string) => string;
  tagLabel?: string;
};

export type ReactRouterNavigationItemType = {
  title: string;
  route: RouteType;
  if?: boolean;
  icon?: string;
  tagLabel?: string;
  navIcon?: string;
  dataViewType?: string;
  disabled?: boolean;
  tooltip?: string;
  highValueLabel?: boolean;
  isOrganizationOnTrial?: boolean;
  children?: ReactRouterNavigationSubitemType[];
  isActiveFn?: (pathname: string) => boolean;
  render?: (item: ReactRouterNavigationItemType) => React.ReactNode;
};

export function ReactRouterNavigationItem(props: { item: ReactRouterNavigationItemType }) {
  const routeNavigate = useRouteNavigate();

  const { item } = props;
  const fetchData = async () => {
    try {
      const modalData = await initialFetch();
      openDialog(modalData);
    } catch {
      // do nothing, user will be able to see tooltip with information about the feature
      throw new Error('Something went wrong while fetching data from Contentful');
    }
  };

  const onClick = () => {
    if (item.disabled) {
      return;
    }

    if (item.highValueLabel && !item.isOrganizationOnTrial) {
      fetchData();
    } else {
      item.isOrganizationOnTrial &&
        handleHighValueLabelTracking('click', TEAMS_TRACKING_NAME, true);
      routeNavigate(item.route);
    }
  };

  return (
    <li
      key={item.title}
      className={cn(styles.appTopBarAction, styles.navBarListItem)}
      {...{
        'data-ui-tour-step': item.dataViewType ? `nav-item-${item.dataViewType}` : undefined,
      }}>
      <RouteLink
        route={item.route}
        data-view-type={item.dataViewType}
        className={cn(styles.navBarLink, {
          'is-disabled': item.disabled,
        })}
        activeClassName={'is-active'}
        exact={false}
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
          tabIndex: item.disabled ? undefined : 0,
        }}>
        <Label
          hasTooptip={Boolean(item.tooltip)}
          content={item.tooltip}
          placement="bottom"
          highValueLabel={item.highValueLabel}
          isOrganizationOnTrial={item.isOrganizationOnTrial}>
          {item.navIcon && (
            <ProductIcon
              icon={item.navIcon as any}
              size="medium"
              color="white"
              className={styles.navIcon}
            />
          )}
          {item.tagLabel && <NavigationItemTag label={item.tagLabel} />}
          {item.title}
          {item.highValueLabel && (
            <Icon
              icon="InfoCircle"
              color="white"
              className={cn(styles.navHighValueIcon, {
                [styles.navHighValueIconTrial]: item.isOrganizationOnTrial,
              })}
            />
          )}
        </Label>
      </RouteLink>
    </li>
  );
}
