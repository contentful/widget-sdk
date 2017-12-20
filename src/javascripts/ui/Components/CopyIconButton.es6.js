import * as Tippy from 'libs/react-tippy';
import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';
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
    this.setState({ showCopiedTooltip: true });
    yield sleep(1500);
    if (!this.isUnmounted) {
      this.setState({ showCopiedTooltip: false });
    }
  }),

  render () {
    const self = this;
    return h('span', {
      role: 'button',
      'data-test-id': 'clickToCopy',
      onClick: this.copyToClipboard,
      style: {
        cursor: 'pointer'
      }
    },
      // TODO we should extract the tooltip stuff once it is used in
      // different places
      h(Tippy.Tooltip, {
        title: 'Copied!',
        open: this.state.showCopiedTooltip,
        position: 'bottom',
        arrow: true,
        // We don’t want the target element for the tooltip to control
        // the visibility.
        trigger: 'manual',
        // Disable animation
        duration: 0,
        onShow: function () {
          // * We want the tooltip to be closed when the user clicks it.
          // * There is no need to remove the event listener because the
          //   element is destroyed when it is closed.
          // * `this` refers to the DOM node that contains the tooltip
          this.addEventListener('click', function () {
            self.setState({ showCopiedTooltip: false });
          });
        }
      },
        asReact(copyIcon({ color: Colors.textLightest }))
      )
    );
  }
});

CopyIconButton.propTypes = {
  value: PropTypes.string.isRequired
};

export default CopyIconButton;
