import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
import SpaceDetails from './SpaceDetails';

describe('SpaceDetails', () => {
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

    expect(onChangeSelectedTemplate).toBeCalledWith(template);
  });

  it('should disable the button if spaceName is an empty string', () => {
    build();

    expect(screen.getByTestId('go-to-confirmation-button')).toHaveAttribute('disabled');
  });

  it('should enable the button if spaceName is given', () => {
    build({ spaceName: 'my space name' });

    expect(screen.getByTestId('go-to-confirmation-button')).not.toHaveAttribute('disabled');
  });

  it('should call onSubmit when the button is clicked', () => {
    const onSubmit = jest.fn();

    build({ onSubmit, spaceName: 'my space name' });

    userEvent.click(screen.getByTestId('go-to-confirmation-button'));

    expect(onSubmit).toBeCalled();
  });
});

function build(custom) {
  const props = Object.assign(
    {
      selectedPlan: {
        name: 'A space plan',
      },
      templates: [],
      spaceName: '',
      selectedTemplate: null,
      onChangeSpaceName: () => {},
      onChangeSelectedTemplate: () => {},
      onSubmit: () => {},
    },
    custom
  );

  render(<SpaceDetails {...props} />);
}
