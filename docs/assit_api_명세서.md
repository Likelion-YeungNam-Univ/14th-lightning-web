# assit API 명세서

- **API 이름**: assit API
- **버전**: 0.1.0
- **베이스 URL**: `http://localhost:8000`

---

## 목차

1. [Health](#1-health)
2. [Session](#2-session)
3. [Auth](#3-auth)
4. [Markets](#4-markets)
5. [Stocks](#5-stocks)
6. [My Stocks](#6-my-stocks)
7. [Cards](#7-cards)
8. [Saved Cards](#8-saved-cards)
9. [Terms](#9-terms)
10. [Admin](#10-admin)
11. [공통 스키마](#11-공통-스키마)

---

## 1. Health

### `GET /health`
- **요약**: 헬스 체크
- **인증**: 불필요
- **응답 (200)**: 임의의 JSON 객체 (`additionalProperties: true`)

---

## 2. Session

### `POST /session`
- **요약**: 세션 생성 (F-1.1)
- **설명**: 첫 진입 시 세션 발급 + 국내 기본 종목 4개 제공. 유효 세션이 있으면 재사용(멱등).
- **인증**: 불필요
- **응답 (200)**: `SessionResponse`

| 필드 | 타입 | 설명 |
|---|---|---|
| created | boolean | 세션 신규 생성 여부 |
| authenticated | boolean | 인증 여부 |
| stocks | string[] | 기본/보유 종목 코드 목록 |

---

## 3. Auth

### `POST /auth/mock-login`
- **요약**: 목(Mock) 로그인 (F-1.2)
- **설명**: 사전 설정된 계정(환경 변수)과 일치하면 세션에 `authenticated`를 세움. 회원가입·중복확인·비밀번호 재설정·로그아웃은 명세상 구현하지 않음.

**Request Body** (`LoginRequest`)

| 필드 | 타입 | 필수 |
|---|---|---|
| id | string (최소 1자) | ✅ |
| password | string (최소 1자) | ✅ |

**Response (200)** (`LoginResponse`)

| 필드 | 타입 |
|---|---|
| authenticated | boolean |

- **422**: Validation Error

---

## 4. Markets

### `GET /markets`
- **요약**: 구분(마켓)별 탭 구성 조회 (F-2.1~2.3)
- **설명**: 구분별 탭 구성, 마지막으로 본 종목, 종목 유무 반환. 인증 불필요이며 세션이 있으면 활용. 프론트는 이 응답으로 탭을 그려야 함(구분 값으로 임의 추론 금지).
- **응답 (200)**: `MarketsResponse`

```
MarketsResponse
└─ markets: MarketInfo[]
   ├─ market: string
   ├─ tabs: string[]
   ├─ stock_count: integer
   ├─ last_stock_code: string | null
   └─ reason: string | null
```

---

## 5. Stocks

### `GET /stocks/search`
- **요약**: 종목 검색 (F-3.3)
- **설명**: 현재 구분(market) 한정 검색. 비로그인 호출 가능 (`already_added`는 세션이 있을 때만 의미 있음).

**Query Parameters**

| 이름 | 타입 | 필수 |
|---|---|---|
| q | string | ✅ |
| market | string | ✅ |

**Response (200)**: `StockSearchResponse`

```
StockSearchResponse
├─ items: StockSearchItem[]
│  ├─ stock_code, name, market: string
│  └─ already_added: boolean
└─ reason: string | null
```

### `GET /stocks/popular`
- **요약**: 인기 종목 조회
- **설명**: 종목 추가 창의 추천 칩 (국내: 시가총액 상위 8 보통주)

**Query Parameters**

| 이름 | 타입 | 필수 |
|---|---|---|
| market | string | ✅ |

**Response (200)**: `PopularStockItem[]`

| 필드 | 타입 |
|---|---|
| stock_code | string |
| name | string |
| market | string |
| already_added | boolean |

---

## 6. My Stocks

### `GET /me/stocks`
- **요약**: 내 종목 목록 조회 (F-3.4)
- **설명**: 구분별 종목 목록 전량 반환. 칩 7개 등 표시 분기는 프론트 규칙.

**Query**: `market` (string, 필수)

**Response (200)**: `MyStocksResponse`

```
MyStocksResponse
└─ items: MyStockItem[]
   ├─ stock_code, name, market: string
   ├─ display_order: integer
   └─ is_default: boolean
```

### `POST /me/stocks`
- **요약**: 종목 벌크 등록 (F-3.5)
- **설명**: 멱등 처리, 구분별 상한 30개. **로그인 필요** (F-1.3). 응답에 `market` 포함(다른 구분에 이미 들어간 종목 안내용). 신규 종목은 응답 후 온디맨드로 수집(F-4.10) — 요청 경로에서 외부 API 직접 호출 안 함.

**Request Body**: `StockAddRequest`

| 필드 | 타입 | 필수 |
|---|---|---|
| stock_codes | string[] (최소 1개) | ✅ |

**Response (200)**: `StockAddResponse`

```
StockAddResponse
├─ added: AddedStock[] { stock_code, name, market }
└─ already_registered: string[]
```

### `DELETE /me/stocks/{stock_code}`
- **요약**: 종목 삭제 (F-3.6)
- **설명**: 백엔드는 전량 삭제 허용(마지막 1개 관련 안내는 프론트 책임). 저장된 카드는 유지됨.

**Path**: `stock_code` (string, 필수)

**Response (200)**: `StockDeleteResponse`

| 필드 | 타입 |
|---|---|
| remaining | integer |

### `PUT /me/stocks/order`
- **요약**: 노출 순서 변경 (F-3.7)
- **설명**: 구분 단위로 순서 변경. 전달한 목록이 전체 목록과 일치하지 않으면 400 에러.

**Request Body**: `StockOrderRequest`

| 필드 | 타입 | 필수 |
|---|---|---|
| market | string | ✅ |
| stock_codes | string[] (최소 1개) | ✅ |

**Response (200)**: `StockOrderResponse` → `{ stocks: string[] }`

---

## 7. Cards

### `GET /cards`
- **요약**: 탭 × 종목 카드 목록 조회 (F-6.1)
- **설명**: 시트용 필드까지 함께 포함해서 반환(별도 카드 상세 엔드포인트 없음). `market` 파라미터는 받지 않음 — 종목코드가 구분을 결정(불변식 11). 비로그인 호출 가능하며 `is_saved`는 저장 기능(#8) 구현 전까지 항상 `false`.

**Query Parameters**

| 이름 | 타입 | 필수 |
|---|---|---|
| tab | string | ✅ |
| stock_code | string | ✅ |

**Response (200)**: `CardListResponse`

```
CardListResponse
├─ tab, market, stock_code: string
├─ link_sentence: string | null
├─ disclaimer: boolean (기본 false)
├─ reason: string | null
└─ items: Card[]
```

**Card 스키마** (다섯 탭 공통, 없는 요소는 null)

| 필드 | 타입 |
|---|---|
| card_id | integer (필수) |
| label | string \| null |
| label_reason | string \| null |
| title | string (필수) |
| summary_short | string \| null |
| summary_full | string \| null |
| source_name | string (필수) |
| published_at | datetime \| null |
| origin_url | string \| null |
| is_saved | boolean (기본 false) |
| thumbnail_url | string \| null |
| channel_name | string \| null |
| view_count | integer \| null |
| indicator_value | string \| null |
| details | CardDetail[] \| null |

- 프론트는 카드 컴포넌트 하나로 렌더링하고 슬롯을 켜고 끄는 방식으로 사용
- `card_id`는 저장 API(F-7.1)가 받는 식별자

**CardDetail** — 정형 공시 핵심 필드 배지 (예: "취득 예정 금액 / 7,174,299,854,900원")

| 필드 | 타입 |
|---|---|
| label | string |
| value | string |

---

## 8. Saved Cards

### `GET /me/saved-cards`
- **요약**: 저장된 카드 목록 (F-7.4, F-7.5)
- **설명**: 국내·해외 통합, 최근 저장 순 정렬. `stock_code` 쿼리로 필터 가능.

**Query**: `stock_code` (string, 선택)

**Response (200)**: `SavedCardListResponse` → `{ items: SavedCardItem[] }`

### `POST /me/saved-cards`
- **요약**: 카드 저장 (F-7.1)
- **설명**: 멱등. 미로그인 시 401 (F-1.3).

**Request Body**: `SavedCardAddRequest`

| 필드 | 타입 | 필수 |
|---|---|---|
| card_id | integer | ✅ |
| stock_code | string | ✅ |

**Response (200)**: `SavedCardAddResponse`

```
SavedCardAddResponse
├─ item: SavedCardItem
└─ already_saved: boolean
```

### `DELETE /me/saved-cards/{card_id}`
- **요약**: 카드 저장 해제 (F-7.2)
- **설명**: 멱등. 스냅샷도 함께 삭제.

**Path**: `card_id` (integer, 필수)

**Response (200)**: `SavedCardDeleteResponse` → `{ removed: boolean }`

**SavedCardItem 스키마** — 표시는 `snapshot` 값만 사용 (F-7.3). `card_id`는 원자료 정리 후 null일 수 있음.

| 필드 | 타입 |
|---|---|
| card_id | integer \| null |
| tab | string |
| stock_code | string |
| stock_name | string \| null |
| saved_at | datetime |
| snapshot | object (임의 필드) |

---

## 9. Terms

### `POST /terms/explain`
- **요약**: 용어 설명

**Request Body**: `TermExplainRequest`

| 필드 | 타입 | 필수 |
|---|---|---|
| term | string (최소 1자) | ✅ |
| tab | string | ✅ |
| context | string \| null | ❌ |

**Response (200)**: `TermExplainResponse`

| 필드 | 타입 |
|---|---|
| term | string |
| tab | string |
| explanation | string \| null |
| sources | TermSource[] |
| cached | boolean |

**TermSource** — RAG 근거(어떤 지식으로 설명했는지 그대로 노출, 설명가능성 목적)

| 필드 | 타입 |
|---|---|
| term | string |
| source | string |
| similarity | number |

---

## 10. Admin

### `POST /admin/reset-demo`
- **요약**: 데모 리셋 (F-1.5)
- **설명**: 리허설 후 첫 진입 화면을 재현. `X-Admin-Token` 헤더로 보호(확정사항 4절).

**Header**: `X-Admin-Token` (string, 선택 — 실제로는 필요)

**Response (200)**: `ResetDemoResponse`

| 필드 | 타입 |
|---|---|
| stocks | string[] |
| deleted_saved_cards | integer |

---

## 11. 공통 스키마

### 에러 응답 — `HTTPValidationError` (422)

```
HTTPValidationError
└─ detail: ValidationError[]
   ├─ loc: (string | integer)[]
   ├─ msg: string
   ├─ type: string
   ├─ input: any
   └─ ctx: object (선택)
```

### 전체 스키마 목록

| 스키마명 | 용도 |
|---|---|
| AddedStock | 등록된 종목 정보 |
| Card | 카드 공통 스키마 |
| CardDetail | 카드 상세 배지 |
| CardListResponse | 카드 목록 응답 |
| LoginRequest / LoginResponse | 로그인 |
| MarketInfo / MarketsResponse | 구분별 화면 구성 |
| MyStockItem / MyStocksResponse | 내 종목 |
| PopularStockItem | 인기 종목 |
| ResetDemoResponse | 데모 리셋 결과 |
| SavedCardAddRequest / SavedCardAddResponse | 카드 저장 |
| SavedCardDeleteResponse | 카드 저장 해제 |
| SavedCardItem / SavedCardListResponse | 저장된 카드 |
| SessionResponse | 세션 |
| StockAddRequest / StockAddResponse | 종목 등록 |
| StockDeleteResponse | 종목 삭제 |
| StockOrderRequest / StockOrderResponse | 종목 순서 변경 |
| StockSearchItem / StockSearchResponse | 종목 검색 |
| TermExplainRequest / TermExplainResponse | 용어 설명 |
| TermSource | 용어 설명 근거 |
| ValidationError | 검증 오류 상세 |

---

## 참고: 주요 설계 포인트 (문서 내 명세 주석 기반)

- 로그인 필요 지점(F-1.3): `POST /me/stocks`, `POST /me/saved-cards`
- `/cards`는 `market` 없이 `stock_code`만으로 구분을 결정 (불변식 11)
- `/stocks/search`, `/stocks/popular`, `/cards`, `GET /markets`는 비로그인 호출 가능
- 신규 종목 데이터는 등록 응답 후 온디맨드 수집(요청 경로에서 외부 API 직접 호출 없음)
- 저장 카드 표시는 `snapshot` 필드만 사용, 원본 `card_id`가 사라져도 스냅샷은 유지