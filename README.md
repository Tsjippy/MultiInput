# Multi Input

A lightweight Vanilla JavaScript plugin that allows multiple values for text, email, url and tel inputs

## Install

```
npm i multi-input
```

## Usage

Include multi-input script.

```html
<script src="path/to/multi-input.js"></script>
```

Include the styles, either the compiled CSS...

```html
<link rel="stylesheet" href="path/to/main.css" />
```

Or import multi-input using ES6 syntax

```js
import MultiInput from "multi-input";
```

```scss
@import "~multi-input/dist/css/style.css";
// or
@import "~multi-input/src/scss/multi-input.scss";
```

Finally, initialize the plugin.

Using the minimified file directly:
```javascript
new MultiInput.Multinput(el, options);
```
or
```javascript
MultiInput.attachAll();
```

Using as import in webpack:
```javascript
new Multinput(el, options);
```

Full documentation and examples at [tsjippy.github.io/MultiInput/](https://tsjippy.github.io/MultiInput/).
