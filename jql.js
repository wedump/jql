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
          foreach : function( $roof, $nextFunction, $excuteContext, $keyFlag ) {
               if ( $keyFlag ) {
                    for ( var key in $roof )
                         $nextFunction.apply( $excuteContext, [ key, $roof ] );
               } else {
                    for ( var i = 0; i < $roof.length; i++ )
                         $nextFunction.apply( $excuteContext, [ i, $roof ] );
               }
          }
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
               
               // * alias 방법에 대한 설계 필요.( 따로 분리 )
               // * var tableList = tableName.replace( /,/g, " " ).replace( /\s+/g, " " ).split( " " );

               if ( !table ) throw new Error( "Not found table. -> " + tableName );

               return _where( table, where, deleteVisitor, null ).length;
          }
     };

     // * like, in, not in, is null, is not null, exists, not exists 처리 필요
     // * '''' 이스케이프 처리
     _where = function( $table, $where, $visitor, $customData ) {
          var result = [];
          var where  = $where.replace( /\s+and\s+/g, " && " ).replace( /\s+or\s+/g, " || " ).replace( /=/g, "==" );

          var tableIterator = function( $index, $parent ) {
               this.row = $parent[ $index ];
               this.isExist = where;

               this.foreach( this.row, rowIterator, true );

               if ( eval( this.isExist ) ) {
                    result[ result.length ] = this.row;
                    $visitor( $table, $index, $customData );
               }
          };
          var rowIterator = function( $key, $parent ) {
               this.whereList = this.isExist.replace( /'/g, ":'" ).split( ":" );
               this.quoteFlag = false;
               this.col = $key;

               this.foreach( this.whereList, whereIterator );

               this.isExist = this.whereList.join( "" );
          };
          var whereIterator = function( $index, $parent ) {
               this.item = $parent[ $index ];
               this.itemList;

               if ( this.item.indexOf( "'" ) > -1 && !this.quoteFlag ) {
                    this.quoteFlag = true;
               } else {
                    this.quoteFlag = false;
                    this.itemList  = this.item.replace( new RegExp( this.col, "g" ), ":" + this.col + ":" ).split( ":" );

                    this.foreach( this.itemList, this.lastFunction );

                    $parent[ $index ] = this.itemList.join( "" );
               }
          };

          _utils.foreach( $table, tableIterator, new Iterator( function( $index, $parent ) {
               var subItem = $parent[ $index ];
               var preSubItem  = $parent[ $index - 1 ];
               var postSubItem = $parent[ $index + 1 ];

               if ( subItem === this.col ) {
                    var preChar  = preSubItem.substr( preSubItem.length - 1, preSubItem.length );
                    var postChar = postSubItem.substr( 0, 1 );

                    if ( ( /\W/.test( preChar ) || !preChar ) && ( /\W/.test( postChar ) || !postChar ) )
                         $parent[ $index ] = "'" + this.row[ this.col ] + "'";
               }
          } ) );

          return result;
     };

     function Iterator( $lastFunction ) {
          this.lastFunction = $lastFunction;
     }

     Iterator.prototype.foreach = function( $roof, $nextFunction, $keyFlag ) {
          _utils.foreach( $roof, $nextFunction, this, $keyFlag );
     };

     function deleteVisitor( $table, $index, $customData ) {
          $table.splice( $index, 1 );
     }

     return $jql;
} )();