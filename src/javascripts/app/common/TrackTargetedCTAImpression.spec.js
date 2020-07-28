import React from 'react';

import { render, screen } from '@testing-library/react';
import * as trackCTA from 'analytics/trackCTA';
import TrackTargetedCTAImpression from './TrackTargetedCTAImpression';
import * as fake from 'test/helpers/fakeFactory';

const trackTargetedCTAImpression = jest.spyOn(trackCTA, 'trackTargetedCTAImpression');

const mockOrganization = fake.Organization();
const mockSpace = fake.Space();

describe('TrackTargetedCTAImpression', () => {
  it('should fire a single trackTargetedCTAImpression event when rendered', () => {
    const { rerender } = render(
      <TrackTargetedCTAImpression
        impressionType={trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE}
        meta={{ spaceId: mockSpace.sys.id, organizationId: mockOrganization.sys.id }}>
        <div data-test-id="test-div"></div>
      </TrackTargetedCTAImpression>
    );

    expect(screen.getByTestId('test-div')).toBeVisible();

    expect(trackTargetedCTAImpression).toBeCalledTimes(1);
    expect(trackTargetedCTAImpression).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
      organizationId: mockOrganization.sys.id,
      spaceId: mockSpace.sys.id,
    });

    // Rerendering with different children to make sure TrackTargetedCTAImpression rerenders, but doesn't fire a second event.
    rerender(
      <TrackTargetedCTAImpression
        impressionType={trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE}
        meta={{ spaceId: mockSpace.sys.id, organizationId: mockOrganization.sys.id }}>
        <div data-test-id="1337"></div>
      </TrackTargetedCTAImpression>
    );
    expect(screen.getByTestId('1337')).toBeVisible();

    expect(trackTargetedCTAImpression).toBeCalledTimes(1);
    expect(trackTargetedCTAImpression).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
      organizationId: mockOrganization.sys.id,
      spaceId: mockSpace.sys.id,
    });
  });

  it('should render all children passed to it', () => {
    render(
      <TrackTargetedCTAImpression
        impressionType={trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE}
        meta={{ spaceId: mockSpace.sys.id, organizationId: mockOrganization.sys.id }}>
        <div data-test-id="test-div">
          <div data-test-id="test-div-child"></div>
        </div>
        <div data-test-id="test-div-2"></div>
        <div data-test-id="test-div-3"></div>
      </TrackTargetedCTAImpression>
    );

    expect(screen.getByTestId('test-div')).toBeVisible();
    expect(screen.getByTestId('test-div-child')).toBeVisible();
    expect(screen.getByTestId('test-div-2')).toBeVisible();
    expect(screen.getByTestId('test-div-3')).toBeVisible();
  });
});
