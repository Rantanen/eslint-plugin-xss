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
        'x = /*safe*/ "This is not <html>"',
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
    ]
} );
