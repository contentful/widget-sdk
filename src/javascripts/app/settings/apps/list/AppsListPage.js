import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import AppsList from './AppsList';
import AppListItem from './AppListItem';
import {
  Note,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonText,
  SkeletonImage,
  Paragraph
} from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon';
import DocumentTitle from 'components/shared/DocumentTitle';

const styles = {
  intro: css({
    marginBottom: tokens.spacingL
  }),
  note: css({
    marginBottom: tokens.spacingL
  })
};

const AppsListShell = props => (
  <Workbench>
    <Workbench.Header icon={<Icon name="page-apps" scale="1" />} title="Apps" />
    <Workbench.Content type="text">
      <div>{props.children}</div>
    </Workbench.Content>
  </Workbench>
);

const ItemSkeleton = props => (
  <React.Fragment>
    <SkeletonImage offsetTop={props.baseTop} width={36} height={36} radiusX={36} radiusY={36} />
    <SkeletonText offsetTop={props.baseTop + 15} offsetLeft={50} lineHeight={8} width={240} />
    <SkeletonText offsetTop={props.baseTop + 15} offsetLeft={510} lineHeight={8} width={90} />
  </React.Fragment>
);
ItemSkeleton.propTypes = {
  baseTop: PropTypes.number
};

export const AppsListPageLoading = () => {
  return (
    <AppsListShell>
      <SkeletonContainer svgWidth={600} svgHeight={200} ariaLabel="Loading apps list...">
        <SkeletonDisplayText />
        <ItemSkeleton baseTop={60} />
        <ItemSkeleton baseTop={110} />
        <ItemSkeleton baseTop={160} />
      </SkeletonContainer>
    </AppsListShell>
  );
};

const appGroupPropType = PropTypes.arrayOf(
  PropTypes.shape({
    id: PropTypes.string.isRequired
  })
).isRequired;

export default class AppsListPage extends Component {
  static propTypes = {
    apps: PropTypes.shape({
      installed: appGroupPropType,
      rest: appGroupPropType
    }).isRequired
  };

  render() {
    return (
      <AppsListShell>
        <DocumentTitle title="Apps" />
        {this.renderApps()}
      </AppsListShell>
    );
  }

  renderApps() {
    const { apps } = this.props;

    const info = (
      <Paragraph>
        We are phasing out alpha apps as we move into beta. This means no new alpha apps can be
        installed. Thank you for your participation and we hope to see you in the beta.
      </Paragraph>
    );

    if (apps.installed.length > 0) {
      return (
        <>
          <Note className={styles.note} noteType="warning" title="Apps alpha is being phased out">
            {info}
            <Paragraph>You can still use the apps installed in the alpha period.</Paragraph>
          </Note>
          <AppsList title="Installed">
            {apps.installed.map(app => (
              <AppListItem key={app.id} app={app} />
            ))}
          </AppsList>
        </>
      );
    }

    return (
      <Note className={styles.note} noteType="warning" title="Apps alpha is being phased out">
        {info}
      </Note>
    );
  }
}
