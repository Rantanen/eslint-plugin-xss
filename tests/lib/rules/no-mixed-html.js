/**
 * @fileoverview Checks for missing encoding when concatenating HTML strings
 * @author Mikko Rantanen
 */
'use strict';

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

var rule = require( '../../../lib/rules/no-mixed-html' ),

    RuleTester = require( 'eslint' ).RuleTester;


// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

var ruleTester = new RuleTester();
ruleTester.run( 'require-encode', rule, {

    valid: [
        'var x = text',
        'x = text',
        'obj.x = text',
        'foo( text )',
        'x.foo( text )',
        'html.foo( text )',
        {
            code: 'test.html( html )',
            options: [ { unsafe: [ '.html()' ] } ]
        },
        {
            code: '$( html )',
            options: [ { unsafe: [ '$()' ] } ]
        },
        {
            code: 'test.html( \'<img src="zwK7XG6.gif">\' )',
            options: [ { unsafe: [ '.html()' ] } ]
        },
        'var x = "a" + "b";',
        {
            code: 'var html = "<div>" + encode( foo() ) + "</div>"',
            options: [ { encoders: [ 'encode()' ] } ]
        },
        {
            code: 'var html = "<div>" + he.encode( foo() ) + "</div>"',
            options: [ { encoders: [ 'he.encode()' ] } ]
        },
        'x = text;',
        'x = "a" + "b";',
        {
            code: 'html = "<div>" + encode( foo() ) + "</div>"',
            options: [ { encoders: [ 'encode()' ] } ]
        },
        'asHtml = varHtml',
        'htmlEncode = function() {}',
        'decode = function( html ) {}',

        'htmlMapping = {}',
        'mapping = { html: "<div>" }',
        'values = [ "value" ]',
        'values = [ text ]',
        'htmlItems = [ html ].join()',
        'text = html ? "a" : "b"',
        'text = html ? foo : bar',
        'html = html ? "<div>" : "b"',
        {
            code: 'encoded = "<div>"',
            options: [ { variableNameRule: [ 'encoded' ] } ]
        },
        {
            code: 'asEncoded = "<div>"',
            options: [ { variableNameRule: [ 'encoded', 'i' ] } ]
        },

        'x = /*safe*/ "This is not <html>"',
        'text = /*safe*/ stuffAsHtml()',
        'html = /*safe*/ getElement()',
        'html = /*safe*/ getElement()',
        'x = /*safe*/ "This is not <html>" + text',
        'text = /*safe*/ stuffAsHtml() + text',
        'texttttt = /*safe*/ ( "<div>" + "</div>" )',
        'obj = { fooHtml: stuffAsHtml() }',
        'obj = { foo: stuff() }',
    ],

    invalid: [

        {
            code: 'var html = "<div>" + text + "</div>"',
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },
        {
            code: 'html = "<div>" + text + "</div>"',
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },
        {
            code: 'x.innerHTML = "<div>" + text + "</div>"',
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },
        {
            code: 'x.html( "<div>" + text + "</div>" )',
            options: [ { unsafe: [ '.html()' ] } ],
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },

        {
            code: 'var asHtml = text',
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },
        {
            code: 'asHtml = text',
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },
        {
            code: 'x.html( text )',
            options: [ { unsafe: [ '.html()' ] } ],
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },
        {
            code: 'x.innerHTML = text',
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },

        {
            code: 'var x = asHtml',
            errors: [ {
                message: 'Non-HTML variable \'x\' is used to store raw HTML',
            } ]
        },
        {
            code: 'x = asHtml',
            errors: [ {
                message: 'Non-HTML variable \'x\' is used to store raw HTML',
            } ]
        },
        {
            code: 'x( asHtml )',
            errors: [ {
                message: 'HTML passed in to function \'x()\'',
            } ]
        },
        {
            code: 'foo.x( asHtml )',
            errors: [ {
                message: 'HTML passed in to function \'foo.x()\'',
            } ]
        },

        {
            code: 'var x = obj.html',
            errors: [ {
                message: 'Non-HTML variable \'x\' is used to store raw HTML',
            } ]
        },
        {
            code: 'x = obj.html',
            errors: [ {
                message: 'Non-HTML variable \'x\' is used to store raw HTML',
            } ]
        },
        {
            code: 'x( obj.html )',
            errors: [ {
                message: 'HTML passed in to function \'x()\'',
            } ]
        },
        {
            code: 'foo.x( obj.html )',
            errors: [ {
                message: 'HTML passed in to function \'foo.x()\'',
            } ]
        },

        {
            code: 'var x = "<div>"',
            errors: [ {
                message: 'Non-HTML variable \'x\' is used to store raw HTML',
            } ]
        },
        {
            code: 'x = "<div>"',
            errors: [ {
                message: 'Non-HTML variable \'x\' is used to store raw HTML',
            } ]
        },
        {
            code: 'x( "<div>" )',
            errors: [ {
                message: 'HTML passed in to function \'x()\'',
            } ]
        },
        {
            code: 'foo.x( "<div>" )',
            errors: [ {
                message: 'HTML passed in to function \'foo.x()\'',
            } ]
        },

        {
            code: 'foo.stuff( doc.html( text ) )',
            options: [ { unsafe: [ '.html()' ] } ],
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },

        {
            code: 'obj = { html: text }',
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },
        {
            code: 'obj = [ { html: text } ]',
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },

        {
            code: 'arr = [ html ]',
            errors: [ {
                message: 'Non-HTML variable \'arr\' is used to store raw HTML',
            } ]
        },
        {
            code: 'htmlItems = [ text ]',
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },
        {
            code: 'htmlItems = [ text ].join()',
            errors: [ {
                message: 'Unencoded input \'text\' used in HTML context',
            } ]
        },
        {
            code: 'textItems = [ html ].join()',
            errors: [ {
                message: 'Non-HTML variable \'textItems\' is used to store raw HTML',
            } ]
        },

        {
            code: 'text = encode( text )',
            options: [ { encoders: [ 'encode()' ] } ],
            errors: [ {
                message: 'Non-HTML variable \'text\' is used to store raw HTML'
            } ]
        },
        {
            code: 'html = html ? foo : "text"',
            errors: [ {
                message: 'Unencoded input \'foo\' used in HTML context'
            } ]
        },
        {
            code: 'html = html ? "text" : foo',
            errors: [ {
                message: 'Unencoded input \'foo\' used in HTML context'
            } ]
        },
        {
            code: 'text = html ? "<div>" : foo',
            errors: [
                { message: 'Non-HTML variable \'text\' is used to store raw HTML' },
                { message: 'Unencoded input \'foo\' used in HTML context' },
            ]
        },
        {
            code: 'text = encode( "foo" )',
            options: [ { encoders: [ 'encode()' ] } ],
            errors: [
                { message: 'Non-HTML variable \'text\' is used to store raw HTML' }
            ]
        },
        {
            code: 'var foo = function() { return "<div>"; }',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Non-HTML function \'foo\' returns HTML content' }
            ]
        },
        {
            code: 'var foo = function bar() { return "<div>"; }',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Non-HTML function \'bar\' returns HTML content' }
            ]
        },
        {
            code: 'function bar() { return "<div>"; }',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Non-HTML function \'bar\' returns HTML content' }
            ]
        },
        {
            code: 'function bar() { return barAsHtml(); }',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Non-HTML function \'bar\' returns HTML content' }
            ]
        },
        {
            parserOptions: { ecmaVersion: 6 },
            code: 'var bar = y => "<div>"',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Non-HTML function \'bar\' returns HTML content' }
            ]
        },

        {
            code: 'var fooAsHtml = function() { return value; }',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Unencoded input \'value\' used in HTML context' }
            ]
        },
        {
            code: 'var foo = function barAsHtml() { return input; }',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Unencoded input \'input\' used in HTML context' }
            ]
        },
        {
            code: 'function barAsHtml() { return bar; }',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Unencoded input \'bar\' used in HTML context' }
            ]
        },
        {
            parserOptions: { ecmaVersion: 6 },
            code: 'var barAsHtml = y => y',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Unencoded input \'y\' used in HTML context' }
            ]
        },

        {
            code: 'var foo = fooAsHtml()',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Non-HTML variable \'foo\' is used to store raw HTML' }
            ]
        },
        {
            code: 'var html = foo()',
            options: [ { functionNameRule: [ 'AsHtml$' ] } ],
            errors: [
                { message: 'Unencoded return value from function \'foo\' used in HTML context' }
            ]
        },

        {
            code: 'x = /*safe*/ "This is not <html>" + html',
            errors: [
                { message: 'Non-HTML variable \'x\' is used to store raw HTML' }
            ]
        },
        {
            code: 'obj = { fooHtml: stuff() }',
            errors: [
                { message: 'Unencoded return value from function \'stuff\' used in HTML context' }
            ]
        },
        {
            code: 'obj = { fooHtml: obj.stuff() }',
            errors: [
                { message: 'Unencoded return value from function \'obj.stuff\' used in HTML context' }
            ]
        },
        {
            code: 'obj = { foo: stuffAsHtml() }',
            errors: [
                { message: 'Non-HTML variable \'foo\' is used to store raw HTML' }
            ]
        }
    ]
} );
