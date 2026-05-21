module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["plugin:@typescript-eslint/recommended"],
  rules: {
    "quotes": "off",
    "semi": "off",
    "object-curly-spacing": "off",
    "max-len": "off",
    "arrow-parens": "off",
    "comma-spacing": "off",
    "no-multi-spaces": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
  },
}