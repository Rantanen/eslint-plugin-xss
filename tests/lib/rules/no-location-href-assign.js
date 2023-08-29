/**
 * @fileoverview checks rule that prevents xss by assignment
 * to location href javascript url string
 * @author Alexander Mostovenko
 */
'use strict';

var rule = require( '../../../lib/rules/no-location-href-assign' ),
    RuleTester = require( 'eslint' ).RuleTester;

var ruleTester = new RuleTester();
ruleTester.run( 'no-location-href-assign', rule, {

    valid: [
        'someLink.href = \'www\'',
        'href = \'wwww\'',
        {
            code: 'location.href = encodeURI(\'www\')',
            options: [ { escapeFunc: 'encodeURI' } ]
        },
        {
            code: 'location.href = DOMPurify.sanitize(\'www\')',
            options: [ { escapeFunc: 'DOMPurify.sanitize' } ]
        }
    ],

    invalid: [
        {
            code: 'location.href = wrapper(encodeURI(\'www\'))',
            options: [ { escapeFunc: 'escapeXSS' } ],
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                ' Please use escapeXSS(wrapper(encodeURI(\'www\'))) ' +
                'as a wrapper for escaping'
            } ]
        },
        {
            code: 'location.href = wrapper(\'www\')',
            options: [ { escapeFunc: 'encodeURI' } ],
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                ' Please use encodeURI(wrapper(\'www\')) as a wrapper for escaping'
            } ]
        },
        {
            code: 'location.href = \'some location\'',
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use encodeURI(\'some location\') as a wrapper for escaping'
            } ]
        },
        {
            code: 'location.href = \'some location for memberExpression callee\'',
            options: [ { escapeFunc: 'DOMPurify.sanitize' } ],
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use DOMPurify.sanitize(\'some location for memberExpression callee\') as a wrapper for escaping'
            } ]
        },
        {
            code: 'window.location.href = \'some location\'',
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use encodeURI(\'some location\') as a wrapper for escaping'
            } ]
        },
        {
            code: 'document.location.href = \'some location\'',
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use encodeURI(\'some location\') as a wrapper for escaping'
            } ]
        },
        {
            code: 'window.document.location.href = \'some location\'',
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use encodeURI(\'some location\') as a wrapper for escaping'
            } ]
        },
        {
            code: 'window.document.location.href = getNextUrl()',
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use encodeURI(getNextUrl()) as a wrapper for escaping'
            } ]
        }
    ]
} );
