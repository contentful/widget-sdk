import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import * as logger from 'services/logger.es6';
import { richTextCommandsFeatureFlag, isEmbeddingEnabled } from './CommandPaletteService.es6';
import { hasCommandPaletteDecoration, getCommandText } from './Util.es6';
import CommandPanel from './CommandPanel/index.es6';
class CommandPalette extends React.PureComponent {
  static propTypes = {
    editor: PropTypes.object,
    richTextAPI: PropTypes.object,
    onClose: PropTypes.func
  };

  state = {
    isFeatureEnabled: false,
    embedsEnabled: false
  };

  componentDidCatch(error, info) {
    logger.logError('Unexpected rich text commands error.', { error, info });
  }

  componentDidMount = async () => {
    const isFeatureEnabled = await richTextCommandsFeatureFlag.isEnabled();
    const embedsEnabled = isEmbeddingEnabled(this.props.richTextAPI.widgetAPI.field);

    this.setState({
      isFeatureEnabled,
      embedsEnabled
    });
  };

  componentDidUpdate() {
    if (!this.state.isFeatureEnabled) {
      return;
    }
  }

  render() {
    if (
      !this.state.isFeatureEnabled ||
      !hasCommandPaletteDecoration(this.props.editor) ||
      !this.state.embedsEnabled
    ) {
      return null;
    }

    return (
      <CommandPanel
        editor={this.props.editor}
        richTextAPI={this.props.richTextAPI}
        command={getCommandText(this.props.editor)}
      />
    );
  }
}

export default CommandPalette;
