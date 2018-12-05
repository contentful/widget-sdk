import React from 'react';
import { shallow } from 'enzyme';
import { TeamForm } from './TeamForm.es6';

const MockedProvider = require('../../../reactServiceContext').MockedProvider;

describe('TeamForm', () => {
  const createStub = jest.fn();
  let component;

  beforeEach(() => {
    component = shallow(
      <MockedProvider
        services={{
          'app/OrganizationSettings/Teams/TeamService.es6': {
            create: createStub
          }
        }}>
        <TeamForm orgId="123" />
      </MockedProvider>
    );
  });

  it('renders the component', () => {
    expect(component).toMatchSnapshot();
  });
});
