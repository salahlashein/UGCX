# Shared theme tokens

Import this in every screen below. Matches DESIGN.md + the Mobile & RTL Addendum.

```jsx
// theme tokens (put in src/theme/tokens.js)
export const colors = {
  primary: '#181d26', primaryActive: '#0d1218',
  canvas: '#ffffff', surfaceSoft: '#f8fafc', surfaceStrong: '#e0e2e6',
  ink: '#181d26', body: '#333840', muted: '#41454d', borderStrong: '#9297a0',
  hairline: '#dddddd', inputBorder: '#8a8f99',
  link: '#1b61c9', linkActive: '#1a3866',
  success: '#006400', danger: '#b3261e', dangerSurface: '#fdecea',
  coral: '#aa2d00', forest: '#0a2e0e', cream: '#f5e9d4',
  peach: '#fcab79', mint: '#a8d8c4', yellow: '#f4d35e', mustard: '#d9a441',
  onPrimary: '#ffffff',
};
export const spacing = { xxs:4, xs:8, sm:12, md:16, lg:24, xl:32, xxl:48, band:48 };
export const radius = { sm:6, md:10, lg:12, pill:9999, full:9999 };
export const type = {
  displayLg: { fontSize:32, lineHeight:38, fontWeight:'400' },
  displayMd: { fontSize:28, lineHeight:34, fontWeight:'400' },
  titleLg: { fontSize:22, lineHeight:30, fontWeight:'400' },
  titleMd: { fontSize:20, lineHeight:28, fontWeight:'400' },
  label: { fontSize:16, lineHeight:22, fontWeight:'500' },
  body: { fontSize:15, lineHeight:22, fontWeight:'400' },
  caption: { fontSize:13, lineHeight:18, fontWeight:'400' },
};

```
