
'use strict';

module.exports = {

    toRegexp: function( str ) {
        var pair = str.split( '/' );
        return new RegExp( pair[ 0 ], pair[ 1 ] );
    },

    any: function( input, regexps ) {

        for( var i = 0; i < regexps.length; i++ ) {
            if( regexps[ i ].exec( input ) )
                return true;
        }

        return false;
    },
};
