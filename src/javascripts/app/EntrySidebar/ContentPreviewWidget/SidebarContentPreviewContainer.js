import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import SidebarContentPreview from './SidebarContentPreview';
import * as Analytics from 'analytics/Analytics';
import { getModule } from 'core/NgRegistry';
import TheLocaleStore from 'services/localeStore';
import * as Entries from 'data/entries';
import { getContentPreview } from 'services/contentPreview';

const getEmptyContentPreview = () => ({
  compiledUrl: '',
  name: '',
});

export class SidebarContentPreviewContainer extends Component {
  static propTypes = {
    entry: PropTypes.object,
    contentType: PropTypes.object.isRequired,
    dataForTracking: PropTypes.shape({
      locales: PropTypes.arrayOf(PropTypes.object).isRequired,
      fromState: PropTypes.string,
      entryId: PropTypes.string,
    }).isRequired,
  };

  state = {
    isInitialized: false,
    isPreviewSetup: false,
    selectedContentPreview: getEmptyContentPreview(),
    contentPreviews: [],
  };

  componentDidMount = async () => {
    // getForContentType does not return API objects, but some non-standard
    // internal representation with `envId` property
    // TODO: refactor to use just API objects
    const contentPreviews = await getContentPreview()
      .getForContentType(this.props.contentType.sys.id)
      .then((previews) => previews || []);
    const selectedContentPreview = this.getSelectedContentPreview(contentPreviews);

    this.setState({
      isInitialized: true,
      isPreviewSetup: contentPreviews.length > 0,
      contentPreviews,
      selectedContentPreview,
    });
  };

  getSelectedContentPreview = (contentPreviews) => {
    const selectedContentPreviewId = getContentPreview().getSelected();
    return (
      contentPreviews.find((preview) => preview.envId === selectedContentPreviewId) ||
      contentPreviews[0] ||
      getEmptyContentPreview()
    );
  };

  getCompiledUrls = async (contentPreviews, entry, contentType) => {
    const selectedContentPreview = this.getSelectedContentPreview(contentPreviews);
    const compiledUrl = await getContentPreview().replaceVariablesInUrl(
      selectedContentPreview.url,
      Entries.internalToExternal(entry, contentType),
      TheLocaleStore.getDefaultLocale().code
    );

    return {
      ...selectedContentPreview,
      compiledUrl,
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
    const richTextFields = contentType.fields.filter((field) => field.type === 'RichText');

    const eventOptions = {};
    if (richTextFields.length) {
      eventOptions.richTextEditor = {
        action: 'contentPreview',
        action_origin: 'entry-editor-content-preview-button',
        fields: richTextFields,
        locales: dataForTracking.locales,
        contentTypeId,
        entryId: dataForTracking.entryId,
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
        contentTypeId,
      },
      ...eventOptions,
    });
  };

  onChangeContentPreview = (preview) => {
    getContentPreview().setSelected(preview);
    this.setState({ selectedContentPreview: preview });
  };

  render() {
    const spaceContext = getModule('spaceContext');

    const isAdmin = spaceContext.getData('spaceMember.admin', false);

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
