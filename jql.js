var $jql = ( function() {
     "use strict";

     var _createSql, _player, _where, _utils, _storage = {};

     // argumets type : function, {}
     function $jql( $sqlFunction, $parameter ) {
          var sql = _createSql( $sqlFunction, $parameter );
          var paragraph = sql.split( " " )[ 0 ]; // select, insert, update, delete, etc..

          return _player[ paragraph + "Excute" ]( sql );
     }

     // ex) $jql.store( "A", A, "B", B );
     // A, B ( JSON Type ) => [{ name : "a", age : 20 }, { name : "b", age : 30 }]
     $jql.store = function() {
          for ( var index in arguments )
               if ( index % 2 === 1 )
                    _storage[ arguments[ index - 1 ].toLowerCase() ] = arguments[ index ];
     }

     _utils = {

     };

     _createSql = function( $sqlFunction, $parameter ) {
          var sql = $sqlFunction.toString().replace( /^[^]+\/\*\s*|\s*\*\/[^]*/g, "" ).toLowerCase();

          for ( key in $parameter )
               sql.replace( new RegExp( ":" + key, [ "g" ] ), "'" + $parameter[ key ] + "'" );

          return sql;
     };

     _player = {
          selectExcute : function( $sql ) {

          },
          insertExcute : function( $sql ) {

          },
          updateExcute : function( $sql ) {

          },
          deleteExcute : function( $sql ) {              
               var tableName = $sql.replace( /\s*delete\s+from\s+|\s+where[^]*/g, "" );
               var where = $sql.replace( /[^]+where\s+/, "" );
               var table = _storage[ tableName ];
               
               // alias 방법에 대한 설계 필요.( 따로 분리 )
               // var tableList = tableName.replace( /,/g, " " ).replace( /\s+/g, " " ).split( " " );

               if ( table == null )
                    throw new Error( "Not found table. -> " + tableName );

               return _where( table, where, deleteVisitor, null ).length;
          }
     };

     _where = function( $table, $where, $visitor, $customData ) {
          var result = [];
          var where  = $where.replace( /\s+and\s+/g, " && " ).replace( /\s+or\s+/g, " || " ).replace( /=/g, "==" );

          for ( var i = 0; i < $table.length; i++ ) {
               var row = $table[ i ];
               var isExist = where;

               for ( var col in row ) {
                    // 대입하는 정규표현식 다시 구상.( 제대로 안됨 )
                    isExist = isExist.replace( new RegExp( "\\s*" + col + "\\s*", "g" ), " '" + row[ col ] + "' " );
               }

               if ( eval( isExist ) ) {
                    result[ result.length ] = row;
                    $visitor( $table, i, $customData );
               }
          }

          return result;
     };

     function deleteVisitor( $table, $index, $customData ) {
          $table.splice( $index, 1 );
     }

     return $jql;
} )();