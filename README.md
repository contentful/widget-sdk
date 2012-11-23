= HTML Client App

Get it running:

1. Start private_content_api at `http://localhost:3000` (the default) with -d flag
2. Seed the server
2. Clone app next to the client library, so that the symlink in /vendor/assets/javascripts/correctly
   points to the clients lib directory:
   ```
   .
   |
   |- client
   |  |- lib
   |
   |- contentful
   |  |- vendor
   |     |- assets
   |        |- javascripts
   |           |- contentful_client -> ../../../../client/lib/
   ```
   This is a temporary solution
3. Start rails with `rails -s -p3001` and visit `http://localhost:3001`