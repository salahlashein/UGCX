// TASK-P1-008 / DES-P1-012: direction-safe styles are enforced by lint, not
// review discipline (R1, R2). See the plan's "Schemas" section for the
// selectors this block implements verbatim.
module.exports = {
  root: true,
  extends: ['../../.eslintrc.js'],
  plugins: ['react-hooks'],
  env: {
    node: true,
  },
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'no-restricted-syntax': [
      'error',
      {
        selector:
          'Property[key.name=/^(marginLeft|marginRight|paddingLeft|paddingRight|borderLeftWidth|borderRightWidth|borderLeftColor|borderRightColor|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius)$/]',
        message:
          'Use the direction-aware property (marginStart/End, paddingStart/End, borderStartStartRadius, ...). Physical directions break Arabic RTL.',
      },
      {
        selector: "Property[key.name=/^(left|right)$/][value.type='Literal']",
        message:
          "Use 'start'/'end' instead of 'left'/'right' for positioning. Physical directions break Arabic RTL.",
      },
      {
        selector: "Property[key.name='textAlign'][value.value=/^(left|right)$/]",
        message: "Omit textAlign (React Native's default is direction-aware) or use 'center'.",
      },
    ],
  },
  overrides: [
    {
      files: ['src/screens/**', 'src/components/**'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector:
              'Property[key.name=/^(marginLeft|marginRight|paddingLeft|paddingRight|borderLeftWidth|borderRightWidth|borderLeftColor|borderRightColor|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius)$/]',
            message:
              'Use the direction-aware property (marginStart/End, paddingStart/End, borderStartStartRadius, ...). Physical directions break Arabic RTL.',
          },
          {
            selector: "Property[key.name=/^(left|right)$/][value.type='Literal']",
            message:
              "Use 'start'/'end' instead of 'left'/'right' for positioning. Physical directions break Arabic RTL.",
          },
          {
            selector: "Property[key.name='textAlign'][value.value=/^(left|right)$/]",
            message: "Omit textAlign (React Native's default is direction-aware) or use 'center'.",
          },
          {
            selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
            message: 'Import the color from ../../theme. Screens must not declare raw hex.',
          },
        ],
      },
    },
  ],
};
