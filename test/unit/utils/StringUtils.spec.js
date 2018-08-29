import { joinWithAnd } from 'utils/StringUtils';

describe('StringUtils', () => {
  describe('joinWithAnd', () => {
    beforeEach(function() {
      this.twoItems = ['two', 'items'];
      this.threeItems = ['definitely', 'three', 'items'];
      this.fourItems = ['absolutely', '100%', 'four', 'items'];
    });

    it('should return null if not given array', () => {
      expect(joinWithAnd('')).toBe(null);
      expect(joinWithAnd({})).toBe(null);
    });

    it('should return the first item if only one item given', () => {
      expect(joinWithAnd(['hello world'])).toBe('hello world');
      expect(joinWithAnd(['testing 1234'])).toBe('testing 1234');
    });

    it('should return items joined with and if more than one item given', function() {
      expect(joinWithAnd(this.twoItems)).toBe('two, and items');
      expect(joinWithAnd(this.threeItems)).toBe('definitely, three, and items');
      expect(joinWithAnd(this.fourItems)).toBe('absolutely, 100%, four, and items');
    });

    it('should allow disabling oxford commas', function() {
      expect(joinWithAnd(this.twoItems, false)).toBe('two and items');
      expect(joinWithAnd(this.threeItems, false)).toBe('definitely, three and items');
      expect(joinWithAnd(this.fourItems, false)).toBe('absolutely, 100%, four and items');
    });
  });
});
