var $jql = ( function() {
     "use strict";

     var _createSql, _player, _where, _utils, _storage = {};

     // argumets type : ( function, {} )
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
          },
          getObjectLength : function( $object ) {
               var count = 0;

               for ( var item in $object )
                    count++;

               return count;
          },
          getColumnIndex : function( $object, $column ) {
               var index = -1;

               for ( var column in $object ) {
                    index++;
                    if ( column === $column ) return index;
               }

               return index;
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

               if ( !table ) throw new Error( "Not found table. -> " + tableName );

               return _where( table, where, deleteVisitor, null ).length;
          }
     };

     _where = function( $table, $where, $visitor, $customData ) {
          var result = [];

          var tableIterator = function( $index, $parent ) {
               this.row = $parent[ $index ];
               this.isExist = $where;

               this.foreach( this.row, rowIterator, true );

               if ( eval( this.isExist ) ) {
                    result[ result.length ] = this.row;
                    $visitor( $table, $index, $customData );
               }
          };
          var rowIterator = function( $key, $parent ) {
               this.whereList = this.isExist.replace( /'/g, ":'" ).split( ":" ); // 문자열 내부의 문자를 제외하고 컬럼을 대입하기 위함.
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
                    // 마지막에 한번만 교체 되어야 하는 문자 처리
                    if ( _utils.getObjectLength( this.row ) - 1 === _utils.getColumnIndex( this.row, this.col ) )
                         this.item = this.item.replace( /\s+and\s+/g, " && " ).replace( /\s+or\s+/g, " || " ).replace( /=/g, "==" );

                    this.quoteFlag = false;
                    this.itemList  = this.item.replace( new RegExp( this.col, "g" ), ":" + this.col + ":" ).split( ":" ); // 컬럼 문자의 앞뒤 문자를 확인 위함.

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

                    // 컬럼 문자의 앞뒤 문자가 영문자 또는 숫자가 아니어야 컬럼 문자가 포함된 문자열에 속지 않음.
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