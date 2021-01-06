export const mockDeleteSpace = jest.fn();
export const mockGetEntrySnapshots = jest.fn();
export const mockValidateEntry = jest.fn();

export default jest.fn().mockImplementation(() => {
  return {
    deleteSpace: mockDeleteSpace,
    getEntrySnapshots: mockGetEntrySnapshots,
    validateEntry: mockValidateEntry,
  };
});
