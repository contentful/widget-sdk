import React, { useState } from 'react';
import NavigationItem from 'navigation/NavBar/NavigationItem';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import NavigationDropdown from 'navigation/NavBar/NavigationDropdown';
import { NavigationAppIcon } from 'app/Apps/AppIcon';
import {
  SkeletonContainer,
  SkeletonImage,
  SkeletonText,
  Tag,
  TextLink,
} from '@contentful/forma-36-react-components';
import styles from './styles';
import PropTypes from 'prop-types';

const makeRef = (ref, isMaster) => {
  if (isMaster) {
    return `spaces.detail.${ref}`;
  } else {
    return `spaces.detail.environment.${ref}`;
  }
};

const hasNavigationItem = ({ navigationItem }) => navigationItem;

const buildAppListingChildren = (title) => ({ isMasterEnvironment }) => ({
  title,
  dataViewType: 'apps-listing',
  sref: makeRef('apps.list', isMasterEnvironment),
  rootSref: makeRef('apps', isMasterEnvironment),
});

export const EXPLORE_APPS_TITLE = 'Explore more apps';
const buildExploreAppsChild = buildAppListingChildren(EXPLORE_APPS_TITLE);

export const MANAGE_APPS_TITLE = 'Manage apps';
const buildManageAppsChild = buildAppListingChildren(MANAGE_APPS_TITLE);

export const LOADING_TITLE = 'Loading';
const buildLoadingChildren = () => {
  return [
    {
      dataViewType: 'apps-loading',
      title: LOADING_TITLE,
      render: () => <AppsLoading />,
    },
  ];
};

const buildAppChild = ({ id, appIconUrl, navigationItem }, { isMasterEnvironment }) => {
  return {
    dataViewType: `apps-${id}`,
    sref: makeRef(`apps.page`, isMasterEnvironment),
    srefParams: {
      appId: id,
      path: navigationItem.path,
    },
    title: navigationItem.name,
    render: (item) => <AppNavigationLink icon={appIconUrl} title={item.title} />,
  };
};

export const SplitterChild = {
  separator: true,
  isTitle: false,
  label: 'apps-divider',
  render: () => <hr className={styles.splitter} />,
};

export const PromotionChild = (canManageSpace) => ({
  separator: true,
  isTitle: false,
  label: 'apps-promotion',
  render: () => <AppPromotion canManageSpace={canManageSpace} />,
});

const buildTopChildren = (context) => {
  const linkToAppsChild = context.canManageSpace
    ? buildManageAppsChild(context)
    : buildExploreAppsChild(context);

  return [linkToAppsChild, SplitterChild];
};

const buildAppsChildren = (apps, context) => {
  const appsWithNav = apps.filter(hasNavigationItem);

  return appsWithNav.length > 0
    ? appsWithNav.map((a) => buildAppChild(a, context))
    : [PromotionChild(context.canManageSpace)];
};

export const buildChildren = (apps, context) => {
  const fixedChildren = buildTopChildren(context);
  const volatileChildren = apps ? buildAppsChildren(apps, context) : buildLoadingChildren();

  return [...fixedChildren, ...volatileChildren];
};

const AppPromotion = ({ canManageSpace }) => {
  return (
    <div className={styles.promotion}>
      <Tag className={styles.promotionTag}>new</Tag>
      Apps can now add pages to
      <br />
      the web app. After installation, they
      <br />
      will show up here.{' '}
      {!!canManageSpace && (
        <TextLink
          href="https://www.contentful.com/developers/docs/extensibility/app-framework/locations/#page"
          target="_blank">
          Learn more
        </TextLink>
      )}
    </div>
  );
};

AppPromotion.propTypes = {
  canManageSpace: PropTypes.bool.isRequired,
};

const AppNavigationLink = ({ icon, title }) => {
  return (
    <div className={styles.navbarItem}>
      <NavigationAppIcon icon={icon} />
      <span>{title}</span>
    </div>
  );
};
AppNavigationLink.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
};

const AppsLoading = () => {
  const height = 21;

  return (
    <SkeletonContainer animate svgWidth={210} svgHeight={height} ariaLabel="Loading apps list...">
      <SkeletonImage width={height} height={height} radiusX={2} radiusY={2} />
      <SkeletonText offsetLeft={height + 7} lineHeight={height} width={240} />
    </SkeletonContainer>
  );
};

export const AppsNavigationItem = ({ item, context }) => {
  const [requestInFlight, setInFlight] = useState(false);
  const [apps, setApps] = useState(null);
  const onOpen = async () => {
    if (apps || requestInFlight) {
      return;
    }

    setInFlight(true);
    setApps(await getCustomWidgetLoader().getOnlyInstalledApps());
    setInFlight(false);
  };
  const children = buildChildren(apps, context);

  return <NavigationDropdown disableHighlight item={{ ...item, children }} onOpen={onOpen} />;
};

AppsNavigationItem.propTypes = {
  item: NavigationItem.propTypes.item,
  context: PropTypes.shape({
    canManageSpace: PropTypes.bool.isRequired,
    isMasterEnvironment: PropTypes.bool.isRequired,
  }).isRequired,
};

export default function renderAppsNavigationItem(item, context) {
  return <AppsNavigationItem key={item.title} item={item} context={context} />;
}
