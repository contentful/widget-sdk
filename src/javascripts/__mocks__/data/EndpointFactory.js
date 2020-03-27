export const mockEndpoint = jest.fn().mockResolvedValue();

export const createEndpoint = jest.fn().mockReturnValue(mockEndpoint);

export const createOrganizationEndpoint = jest.fn().mockReturnValue(mockEndpoint);
export const createSpaceEndpoint = jest.fn().mockReturnValue(mockEndpoint);
export const createUsersEndpoint = jest.fn().mockReturnValue(mockEndpoint);

export const createPaginationEndpoint = jest.fn().mockImplementation((envs) => {
  return jest.fn().mockImplementation(({ query: { skip = 0, limit = 100 } = {} }) => {
    return Promise.resolve({
      total: envs.length,
      items: envs.slice(skip, skip + limit),
      limit,
      skip,
    });
  });
});
