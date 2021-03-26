import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HostingDropzone } from './HostingDropzone';
import { AppDefinitionWithBundle } from './AppHosting';

describe('HostingDropzone', () => {
  beforeEach(() => {
    render(
      <HostingDropzone onAppBundleCreated={jest.fn()} definition={{} as AppDefinitionWithBundle} />
    );
  });
  it('renders overlay when dragover event is fired', () => {
    fireEvent(window, new MouseEvent('dragenter'));
    const overlay = screen.getByTestId('dropzone-overlay');
    expect(overlay).toBeInTheDocument();
    fireEvent(window, new MouseEvent('mouseout'));
    expect(overlay).not.toBeInTheDocument();
  });
});
