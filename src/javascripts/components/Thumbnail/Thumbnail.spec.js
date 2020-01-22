import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, cleanup } from '@testing-library/react';
import Thumbnail from './Thumbnail';

describe('Thumbnail', () => {
  afterEach(cleanup);

  describe('file without preview', () => {
    it('does not render preview for non-images MIME types', () => {
      const { container } = render(
        <Thumbnail
          file={{
            url: '//images.contentful.com/image.png',
            contentType: 'application/json'
          }}
        />
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <i
            class="icon fa fa-file-text-o"
          />
        </div>
      `);
    });

    it('renders icon according to MIME type', function() {
      const { container } = render(
        <Thumbnail
          file={{
            url: 'url',
            contentType: 'video/h264'
          }}
        />
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <i
            class="icon fa fa-file-video-o"
          />
        </div>
      `);
    });
  });

  describe('file with image preview', () => {
    const imageUrl = 'https://images.contentful.com/path';

    it('with size', function() {
      const { container } = render(
        <Thumbnail
          file={{
            url: imageUrl,
            contentType: 'image/png'
          }}
          size="300"
        />
      );

      expect(container.querySelector('img')).toMatchInlineSnapshot(`
        <img
          class="thumbnail"
          src="https://images.contentful.com/path?w=300&h=300"
          style="width: 300px; height: 300px;"
        />
      `);
    });

    it('with width and height', function() {
      const { container } = render(
        <Thumbnail
          file={{
            url: imageUrl,
            contentType: 'image/png'
          }}
          width="300"
          height="400"
        />
      );

      expect(container.querySelector('img')).toMatchInlineSnapshot(`
        <img
          class="thumbnail"
          src="https://images.contentful.com/path?w=300&h=400"
          style="width: 300px; height: 400px;"
        />
      `);
    });

    it('with icon=true renders the icon instead of the image', function() {
      const { container } = render(
        <Thumbnail
          file={{
            url: imageUrl,
            contentType: 'image/png'
          }}
          icon={true}
        />
      );

      expect(container).toMatchInlineSnapshot(`
        <div>
          <i
            class="icon fa fa-file-image-o"
          />
        </div>
      `);
    });
  });
});
