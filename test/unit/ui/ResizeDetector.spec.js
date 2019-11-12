import React from 'react';
import { observeResize } from 'ui/ResizeDetector';
import _ from 'lodash';
import $ from 'jquery';
import { createUI } from 'test/utils/dom';
import { $wait } from 'test/utils/ng';

describe('ui/ResizeDetector', () => {
  beforeEach(function() {
    this.view = createUI();

    this.view.render(
      <div
        id="container"
        style={{
          display: 'flex',
          width: '100px',
          height: '100px'
        }}>
        <div
          id="inner"
          style={{
            flexGrow: 1
          }}
        />
      </div>
    );

    this.container = $(this.view.element).find('#container');
  });

  afterEach(function() {
    this.view.destroy();
  });

  it('emits when container is resized', async function() {
    const inner = this.container.find('#inner');
    const innerWidth$ = observeResize(inner.get(0)).map(() => inner.width());
    // This promise resolves when the width of the inner container
    // changes to 1000
    const resizeDetected = innerWidth$
      .filter(width => width === 1000)
      .take(1)
      .toPromise();

    this.container.width(1000);

    await $wait();

    // We don’t need an assertion. We just make sure that this promise
    // resolves without timing out.
    await resizeDetected;
  });
});
