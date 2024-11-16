# Glossary

## Token

The internal name of the item being exported from `*.module.css`.

For example, consider the following CSS file:

```css
.a {
  color: red;
}
.b,
.c {
  color: red;
}
:root {
  --a: red;
}
```

In this case, `a`, `b`, and `c` are tokens. If `dashedIdents` option is `true`, `--a` is also a token.
