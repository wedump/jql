var $jql = ( function() {
	"use strict";

	var _storage = {};

	var _trim = function( $string ) {
		return $string.replace( /^\s+|\s+$/g, "" );
	};

	var _in = function( $target, $wordList ) {
		for ( var i = 0, j = $wordList.length; i < j; i++ )
			if ( $target === $wordList[ i ] ||
				 $target === $wordList[ j - i - 1 ] ) return true;

		return false;
	};

	var $jql = function( $function ) {
		var resultTable = [],
			sql = $jql.parse.sql( $function ),
			table = $jql.parse.table( sql ),			
			columnInfo = $jql.parse.column( sql );

		$jql.table( table ).where( sql ).group( sql ).order( sql );

		for ( var index in table ) {			
			resultTable[ index ] = {};

			for ( var column in columnInfo )
				resultTable[ index ][ column ] = $jql.parse.substitute( columnInfo[ column ], table[ index ] );
		}

		return $jql.parse.formula( resultTable );
	};

	$jql.parse = {
		sql : function( $function ) {
			return $function.toString().replace( /^[^\*]+\*\s*/, "" ).replace( /\s*\*\/+[^]*/, "" ).toLowerCase(); // comment trick
		},

		table : function( $sql ) {
			return _storage[ $sql.replace( /[^]+(from)+(\s+)/, "" ).replace( /(\s+)+[^]*/, "" ) ];
		},

		column : function( $sql ) {
			var columnInfo = {};			
			var columnList = $sql.substring( $jql.util.indexOf( $sql, "select" ) + 6, $jql.util.indexOf( $sql, "from" ) );
			var isBracket  = false;

			for ( var i = 0; i < columnList.length; i++ ) {
				switch ( columnList.substr( i, 1 ) ) {
					case "(":
						isBracket = true;
						break;
					case ")":						
						isBracket = false;
						break;
					case ",":
						if ( !isBracket )
							columnList = columnList.substring( 0, i ) + "$_$" + columnList.substring( i + 1 );
						break;
				}
			}

			columnList = columnList.split( "$_$" );

			for ( var index in columnList ) {
				var column = _trim( columnList[ index ] );
				var columnName = "";
				var index;

				if ( ( index = $jql.util.indexOf( column, "as" ) ) > -1 ) {
					columnName = _trim( column.substring( index + 2 ) );
					column = _trim( column.substring( 0, index ) );
				} else {
					var columSplit = column.split( " " );
					index = columSplit.length;

					while ( index-- )
						if ( columnName = columSplit[ index ] ) break;

					if ( /^(\w+.)\w+$/.test( columnName ) ) {
						column = columSplit.length > 1 ? _trim( column.substring( 0, column.indexOf( columnName ) ) ) : "";
						columnName = ( index = columnName.indexOf( "." ) ) > -1 ? columnName.substring( index + 1 ) : columnName;

						if ( !column ) column = columnName;
					} else {
						columnName = column;
					}
				}

				columnInfo[ columnName ] = column;
			}

			return columnInfo; // { column1 : value1, column2 : value2, ... };
		},

		substitute : function( $columnInfo, $row ) {
			$columnInfo = $columnInfo.replace( /sysdate/g, "'__date__'" ).replace( /systimestamp/g, "'__date__'" );

			for ( var column in $row )
				$columnInfo = $columnInfo.replace( new RegExp( column, [ "g" ] ), "'" + $row[ column ] + "'" );

			return $columnInfo;
		},

		formula : function( $table ) {
			function substr( $string, $startIndex, $unit ) {
				return $string.substr( $startIndex - 1, $unit );
			}
			
			function to_char( $date, $format ) {
				if ( $date === "__date__" )
					$date = new Date;
				else
					return "";

		    	var result = $format.toLowerCase(),
		    		year   = $date.getFullYear() + "",
		    		month  = $date.getMonth() + 1 + "",
		    		date   = $date.getDate() + "",
		    		hours  = $date.getHours(),
		    		zeroNotation = function( $str ) {
		    			var str0 = "0" + $str;
		    			return str0.substr( str0.length - 2 );
		    		},
		    		formatList = {
		   				"dd"   : function() { return zeroNotation( date ); },
		       			"d"	   : function() { return date; },
		       			"hh24" : function() { return zeroNotation( hours ); },
		    			"hh"   : function() { return hours === 12 ? "12" : zeroNotation( hours % 12 ); },
		       			"mm"   : function() { return zeroNotation( month ); },
		    			"mi"   : function() { return zeroNotation( $date.getMinutes() ); },
		    			"m"    : function() { return month; },
		    			"ss"   : function() { return zeroNotation( $date.getSeconds() ); },
		    			"yyyy" : function() { return year; },
		    			"yy"   : function() { return year.substr( year.length - 2 ); }
		    		};
		    		
		    	for ( var format in formatList )
		    		result = result.replace( format, formatList[ format ]() );
		    		
		    	return result;
			}

			var index = $table.length;

			while ( index-- ) {
				var row = $table[ index ];

				for ( var column in row )
					row[ column ] = eval( row[ column ].replace( /\|\|/g, "+" ) );
			}

			return $table;
		}
	};

	$jql.table = ( function() {
		var table;

		var library = {
			where : function( $sql ) {
				var where = $sql.replace( /\s+where\s+/, "$where$" ).replace( /\s+group\s+by\s+/, "$group|order$" ).replace( /\s+order\s+by\s+/, "$group|order$" ),
					where = _trim( where.substring( where.indexOf( "$where$" ) + 7, where.indexOf( "$group|order$" ) ) ),
					where = where.replace( /\s+and\s+/g, " && " ).replace( /\s+or\s+/g, " || " ).replace( "=", "===" ),
					deleteIndexList = [], index = table.length;

				while ( index-- ) {
					var row = table[ index ], replacedWhere = where;

					for ( var column in row )
						replacedWhere = replacedWhere.replace( new RegExp( column, [ "g" ] ), "'" + row[ column ] + "'" );

					if ( !eval( replacedWhere ) ) table.splice( index, 1 );
				}

				return $jql.table( table );
			},

			group : function( $sql ) {
				return $jql.table( table );
			},

			order : function( $sql ) {
				var sql = $sql.replace( /\s+order\s+by\s+/, "$order$" ),
					sql = _trim( sql.substr( sql.indexOf( "$order$" ) + 7 ) ),
					orderList = sql.split( "," ), index = orderList.length;

				function sortMethod( $firstItem, $secondItem ) {					
					var orderColumn = _trim( orderList[ index ] ),
						order = _trim( orderColumn.substr( orderColumn.length - 4 ) );

					if ( order === "desc" ) {
						orderColumn = orderColumn.split( " " )[ 0 ];

						if ( $firstItem[ orderColumn ] > $secondItem[ orderColumn ] ) return -1;
						if ( $firstItem[ orderColumn ] < $secondItem[ orderColumn ] ) return 1;
					} else {
						if ( $firstItem[ orderColumn ] > $secondItem[ orderColumn ] ) return 1;
						if ( $firstItem[ orderColumn ] < $secondItem[ orderColumn ] ) return -1;
					}

					return 0;
				}

				while ( index-- ) table.sort( sortMethod );

				return $jql.table( table );
			}
		};

		return function( $table ) {
			table = $table;
			return library;
		};
	} )();

	$jql.util = {
		indexOf : function( $sql, $command ) {
			var index = -$command.length;

			while ( ( index = $sql.indexOf( $command, index + $command.length ) ) > -1 )
				if ( _in( $sql.substr( index === 0 ? $sql.length : index - 1, 1 ), [ "", " " ] ) &&
					 _in( $sql.substr( index + $command.length, 1 ), [ "", " " ] ) ) break;

			return index;
		}
	};

	$jql.store = function() {
		for ( var index in arguments )
			if ( index % 2 === 1 )
				_storage[ arguments[ index - 1 ].toLowerCase() ] = arguments[ index ];
	};

	return $jql;
} )();