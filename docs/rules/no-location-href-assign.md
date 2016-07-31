# Checks for all assignments to location.href (prevents javascript url based XSS)

Wanted a way to catch XSS issues in code before they end up in production.

## Rule Details

This rule tries to prevent XSS that can be created by passing user input directly to
location.href property. Here is an example of how we can execute any js code in that way;

```js
window.location.href = 'javascript:alert('xss')'
```


The following patterns are considered warnings:

```js

window.location.href = 'some evil user content';
document.location.href = 'some evil user content';
location.href = 'some evil user content';
location.href = getNextUrl();

```

The following patterns are not warnings:

```js
// this rule ensures that you are calling escape function before location.href assignment
// 'escape' name can be configured via options.
location.href = escape('some evil url');

```

### Options

```js
"xss/no-mixed-html": [ 2, {
    "escapeFunc": "escape"
} ];
```

### escapeFunc (optional)
Function name that is used to sanitize user input. 'escape' is used by default.


## When Not To Use It

If you are not care about XSS vulnerabilities.

## Further Reading

- [XSS Prevention CHeat Sheet - OWASP](https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet)
