import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateSelector from './TemplateSelector';

const mockTemplates = [{ name: 'Test template', sys: { id: 'template_1234' } }];

describe('TemplateSelector', () => {
  it('should not call onSelect when component is mounted', () => {
    const onSelect = jest.fn();
    build({ onSelect });

    expect(onSelect).toHaveBeenCalledTimes(0);
  });

  it('should call onSelect with null if the templates list is not visible', () => {
    const onSelect = jest.fn();
    build({ onSelect });

    const showTemplatesToogle = screen.getByTestId('template-toggle-true');
    const hideTemplatesToogle = screen.getByTestId('template-toggle-false');

    userEvent.click(within(showTemplatesToogle).getByTestId('cf-ui-controlled-input'));
    userEvent.click(within(hideTemplatesToogle).getByTestId('cf-ui-controlled-input'));

    expect(onSelect).toBeCalledWith(null);
  });

  it('should call onSelect with the first template if no template is selected but the templates are visible', () => {
    const onSelect = jest.fn();
    build({ onSelect });

    const showTemplatesToogle = screen.getByTestId('template-toggle-true');

    userEvent.click(within(showTemplatesToogle).getByTestId('cf-ui-controlled-input'));

    expect(onSelect).toBeCalledWith(mockTemplates[0]);
  });

  it('should show the templates list if the templates are marked as visible', () => {
    build();
    const showTemplatesToogle = screen.getByTestId('template-toggle-true');

    expect(screen.queryByTestId('template-list-wrapper')).toBeNull();

    userEvent.click(within(showTemplatesToogle).getByTestId('cf-ui-controlled-input'));

    expect(screen.getByTestId('template-list-wrapper')).toBeVisible();
  });
});

function build(custom = {}) {
  const props = Object.assign(
    {
      onSelect: () => {},
      templates: mockTemplates,
      formAlign: 'left',
      selectedTemplate: null,
    },
    custom
  );

  render(<TemplateSelector {...props} />);
}
