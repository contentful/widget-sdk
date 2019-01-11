import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import SidebarContentPreview from './SidebarContentPreview.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const Analytics = getModule('analytics/Analytics.es6');
const contentPreview = getModule('contentPreview');

const getEmptyContentPreview = () => ({
  compiledUrl: '',
  name: ''
});

export class SidebarContentPreviewContainer extends Component {
  static propTypes = {
    entry: PropTypes.object,
    contentType: PropTypes.object.isRequired,
    dataForTracking: PropTypes.shape({
      locales: PropTypes.arrayOf(PropTypes.object).isRequired,
      fromState: PropTypes.string,
      entryId: PropTypes.string
    }).isRequired
  };

  state = {
    isInitialized: false,
    isPreviewSetup: false,
    selectedContentPreview: getEmptyContentPreview(),
    contentPreviews: []
  };

  componentDidMount = async () => {
    const state = await this.initialize();
    this.setState(state);
  };

  componentDidUpdate = async prevProps => {
    // every time entry is updated
    // we need to complile template url with actual data from entry
    if (this.props.entry && prevProps.entry !== this.props.entry) {
      const { contentPreviews, selectedContentPreview } = await this.getCompiledUrls(
        this.state.contentPreviews,
        this.props.entry,
        this.props.contentType
      );
      this.setState({ contentPreviews, selectedContentPreview });
    }
  };

  getCompiledUrls = async (contentPreviews, entry, contentType) => {
    const contentPreviewsWithUrls = await Promise.all(
      contentPreviews.map(preview => {
        return contentPreview
          .replaceVariablesInUrl(preview.url, entry, contentType)
          .then(compiledUrl => ({
            ...preview,
            compiledUrl
          }));
      })
    );

    const selectedContentPreviewId = contentPreview.getSelected();
    const selectedContentPreview = contentPreviewsWithUrls.find(
      item => item.envId === selectedContentPreviewId
    );

    return {
      contentPreviews: contentPreviewsWithUrls,
      selectedContentPreview:
        selectedContentPreview || contentPreviews[0] || getEmptyContentPreview()
    };
  };

  initialize = async () => {
    // getForContentType does not return API objects, but some non-standard
    // internal representation with `envId` property
    // TODO: refactor to use just API objects
    let contentPreviews = await contentPreview
      .getForContentType(this.props.contentType.sys.id)
      .then(previews => previews || []);

    const selectedContentPreviewId = contentPreview.getSelected();
    let selectedContentPreview = contentPreviews.find(
      item => item.envId === selectedContentPreviewId
    );

    if (this.props.entry) {
      const compiledUrlsState = await this.getCompiledUrls(
        contentPreviews,
        this.props.entry,
        this.props.contentType
      );
      contentPreviews = compiledUrlsState.contentPreviews;
      selectedContentPreview = compiledUrlsState.selectedContentPreview;
    }

    return {
      isInitialized: true,
      isPreviewSetup: contentPreviews.length > 0,
      contentPreviews,
      selectedContentPreview:
        selectedContentPreview || contentPreviews[0] || getEmptyContentPreview()
    };
  };

  onTrackPreviewOpened = async () => {
    if (!this.state.isPreviewSetup || !this.state.selectedContentPreview.compiledUrl) {
      return;
    }

    const { selectedContentPreview } = this.state;
    const { dataForTracking } = this.props;

    const contentTypeId = selectedContentPreview.contentType;
    const contentTypeName = get(this.props.contentType, 'name', '<UNPUBLISHED CONTENT TYPE>');
    const toState = selectedContentPreview.compiledUrl.replace(/\?.*$/, '');
    const stFields = this.props.contentType.fields.filter(field => field.type === 'RichText');

    const eventOptions = {};
    if (stFields.length) {
      eventOptions.richTextEditor = {
        action: 'contentPreview',
        action_origin: 'entry-editor-content-preview-button',
        fields: stFields,
        locales: dataForTracking.locales,
        contentTypeId,
        entryId: dataForTracking.entryId
      };
    }

    Analytics.track('element:click', {
      elementId: 'openContentPreviewBtn',
      groupId: 'entryEditor:contentPreview',
      fromState: dataForTracking.fromState,
      toState,
      contentPreview: {
        previewName: selectedContentPreview.name,
        previewId: selectedContentPreview.envId,
        contentTypeName,
        contentTypeId
      },
      ...eventOptions
    });

    const netlifyAppConfig = await spaceContext.netlifyAppConfig.get();
    const sites = get(netlifyAppConfig, ['sites'], []);
    const sitesArray = Array.isArray(sites) ? sites : [];

    if (sitesArray.find(s => s.contentPreviewId === selectedContentPreview.envId)) {
      Analytics.track('netlify:preview_opened');
    }
  };

  onChangeContentPreview = preview => {
    contentPreview.setSelected(preview);
    this.setState({ selectedContentPreview: preview });
  };

  render() {
    const isAdmin = spaceContext.getData('spaceMembership.admin', false);

    return (
      <SidebarContentPreview
        isInitialized={this.state.isInitialized}
        isPreviewSetup={this.state.isPreviewSetup}
        isAdmin={isAdmin}
        selectedContentPreview={this.state.selectedContentPreview}
        contentPreviews={this.state.contentPreviews}
        trackPreviewOpened={this.onTrackPreviewOpened}
        onChangeContentPreview={this.onChangeContentPreview}
      />
    );
  }
}

export default SidebarContentPreviewContainer;
