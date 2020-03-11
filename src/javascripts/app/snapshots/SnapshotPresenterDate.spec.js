import React from 'react';
import { render } from '@testing-library/react';
import SnapshotPresenterDate from './SnapshotPresenterDate';

describe('SnapshotPresenterDate', () => {
  it('should render standard 24H string', () => {
    const { container } = render(
      <SnapshotPresenterDate
        settings={{ format: 'timeZ', ampm: 24 }}
        value="2020-03-10T16:00+00:00"
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render standard AmPm string', () => {
    const { container } = render(
      <SnapshotPresenterDate
        settings={{ format: 'time', ampm: 12 }}
        value="2020-03-10T16:00+00:00"
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render default string', () => {
    const { container } = render(
      <SnapshotPresenterDate settings={{}} value="2020-03-10T16:00+00:00" />
    );
    expect(container).toMatchSnapshot();
  });
});
