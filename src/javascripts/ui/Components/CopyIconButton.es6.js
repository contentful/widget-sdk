import * as Tippy from 'react-tippy';
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

import copyToClipboard from 'utils/DomClipboardCopy';
import { sleep, wrapTask } from 'utils/Concurrent';

import { asReact } from 'ui/Framework/DOMRenderer';
import copyIcon from 'svg/CopyIcon';
import { byName as Colors } from 'Styles/Colors';

/**
 * The `copyIconButton` component shows a copy icon and copies the
 * provided value to the clipboard when the user clicks the icon.
 *
 *   h(CopyIconButton, { value: 'value to copy' })
 *
 * We also show a tooltip for to notify the user the value was copied.
 *
 * The styles for the tooltip are defined in
 * `src/stylesheets/Components/TippyTooltipOveride.styl`.
 */
const CopyIconButton = createReactClass({
  displayName: 'CopyIconButton',

  propTypes: {
    tooltipPosition: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    value: PropTypes.string.isRequired,
    onCopy: PropTypes.func,
    className: PropTypes.string
  },

  getDefaultProps () {
    return {
      onCopy: () => undefined,
      tooltipPosition: 'bottom'
    };
  },

  getInitialState: () => ({
    showCopiedTooltip: false
  }),

  // TODO This is an ugly workaround to prevent React warnings when the
  // component is unmounted.
  componentWillUnmount () {
    this.isUnmounted = true;
  },

  copyToClipboard: wrapTask(function* () {
    copyToClipboard(this.props.value);
    this.props.onCopy(this.props.value);
    this.setState({ showCopiedTooltip: true });
    yield sleep(1500);
    if (!this.isUnmounted) {
      this.setState({ showCopiedTooltip: false });
    }
  }),

  render () {
    const {tooltipPosition, className} = this.props;
    const self = this;
    return (
      <span
        role={'button'}
        data-test-id={''}
        onClick={this.copyToClipboard}
        style={{ cursor: 'pointer' }}
        className={className || ''}
      >
        <Tippy.Tooltip
          title={'Copied!'}
          open={this.state.showCopiedTooltip}
          position={tooltipPosition}
          arrow
          trigger={'manual'}
          duration={0}
          onShow={function () {
            // * We want the tooltip to be closed when the user clicks it.
            // * There is no need to remove the event listener because the
            //   element is destroyed when it is closed.
            // * `this` refers to the DOM node that contains the tooltip
            this.addEventListener('click', () => {
              self.setState({ showCopiedTooltip: false });
            });
          }}>
          {asReact(copyIcon({ color: Colors.textLightest }))}
        </Tippy.Tooltip>
      </span>
    );
  }
});

export default CopyIconButton;
