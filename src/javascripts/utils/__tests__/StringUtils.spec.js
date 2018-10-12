import * as utils from '../StringUtils.es6';

describe('utils/StringUtils.es6', () => {
  describe('#joinAndTruncate()', () => {
    it('does not truncate short lists', function() {
      expect(utils.joinAndTruncate(split('a b c'), 3)).toEqual('a, b and c');
    });

    it('truncates long lists', function() {
      expect(utils.joinAndTruncate(split('a b c d'), 2, 'variables')).toEqual(
        'a, b and 2 other variables'
      );
    });

    it('has at least 2 "other" items', function() {
      expect(utils.joinAndTruncate(split('a b c'), 2, 'variables')).toEqual(
        'a and 2 other variables'
      );
    });

    function split(string) {
      return string.split(' ');
    }
  });

  describe('#truncate()', () => {
    it('retains short strings', function() {
      expect(utils.truncate('abc', 3)).toEqual('abc');
    });

    it('truncates long strings with ellipses', function() {
      expect(utils.truncate('abcd', 3)).toEqual('abc…');
    });

    it('omits trailing spaces', function() {
      expect(utils.truncate('abc \t\n\r xyz', 8)).toEqual('abc…');
    });

    it('omits orphaned letters', function() {
      expect(utils.truncate('go 22 ahead', 4)).toEqual('go…');
    });

    it('does not mistake single chars for orphaned letters', function() {
      expect(utils.truncate('go 2 start', 4)).toEqual('go 2…');
    });

    it('cuts off spaces before ellipsis', function() {
      expect(utils.truncate('abc  d', 5)).toEqual('abc…');
      expect(utils.truncate('go 2 start', 5)).toEqual('go 2…');
      expect(utils.truncate('go 2  start', 6)).toEqual('go 2…');
    });

    it('does currently not honor word boundaries other than spaces', function() {
      expect(utils.truncate('go-22-ahead', 4)).toEqual('go-2…');
    });

    it('cuts off `.` as last character', function() {
      expect(utils.truncate('go.ahead', 3)).toEqual('go…');
    });
  });

  describe('#truncateMiddle()', () => {
    it('throws an error if string end greater than total length param', function() {
      const call = utils.truncateMiddle.bind(null, 'foo', 10, 11);
      expect(call).toThrow();
    });

    it('retains short string', function() {
      expect(utils.truncateMiddle('abc', 3, 1)).toEqual('abc');
    });

    it('truncates long strings with ellipses at the middle', function() {
      expect(utils.truncateMiddle('abcd', 3, 1)).toEqual('ab…d');
    });

    it('retains short string 2', function() {
      expect(utils.truncateMiddle('abcd', 3, 3)).toEqual('…bcd');
    });

    it('omits orphaned letters before the middle', function() {
      expect(utils.truncateMiddle('ab cdefgh xyz', 7, 3)).toEqual('ab…xyz');
    });

    it('removes `.` if they would result in visually awkward “….”', function() {
      expect(utils.truncateMiddle('foo.bar.baz', 8, 4)).toEqual('foo…baz');
    });
  });

  describe('#startsWithVowel', () => {
    it('returns false for non-string or empty string', () => {
      expect(utils.startsWithVowel({})).toBe(false);
      expect(utils.startsWithVowel('')).toBe(false);
    });

    it('returns true for strings starting with vowel', () => {
      ['anna', 'eleonore', 'isabel', 'olga', 'ulrika'].forEach(name => {
        expect(utils.startsWithVowel(name)).toBe(true);
        expect(utils.startsWithVowel(name.toUpperCase())).toBe(true);
      });
    });

    it('returns false for strings that are not starting with vowel', () => {
      ['daisy', 'wanda', 'rachel', 'salomea', 'tania'].forEach(name => {
        expect(utils.startsWithVowel(name)).toBe(false);
        expect(utils.startsWithVowel(name.toUpperCase())).toBe(false);
      });
    });
  });

  describe('.fileNameToTitle()', () => {
    it('removes the file extension', () => {
      expect(utils.fileNameToTitle('file.jpg')).toBe('file');
    });

    it('trims spaces', () => {
      expect(utils.fileNameToTitle(' file .jpg')).toBe('file');
    });

    it('replaces underscores with one space', () => {
      expect(utils.fileNameToTitle('_file_name_.jpg')).toBe('file name');
      expect(utils.fileNameToTitle('file___name.jpg')).toBe('file name');
    });

    it('replaces underscore even if it is the only character', () => {
      expect(utils.fileNameToTitle('_.jpg')).toBe('');
    });
  });

  describe('#normalizeWhiteSpace()', () => {
    it('remoes extraneous whitespace', function() {
      expect(utils.normalizeWhiteSpace(' a  b   c ')).toEqual('a b c');
    });
  });

  describe('#isValidEmail', () => {
    it('returns true for valid emails', () => {
      [
        'jeffrey.lebowski@gmail.com', // Regular old email address
        'jeffrey.lebowski+thedude@gmail.com', // Email address with plus sign
        '0123456789012345678901234567890123456789012345678901234567890123@gmail.com', // 64 char local-part (max)
        '0123456789012345678901234567890123456789012345678901234567890123@01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234.com' // 254 characters
      ].forEach(email => {
        expect(utils.isValidEmail(email)).toBe(true);
      });
    });

    it('returns false for invalid emails', () => {
      [
        '@gmail.com', // No Local-part
        '01234567890123456789012345678901234567890123456789012345678901234@gmail.com', // 65 char local-part (too long)
        '0123456789012345678901234567890123456789012345678901234567890123@012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345.com', // 255 characters
        'jeffrey.lebowski@.com', // No host
        'jeffrey.lebowski@gmail', // No TLD
        'jeffrey.lebowski@gmail.c' // TLD too short
      ].forEach(email => {
        expect(utils.isValidEmail(email)).toBe(false);
      });
    });

    it('returns false for non-strings', () => {
      expect(utils.isValidEmail({})).toBe(false);
    });
  });

  describe('joinWithAnd', () => {
    const getItems = () => {
      return {
        twoItems: ['two', 'items'],
        threeItems: ['definitely', 'three', 'items'],
        fourItems: ['absolutely', '100%', 'four', 'items']
      };
    };

    it('should return null if not given array', () => {
      expect(utils.joinWithAnd('')).toBeNull();
      expect(utils.joinWithAnd({})).toBeNull();
    });

    it('should return the first item if only one item given', () => {
      expect(utils.joinWithAnd(['hello world'])).toBe('hello world');
      expect(utils.joinWithAnd(['testing 1234'])).toBe('testing 1234');
    });

    it('should return items joined with and if more than one item given', function() {
      const { twoItems, threeItems, fourItems } = getItems();
      expect(utils.joinWithAnd(twoItems)).toBe('two, and items');
      expect(utils.joinWithAnd(threeItems)).toBe('definitely, three, and items');
      expect(utils.joinWithAnd(fourItems)).toBe('absolutely, 100%, four, and items');
    });

    it('should allow disabling oxford commas', function() {
      const { twoItems, threeItems, fourItems } = getItems();

      expect(utils.joinWithAnd(twoItems, false)).toBe('two and items');
      expect(utils.joinWithAnd(threeItems, false)).toBe('definitely, three and items');
      expect(utils.joinWithAnd(fourItems, false)).toBe('absolutely, 100%, four and items');
    });
  });
});
