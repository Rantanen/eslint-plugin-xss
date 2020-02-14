# Checks for missing encoding when concatenating HTML strings (require-encode)

Wanted a way to catch XSS issues in code before they end up in production.

## Rule Details

This rule aims to catch as many XSS issues by examining the code as possible.
The rule checks for mixed html/non-html content, unescaped input, etc.

The following patterns are considered warnings:

```js

// Mixed content
var x = '<div>' + input + '</div>';
$node.html( '<div>' + input + '</div>' );

// Unsafe container names.
var html = input;
var text = htmlInput;
displayValue( htmlInput );

// Checking certain expression parameters that might end up in the variables.
var htmlItems = [ input1, input2 ].join();
var textItems = [ '<div>', input, '</div>' ].join();
var tag = isNumbered ? '<ol>' : '<ul>';

// Checking function return values.
var createHtml = function( item ) { return item.name; }
var createBox = function( item ) { return '<div>' + encode( item ) + '</div>' }

```

The following patterns are not warnings:

```js

// Proper encoding
var html = '<div>' + encode( input ) + '</div>';
$node.html( '<div>' + encode( input ) + '</div>' );

// Proper container names
var html = '<img src="happy.png">';
var text = textbox.value;

```

### Options

```js
"xss/no-mixed-html": [ 2, {
    "htmlVariableRules": [ "AsHtml", "HtmlEncoded/i", "^html$" ],
    "htmlFunctionRules": [ ".asHtml/i", "toHtml" ],
    "functions": {
        "$": {
            "htmlInput": true,
            "safe": [ "document", "this" ]
        },
        ".html": {
            "htmlInput": true,
            "htmlOutput": true
        },
        ".join": {
            "passthrough": { "obj": true, "args": true }
        }
    }
} ];
```

#### `htmlVariableRules`, `htmlFunctionRules`

`htmlVariableRules` and `htmlFunctionRules` specify the naming convention used
for storing HTML variables and defining functions returnign HTML values. Both
of these options are defined as Regex-arrays. The regex options, such as case
insensitive matching can be defined with a delimiting '/'.

##### Examples

```js
"htmlVariableRules": [
    "AsHtml",  // Matches fooAsHtml, barAsHtmlValue. Doesn't match: myHTML.
    "HtmlEncoded/i", // Matches htmlEncoded, HTMLEncodedValue
    "^html$", // Matches html
],
"htmlFunctionRules": [
    ".asHtml/i",  // Matches foo.asHTML(), doesn't match asHtml()
    "toHtml",  // Matches toHtml( txt ), doesn't match value.toHtml()
]
````

#### `functions`

`functions` specify special rules for certain functions.

- `htmlInput` makes the function require HTML input. By default calling a
  function with HTML input will yield a warning. Specifying `htmlInput` option
  on the function will yield a warning when the function is used with unencoded
  input.
- Functions with `htmlOutput` defined are considered to return HTML output.
  Mixing this with unencoded values or storing it in non-HTML variables will
  yield a warning. Also functions that match `htmlFunctionRules` are considered
  to return HTML output in the same way.
- `passthrough` defines which parameters of a function are passed through as
  such. This can be used to specify functions like `Array.join`. Passthrough
  functions won't perform any checking on their own, instead the checks depend
  on where the parameter values are used in.
- `safe` can be used to disable warnings for certain parameters for the
  functions. The jQuery function `$()` is often used with HTML or CSS input,
  which should be encoded - but it may also be used to construct jQuery-lists
  from DOM elements - the two most common usages being: `$( document )` and `$(
  this )`. The value should be either `true`/`false` for blanket safety or an
  array of accepted variable names.


## When Not To Use It

If you are creating a Node.js application that doesn't output any HTML, you can
safely disable this rule.

## Further Reading

- [XSS Prevention CHeat Sheet - OWASP](https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet)
