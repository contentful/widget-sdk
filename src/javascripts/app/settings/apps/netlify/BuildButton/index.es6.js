import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { get } from 'lodash';

import BuildButton from './BuildButton.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const contentPreview = getModule('contentPreview');

const validId = id => typeof id === 'string' && id.length > 0;

const getContentPreviewIdsFor = async contentType => {
  const ctId = get(contentType, ['sys', 'id']);
  const contentPreviews = await contentPreview.getForContentType(ctId);

  return (Array.isArray(contentPreviews) ? contentPreviews : []).map(p => p.envId);
};

export default class NetlifyBuildButton extends Component {
  static propTypes = {
    contentType: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired
    }).isRequired
  };

  state = {};

  async componentDidMount() {
    const contentPreviewIds = await getContentPreviewIdsFor(this.props.contentType);

    // Normally if there are no content previews in a space we
    // could just return here: at least one content preview is
    // required for Netlify app to operate.

    // We don't return so we put more stress on the "apps"
    // micro-backend (with calls to `netlifyAppConfig.get`).
    // TODO: This is an experiment, restore logic commented out
    // below once done.

    // if (contentPreviewIds.length < 1) {
    //   return;
    // }

    const config = await spaceContext.netlifyAppConfig.get();
    const sites = get(config, ['sites'], []).filter(s => validId(s.contentPreviewId));
    if (sites.length < 1) {
      return;
    }

    // Poll for changes in selected content preview.
    // TODO: content_preview.js should offer subscription mechanism
    // but it's ~500LOC of global (not space aware) logic.
    // Once content_preview.js is in a better shape a listener
    // should be used.
    this.interval = setInterval(() => {
      // If selected content preview is not enabled for this
      // content type or we cannot get selected content preview
      // at all - just use the first one what matches behavior
      // of the preview button.
      let selectedPreviewId = contentPreview.getSelected();

      if (!contentPreviewIds.includes(selectedPreviewId)) {
        selectedPreviewId = contentPreviewIds[0];
      }

      const isChanged = selectedPreviewId !== this.state.selectedPreviewId;

      if (isChanged && validId(selectedPreviewId)) {
        const site = sites.find(s => s.contentPreviewId === selectedPreviewId);
        this.setState({ site, selectedPreviewId });
      }
    }, 250);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  render() {
    const { site } = this.state;

    if (site) {
      return <BuildButton key={site.buildHookUrl} netlifySite={site} />;
    } else {
      return null;
    }
  }
}
