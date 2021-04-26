/* eslint-disable rulesdir/restrict-non-f36-components */

import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import cn from 'classnames';
import PropTypes from 'prop-types';
import { Tooltip, Icon as F36Icon, ModalLauncher } from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import NavigationItemTag from './NavigationItemTag';
import Icon from 'ui/Components/Icon'; // TODO: remove this component and replace with Icon from F36
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

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

function Label({ hasTooptip, children, highValueLabel, isOrganizationOnTrial, ...rest }) {
  if (hasTooptip) {
    return (
      <Tooltip
        {...rest}
        targetWrapperClassName={cn(styles.navBarListLabel, 'border-bottom--active')}
        onMouseOver={
          highValueLabel &&
          (() =>
            handleHighValueLabelTracking('hover', TEAMS_TRACKING_NAME, !!isOrganizationOnTrial))
        }>
        {children}
      </Tooltip>
    );
  }
  return <span className={cn(styles.navBarListLabel, 'border-bottom--active')}>{children}</span>;
}

Label.propTypes = {
  hasTooptip: PropTypes.bool.isRequired,
  highValueLabel: PropTypes.bool,
  isOrganizationOnTrial: PropTypes.bool,
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

export default function NavigationItem(props) {
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
      Navigator.go(getNavigationProps(item));
    }
  };

  const isActive = Navigator.includes({
    path: item.rootSref || item.sref,
    params: item.srefParams,
  });

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
        <Label
          hasTooptip={Boolean(item.tooltip)}
          content={item.tooltip}
          placement="bottom"
          highValueLabel={item.highValueLabel}
          isOrganizationOnTrial={item.isOrganizationOnTrial}>
          {item.navIcon ? (
            <ProductIcon
              icon={item.navIcon}
              size="medium"
              color="white"
              className={styles.navIcon}
            />
          ) : (
            <Icon name={item.icon} />
          )}
          {item.tagLabel && <NavigationItemTag label={item.tagLabel} />}
          {item.title}
          {item.highValueLabel && (
            <F36Icon
              icon="InfoCircle"
              color="white"
              className={cn(styles.navHighValueIcon, {
                [styles.navHighValueIconTrial]: item.isOrganizationOnTrial,
              })}
            />
          )}
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
    disabled: PropTypes.bool,
    tooltip: PropTypes.string,
    highValueLabel: PropTypes.bool,
    isOrganizationOnTrial: PropTypes.bool,
  }).isRequired,
};
