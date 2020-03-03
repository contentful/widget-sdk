import React from 'react';
import { shallow } from 'enzyme';
import 'jest-enzyme';

import { WorkbenchContent } from '../OrganizationUsage';
import NoSpacesPlaceholder from '../NoSpacesPlaceholder';
import OrganizationUsagePageNew from '../committed/OrganizationUsagePageNew';
import OrganizationResourceUsageList from 'account/usage/non_committed/OrganizationResourceUsageList';

describe('WorkbenchContent', () => {
  let defaultProps = null;

  beforeEach(() => {
    defaultProps = {
      committed: true,
      hasSpaces: true,
      selectedPeriodIndex: 0,
      spaceNames: { space1: 'Space1', space2: 'Space2' },
      isPoC: { space1: false, space2: true },
      periodicUsage: {
        org: { usage: [] },
        apis: { cma: { items: [] } }
      },
      apiRequestIncludedLimit: 1000,
      assetBandwidthUsage: 100,
      assetBandwidthIncludedLimit: 50,
      assetBandwidthUOM: 'GB',
      isLoading: false,
      periods: [],
      resources: [],
      newOrgEnabled: true
    };
  });

  it('should render', () => {
    const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

    expect(wrapper).toMatchSnapshot();
  });

  describe('org is committed and there are spaces', () => {
    it('should render the OrganizationUsagePage', () => {
      const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

      expect(wrapper.find(OrganizationUsagePageNew)).toHaveLength(1);

      expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(0);
      expect(wrapper.find(OrganizationResourceUsageList)).toHaveLength(0);
    });
  });

  describe('org has no spaces', () => {
    it('should render NoSpacePlaceholder', () => {
      const wrapper = shallow(
        <WorkbenchContent {...{ ...defaultProps, ...{ hasSpaces: false } }} />
      );

      expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(1);

      expect(wrapper.find(OrganizationUsagePageNew)).toHaveLength(0);
      expect(wrapper.find(OrganizationResourceUsageList)).toHaveLength(0);
    });
  });

  describe('org is not committed', () => {
    beforeEach(() => {
      defaultProps.committed = false;
    });

    it('should render OrganizationResourceUsageList', () => {
      const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

      expect(wrapper.find(OrganizationResourceUsageList)).toHaveLength(1);

      expect(wrapper.find(OrganizationUsagePageNew)).toHaveLength(0);
      expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(0);
    });

    describe('no resources given', () => {
      beforeEach(() => {
        defaultProps.resources = undefined;
      });

      it('should render nothing', () => {
        const wrapper = shallow(<WorkbenchContent {...defaultProps} />);

        expect(wrapper.find(OrganizationResourceUsageList)).toHaveLength(0);
        expect(wrapper.find(OrganizationUsagePageNew)).toHaveLength(0);
        expect(wrapper.find(NoSpacesPlaceholder)).toHaveLength(0);
      });
    });
  });
});
