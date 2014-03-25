JQL( Javascript Query Language  )
=================================

* Javascript에서 SQL 문법을 사용하여 JSON 데이터를 조작할 수 있는 라이브러리 입니다.
* 실제로 DB에 접속하거나 하지는 않습니다.
* 단지 서버와 클라이언트 사이의 데이터를 JSON으로 주고 받을 때, 또는 화면에서 데이터를 조작하여 보여주어야 할 때, 편하게 작업하는 용도로 사용됩니다.


사용방법
========

1. SQL 선언
-----------

* 커멘트 트릭을 사용하여 SQL을 작성합니다.
* SQL은 대소문자를 구분하지 않고, 구문분석 시 모두 소문자로 변환됩니다.
* :변수명 으로 값을 동적할당 할 수 있습니다.

        var select01 = function() {/*
            select substr( name, 2 ) as name,
                   age || '세' as age,
                   job
              from A
             where age > :age
          order by name,
                   age desc
        */};
        
        var insert01 = function() {/*
            insert into A( name, age, job ) values( :name, :age, :job )
        */};
        
        var update01 = function() {/*
            update A set age = age + 1 where name = :name
        */};
        
        var delete01 = function() {/*
            delete from A where name = :name
        */};
    
2. 테이블 저장
--------------

* jql 라이브러리의 사용은 $jql 객체를 통해 실현됩니다.
* store함수를 사용하여 테이블을 저장할 수 있습니다.
* store함수 파라미터의 개수는 제한이 없습니다.
* store함수 파라미터의 홀수 인자는 SQL에서 사용할 테이블명을 나타내고, 짝수 인자는 테이블로 사용할 JSON 데이터 입니다.

        var A = ajax(); // ajax를 통해 서버로 부터 JSON데이터를 받아옴( ajax()는 지원 X )
        var B = ajax();
        
        $jql.store( "A", A, "B", B );

3. SQL 실행
-----------

* $jql()을 통해 SQL을 실행 할 수 있습니다.
* 파라미터의 첫번째 인자는 SQL함수이고, 두번째 인자는 Object이며 SQL에 동적변수를 할당하는 용도로 사용됩니다.
* SELECT문의 리턴값은 JSON데이터 이고, INSERT, UPDATE, DELETE는 성공여부를 boolean으로 리턴합니다.

        $jql( insert01, { "name" : "홍길동", "age" : 27, "job" : "개발자" } );
        $jql( update01, { "name" : "홍길동" } );
        
        var dataList01 = $jql( select01, { "age", 25 } );
        var dataList02 = $jql( function() {/* select * from B where amt > 10000 */} );
        
        console.log( dataList01 ); // [{ "name" : "홍길동", "age" : 28, "job" : "개발자" }]

API 명세
========

        $jql : SQL문을 실행한다.
        
        $jql.parse : SQL문 파싱과 관련된 함수제공
          - $jql.parse.sql : 커멘트 트릭으로 받아온 주석 문자열을 SQL문자열로 변경
          - $jql.parse.table : SQL문장으로 부터 테이블을 추출
          - $jql.parse.column : SQL문장으로 부터 컬럼정보를 분리
          - $jql.parse.substitute : 컬럼정보에 테이블값을 대입
          - $jql.parse.formula : 값이 대입된 컬럼정보를 파싱하여 최종 데이터를 생성
          
        $jql.table : 테이블 데이터를 조작하는 함수제공
          - $jql.table.where : SQL문장의 WHERE조건절대로 테이블을 필터링
          - $jql.table.group : SQL문장의 GROUP BY절대로 테이블을 그룹핑
          - $jql.table.order : SQL문장의 ORDER BY절대로 테이블을 정렬
          
        $jql.util : 기타 유틸리티 함수제공
          - $jql.util.indexOf : 파라미터로 넘겨준 명령어의 인덱스값을 제공
          
        $jql.store : 테이블 저장
