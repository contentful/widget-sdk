import React from 'react';
import PropTypes from 'prop-types';

import ExtensionIFrameRenderer from './ExtensionIFrameRenderer.es6';

export default class WidgetRenderWarning extends React.Component {
  static propTypes = {
    extensions: PropTypes.arrayOf(
      PropTypes.shape({
        bridge: PropTypes.object.isRequired,
        widget: PropTypes.object.isRequired
      })
    ).isRequired,
    appDomain: PropTypes.string.isRequired
  };

  render() {
    return (
      <React.Fragment>
        {this.props.extensions.map(({ bridge, widget }) => {
          return (
            <div key={widget.field.id} className="entity-sidebar__widget">
              <h2 className="entity-sidebar__heading">{widget.field.name}</h2>
              <ExtensionIFrameRenderer
                bridge={bridge}
                src={widget.src}
                srcdoc={widget.srcdoc}
                appDomain={this.props.appDomain}
              />
            </div>
          );
        })}
      </React.Fragment>
    );
  }
}
