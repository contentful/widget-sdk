export const mockGetEntrySnapshots = jest.fn();
export const mockValidateEntry = jest.fn();
export const mockDeleteSpace = jest.fn();

export default jest.fn().mockImplementation(() => {
  return {
    getEntrySnapshots: mockGetEntrySnapshots,
    validateEntry: mockValidateEntry,
    deleteSpace: mockDeleteSpace,
  };
});
