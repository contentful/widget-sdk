import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle';
import {
  SkeletonContainer,
  SkeletonBodyText,
  Heading,
  Workbench,
  Note,
  Paragraph,
} from '@contentful/forma-36-react-components';
import ContentTypeList from './ContentTypeList';
import NoSearchResultsAdvice from 'components/tabs/NoSearchResultsAdvice';
import NoContentTypeAdvice from 'components/tabs/NoContentTypeAdvice';
import CreateContentTypeCta from 'components/tabs/CreateContentTypeCta';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import ContentTypeListSearch from './ContentTypeListSearch';
import ContentTypeListFilter from './ContentTypeListFilter';
import * as service from './ContentTypeListService';
import { getSearchTerm } from 'redux/selectors/filters';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { css } from 'emotion';
import ExternalTextLink from 'app/common/ExternalTextLink';
import createResourceService from 'services/ResourceService';
import { track } from 'analytics/Analytics';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getSingleSpacePlan } from 'account/pricing/PricingDataProvider';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { PRICING_2020_RELEASED } from 'featureFlags';
import { getVariation } from 'LaunchDarkly';

import { websiteUrl } from 'Config';
import { getModule } from 'core/NgRegistry';

const styles = {
  banner: css({
    marginBottom: '20px',
  }),
};

export class ContentTypesPage extends React.Component {
  static propTypes = {
    searchText: PropTypes.string,
    spaceId: PropTypes.string,
    onSearchChange: PropTypes.func,
  };
  static defaultProps = {
    onSearchChange: () => {},
  };

  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      contentTypes: [],
      searchTerm: props.searchText || '',
      status: undefined,
      showContentTypeLimitBanner: false,
      usage: 0,
      maximum: 0,
    };
  }

  async componentDidMount() {
    const spaceContext = getModule('spaceContext');
    const { spaceId } = this.props;
    const endpoint = createOrganizationEndpoint(spaceContext.organization.sys.id);

    // This is written so that the important data (contentTypes) only would wait for a max of 2 seconds for the
    // less important banner information to load. Having them load together prevents the page jumping when the
    // banner information loads second, but if the banner information would take more than 2 seconds to load,
    // it's more important that we allow the user to use the page than wait longer for this less important information.

    const promisesArray = [service.fetchContentTypes()];

    const isNewPricingReleased = await getVariation(PRICING_2020_RELEASED, {
      organizationId: spaceContext.organization.sys.id,
    });

    const isOrgAdminOrOwner = isOwnerOrAdmin(spaceContext.organization);
    const orgIsLegacy = isLegacyOrganization(spaceContext.organization);

    // Only want to make this fetch if isNewPricingReleased.
    if (isNewPricingReleased && !orgIsLegacy && isOrgAdminOrOwner) {
      promisesArray.push(
        Promise.race([
          Promise.all([
            getSingleSpacePlan(endpoint, spaceId),
            createResourceService(spaceId).get('Content type', spaceContext.getEnvironmentId()),
          ]),
          new Promise((resolve) => setTimeout(resolve, 2 * 1000)),
        ])
      );
    }

    const [contentTypeItems, communityBannerData] = await Promise.all(promisesArray);

    let state = {
      contentTypes: contentTypeItems,
      isLoading: false,
      showContentTypeLimitBanner: false,
      usage: 0,
      maximum: 0,
    };

    // If there is communityBannerData then the user isOrgAdminOrOwner, so we can then determine if we should show the CTA to upgrade to enterprise.
    if (communityBannerData) {
      const [
        plan,
        {
          usage,
          limits: { maximum },
        },
      ] = communityBannerData;

      const isMediumOrLargePlan = plan.name === 'Large' || plan.name === 'Medium';

      const showContentTypeLimitBanner = isMediumOrLargePlan && usage / maximum > 0.9;

      state = { ...state, showContentTypeLimitBanner, usage, maximum };
    }

    if (!this.componentIsUnmounted) {
      this.setState(state);
    }
  }

  componentWillUnmount() {
    this.componentIsUnmounted = true;
  }

  handleBannerClickCTA() {
    const { spaceId } = this.props;
    const spaceContext = getModule('spaceContext');
    const orgId = spaceContext.organization.sys.id;

    track('targeted_cta_clicked:upgrade_to_enterprise', {
      ctaLocation: 'content_types',
      spaceId,
      orgId,
    });
  }

  renderSidebar() {
    const { isLoading, contentTypes, status } = this.state;
    if (!isLoading && contentTypes.length === 0) {
      return null;
    }

    return (
      <Workbench.Sidebar position="left">
        {!isLoading && (
          <ContentTypeListFilter
            status={status}
            onChange={(status) => {
              this.setState({ status });
            }}
          />
        )}
      </Workbench.Sidebar>
    );
  }

  render() {
    const {
      isLoading,
      contentTypes,
      searchTerm,
      status,
      showContentTypeLimitBanner,
      usage,
      maximum,
    } = this.state;
    const filteredContentTypes = service.filterContentTypes(contentTypes, {
      searchTerm,
      status,
    });

    return (
      <React.Fragment>
        <DocumentTitle title="Content Model" />
        <Workbench>
          <Workbench.Header
            icon={<NavigationIcon icon="ContentModel" size="large" />}
            title={
              <>
                <Heading>Content Model</Heading>
                <div className="workbench-header__kb-link">
                  <KnowledgeBase target="content_model" />
                </div>
              </>
            }
            actions={
              <>
                {contentTypes.length > 0 && (
                  <ContentTypeListSearch
                    initialValue={searchTerm}
                    onChange={(value) => {
                      this.setState({
                        searchTerm: value,
                      });
                      this.props.onSearchChange(value);
                    }}
                  />
                )}
                {contentTypes.length > 0 && <CreateContentTypeCta testId="create-content-type" />}
              </>
            }
          />

          {this.renderSidebar()}

          <Workbench.Content type="full">
            {isLoading ? (
              <SkeletonContainer
                data-test-id="content-loader"
                ariaLabel="Loading Content Type list"
                svgWidth="100%">
                <SkeletonBodyText numberOfLines={2} />
                <SkeletonBodyText numberOfLines={2} offsetTop={75} />
                <SkeletonBodyText numberOfLines={2} offsetTop={150} />
                <SkeletonBodyText numberOfLines={2} offsetTop={225} />
                <SkeletonBodyText numberOfLines={2} offsetTop={300} />
                <SkeletonBodyText numberOfLines={2} offsetTop={375} />
              </SkeletonContainer>
            ) : (
              <React.Fragment>
                {showContentTypeLimitBanner && (
                  <Note
                    noteType="primary"
                    className={styles.banner}
                    testId="content-type-limit-banner">
                    <Paragraph>
                      You have used {usage} of {maximum} content types.
                    </Paragraph>
                    <Paragraph>
                      To increase the limit,{' '}
                      <ExternalTextLink
                        testId="link-to-sales"
                        href={websiteUrl('contact/sales/')}
                        onClick={() => this.handleBannerClickCTA()}>
                        talk to us
                      </ExternalTextLink>{' '}
                      about upgrading to the enterprise tier .
                    </Paragraph>
                  </Note>
                )}

                {filteredContentTypes.length > 0 && (
                  <div data-test-id="content-type-list">
                    <ContentTypeList contentTypes={filteredContentTypes} />
                  </div>
                )}
                {contentTypes.length > 0 && filteredContentTypes.length === 0 && (
                  <div data-test-id="no-search-results">
                    <NoSearchResultsAdvice />
                  </div>
                )}
                {contentTypes.length === 0 && (
                  <div data-test-id="empty-state">
                    <NoContentTypeAdvice />
                  </div>
                )}
              </React.Fragment>
            )}
          </Workbench.Content>
        </Workbench>
      </React.Fragment>
    );
  }
}

export default connect(
  (state) => ({
    searchText: getSearchTerm(state),
  }),
  (dispatch) => ({
    onSearchChange: (newSearchTerm) =>
      dispatch({ type: 'UPDATE_SEARCH_TERM', payload: { newSearchTerm } }),
  })
)(ContentTypesPage);
