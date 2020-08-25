import { renderHook, act } from '@testing-library/react-hooks';
import useEntityLoader, { ITEMS_PER_PAGE } from './useEntityLoader';
import { id as randomId } from 'utils/Random';

jest.mock('ng/spaceContext', () => ({
  publishedCTs: {
    get: jest.fn().mockReturnValue({
      data: {
        displayField: 'title',
        fields: [
          {
            type: 'Symbol',
            id: 'title',
          },
        ],
      },
    }),
  },
}));

const Entities = {
  Entry: 'Entry',
  Asset: 'Asset',
};

const entity = (type, id = randomId()) => {
  if (type === Entities.Entry) {
    return {
      sys: {
        type,
        id,
      },
    };
  } else {
    const newAsset = (file) => ({
      sys: {
        type,
        id,
      },
      fields: {
        file,
      },
    });
    return {
      ...newAsset(),
      withFile: () => newAsset('file.txt'),
    };
  }
};

describe('useEntityLoader', () => {
  it('should expose the loading api', () => {
    const fetch = jest.fn();
    const { result } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId: null,
      })
    );

    const [{ error, isLoading }, load] = result.current;

    expect(error).toBeUndefined();
    expect(isLoading).toBe(false);
    expect(typeof load).toBe('function');
  });

  it('should send the reuqest and update the state', async () => {
    const fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(), 1000);
        })
    );
    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId: null,
      })
    );

    act(() => {
      const [, load] = result.current;
      load();
    });

    const [{ isLoading }] = result.current;
    expect(isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current[0].isLoading).toBe(false);

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        order: undefined,
      })
    );
  });

  it('should resolve the results of the request', async () => {
    const expectedResults = {
      items: [entity(Entities.Entry), entity(Entities.Entry), entity(Entities.Entry)],
      total: 3,
    };
    const fetch = jest.fn().mockResolvedValue(expectedResults);
    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId: null,
      })
    );

    act(() => {
      const [, load] = result.current;
      load().then((res) => {
        expect(res).toEqual({
          data: expectedResults.items,
          hasMore: false,
          total: expectedResults.total,
        });
      });
    });

    await waitForNextUpdate();
  });

  it('should resolve the results of the request in pages', async () => {
    const TOTAL_ITEMS = Math.floor(ITEMS_PER_PAGE * 1.5);
    const expectedBatches = [
      {
        items: new Array(ITEMS_PER_PAGE).fill(0).map(() => entity(Entities.Entry)),
        total: TOTAL_ITEMS,
      },
      {
        items: new Array(TOTAL_ITEMS - ITEMS_PER_PAGE).fill(0).map(() => entity(Entities.Entry)),
        total: TOTAL_ITEMS,
      },
    ];
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(expectedBatches[0])
      .mockResolvedValueOnce(expectedBatches[1]);
    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId: null,
      })
    );

    act(() => {
      const [, load] = result.current;
      load().then((res) => {
        expect(res).toEqual({
          data: expectedBatches[0].items,
          hasMore: true,
          total: expectedBatches[0].total,
        });
      });
    });

    await waitForNextUpdate();
    expect(fetch.mock.calls[0][0].paginator.getPage()).toBe(0);

    act(() => {
      const [, load] = result.current;
      load({ more: true }).then((res) => {
        expect(res).toEqual({
          data: expectedBatches[1].items,
          hasMore: false,
          total: expectedBatches[1].total,
        });
      });
    });

    await waitForNextUpdate();

    expect(fetch.mock.calls[1][0].paginator.getPage()).toBe(1);
  });

  it('should handle the error and resolve empty batch', async () => {
    const expectedError = {
      status: 500,
      data: {
        message: 'Something went wrong',
      },
    };
    const fetch = jest.fn().mockRejectedValue(expectedError);
    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId: null,
      })
    );

    act(() => {
      const [, load] = result.current;
      load().then((res) => {
        expect(res).toEqual({
          data: [],
          hasMore: false,
          total: 0,
        });
      });
    });

    await waitForNextUpdate();

    const [{ error }] = result.current;
    expect(error).toEqual(expectedError);
  });

  it('should stay on the same page if error happened on page batch request', async () => {
    const TOTAL_ITEMS = Math.floor(ITEMS_PER_PAGE * 3);
    const expectedBatches = [
      {
        items: new Array(ITEMS_PER_PAGE).fill(0).map(() => entity(Entities.Entry)),
        total: TOTAL_ITEMS,
      },
      {
        items: new Array(ITEMS_PER_PAGE).fill(0).map(() => entity(Entities.Entry)),
        total: TOTAL_ITEMS,
      },
    ];
    const expectedError = {
      status: 500,
      data: {
        message: 'Something went wrong',
      },
    };

    const fetch = jest
      .fn()
      .mockResolvedValueOnce(expectedBatches[0])
      .mockRejectedValueOnce(expectedError)
      .mockResolvedValueOnce(expectedBatches[1]);

    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId: null,
      })
    );

    act(() => {
      const [, load] = result.current;
      load().then((res) => {
        expect(res).toEqual({
          data: expectedBatches[0].items,
          hasMore: true,
          total: TOTAL_ITEMS,
        });
      });
    });

    await waitForNextUpdate();
    expect(fetch.mock.calls[0][0].paginator.getPage()).toBe(0);
    expect(result.current[0].error).toBeUndefined();

    act(() => {
      const [, load] = result.current;
      load({ more: true }).then((res) => {
        expect(res).toEqual({
          data: [],
          hasMore: true,
          total: TOTAL_ITEMS,
        });
      });
    });

    await waitForNextUpdate();
    expect(fetch.mock.calls[0][0].paginator.getPage()).toBe(0);

    const [{ error }] = result.current;
    expect(error).toEqual(expectedError);

    act(() => {
      const [, load] = result.current;
      load({ more: true }).then((res) => {
        expect(res).toEqual({
          data: expectedBatches[1].items,
          hasMore: true,
          total: TOTAL_ITEMS,
        });
      });
    });

    await waitForNextUpdate();
    expect(fetch.mock.calls[0][0].paginator.getPage()).toBe(1);
    expect(result.current[0].error).toBeUndefined();
  });

  it('should automatically retry with a smaller batch size in case of a Response size too big error', async () => {
    const TOTAL_ITEMS = Math.floor(ITEMS_PER_PAGE * 2);
    const expectedBatch = {
      items: new Array(ITEMS_PER_PAGE / 4).fill(0).map(() => entity(Entities.Entry)),
      total: TOTAL_ITEMS,
    };
    const expectedError = {
      status: 400,
      data: {
        message: 'Response size too big',
      },
    };

    const fetch = jest
      .fn()
      .mockRejectedValueOnce(expectedError) // reduces from 40 to 20
      .mockRejectedValueOnce(expectedError) // reduces from 20 to 10
      .mockResolvedValueOnce(expectedBatch);

    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId: null,
      })
    );

    act(() => {
      const [, load] = result.current;
      load().then((res) => {
        expect(res).toEqual({
          data: expectedBatch.items,
          hasMore: true,
          total: TOTAL_ITEMS,
        });
      });
    });

    await waitForNextUpdate();

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[0][0].paginator.getPerPage()).toBe(ITEMS_PER_PAGE / 4);
  });

  it('should reset the pages if reset:true is given', async () => {
    const TOTAL_ITEMS = Math.floor(ITEMS_PER_PAGE * 2);
    const expectedBatches = [
      {
        items: new Array(ITEMS_PER_PAGE).fill(0).map(() => entity(Entities.Entry)),
        total: TOTAL_ITEMS,
      },
      {
        items: new Array(ITEMS_PER_PAGE).fill(0).map(() => entity(Entities.Entry)),
        total: TOTAL_ITEMS,
      },
    ];

    const fetch = jest
      .fn()
      .mockResolvedValueOnce(expectedBatches[0])
      .mockResolvedValueOnce(expectedBatches[1])
      .mockResolvedValueOnce(expectedBatches[0]);

    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId: null,
      })
    );

    act(() => {
      const [, load] = result.current;
      load().then((res) => {
        expect(res).toEqual({
          data: expectedBatches[0].items,
          hasMore: true,
          total: TOTAL_ITEMS,
        });
      });
    });

    await waitForNextUpdate();

    act(() => {
      const [, load] = result.current;
      load({ more: true }).then((res) => {
        expect(res).toEqual({
          data: expectedBatches[1].items,
          hasMore: false,
          total: TOTAL_ITEMS,
        });
      });
    });

    await waitForNextUpdate();

    act(() => {
      const [, load] = result.current;
      load({ reset: true }).then((res) => {
        expect(res).toEqual({
          data: expectedBatches[0].items,
          hasMore: true,
          total: TOTAL_ITEMS,
        });
      });
    });

    await waitForNextUpdate();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[0][0].paginator.getPerPage()).toBe(ITEMS_PER_PAGE);
    expect(fetch.mock.calls[1][0].paginator.getPerPage()).toBe(ITEMS_PER_PAGE);
    expect(fetch.mock.calls[2][0].paginator.getPerPage()).toBe(ITEMS_PER_PAGE);
  });

  it('should send a request with the search query', async () => {
    const expectedBatch = {
      items: [entity(Entities.Entry)],
      total: 1,
    };

    const searchQuery = {
      searchText: 'hellno',
      searchFilters: [['__status', '', 'published']],
      contentTypeId: 'Article',
    };

    const fetch = jest.fn().mockResolvedValue(expectedBatch);

    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId: null,
      })
    );

    act(() => {
      const [, load] = result.current;
      load({ search: searchQuery }).then((res) => {
        expect(res).toEqual({
          data: expectedBatch.items,
          hasMore: false,
          total: expectedBatch.total,
        });
      });
    });

    await waitForNextUpdate();

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        order: undefined,
        ...searchQuery,
      })
    );
  });

  it('should send request with contentTypeId', async () => {
    const expectedBatch = {
      items: [entity(Entities.Entry)],
      total: 1,
    };

    const contentTypeId = 'Article';
    const fetch = jest.fn().mockResolvedValue(expectedBatch);

    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId,
      })
    );

    act(() => {
      const [, load] = result.current;
      load().then((res) => {
        expect(res).toEqual({
          data: expectedBatch.items,
          hasMore: false,
          total: expectedBatch.total,
        });
      });
    });

    await waitForNextUpdate();

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        contentTypeId: contentTypeId,
      })
    );
  });

  it('should only return assets with file and apply fields.file filter automatically', async () => {
    const expectedBatch = {
      items: [entity(Entities.Asset), entity(Entities.Asset).withFile()],
      total: 2,
    };

    const fetch = jest.fn().mockResolvedValue(expectedBatch);

    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Asset,
        fetch,
        contentTypeId: null,
      })
    );

    act(() => {
      const [, load] = result.current;
      load().then((res) => {
        expect(res).toEqual({
          data: [expectedBatch.items[1]], // only returns assets with files
          hasMore: false,
          total: expectedBatch.total,
        });
      });
    });

    await waitForNextUpdate();

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        searchFilters: [['fields.file', 'exists', true]],
      })
    );
  });

  it('should merge the searchFilters with fields.file filter for Assets automatically', async () => {
    const expectedBatch = {
      items: [entity(Entities.Asset), entity(Entities.Asset).withFile()],
      total: 2,
    };

    const searchQuery = {
      searchText: 'hellno',
      searchFilters: [['__status', '', 'published']],
      contentTypeId: 'Article',
    };

    const fetch = jest.fn().mockResolvedValue(expectedBatch);

    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Asset,
        fetch,
        contentTypeId: null,
      })
    );

    act(() => {
      const [, load] = result.current;
      load({ search: searchQuery }).then((res) => {
        expect(res).toEqual({
          data: [expectedBatch.items[1]], // only returns assets with files
          hasMore: false,
          total: expectedBatch.total,
        });
      });
    });

    await waitForNextUpdate();

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        searchText: searchQuery.searchText,
        searchFilters: [...searchQuery.searchFilters, ['fields.file', 'exists', true]],
        contentTypeId: searchQuery.contentTypeId,
      })
    );
  });

  it('should apply order if contentTypeId is given', async () => {
    const expectedBatch = {
      items: [entity(Entities.Entry), entity(Entities.Entry)],
      total: 2,
    };

    const contentTypeId = 'Article';

    const fetch = jest.fn().mockResolvedValue(expectedBatch);

    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
        contentTypeId,
      })
    );

    act(() => {
      const [, load] = result.current;
      load().then((res) => {
        expect(res).toEqual({
          data: expectedBatch.items,
          hasMore: false,
          total: expectedBatch.total,
        });
      });
    });

    await waitForNextUpdate();

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        order: {
          fieldId: 'title', // taken from content type, mocked at the top of the file
          direction: 'ascending',
        },
      })
    );
  });

  it('should return empty response from the interrupted request and should respond with the full response in the most recent request', async () => {
    const expectedBatch = {
      items: [entity(Entities.Entry), entity(Entities.Entry)],
      total: 2,
    };
    const fetch = jest.fn().mockResolvedValue(expectedBatch);

    const { result, waitForNextUpdate } = renderHook(() =>
      useEntityLoader({
        entityType: Entities.Entry,
        fetch,
      })
    );

    const [, load] = result.current;
    let responses;
    act(() => {
      Promise.all([load(), load(), load(), load()]).then((resolvedResponses) => {
        responses = resolvedResponses;
      });
    });

    await waitForNextUpdate();
    expect(responses.pop()).toEqual({
      data: expectedBatch.items,
      hasMore: false,
      total: expectedBatch.total,
    });
    responses.forEach((response) =>
      expect(response).toEqual({ data: [], hasMore: false, total: 0 })
    );

    expect(fetch).toHaveBeenCalledTimes(4);
  });
});
