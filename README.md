# eslint-plugin-xss

[![NPM version](http://img.shields.io/npm/v/eslint-plugin-xss.svg)](https://www.npmjs.com/package/eslint-plugin-xss)
[![Build Status](https://travis-ci.org/Rantanen/eslint-plugin-xss.svg?branch=master)](https://travis-ci.org/Rantanen/eslint-plugin-xss)
[![Codecov](https://codecov.io/gh/Rantanen/eslint-plugin-xss/branch/master/graph/badge.svg)](https://codecov.io/gh/Rantanen/eslint-plugin-xss)
[![Codacy](https://api.codacy.com/project/badge/grade/13e5c7abeb4545359ca9b02c0e91bb72)](https://www.codacy.com/app/jubjub/eslint-plugin-xss)

Tries to detect XSS issues in codebase before they end up in production.

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-xss`:

```
$ npm install eslint-plugin-xss --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-xss` globally.

## Usage

Add `xss` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "xss"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "xss/rule-name": 2
    }
}
```

## Supported Rules

###`xss/no-mixed-html`

```json
"xss/no-mixed-html": [ 2, {
    "encoders": [ "utils.htmlEncode()", "CSS.escape()", "Number()" ],
    "unsafe": [ ".html()" ]
} ];
```

The rule disallows mixing HTML content and unencoded input. It should fail in
following scenarios:

```javascript
var x = '<div>' + input + '</div>';
$node.html( '<div>' + input + '</div>' );
```

The rule also uses variable names to convey meaning about the contents.
Variable names with 'html' are expected to be html encoded. The following will
fail:

```javascript
var html = input;
var text = htmlInput;
displayValue( htmlInput );
htmlItems = [ input1, input2 ].join();
textItems = [ '<div>', input, '</div>' ].join();
tag = isNumbered ? '<ol>' : '<ul>';
```

