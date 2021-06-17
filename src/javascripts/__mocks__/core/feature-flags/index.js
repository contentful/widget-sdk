export const getVariation = jest.fn().mockResolvedValue(true);
export const getVariationSync = jest.fn().mockReturnValue(false);
export const useFeatureFlag = jest.fn().mockReturnValue([true, false]);
export const hasCachedVariation = jest.fn().mockReturnValue(true);
export const FLAGS = {};
