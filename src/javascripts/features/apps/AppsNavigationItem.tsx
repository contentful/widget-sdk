import React, { useState } from 'react';
import NavigationItem from 'navigation/NavBar/NavigationItem';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import NavigationDropdown from 'navigation/NavBar/NavigationDropdown';
import { NavigationAppIcon } from 'features/apps/AppIcon';
import {
  SkeletonContainer,
  SkeletonImage,
  SkeletonText,
  Tag,
  TextLink,
} from '@contentful/forma-36-react-components';
import { styles } from './styles';
import PropTypes from 'prop-types';
import { WidgetLocation, Widget } from '@contentful/widget-renderer';

const makeRef = (ref, isMaster) => {
  if (isMaster) {
    return `spaces.detail.${ref}`;
  } else {
    return `spaces.detail.environment.${ref}`;
  }
};

const getPageLocation = (widget) => {
  return widget.locations.find((l) => l.location === WidgetLocation.PAGE);
};

const hasNavigationItem = (widget) => {
  const pageLocation = getPageLocation(widget);

  return pageLocation && pageLocation.navigationItem;
};

const buildAppListingChildren = (title) => ({ isUnscopedRoute }) => ({
  title,
  dataViewType: 'apps-listing',
  sref: makeRef('apps.list', isUnscopedRoute),
  rootSref: makeRef('apps', isUnscopedRoute),
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

const buildAppChild = (widget, { isUnscopedRoute }) => {
  const { navigationItem } = getPageLocation(widget);

  return {
    dataViewType: `apps-${widget.id}`,
    sref: makeRef(`apps.page`, isUnscopedRoute),
    srefParams: {
      appId: widget.slug,
      path: navigationItem.path,
    },
    title: navigationItem.name,
    formatUrl: (url) => {
      const encodedPath = encodeURIComponent(navigationItem.path);
      return url.replace(encodedPath, navigationItem.path);
    },
    render: (item) => <AppNavigationLink icon={widget.iconUrl} title={item.title} />,
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

export const buildChildren = (
  apps: Widget[] | null,
  context: AppsNavigationItemProps['context']
) => {
  const fixedChildren = buildTopChildren(context);
  const volatileChildren = apps ? buildAppsChildren(apps, context) : buildLoadingChildren();

  return [...fixedChildren, ...volatileChildren];
};

const AppPromotion = ({ canManageSpace }: { canManageSpace: boolean }) => {
  return (
    <div className={styles.promotion}>
      <Tag tagType="primary-filled" size="small" className={styles.promotionTag}>
        new
      </Tag>
      Apps can now add pages to
      <br />
      the web app. After installation, they
      <br />
      will show up here.{' '}
      {!!canManageSpace && (
        <TextLink
          href="https://www.contentful.com/developers/docs/extensibility/app-framework/locations/#page"
          target="_blank"
          rel="noopener noreferrer">
          Learn more
        </TextLink>
      )}
    </div>
  );
};

const AppNavigationLink = ({ icon, title }: { icon?: string; title: string }) => {
  return (
    <div className={styles.navbarItem}>
      <NavigationAppIcon icon={icon} />
      <span>{title}</span>
    </div>
  );
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

interface AppsNavigationItemProps {
  item: any;
  context: { canManageSpace: boolean; isUnscopedRoute: boolean };
}

export const AppsNavigationItem = ({ item, context }: AppsNavigationItemProps) => {
  const [requestInFlight, setInFlight] = useState(false);
  const [apps, setApps] = useState<Widget[] | null>(null);
  const onOpen = async () => {
    if (apps || requestInFlight) {
      return;
    }

    setInFlight(true);
    const loader = await getCustomWidgetLoader();
    setApps(await loader.getInstalledApps());
    setInFlight(false);
  };

  const children = buildChildren(apps, context);

  return <NavigationDropdown item={{ ...item, children }} onOpen={onOpen} />;
};

AppsNavigationItem.propTypes = {
  item: NavigationItem.propTypes.item,
  context: PropTypes.shape({
    canManageSpace: PropTypes.bool.isRequired,
    isUnscopedRoute: PropTypes.bool.isRequired,
  }).isRequired,
};

export function renderAppsNavigationItem(item, context) {
  return <AppsNavigationItem key={item.title} item={item} context={context} />;
}