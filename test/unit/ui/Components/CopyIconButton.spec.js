import React from 'react';
import * as sinon from 'test/helpers/sinon';

describe('ui/Components/CopyIconButton.es6', () => {
  beforeEach(function() {
    this.copyToClipboard = sinon.stub();
    module('contentful/test', $provide => {
      $provide.constant('utils/DomClipboardCopy.es6', this.copyToClipboard);
    });

    this.sleep = this.$inject('utils/Concurrent.es6').sleep;
    const CopyIconButton = this.$inject('ui/Components/CopyIconButton.es6').default;

    this.ui = this.createUI();
    this.ui.render(<CopyIconButton value="TEXT" />, this.container);
  });

  it('copies the value to the clipboard', function*() {
    this.ui.find('clickToCopy').click();
    sinon.assert.calledOnceWith(this.copyToClipboard, 'TEXT');
  });

  it('shows a tooltip after copying', function*() {
    this.ui.find('clickToCopy').click();
    // The tooltip is shown asynchronously. Idealy we would poll for
    // the desctiptor to exist.
    yield this.sleep(10);
    const tooltip = this.ui.find('clickToCopy').getDescriptor();
    tooltip.assertHasText('Copied');
  });
});
