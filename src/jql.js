var $jql = ( function() {
     "use strict";

     var _core, _utils, _player, _storage = {};

     // argumets type : ( function, {} )
     function $jql( $sqlFunction, $parameter ) {
          var sql = _core.createSql( $sqlFunction, $parameter );
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

               for ( var item in $object ) count++;

               return count;
          },
          getColumnIndex : function( $object, $column ) {
               var index = -1;

               for ( var column in $object ) {
                    index++;
                    if ( column === $column ) return index;
               }

               return index;
          },
          // 문자열에서 순수단어만을 찾아 치환
          // 치환을 원하는 단어 : "as", "12as" -> X, "paas" -> X, "substr( name, 3 )as A" -> O
          replacePureWord : function( $target, $searchWord, $division ) {
               var replaceWord = $division + $searchWord + $division;
               var targetSplit = $target.replace( new RegExp( $searchWord, "g" ), replaceWord ).split( $division );

               for ( var i = 0; i < targetSplit.length; i++ ) {
                    var item     = targetSplit[ i ];                  
                    var preItem  = targetSplit[ i - 1 ];
                    var postItem = targetSplit[ i + 1 ];

                    if ( item === $searchWord ) {
                         var preChar  = preItem.substr( preItem.length - 1, preItem.length );
                         var postChar = postItem.substr( 0, 1 );
                         
                         if ( ( /\W/.test( preChar ) || !preChar ) && ( /\W/.test( postChar ) || !postChar ) )
                              targetSplit[ i ] = replaceWord;
                    }
               }

               return targetSplit.join( "" );
          }
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
               var table = _storage[ _core.alias( tableName ).tableName ];

               if ( !table ) throw new Error( "Not found table. -> " + tableName );

               return _core.where( table, where, deleteVisitor, null ).length;
          }
     };

     _core = {
          createSql : function( $sqlFunction, $parameter ) {
               var sql = $sqlFunction.toString().replace( /^[^]+\/\*\s*|\s*\*\/[^]*/g, "" ).toLowerCase();

               for ( key in $parameter )
                    sql.replace( new RegExp( ":" + key, [ "g" ] ), "'" + $parameter[ key ] + "'" );

               return sql;
          },
          where : function( $table, $where, $visitor, $customData ) {
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

                    this.foreach( this.whereList, this.lastFunction );

                    this.isExist = this.whereList.join( "" );
               };

               _utils.foreach( $table, tableIterator, new Iterator( function( $index, $parent ) {
                    this.item = $parent[ $index ];

                    if ( this.item.indexOf( "'" ) > -1 && !this.quoteFlag ) {
                         this.quoteFlag = true;
                    } else {
                         // 마지막에 한번만 교체 되어야 하는 문자 처리
                         if ( _utils.getObjectLength( this.row ) - 1 === _utils.getColumnIndex( this.row, this.col ) )
                              this.item = this.item.replace( /\s+and\s+/g, " && " ).replace( /\s+or\s+/g, " || " ).replace( /=/g, "==" );

                         this.quoteFlag = false;

                         $parent[ $index ] = _utils.replacePureWord( this.item, this.col, ":" ).replace( new RegExp( ":" + this.col + ":", "g" ), "'" + this.row[ this.col ] + "'" );
                    }
               } ) );

               return result;
          },
          // argument type : 컬럼 리스트나 테이블 리스트 중 한 줄만 문자열로 들어옴
          alias : function( $string ) {
               var stringList = _utils.replacePureWord( $string, "as", ":" ).split( ":as:" );

               return { tableName : stringList[ 0 ], alias : stringList[ 1 ] };
          }
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