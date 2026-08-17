# assit 시퀀스 다이어그램

기준: `assit 요구사항 명세서 (백엔드)` - 국내/해외 4층 구조 반영본

> 표기 규칙: 명세서에서 아직 확정되지 않은 값은 다이어그램의 `Note`에 **미확정/제안**으로 표시한다.

## 1. 첫 진입과 국내/해외 구분 전환

```mermaid
sequenceDiagram
    autonumber
    actor U as 사용자
    participant FE as 프론트엔드
    participant API as 백엔드 API
    participant DB as DB

    U->>FE: 서비스 첫 진입
    FE->>API: POST /session
    API->>DB: 세션 생성
    API->>DB: 국내 기본 종목 4개 등록
    DB-->>API: session_id
    API-->>FE: 세션 쿠키 발급
    Note over API,DB: F-1.1, F-3.8<br/>세션 기간 30일은 제안값

    FE->>API: GET /markets
    API->>DB: 구분별 마지막 종목과 등록 종목 유무 조회
    DB-->>API: domestic / overseas 상태
    API-->>FE: 탭 구성 + 마지막 종목 + 종목 유무
    Note over FE,API: 국내: youtube, disclosure, regulation, bok, fed<br/>해외: youtube, disclosure, regulation, fed

    FE->>API: GET /me/stocks?market=DOMESTIC
    API->>DB: 국내 등록 종목 전량 조회
    DB-->>API: 종목 + display_order
    API-->>FE: 국내 종목 목록

    U->>FE: 해외 구분 선택
    FE->>API: GET /markets
    API->>DB: 해외 마지막 종목 및 종목 유무 조회
    alt 등록된 해외 종목 있음
        DB-->>API: last_stock_overseas + has_stock=true
        API-->>FE: 해외 탭 구성 + 마지막 종목
        FE->>API: GET /me/stocks?market=OVERSEAS
        API-->>FE: 해외 종목 목록
    else 등록된 해외 종목 없음
        DB-->>API: has_stock=false
        API-->>FE: no_overseas_stock + 해외 탭 구성
        FE-->>U: 해외 구분 유지 + 종목 추가 빈 화면
    end
    Note over U,DB: F-2.1~F-2.3<br/>구분별 마지막 종목은 세션에 각각 저장
```

## 2. 종목 검색, 모의 로그인, 종목 추가

```mermaid
sequenceDiagram
    autonumber
    actor U as 사용자
    participant FE as 프론트엔드
    participant API as 백엔드 API
    participant DB as DB
    participant JOB as 수집 작업

    U->>FE: 현재 구분에서 종목 검색
    FE->>API: GET /stocks/search?q=&market=
    API->>DB: 현재 market의 마스터만 검색
    alt 지원 종목 발견
        DB-->>API: 부분 이름/코드 전방 일치 결과
        API-->>FE: 200 + already_added + market
    else 주요 해외 종목이지만 화이트리스트 밖
        DB-->>API: 미지원 별칭 일치
        API-->>FE: unsupported_overseas
    else 결과 없음
        DB-->>API: 없음
        API-->>FE: 200 + 빈 배열
    end
    Note over API,DB: F-3.2~F-3.3.1<br/>해외 지원 대상 20~30개 목록은 미확정

    U->>FE: 여러 종목 추가
    FE->>API: POST /me/stocks [stock_codes]
    API->>DB: authenticated 확인
    alt 비로그인 세션
        DB-->>API: false
        API-->>FE: 401
        FE-->>U: 모의 로그인 창
        U->>FE: 사전 설정 계정 입력
        FE->>API: POST /auth/mock-login
        API->>API: 환경 변수의 계정 값과 비교
        alt 계정 일치
            API->>DB: authenticated=true
            API-->>FE: 200
            FE->>API: POST /me/stocks 재전송
        else 계정 불일치
            API-->>FE: 인증 오류
        end
    else 로그인 세션
        DB-->>API: true
    end

    API->>DB: 구분별 상한 검사 후 멱등 등록
    API-->>FE: 추가 결과 + 각 종목 market
    API--)JOB: 신규 고유 종목 온디맨드 수집
    Note over FE,JOB: F-1.2~F-1.4, F-3.5~F-3.5.1, F-4.8<br/>구분별 상한 30개는 제안값
```

## 3. 카드 목록 조회와 유효하지 않은 조합 처리

```mermaid
sequenceDiagram
    autonumber
    actor U as 사용자
    participant FE as 프론트엔드
    participant API as 백엔드 API
    participant DB as DB

    U->>FE: 종목과 출처 탭 선택 또는 URL 직접 진입
    FE->>API: GET /cards?tab=&stock_code=
    API->>DB: 종목의 market과 탭 구성 확인
    alt 유효하지 않은 조합
        Note over FE,API: 예: 해외 종목 + bok 탭<br/>국내 구분 + 해외 종목코드
        API-->>FE: invalid_combination
        FE->>FE: 해당 구분의 첫 탭으로 이동
    else 유효한 조합
        API->>DB: 원자료 + 생성물 + 저장 여부 조회
        alt 수집 실패
            DB-->>API: fetch_failed
            API-->>FE: 빈 배열 + fetch_failed
        else 자료 없음
            DB-->>API: no_data
            API-->>FE: 빈 배열 + no_data
        else 자료 있음
            DB-->>API: 최신 20건 내외 + 부가 정보
            API-->>FE: 공통 카드 스키마
        end
    end
    Note over FE,DB: F-2.4, F-6.1~F-6.5<br/>목록과 요약 시트 필드를 한 번에 반환

    opt 금리 탭
        API-->>FE: link_sentence + 카드 목록
        Note over FE,API: 국내: BOK/Fed, 해외: Fed<br/>문장이 비어도 카드는 반환
    end

    opt 유튜브 탭
        API-->>FE: disclaimer=true
        FE-->>U: 참고용 안내를 고정 노출
    end

    opt 사용자가 요약 시트 열기
        U->>FE: 카드 선택
        FE->>FE: 기존 /cards 응답으로 시트 표시
        Note over U,FE: 상세 조회 API 호출 없음<br/>원문 링크는 시트에만 노출(제안)
    end
```

## 4. 용어 풀이와 카드 저장

```mermaid
sequenceDiagram
    autonumber
    actor U as 사용자
    participant FE as 프론트엔드
    participant API as 백엔드 API
    participant DB as DB
    participant LLM as LLM

    U->>FE: 요약 시트에서 용어 드래그
    FE->>API: POST /terms/explain<br/>{text, summary, tab}
    API->>API: 세션/IP 레이트리밋 검사
    API->>DB: term + tab 캐시 조회
    alt 캐시 적중
        DB-->>API: 저장된 정의
    else 캐시 미스
        API->>LLM: 용어 + 해당 자료 요약 본문
        LLM-->>API: 문맥 기반 정의
        API->>API: 영향 판단/투자 권유/예측 제거
        API->>DB: 설명 캐시 저장
    end
    API-->>FE: 용어 정의
    Note over FE,LLM: F-5.4~F-5.5, F-8.3<br/>50자 상한·분당 20회는 제안값

    U->>FE: 카드 저장
    FE->>API: POST /me/saved-cards
    API->>DB: authenticated 확인
    alt 비로그인 세션
        API-->>FE: 401
        FE-->>U: 모의 로그인 창
        Note over U,FE: 로그인 성공 후 저장 요청 재전송
    else 로그인 세션
        API->>DB: 중복 여부 확인
        API->>DB: snapshot_json으로 현재 내용 복사
        DB-->>API: 저장 완료
        API-->>FE: 200
    end
    Note over API,DB: F-7.1~F-7.4<br/>저장본은 국내/해외 구분 없이 세션에 귀속

    U->>FE: 저장됨 열기
    FE->>API: GET /me/saved-cards?stock_code=
    API->>DB: 세션의 국내·해외 저장 카드 통합 조회
    DB-->>API: 최근 저장 순 스냅샷
    API-->>FE: 탭·종목 배지 포함 목록
```

## 5. 정기 배치와 국내/해외 데이터 수집

```mermaid
sequenceDiagram
    autonumber
    participant SCH as 스케줄러
    participant COL as 수집기
    participant DB as DB
    participant DART as DART/정책브리핑/ECOS
    participant US as SEC/Federal Register/FRED
    participant YT as YouTube API
    participant AI as AI 가공 작업

    alt 매일 06:00 배치(제안)
        SCH->>COL: 등록된 고유 종목 수집 시작
    else 신규 종목 추가
        COL->>COL: 해당 종목만 온디맨드 수집
    end

    par 국내 종목
        COL->>DART: corp_code 기반 공시 조회
        COL->>DART: 부처 + 산업 키워드 규제 조회
        COL->>DART: 기준금리/결정 요지 조회
    and 해외 종목
        COL->>US: CIK 기반 SEC submissions 조회
        Note over COL,US: 연락처 User-Agent 필수, 초당 10회 이하
        COL->>US: 기관 + SIC 키워드 규제 조회
        COL->>US: FRED 금리 조회
    and 국내·해외 공통 영상
        COL->>DB: 당일 YouTube 사용량 조회
        alt 쿼터 80% 미만
            COL->>YT: 종목 영상 검색
            COL->>YT: 영상 상세/조회수 일괄 조회
            COL->>DB: quota_usage 증가
        else 80% 도달 또는 403
            COL->>DB: 직전 캐시 사용
        end
    end

    loop 외부 호출별 제안 3회
        alt 성공
            DART-->>COL: 국내 원자료
            US-->>COL: 해외 원자료
            YT-->>COL: 영상 메타데이터
        else 실패
            COL->>COL: 지수 백오프
        end
    end

    alt 수집 성공
        COL->>DB: source_item 및 대상 연결 upsert
        COL->>DB: 변경된 생성물 무효화
        COL--)AI: 자료별 AI 가공 요청
    else 최종 실패
        COL->>DB: 해당 탭/종목 fetch_failed 기록
    end
    Note over SCH,AI: F-4.1~F-4.10<br/>한 탭 실패가 다른 수집을 막지 않음
```

## 6. AI 요약, 영향 라벨, 금리 연결 문장

```mermaid
sequenceDiagram
    autonumber
    participant JOB as AI 가공 작업
    participant DB as DB
    participant LLM as LLM
    participant QA as 검수 담당자

    JOB->>DB: 신규/변경 원자료 조회
    alt 유튜브
        JOB->>JOB: 요약과 라벨 생성 생략
    else 공시
        JOB->>DB: 국내 공시 유형 또는 미국 Form 해설 조회
        DB-->>JOB: 유형 해설
        JOB->>LLM: 원문 제목 + 유형 해설
        LLM-->>JOB: summary_short + summary_full
        JOB->>JOB: 제목에 없는 숫자/조건 생성 여부 검사
        JOB->>LLM: 영향 라벨 + 판단 이유 생성
    else 규제
        JOB->>LLM: 본문/초록 + 산업 정보
        LLM-->>JOB: 관련성 + 요약 + 영향 라벨/이유
        alt 해외 규제가 산업과 무관
            JOB->>JOB: 카드 생성 없이 폐기
        end
    else 한국은행 또는 Fed
        JOB->>LLM: 지표 + 결정 요지
        LLM-->>JOB: summary_short + summary_full
        Note over JOB,LLM: 금리에는 영향 라벨 미부착
    end

    JOB->>JOB: 공통 출력 가드레일 검사
    alt 금지 표현 발견
        JOB->>LLM: 1회 재생성
        LLM-->>JOB: 재생성 결과
        alt 재위반
            JOB->>JOB: 위반 필드 비움
        end
    end
    JOB->>DB: generated_content 저장

    opt 국내 BOK/Fed 또는 해외 Fed
        JOB->>DB: 업종 코드/SIC + 지표 스냅샷 조회
        JOB->>LLM: 업종 성격과 금리 연결 요청
        LLM-->>JOB: 종목명 없는 한두 줄 문장
        JOB->>JOB: 예측·매매 시사·수치 단정 검사
        JOB->>DB: market + industry_key + indicator_version로 캐시
    end

    opt 시연 종목 검수
        QA->>DB: 생성물 확인
        QA->>DB: locked=true
    end
    Note over JOB,QA: F-5.1~F-5.7<br/>라벨 오판 검증 절차는 블로커 B4
```

## 7. 데모 데이터 초기화

```mermaid
sequenceDiagram
    autonumber
    actor A as 관리자
    participant API as 백엔드 API
    participant DB as DB

    A->>API: POST /admin/reset-demo
    Note over A,API: 관리자 경로/스크립트 및 인증 방식 미확정
    API->>DB: 대상 세션의 종목 삭제
    API->>DB: 저장 카드 삭제
    API->>DB: 구분별 마지막 종목 기록 삭제
    API->>DB: 국내 기본 종목 4개 재등록
    DB-->>API: 초기화 완료
    API-->>A: 성공 응답
    Note over API,DB: F-1.5<br/>공용 원자료와 AI 생성물은 초기화 대상이 아님
```

## 착수 전 반드시 확정할 항목

- B1: 국내 종목 마스터 데이터 출처
- B2: 국내 업종 분류 체계
- B3: ECOS 통계표 코드와 금통위 결정 요지 텍스트 확보 경로
- B4: 영향 라벨 오판 검증 절차
- 해외 화이트리스트 종목, 공시 Form, 규제 문서 유형과 기관 매핑표
- 데모 초기화 노출·인증 방식

