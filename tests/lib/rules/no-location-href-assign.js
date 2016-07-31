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
            code: 'location.href = escape(\'www\')',
            options: [ { escapeFunc: 'escape' } ]
        }
    ],

    invalid: [
        {
            code: 'location.href = wrapper(escape(\'www\'))',
            options: [ { escapeFunc: 'escapeXSS' } ],
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                ' Please use escapeXSS(wrapper(escape(\'www\'))) ' +
                'as a wrapper for escaping'
            } ]
        },
        {
            code: 'location.href = wrapper(\'www\')',
            options: [ { escapeFunc: 'escape' } ],
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                ' Please use escape(wrapper(\'www\')) as a wrapper for escaping'
            } ]
        },
        {
            code: 'location.href = \'some location\'',
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use escape(\'some location\') as a wrapper for escaping'
            } ]
        },
        {
            code: 'window.location.href = \'some location\'',
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use escape(\'some location\') as a wrapper for escaping'
            } ]
        },
        {
            code: 'document.location.href = \'some location\'',
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use escape(\'some location\') as a wrapper for escaping'
            } ]
        },
        {
            code: 'window.document.location.href = \'some location\'',
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use escape(\'some location\') as a wrapper for escaping'
            } ]
        },
        {
            code: 'window.document.location.href = getNextUrl()',
            errors: [ {
                message: 'Dangerous location.href assignment can lead to XSS.' +
                    ' Please use escape(getNextUrl()) as a wrapper for escaping'
            } ]
        }
    ]
} );