/** @type {import('stylelint').Config} */
export default {
  plugins: ['stylelint-plugin-css-modules-kit'],
  rules: {
    'css-modules-kit/no-unused-class-names': true,
    'css-modules-kit/no-missing-component-file': true,
  },
};
