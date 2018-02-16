# Checks for all assignments to location.href

This rule ensures that you are calling escape logic before assigning to location.href property.

## Rule Details

This rule tries to prevent XSS that can be created by assigning some user input directly to
location.href property. Here is an example of how we can execute any js code in that way;

```js
window.location.href = 'javascript:alert("xss")'
```


The following patterns are considered as errors:

```js

window.location.href = 'some evil user content';
document.location.href = 'some evil user content';
location.href = 'some evil user content';
location.href = getNextUrl();

```

The following patterns are not errors:

```js
// this rule ensures that you are calling escape function before location.href assignment
// 'escape' name can be configured via options.
location.href = escape('some evil url');

```
The concrete implementation of escape is up to you and how you will decide to escape location.href value. This rule
only ensures that you are handling assignment in a proper way (by wrapping the right part with the escape function).

### Options

```js
"xss/no-location-href-assign": [ 2, {
    "escapeFunc": "escapeHref"
} ];
```

### escapeFunc (optional)
Function name that is used to sanitize user input. 'escape' is used by default.


## When Not To Use It

When you are running your code outside of browser environment (node) or you don't care about XSS vulnerabilities.

## Further Reading

- [XSS Prevention CHeat Sheet - OWASP](https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet)
