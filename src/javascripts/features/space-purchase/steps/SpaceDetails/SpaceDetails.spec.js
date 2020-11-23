import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, within, waitFor } from '@testing-library/react';
import { SpaceDetails } from './SpaceDetails';

describe('steps/SpaceDetails', () => {
  it('should call onChangeSpaceName when the space name is changed', () => {
    const onChangeSpaceName = jest.fn();

    build({ onChangeSpaceName });

    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'my space name'
    );

    expect(onChangeSpaceName).toBeCalledWith('my space name');
  });

  it('should call onChangeSelectedTemplate when the selected template is changed', () => {
    const onChangeSelectedTemplate = jest.fn();
    const template = { name: 'Cool template bro', sys: { id: 'template_abcd' } };

    build({ onChangeSelectedTemplate, templates: [template] });

    userEvent.click(
      within(screen.getByTestId('template-toggle-true')).getByTestId('cf-ui-controlled-input')
    );

    waitFor(() => {
      expect(onChangeSelectedTemplate).toBeCalledWith(template);
    });
  });

  it('should disable the button if spaceName is an empty string', () => {
    build();

    expect(screen.getByTestId('next-step-new-details-page')).toHaveAttribute('disabled');
  });

  it('should enable the button if spaceName is given', () => {
    build({ spaceName: 'my space name' });

    expect(screen.getByTestId('next-step-new-details-page')).not.toHaveAttribute('disabled');
  });

  it('should call onSubmit when the button is clicked', () => {
    const onSubmit = jest.fn();

    build({ onSubmit, spaceName: 'my space name' });

    userEvent.click(screen.getByTestId('next-step-new-details-page'));

    expect(onSubmit).toBeCalled();
  });

  it('should call navigateToPreviousStep when the back button is clicked', () => {
    const navigateToPreviousStep = jest.fn();

    build({ navigateToPreviousStep });

    userEvent.click(screen.getByTestId('navigate-back'));

    expect(navigateToPreviousStep).toBeCalled();
  });
});

function build(customProps) {
  const props = {
    templatesList: [],
    spaceName: '',
    selectedTemplate: null,
    onChangeSpaceName: () => {},
    onChangeSelectedTemplate: () => {},
    onSubmit: () => {},
    navigateToPreviousStep: () => {},
    ...customProps,
  };

  render(<SpaceDetails {...props} />);
}
