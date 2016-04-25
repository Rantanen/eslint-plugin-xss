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

```json
"xss/no-mixed-html": [ 2, {
    "encoders": [ ... ],
    "unsafe": [ ... ]
} ];
```

`encoders` is a string-array of different encoding functions. This is used to
figure out what strings are correctly encoded and what aren't. All encoders are
expected to be statically available.

Example: `"encoders": [ "utils.encode()", "Number()" ]`

`unsafe` are functions that read HTML input. Since we cannot validate the
object types in member functions, these are specified without one.

Example: `"unsafe": [ ".html()" ]`

## When Not To Use It

If you are creating a Node.js application that doesn't output any HTML, you can
safely disable this rule.

## Further Reading

- [XSS Prevention CHeat Sheet - OWASP](https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet)
