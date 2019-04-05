export const getWithId = (wrapper, testId) => wrapper.find(`[data-test-id="${testId}"]`).first();
