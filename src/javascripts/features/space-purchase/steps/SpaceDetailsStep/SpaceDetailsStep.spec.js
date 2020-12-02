import userEvent from '@testing-library/user-event';
import { screen, within } from '@testing-library/react';
import { SpaceDetailsStep } from './SpaceDetailsStep';
import { renderWithProvider } from '../../__tests__/helpers';
import { EVENTS } from '../../utils/analyticsTracking';

const mockTemplate = { name: 'Cool template bro', sys: { id: 'template_abcd' } };

describe('SpaceDetailsStep', () => {
  it('should enable the button once a space name is typed', async () => {
    await build();

    expect(screen.getByTestId('next-step-new-details-page')).toHaveAttribute('disabled');

    userEvent.type(
      within(screen.getByTestId('space-name')).getByTestId('cf-ui-text-input'),
      'my space name'
    );

    expect(screen.getByTestId('next-step-new-details-page')).not.toHaveAttribute('disabled');
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
