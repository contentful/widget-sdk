import React from 'react';
import { render, wait } from '@testing-library/react';
import { AppDetails, validate } from './AppDetails';
import mockDefinitions from '../__mocks__/mockDefinitions.json';

jest.mock('../ManagementApiClient', () => ({
  getCreatorNameOf: jest.fn(() => Promise.resolve()),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(() => Promise.resolve()),
}));

const props = {
  definition: mockDefinitions[0],
  goToListView: () => {},
  goToTab: jest.fn(),
  tab: '',
};

describe('AppDetails', () => {
  describe('When passed a tab that is implemented', () => {
    it('gos to the general tab', async () => {
      const localProps = { ...props, tab: 'events' };
      render(<AppDetails {...localProps} />);

      await wait();

      expect(props.goToTab).not.toHaveBeenCalled();
    });
  });

  describe('When passed a tab that is not implemented', () => {
    it('gos to the general tab', async () => {
      const localProps = { ...props, tab: 'not_a_real_tab' };
      render(<AppDetails {...localProps} />);

      await wait();

      expect(localProps.goToTab).toHaveBeenCalledWith('');
    });
  });

  describe('validate', () => {
    it('accepts a valid definition', () => {
      const definition = {
        name: 'Test App',
        src: 'https://httpbin.org/post',
        locations: [{ location: 'dialog' }],
      };

      const result = validate(definition);
      expect(result).toStrictEqual([]);
    });

    it('returns error for empty name', () => {
      const definition = {
        name: '',
        src: 'https://httpbin.org/post',
        locations: [{ location: 'dialog' }],
      };

      const result = validate(definition);
      expect(result).toHaveLength(1);
      expect(result[0].path).toStrictEqual(['name']);
    });

    it('returns no error for empty url', () => {
      const definition = {
        name: 'Test app',
        src: '',
        locations: [{ location: 'dialog' }],
      };

      const result = validate(definition);
      expect(result).toStrictEqual([]);
    });

    it('returns error for http url', () => {
      const definition = {
        name: 'Test app',
        src: 'http://httpbin.org/post',
        locations: [{ location: 'dialog' }],
      };

      const result = validate(definition);
      expect(result).toHaveLength(1);
      expect(result[0].path).toStrictEqual(['src']);
    });

    ['http://localhost:1234', 'http://localhost', 'http://localhost:1234/contentful'].forEach(
      (src) => {
        it(`returns no error for localhost url: ${src}`, () => {
          const definition = {
            name: 'Test app',
            src: 'http://localhost:1234',
            locations: [{ location: 'dialog' }],
          };

          const result = validate(definition);
          expect(result).toHaveLength(0);
        });
      }
    );

    it('returns error for empty link name', () => {
      const definition = {
        name: 'Test app',
        src: 'https://httpbin.org/post',
        locations: [
          { location: 'dialog' },
          { location: 'page', navigationItem: { name: '', path: '/' } },
        ],
      };

      const result = validate(definition);
      expect(result).toHaveLength(1);
      expect(result[0].path).toStrictEqual(['locations', 'page', 'navigationItem', 'name']);
    });

    it('returns error for an invalid path', () => {
      const definition = {
        name: 'Test app',
        src: 'https://httpbin.org/post',
        locations: [
          { location: 'dialog' },
          { location: 'page', navigationItem: { name: 'Link name', path: 'invalid-link' } },
        ],
      };

      const result = validate(definition);
      expect(result).toHaveLength(1);
      expect(result[0].path).toStrictEqual(['locations', 'page', 'navigationItem', 'path']);
    });
  });
});
