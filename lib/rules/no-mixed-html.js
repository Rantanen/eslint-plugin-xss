/**
 * @fileoverview Checks for missing encoding when concatenating HTML strings
 * @author Mikko Rantanen
 */
'use strict';

// -----------------------------------------------------------------------------
// Rule Definition
// -----------------------------------------------------------------------------

module.exports = function( context ) {

    // Default options.
    var encoders = [];
    var unsafeFunctions = [];
    var variableNameRule = [ 'html', 'i' ];
    var functionNameRule = [ 'AsHtml', '' ];

    // Read the user specified options.
    if( context.options.length > 0 ) {
        encoders = context.options[ 0 ].encoders || [];
        unsafeFunctions = context.options[ 0 ].unsafe || [];
        variableNameRule = context.options[ 0 ].variableNameRule || variableNameRule;
        functionNameRule = context.options[ 0 ].functionNameRule || functionNameRule;
    }

    // Remove the final () from the function anmes.
    encoders = encoders.map( e => e.replace( /\(\)$/, '' ) );
    unsafeFunctions = unsafeFunctions.map( e => e.replace( /\(\)$/, '' ) );

    // Turn the name rules from string/string array to regexp.
    variableNameRule = new RegExp( variableNameRule[ 0 ], variableNameRule[ 1 ] );
    functionNameRule = new RegExp( functionNameRule[ 0 ], functionNameRule[ 1 ] );

    // Expression stack for tracking the topmost expression that is marked
    // XSS-candidate when we find '<html>' strings.
    var exprStack = [];

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------


    /**
     * Checks whether the node represents an array join.
     *
     * @param {Node} node - Node to check.
     *
     * @returns {bool} - True, if the node is an array join.
     */
    var isJoin = function( node ) {
        return node.type === 'CallExpression' &&
                node.callee.type === 'MemberExpression' &&
                node.callee.property.type === 'Identifier' &&
                node.callee.property.name === 'join' &&
                node.callee.object.type === 'ArrayExpression';
    };

    /**
     * Gets all descendants that we know to affect the possible output string.
     *
     * @params {Node} node - Node for which to get the descendants. Inclusive.
     *
     * @returns {Node[]} - Flat list of descendant nodes.
     */
    var getDescendants = function( node, _children ) {

        // The children array may be passed during recursion.
        if( _children === undefined )
            _children = [];

        // Handle the special case of .join() function.
        if( isJoin( node ) ) {

            // Get the descedants from the array and the function argument.
            getDescendants( node.callee.object, _children );
            node.arguments.forEach( function( a ) {
                getDescendants( a, _children );
            } );

            return _children;
        }

        // Check the expression type.
        if( node.type === 'CallExpression' ||
            node.type === 'NewExpression' ||
            node.type === 'ThisExpression' ||
            node.type === 'ObjectExpression' ||
            node.type === 'FunctionExpression' ||
            node.type === 'UnaryExpression' ||
            node.type === 'UpdateExpression' ||
            node.type === 'MemberExpression' ||
            node.type === 'SequenceExpression' ||
            node.type === 'Literal' ||
            node.type === 'Identifier'
        ) {

            // Basic expressions that won't be reflected further.
            _children.push( node );

        } else if( node.type === 'ArrayExpression' ) {

            // For array nodes, get the descendant nodes.
            node.elements.forEach( function( e ) {
                getDescendants( e, _children );
            } );

        } else if( node.type === 'BinaryExpression' ) {

            // Binary expressions concatenate strings.
            //
            // Recurse to both left and right side.
            getDescendants( node.left, _children );
            getDescendants( node.right, _children );

        } else if( node.type === 'AssignmentExpression' ) {

            // There might be assignment expressions in the middle of the node.
            // Use the assignment identifier as the descendant.
            //
            // The assignment itself will be checked with its own descendants
            // check.
            getDescendants( node.left, _children );

        } else if( node.type === 'ConditionalExpression' ) {

            getDescendants( node.alternate, _children );
            getDescendants( node.consequent, _children );
        }

        return _children;
    };

    /**
     * Checks whether the node is safe for XSS attacks.
     *
     * @params {Node} node - Node to check.
     */
    var isXssSafe = function( node ) {

        // See if the item is commented to be safe.
        if( isCommentedSafe( node ) )
            return true;

        // Literal nodes and function expressions are okay.
        if( node.type === 'Literal' ||
            node.type === 'FunctionExpression' ) {
            return true;
        }

        // Identifiers and member expressions are okay if they resolve to an
        // HTML name.
        if( node.type === 'Identifier' ||
            node.type === 'MemberExpression' ) {

            // isHtmlVariable handles both Identifiers and member expressions.
            return isHtmlVariable( node );
        }

        // Encode calls are okay.
        if( node.type === 'CallExpression' ) {

            return isKnownHtmlFunction( node.callee );
        }

        // Assume unsafe.
        return false;
    };

    /**
     * Check for whether the function identifier refers to an encoding function.
     *
     * @param {Identifier} ref - Function identifier to check.
     *
     * @returns {bool} True, if the function is an encoding function.
     */
    var isKnownHtmlFunction = function( ref ) {

        // Resolve the name stack from the member expression.
        // This gathers it in reverse.
        var name = [];
        while( ref.type === 'MemberExpression' ) {
            name.push( ref.property.name );
            ref = ref.object;
        }

        // Ensure the last object name is an identifier at this point.
        // We don't support [] indexed access for encoders.
        if( ref.type === 'Identifier' )
            name.push( ref.name );

        // Reverse the stack to get it in correct order and join functio names
        // using '.'
        name.reverse();
        name = name.join( '.' );

        return encoders.indexOf( name ) !== -1 || functionNameRule.exec( name );
    };

    /**
     * Checks whether the function uses raw HTML input.
     *
     * @param {Identifier} func - Function identifier to check.
     *
     * @returns {bool} True, if the function is unsafe.
     */
    var functionAcceptsHtml = function( func ) {

        // Unwrap the member expressions and get the last identifier.
        var isMember = func.type === 'MemberExpression';
        var node = getIdentifier( func );
        if( !node ) return;

        var funcName = ( isMember ? '.' : '' ) + node.name;

        return unsafeFunctions.indexOf( funcName ) !== -1;
    };

    /**
     * Checks whether the node-tree contains XSS-safe data
     *
     * Reports error to ESLint.
     *
     * @param {Node} node - Root node to check.
     */
    var checkForXss = function( node ) {

        // Skip functions.
        // This stops the following from giving errors:
        // > htmlEncoder = function() {}
        if( node.type === 'FunctionExpression' ||
            node.type === 'ObjectExpression' )
            return;

        // Get the descendants.
        var nodes = getDescendants( node );

        // Check each descendant.
        nodes.forEach( function( childNode ) {

            // Node is okay, if it is safe.
            if( isXssSafe( childNode ) ) {
                return;
            }

            // Node wasn't deemed okay. Report error.
            var msg = 'Unencoded input \'{{ identifier }}\' used in HTML context';
            if( childNode.type === 'CallExpression' ) {
                msg = 'Unencoded return value from function \'{{ identifier }}\' ' +
                        'used in HTML context';
                childNode = childNode.callee;
            }

            context.report( {
                node: childNode,
                message: msg,
                data: {
                    identifier: context.getSource( childNode )
                }
            } );
        } );
    };

    /**
     * Checks whether the node uses HTML.
     *
     * @param {Node} node - Node to check.
     *
     * @returns {bool} True, if the node uses HTML.
     */
    var usesHtml = function( node ) {

        // Check the node type.
        if( node.type === 'CallExpression' ) {

            // Check the valid call expression callees.
            return functionAcceptsHtml( node.callee );

        } else if( node.type === 'AssignmentExpression' ) {

            // Assignment operator.
            // x = y
            // HTML-name on the left indicates html expression.
            return isHtmlVariable( node.left );

        } else if( node.type === 'VariableDeclarator' ) {

            // Variable declaration.
            // var x = y
            // HTML-name as the variable name indicates html expression.
            return isHtmlVariable( node.id );

        } else if( node.type === 'Property' ) {

            // Property declaration.
            // x: y
            // HTML-name as the key indicates html property.
            return isHtmlVariable( node.key );

        } else if( node.type === 'ArrayExpression' ) {

            // Array expression.
            // [ a, b, c ]
            return usesHtml( node.parent );

        } else if( node.type === 'ReturnStatement' ) {

            // Return statement.
            let func = getParentFunctionIdentifier( node );
            if( !func ) return false;

            return isHtmlFunction( func );

        } else if( node.type === 'ArrowFunctionExpression' ) {

            // Return statement.
            let func = getParentFunctionIdentifier( node );
            if( !func ) return false;

            return isHtmlFunction( func );
        }

        return false;
    };

    var getParentFunctionIdentifier = function( node ) {

        // We'll want to get the closest function.
        var func = node;
        while( func &&
            func.type !== 'FunctionExpression' &&
            func.type !== 'FunctionDeclaration' &&
            func.type !== 'ArrowFunctionExpression' ) {

            // Continue getting the parent.
            func = func.parent;
        }

        // If the function is named, return the function name.
        if( func.id )
            return func.id;

        // Otherwise see if it is being assigned to a variable.
        var parent = func.parent;
        if( parent && parent.type === 'VariableDeclarator' )
            return parent.id;
        if( parent && parent.type === 'AssignmentExpression' )
            return parent.left;

        return null;
    };

    /**
     * Checks whether the node meets the criteria of storing HTML content.
     *
     * Reports error to ESLint.
     *
     * @param {Node} node - The node to check.
     */
    var checkHtmlVariable = function( node ) {

        var msg = 'Non-HTML variable \'{{ identifier }}\' is used to store raw HTML';
        if( !isXssSafe( node ) ) {
            context.report( {
                node: node,
                message: msg,
                data: {
                    identifier: context.getSource( node )
                }
            } );
        }
    };

    /**
     * Checks whether the node meets the criteria of storing HTML content.
     *
     * Reports error to ESLint.
     *
     * @param {Node} node - The node to check.
     */
    var checkHtmlFunction = function( node, fault ) {

        var msg = 'Non-HTML function \'{{ identifier }}\' returns HTML content';
        if( !isXssSafe( node ) ) {
            context.report( {
                node: fault,
                message: msg,
                data: {
                    identifier: context.getSource( node )
                }
            } );
        }
    };

    /**
     * Checks whether the node meets the criteria of storing HTML content.
     *
     * Reports error to ESLint.
     *
     * @param {Node} node - The node to check.
     */
    var checkFunctionAcceptsHtml = function( node ) {

        if( !functionAcceptsHtml( node ) ) {
            context.report( {
                node: node,
                message: 'HTML passed in to function \'{{ identifier }}()\'',
                data: {
                    identifier: context.getSource( node )
                }
            } );
        }
    };

    /**
     * Gets the identifier from the node.
     *
     * @params {Node} node - Node to get the identifier for.
     *
     * @returns {Identifier} - The identifier node.
     */
    var getIdentifier = function( node ) {

        // Get the member property.
        if( node.type === 'MemberExpression' )
            node = node.property;

        if( node.type !== 'Identifier' )
            return null;

        return node;
    };

    /**
     * Checks whether the node name matches the variable naming rule.
     *
     * @param {Node} node - Node to check
     *
     * @returns {bool} True, if the node matches HTML variable naming.
     */
    var isHtmlVariable = function( node ) {

        // Ensure we can get the identifier.
        node = getIdentifier( node );
        if( !node ) return false;

        // Make the check against the variableNameRule regexp.
        return variableNameRule.exec( node.name );
    };

    /**
     * Checks whether the node name matches the function naming rule.
     *
     * @param {Node} node - Node to check
     *
     * @returns {bool} True, if the node matches HTML function naming.
     */
    var isHtmlFunction = function( node ) {

        // Ensure we can get the identifier.
        node = getIdentifier( node );
        if( !node ) return false;

        // Make the check against the function naming rule.
        return functionNameRule.exec( node.name );
    };

    var isParameter = function( node, expr ) {

        if( expr.type === 'CallExpression' ) {

            // Check whether any of the call arguments equals the node.
            var isParameter = false;
            expr.arguments.forEach( function( a ) {
                if( a === node )
                    isParameter = true;
            } );

            // Return the result.
            return isParameter;

        } else if( expr.type === 'AssignmentExpression' ) {

            // Assignments count the right side as the paramter.
            return expr.right === node;

        } else if( expr.type === 'VariableDeclarator' ) {

            // Declaration count the init expression as the paramter.
            return expr.init === node;

        } else if( expr.type === 'Property' ) {

            // Properties consider the property value as the parameter.
            return expr.value === node;

        } else if( expr.type === 'ArrayExpression' ) {

            // For arrays check whether the node is any of the elements.
            var isElement = false;
            expr.elements.forEach( function( e ) {
                if( e === node )
                    isElement = true;
            } );
            return isElement;

        } else if( expr.type === 'FunctionExpression' ) {

            // Function expression has no 'parameters'.
            // None of the fields end up directly into the HTML (that we know
            // of without solving the halting problem...)
            return false;

        } else if( expr.type === 'ConditionalExpression' ) {

            return node === expr.alternate || node === expr.consequent;
        }

        return true;
    };

    /**
     * Checks whether the current node may infect the stack with XSS.
     *
     * @param {Node} node - Current node.
     *
     * @returns {bool} True, if the node can infect the stack.
     */
    var canInfectXss = function( node ) {

        // If we got nothing in the stack, there's nothing to infect.
        if( exprStack.length === 0 )
            return false;

        // Ensure the node to check is used as part of a 'parameter chain' from
        // the top stack node.
        //
        // This 'parameter chain' is the group of nodes that directly affect the
        // node result. It ignores things like function expression argument
        // lists and bodies, etc.
        //
        // We don't want to trigger xss checks in case the identifier
        // is the parent object of a function call expression for
        // example:
        // > html.encode( text )
        var top = exprStack[ exprStack.length - 1 ].node;
        var parent = node;
        do {
            var child = parent;
            parent = parent.parent;

            if( !isParameter( child, parent ) ) {
                return false;
            }

        } while( parent !== top );

        // Assume true.
        return true;
    };

    var pushNode = function( node ) {

        // Skip the array.join(). It behaves closer to BinaryExpression.
        if( isJoin( node ) )
            return;

        exprStack.push( { node: node } );
    };
    var exitNode = function( node ) {

        // Skip the array.join(). It behaves closer to BinaryExpression.
        if( isJoin( node ) )
            return;

        var expr = exprStack.pop();
        if( !expr.xss && !usesHtml( expr.node ) )
            return;

        if( expr.node.type === 'CallExpression' ) {

            checkFunctionAcceptsHtml( expr.node.callee );

            expr.node.arguments.forEach( function( a ) {
                checkForXss( a );
            } );

        } else if( expr.node.type === 'AssignmentExpression' ) {

            checkHtmlVariable( expr.node.left );
            checkForXss( expr.node.right );

        } else if( expr.node.type === 'VariableDeclarator' ) {

            checkHtmlVariable( expr.node.id );
            if( expr.node.init )
                checkForXss( expr.node.init );

        } else if( expr.node.type === 'Property' ) {

            checkHtmlVariable( expr.node.key );
            checkForXss( expr.node.value );

        } else if( expr.node.type === 'ReturnStatement' ) {

            // Get the closest function scope.
            let func = getParentFunctionIdentifier( node );
            if( !func ) return false;

            checkHtmlFunction( func, node );
            checkForXss( expr.node.argument );

        } else if( expr.node.type === 'ArrowFunctionExpression' ) {

            // Get the closest function scope.
            let func = getParentFunctionIdentifier( node );
            if( !func ) return false;

            checkHtmlFunction( func, func );
            checkForXss( expr.node.body );
        }
    };

    var markParentXSS = function() {

        // Ensure the current node is XSS candidate.
        var expr = exprStack.pop();
        if( !expr.xss && !usesHtml( expr.node ) )
            return;

        // Mark the parent element as XSS candidate.
        if( exprStack.length > 0 ) {
            exprStack[ exprStack.length - 1 ].xss = true;
        }
    };

    /**
     * Checks whether the given node is commented to be safe from HTML.
     */
    var isCommentedSafe = function( node ) {

        while( node && (
            node.type === 'Identifier' ||
            node.type === 'Literal' ||
            node.type === 'CallExpression' ||
            node.type === 'BinaryExpression' ) ) {

            if( nodeHasSafeComment( node ) )
                return true;

            node = getCommentParent( node );
        }

        return false;
    };

    /**
     * Gets a parent node that might have a comment that is seemingly
     * attached to the current node.
     *
     * This might differ from normal parent node in cases where the
     * physical location of the node isn't at the start of the parent:
     *
     * /comment/ a + b
     *
     * Here the comment is attached to the binary expression node 'a+b' instead
     * of the a 'a' identifier node.
     *
     * However 'a' should still be considered commented - but 'b' isn't.
     *
     * However this function also handles situation such as
     * /comment/ ( a + b )
     * Where this
     */
    var getCommentParent = function( node ) {

        var parent = node.parent;
        if( !parent ) return parent;

        // Call expressions don't cause comment inheritance:
        // /comment/ foo( unsafe() )
        //
        // Shouldn't equal:
        // foo( /comment/ unsafe() )
        if( parent.type === 'CallExpression' )
            return null;

        // Binary expressions are a bit confusing when it comes to comment
        // parenting. /comment/ x + y belongs to the binary expression instead
        // of 'x'.
        if( parent.type === 'BinaryExpression' ) {

            // If the node is left side of binary expression, return parent no
            // matter what.
            if( node === parent.left )
                return parent;

            // Get the closest parenthesized binary expression.
            while( parent &&
                    parent.type === 'BinaryExpression' &&
                    !hasParentheses( parent ) ) {

                parent = parent.parent;
            }

            if( parent && parent.type === 'BinaryExpression' )
                return parent;

            return null;
        }

        return parent;
    };

    /**
     * Checks whether the node is surrounded by parentheses.
     */
    var hasParentheses = function( node ) {
        var prevToken = context.getTokenBefore( node );

        return ( prevToken.type === 'Punctuator' && prevToken.value === '(' );
    };

    /**
     * Checks whether the given node is commented to be safe from HTML.
     *
     * @param {Node} node - Node to check.
     */
    var nodeHasSafeComment = function( node ) {

        // Check all the comments in front of the node for comment 'safe'
        var isSafe = false;
        var comments = context.getSourceCode().getComments( node );
        comments.leading.forEach( function( comment ) {
            if( /^\s*safe\s*$/i.exec( comment.value ) )
                isSafe = true;
        } );

        return isSafe;
    };

    var infectParentConditional = function( condition, node ) {

        if( exprStack.length > 0 &&
            !isCommentedSafe( node ) &&
            canInfectXss( node ) &&
            condition( node ) ) {

            exprStack[ exprStack.length - 1 ].xss = true;
        }
    };

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    return {

        'AssignmentExpression': pushNode,
        'AssignmentExpression:exit': exitNode,
        'VariableDeclarator': pushNode,
        'VariableDeclarator:exit': exitNode,
        'Property': pushNode,
        'Property:exit': exitNode,
        'ReturnStatement': pushNode,
        'ReturnStatement:exit': exitNode,
        'ArrowFunctionExpression': pushNode,
        'ArrowFunctionExpression:exit': exitNode,
        'ArrayExpression': pushNode,
        'ArrayExpression:exit': markParentXSS,

        // Call expressions have a dual nature. They can either infect their
        // parents with XSS vulnerabilities or then they can suffer from them.
        'CallExpression': function( node ) {

            // First check whether this expression marks the parent as dirty.
            infectParentConditional( function( node ) {
                return isKnownHtmlFunction( node.callee );
            }, node );
            pushNode( node );
        },
        'CallExpression:exit': exitNode,

        // Literals infect parents if they contain <html> tags or fragments.
        'Literal': infectParentConditional.bind( null, function( node ) {
            return /<\/?[a-z]/.exec( node.value ) && !isCommentedSafe( node );
        } ),

        // Identifiers infect parents if they refer to HTML in their name.
        'Identifier': infectParentConditional.bind( null, function( node ) {
            return isHtmlVariable( node );
        } ),
    };
};

module.exports.schema = [
    {
        type: 'object',
        properties: {
            encoders: { type: 'array' },
            unsafe: { type: 'array' },
            variableNameRule: { type: 'array' },
            functionNameRule: { type: 'array' },
        },
        additionalProperties: false
    }
];
