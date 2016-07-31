/**
 * @fileoverview prevents xss by assignment to location href javascript url string
 * @author Alexander Mostovenko
 */
'use strict';


// ------------------------------------------------------------------------------
// Plugin Definition
// ------------------------------------------------------------------------------

var ERROR = 'Dangerous location.href assignment can lead to XSS';

module.exports = {
    meta: {
        docs: {
            description: 'disallow location.href assignment (prevent possible XSS)'
        },
    },
    create: function( context ) {
        var escapeFunc = context.options[ 0 ] &&
            context.options[ 0 ].escapeFunc || 'escape';

        return {
            AssignmentExpression: function( node ) {
                var left = node.left;
                var isHref = left.property && left.property.name === 'href';
                if( !isHref ) {
                    return;
                }
                var isLocationObject = left.object && left.object.name === 'location';
                var isLocationProperty = left.object.property &&
					left.object.property.name === 'location';

                if( !( isLocationObject || isLocationProperty ) ) {
                    return;
                }

                if( node.right.callee && node.right.callee.name === escapeFunc ) {
                    return;
                }
                var sourceCode = context.getSourceCode();
                var rightSource = sourceCode.getText( node.right );
                var errorMsg = ERROR +
                    '. Please use ' + escapeFunc +
                    '(' + rightSource + ') as a wrapper for escaping';

                context.report( { node: node, message: errorMsg } );
            }
        };
    }
};


