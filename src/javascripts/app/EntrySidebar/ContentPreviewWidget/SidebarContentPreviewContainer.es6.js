import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import SidebarContentPreview from './SidebarContentPreview.es6';
import * as Analytics from 'analytics/Analytics.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
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
    // getForContentType does not return API objects, but some non-standard
    // internal representation with `envId` property
    // TODO: refactor to use just API objects
    const contentPreviews = await contentPreview
      .getForContentType(this.props.contentType.sys.id)
      .then(previews => previews || []);
    const selectedContentPreview = this.getSelectedContentPreview(contentPreviews);

    this.setState({
      isInitialized: true,
      isPreviewSetup: contentPreviews.length > 0,
      contentPreviews,
      selectedContentPreview
    });
  };

  getSelectedContentPreview = contentPreviews => {
    const selectedContentPreviewId = contentPreview.getSelected();
    return (
      contentPreviews.find(preview => preview.envId === selectedContentPreviewId) ||
      contentPreviews[0] ||
      getEmptyContentPreview()
    );
  };

  getCompiledUrls = async (contentPreviews, entry, contentType) => {
    const selectedContentPreview = this.getSelectedContentPreview(contentPreviews);
    const compiledUrl = await contentPreview.replaceVariablesInUrl(
      selectedContentPreview.url,
      entry,
      contentType
    );

    return {
      ...selectedContentPreview,
      compiledUrl
    };
  };

  onTrackPreviewOpened = async () => {
    if (!this.state.isPreviewSetup) {
      return;
    }

    const { selectedContentPreview, contentPreviews } = this.state;
    const { dataForTracking, contentType, entry } = this.props;
    const previewUrl = await this.getCompiledUrls(contentPreviews, entry, contentType);
    window.open(previewUrl.compiledUrl);

    const contentTypeId = selectedContentPreview.contentType;
    const contentTypeName = get(contentType, 'name', '<UNPUBLISHED CONTENT TYPE>');
    const toState = previewUrl.compiledUrl.replace(/\?.*$/, '');
    const richTextFields = contentType.fields.filter(field => field.type === 'RichText');

    const eventOptions = {};
    if (richTextFields.length) {
      eventOptions.richTextEditor = {
        action: 'contentPreview',
        action_origin: 'entry-editor-content-preview-button',
        fields: richTextFields,
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
