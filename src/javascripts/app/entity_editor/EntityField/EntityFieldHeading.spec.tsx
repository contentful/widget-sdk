import React from 'react';
import { render } from '@testing-library/react';
import { EntityFieldHeading } from './EntityFieldHeading';
import { ContentEntityType } from '@contentful/app-sdk';
import { FieldAccess } from './EntityFieldAccess';

const renderComponent = (override = (props) => props) => {
  const defaultProps = {
    field: {
      id: 'field-id',
      name: 'Field',
      apiName: 'field',
      type: '',
      disabled: false,
      required: true,
      localized: true,
      items: {
        type: 'type',
      },
    },
    locale: {
      name: 'de-DE',
      internal_code: 'de-DE',
      code: 'de-DE',
      default: true,
      contentManagementApi: false,
      contentDeliveryApi: false,
      optional: false,
      sys: {
        id: 'de-DE',
      },
    },
    entityType: 'Entry' as ContentEntityType,
    withLocaleName: true,
  };

  return render(<EntityFieldHeading {...override(defaultProps)} />);
};

describe('EntityFieldHeading', () => {
  it('renders the required field name with locale name', () => {
    const { queryByTestId } = renderComponent();
    const label = queryByTestId('field-locale-label');
    expect(label).toBeTruthy();
    expect(label?.innerHTML).toContain('Field');
    expect(label?.innerHTML).toContain('(required)');
    expect(label?.innerHTML).toContain('de-DE');
  });

  it('renders the field name without locale name', () => {
    const { queryByTestId } = renderComponent((props) => {
      props.withLocaleName = false;
      props.field.required = false;
      return props;
    });
    const label = queryByTestId('field-locale-label');
    expect(label).toBeTruthy();
    expect(label?.innerHTML).toContain('Field');
    expect(label?.innerHTML).not.toContain('(required)');
    expect(label?.innerHTML).not.toContain('de-DE');
  });

  const accessTypes = [FieldAccess.DENIED, FieldAccess.EDITING_DISABLED, FieldAccess.OCCUPIED];
  accessTypes.forEach(({ type }) => {
    it(`renders the field with "${type}" FieldLockIndicator`, () => {
      const { queryByTestId } = renderComponent((props) => {
        props.access = FieldAccess[type];
        return props;
      });
      expect(queryByTestId(`field-locale-${type.toLowerCase()}`)).toBeTruthy();
      accessTypes
        .filter((access) => access.type !== type)
        .forEach(({ type }) =>
          expect(queryByTestId(`field-locale-${type.toLowerCase()}`)).not.toBeTruthy()
        );
    });
  });
});
