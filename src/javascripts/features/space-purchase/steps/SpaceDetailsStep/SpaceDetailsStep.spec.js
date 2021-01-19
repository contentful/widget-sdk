import userEvent from '@testing-library/user-event';
import { screen, within, fireEvent } from '@testing-library/react';
import { SpaceDetailsStep } from './SpaceDetailsStep';
import { renderWithProvider } from '../../__tests__/helpers';
import { EVENTS } from '../../utils/analyticsTracking';

const mockTemplate = { name: 'Cool template bro', sys: { id: 'template_abcd' } };

describe('SpaceDetailsStep', () => {
  it('should disable the button once a space name input is empty', async () => {
    await build();

    const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];
    const nextButton = screen.getByTestId('next-step-new-details-page');

    fireEvent.change(input, { target: { value: '' } });
    expect(nextButton).toHaveAttribute('disabled');
    userEvent.type(input, 'my space name');
    expect(nextButton).not.toHaveAttribute('disabled');
  });

  it('should call onSubmit when the button is clicked', async () => {
    const onSubmit = jest.fn();

    await build({ onSubmit }, { spaceName: 'my space name' });

    userEvent.click(screen.getByTestId('next-step-new-details-page'));

    expect(onSubmit).toBeCalled();
  });

  it('should track when a template is selected', async () => {
    const track = jest.fn();

    await build({ track });

    userEvent.click(
      within(screen.getByTestId('template-toggle-true')).getByTestId('cf-ui-controlled-input')
    );

    expect(track).toBeCalledWith(EVENTS.SPACE_TEMPLATE_SELECTED, {
      selectedTemplate: mockTemplate.name,
    });
  });

  it('should call onBack when the back button is clicked', async () => {
    const onBack = jest.fn();

    await build({ onBack });

    userEvent.click(screen.getByTestId('navigate-back'));

    expect(onBack).toBeCalled();
  });
});

async function build(customProps, customState) {
  const props = {
    track: () => {},
    onSubmit: () => {},
    onBack: () => {},
    ...customProps,
  };

  await renderWithProvider(
    SpaceDetailsStep,
    {
      selectedPlan: {
        name: 'Medium',
        price: 123,
      },
      templatesList: [mockTemplate],
      ...customState,
    },
    props
  );
}
