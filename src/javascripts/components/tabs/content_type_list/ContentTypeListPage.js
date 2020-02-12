import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle';
import {
  SkeletonContainer,
  SkeletonBodyText,
  Heading,
  Workbench
} from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import ContentTypeList from './ContentTypeList';
import NoSearchResultsAdvice from 'components/tabs/NoSearchResultsAdvice';
import NoContentTypeAdvice from 'components/tabs/NoContentTypeAdvice';
import CreateContentTypeCta from 'components/tabs/CreateContentTypeCta';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import ContentTypeListSearch from './ContentTypeListSearch';
import ContentTypeListFilter from './ContentTypeListFilter';
import * as service from './ContentTypeListService';
import { getSearchTerm } from 'redux/selectors/filters';

export class ContentTypesPage extends React.Component {
  static propTypes = {
    searchText: PropTypes.string,
    onSearchChange: PropTypes.func
  };
  static defaultProps = {
    onSearchChange: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      contentTypes: [],
      searchTerm: props.searchText || '',
      status: undefined
    };
  }

  componentDidMount() {
    service.fetchContentTypes().then(items => {
      if (!this.componentIsUnmounted) {
        this.setState({
          contentTypes: items,
          isLoading: false
        });
      }
    });
  }

  componentWillUnmount() {
    this.componentIsUnmounted = true;
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
            onChange={status => {
              this.setState({ status });
            }}
          />
        )}
      </Workbench.Sidebar>
    );
  }

  render() {
    const { isLoading, contentTypes, searchTerm, status } = this.state;
    const filteredContentTypes = service.filterContentTypes(contentTypes, {
      searchTerm,
      status
    });

    return (
      <React.Fragment>
        <DocumentTitle title="Content Model" />
        <Workbench>
          <Workbench.Header
            icon={<Icon name="page-ct" scale="0.75" />}
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
                    onChange={value => {
                      this.setState({
                        searchTerm: value
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
  state => ({
    searchText: getSearchTerm(state)
  }),
  dispatch => ({
    onSearchChange: newSearchTerm =>
      dispatch({ type: 'UPDATE_SEARCH_TERM', payload: { newSearchTerm } })
  })
)(ContentTypesPage);
