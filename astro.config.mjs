import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';

export default defineConfig({
  // compat aliases react/react-dom → preact/compat so the ported hero engine
  // (React.createElement / hooks) runs unchanged as a Preact island.
  integrations: [tailwind(), preact({ compat: true })],
  output: 'static',
  build: {
    assets: 'assets'
  }
});
