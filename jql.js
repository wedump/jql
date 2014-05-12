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

               if ( !table ) throw new Error( "Not found table. -> " + tableName );

               return _where( table, where, deleteVisitor, null ).length;
          }
     };

     // like, in, not in, is null, is not null, exists, not exists 처리 필요                    
     _where = function( $table, $where, $visitor, $customData ) {
          var result = [];
          var where  = $where.replace( /\s+and\s+/g, " && " ).replace( /\s+or\s+/g, " || " ).replace( /=/g, "==" );

          for ( var i = 0; i < $table.length; i++ ) {
               var row = $table[ i ];
               var isExist = where;

               for ( var col in row ) {
                    var whereList = isExist.replace( /'/g, ":'" ).split( ":" );
                    var quoteFlag = false;
                    
                    for ( var j = 0; j < whereList.length; j++ ) {
                         var item = whereList[ j ], itemList;

                         if ( item.indexOf( "'" ) > -1 && !quoteFlag ) {
                              quoteFlag = true;
                              continue;
                         }

                         quoteFlag = false;
                         itemList  = item.replace( new RegExp( col, "g" ), ":" + col + ":" ).split( ":" );

                         for ( var k = 0; k < itemList.length; k++ ) {
                              var subItem = itemList[ k ];
                              var preSubItem  = itemList[ k - 1 ];
                              var postSubItem = itemList[ k + 1 ];

                              if ( subItem === col ) {
                                   var preChar  = preSubItem.substr( preSubItem.length - 1, preSubItem.length );
                                   var postChar = postSubItem.substr( 0, 1 );

                                   if ( ( /\W/.test( preChar ) || !preChar ) && ( /\W/.test( postChar ) || !postChar ) )
                                        itemList[ k ] = "'" + row[ col ] + "'";
                              }
                         }

                         whereList[ j ] = itemList.join( "" );
                    }

                    isExist = whereList.join( "" );
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