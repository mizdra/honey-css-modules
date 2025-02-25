/** @type {import('stylelint').Config} */
export default {
  plugins: ['@css-modules-kit/stylelint-plugin'],
  rules: {
    'css-modules-kit/no-unused-class-names': true,
    'css-modules-kit/no-missing-component-file': true,
  },
};
