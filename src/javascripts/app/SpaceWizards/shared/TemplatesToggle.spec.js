import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplatesToggle from './TemplatesToggle';

describe('TemplatesToggle', () => {
  it('should check the true radio button if isShowingTemplates is true', () => {
    build({ isShowingTemplates: true });

    expect(
      within(screen.getByTestId('template-toggle-true')).getByTestId('cf-ui-controlled-input')
    ).toHaveAttribute('checked');
  });

  it('should call onChange with true if the template radio is selected', () => {
    const onChange = jest.fn();
    build({ onChange });

    userEvent.click(
      within(screen.getByTestId('template-toggle-true')).getByTestId('cf-ui-controlled-input')
    );

    expect(onChange).toBeCalledWith(true);
  });

  it('should call onChange with false if the empty space radio is selected', () => {
    const onChange = jest.fn();
    build({ onChange, isShowingTemplates: true });

    userEvent.click(
      within(screen.getByTestId('template-toggle-false')).getByTestId('cf-ui-controlled-input')
    );

    expect(onChange).toBeCalledWith(false);
  });

  it('should add the centered class if formAlign is "center"', () => {
    build({ formAlign: 'center' });

    expect(screen.getByTestId('templates-toggle-wrapper')).toHaveClass(
      'create-space-wizard__centered-block'
    );
  });

  it('should add the centered class if formAlign is not given', () => {
    build({ formAlign: null });

    expect(screen.getByTestId('templates-toggle-wrapper')).toHaveClass(
      'create-space-wizard__centered-block'
    );
  });
});

function build(custom) {
  const props = Object.assign(
    {
      isShowingTemplates: false,
      onChange: () => {},
      formAlign: 'left',
    },
    custom
  );

  render(<TemplatesToggle {...props} />);
}
