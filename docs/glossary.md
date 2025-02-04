# Glossary

## Token

The internal name of the item being exported from `*.module.css`.

For example, consider the following CSS file:

```css
@value a_1: red;
@import b_1, b_2 as b_2_alias from './b.module.css';
.a_2 {
  color: red;
}
.a_3,
.a_4 {
  color: red;
}
:root {
  --a-5: red;
}
```

In this case, `a_1`, `a_2`, `a_3`, `a_4`, `b_1` and `b_2_alias` are tokens. If `dashedIdents` option is `true`, `--a-5` is also a token.
