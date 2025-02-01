/** @type {import('stylelint').Config} */
export default {
  plugins: ['stylelint-plugin-honey-css-modules'],
  rules: {
    'honey-css-modules/no-unused-class-names': true,
    'honey-css-modules/no-missing-component-file': true,
  },
};
