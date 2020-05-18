import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplatesList from './TemplatesList';

const mockTemplates = [
  { name: 'Test template', descriptionV2: '', sys: { id: 'template_1234' } },
  { name: 'Test template 2', descriptionV2: '', sys: { id: 'template_5678' } },
];

describe('TemplatesList', () => {
  it('should render nothing if there are no templates given', () => {
    build({ templates: null });

    expect(screen.queryByTestId('template-list-wrapper')).toBeNull();
  });

  it('should render nothing if there are the templates array is empty', () => {
    build({ templates: [] });

    expect(screen.queryByTestId('template-list-wrapper')).toBeNull();
  });

  it('should a tab for each template with the template name', () => {
    build();

    expect(screen.getAllByTestId('space-template-template.id')).toHaveLength(2);
  });

  it('should call onSelect with the template if a template tab is clicked', () => {
    const onSelect = jest.fn();

    build({ onSelect });

    userEvent.click(screen.getAllByTestId('space-template-template.id')[1]);

    expect(onSelect).toBeCalledWith(mockTemplates[1]);
  });

  it('should show the template details if a template is selected', () => {
    build({ selectedTemplate: mockTemplates[1] });

    expect(screen.getByTestId('selected-template-details')).toBeVisible();
  });
});

function build(custom) {
  const props = Object.assign(
    {
      templates: mockTemplates,
      selectedTemplate: null,
      onSelect: () => {},
    },
    custom
  );

  render(<TemplatesList {...props} />);
}
