export const mockEndpoint = jest.fn().mockResolvedValue();

export const createEndpoint = jest.fn().mockReturnValue(mockEndpoint);

export const createOrganizationEndpoint = jest.fn().mockReturnValue(mockEndpoint);
