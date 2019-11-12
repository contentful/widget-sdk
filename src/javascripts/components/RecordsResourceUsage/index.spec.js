import React from 'react';
import { render, cleanup, wait } from '@testing-library/react';
import RecordsResourceUsage from './index';
import createResourceService from 'services/ResourceService';

import '@testing-library/jest-dom/extend-expect';

jest.mock('services/ResourceService', () => {
  const get = jest.fn();

  const result = () => ({
    get
  });

  result.__get = get;

  return result;
});

describe('RecordsResourceUsage', () => {
  const build = () => {
    const space = {
      sys: {
        id: 'space_1234'
      }
    };

    return render(
      <RecordsResourceUsage
        space={space}
        environmentId="env_1234"
        currentTotal={0}
        isMasterEnvironment
      />
    );
  };

  const makeResource = usage => ({
    name: 'Record',
    usage,
    limits: {
      included: 10,
      maximum: 10
    }
  });

  beforeEach(() => {
    createResourceService.__get.mockResolvedValueOnce(makeResource());
  });

  afterEach(cleanup);

  it('should attempt to get the resource when mounted', async () => {
    build();

    await wait();

    expect(createResourceService.__get).toHaveBeenCalledTimes(1);
  });

  it('should have the basic resource-usage class', async () => {
    const { queryByTestId } = build();

    await wait();

    expect(queryByTestId('container')).toHaveClass('resource-usage');
  });

  it('should add the resource-usage--warn class if near the limit', async () => {
    createResourceService.__get.mockReset().mockResolvedValueOnce(makeResource(9));

    const { queryByTestId } = build();

    await wait();

    expect(queryByTestId('container')).toHaveClass('resource-usage--warn');
  });

  it('should add the resource-usage--danger class if at the limit', async () => {
    createResourceService.__get.mockReset().mockResolvedValueOnce(makeResource(10));

    const { queryByTestId } = build();

    await wait();

    expect(queryByTestId('container')).toHaveClass('resource-usage--danger');
  });
});
