// Define config without `defineConfig` to simplify tsserver.log
export default {
  pattern: 'src/**/*.module.css',
  dtsOutDir: 'generated',
  alias: { '@': '.' },
};
