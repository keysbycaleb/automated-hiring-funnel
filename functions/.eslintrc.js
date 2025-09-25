module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    "max-len": "off",
    "indent": "off",
    "require-jsdoc": "off",
  },
  parserOptions: {
    // Required for modern syntax features like optional chaining
    "ecmaVersion": 2020,
  },
};
