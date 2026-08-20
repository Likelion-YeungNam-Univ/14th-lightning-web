                    API-->>JOB: 다음 시각 재시도 예약
                else 3회 모두 실패
                    API->>DB: 트랜잭션 시작
                    API->>DB: 모든 참가자 refund 원장 기록
                    API->>DB: 상태를 void로 변경
                    API->>DB: 트랜잭션 커밋
                    API-->>JOB: 무효·전액 반환 완료
                end
            end
        end
    end
```

## 5. 테스트 결제 포인트 충전

```mermaid
sequenceDiagram
    autonumber
    actor U as 사용자
    participant UI as 웹 클라이언트
    participant API as 포인트 API
    participant DB as DB
    participant TOSS as 토스페이먼츠<br/>(테스트)

    U->>UI: 충전 상품 선택
    UI-->>U: 테스트 결제·환불 불가 안내
    UI->>API: 충전 사전 검증 요청
    API->>DB: point_ledger 합계로 잔액 조회
    alt 충전 후 30,000P 초과
        API-->>UI: 400 보유 상한 초과
        UI-->>U: 결제 진입 차단
    else 충전 가능
        API-->>UI: 주문 ID·금액
        UI->>TOSS: 테스트 결제창 요청<br/>(클라이언트 키)
        TOSS-->>U: 결제·성인 인증
        U->>TOSS: 인증 완료
        TOSS-->>UI: paymentKey·orderId·amount 콜백
        UI->>API: POST /me/points/charge
        API->>TOSS: 결제 승인 API 호출<br/>(서버 시크릿 키)
        alt 승인 실패 또는 금액/주문 불일치
            TOSS-->>API: 실패/불일치
            API-->>UI: 적립 거절
            UI-->>U: 충전 실패 안내
        else 승인 검증 성공
            TOSS-->>API: 승인 결과
            API->>DB: 트랜잭션 시작
            API->>DB: 결제 중복 처리 여부 확인
            API->>DB: charge 원장 기록(+포인트)
            API->>DB: 결제 로그 저장 후 커밋
            API-->>UI: 변경된 원장 기준 잔액
            UI-->>U: 충전 완료·피자 진행률 갱신
        end
    end
```

## 6. 피자 기프티콘 교환

```mermaid
sequenceDiagram
    autonumber
    actor U as 사용자
    participant UI as 웹 클라이언트
    participant VERIFY as 본인확인
    participant API as 기프티콘 API
    participant DB as DB
    participant GIFT as 발급 서비스<br/>(시연: 더미)

    U->>UI: 피자 기프티콘 교환 선택
    UI->>API: POST /me/gifticons
    API->>DB: 월 교환 이력·원장 잔액 조회
    alt 잔액이 18,000P 미만
        API-->>UI: 400 포인트 부족
        UI-->>U: 포인트 모으는 법 표시
    else 이번 달 이미 교환함
        API-->>UI: 400 월 1회 제한
        UI-->>U: 교환 제한 안내
    else 교환 가능
        API->>VERIFY: 1회 본인확인 요청
        VERIFY-->>API: 확인 결과
        alt 본인확인 실패
            API-->>UI: 교환 거절
        else 본인확인 성공
            API->>DB: 트랜잭션 시작 + 사용자 원장 잠금
            API->>DB: 잔액·월 제한 재확인
            API->>DB: exchange 원장 기록(-18,000P)
            API->>GIFT: 기프티콘 발급 요청
            alt 발급 성공 (시연: 더미 코드)
                GIFT-->>API: issued_code
                API->>DB: gifticon_order 완료 저장
                API->>DB: 트랜잭션 커밋
                API-->>UI: 발급 완료·코드
                UI-->>U: 발급 완료 화면
            else 발급 실패
                GIFT-->>API: 실패
                API->>DB: exchange 취소 또는 refund 원장 기록
                API->>DB: 실패 주문 저장 후 커밋
                API-->>UI: 실패·포인트 복구 완료
                UI-->>U: 발급 실패 안내
            end
        end
    end
```

## 7. 댓글 작성 및 삭제

```mermaid
sequenceDiagram
    autonumber
    actor U as 사용자
    participant UI as 웹 클라이언트
    participant AUTH as 인증/세션
    participant API as 커뮤니티 API
    participant DB as DB

    U->>UI: 댓글 입력 및 선택적으로 자료 카드 첨부
    UI->>AUTH: 로그인 상태 확인
    alt 비로그인
        UI-->>U: 로그인 요청 (401)
    else 로그인
        UI->>API: POST /rooms/{id}/comments
        API->>DB: 본문·저장 카드 스냅샷·참여 진영 조회
        API->>DB: 댓글 저장
        DB-->>API: 생성된 댓글
        API-->>UI: 댓글 + 진영 배지<br/>(간다/안 간다/미참여)
        UI-->>U: 최신순 목록 갱신
    end

    opt 본인 댓글 삭제
        U->>UI: 삭제 선택
        UI->>API: DELETE /comments/{id}
        API->>DB: 작성자 일치 여부 확인
        alt 작성자가 아님
            API-->>UI: 403
        else 작성자 일치
            API->>DB: deleted_at 기록
            API-->>UI: 삭제 완료
            UI-->>U: '삭제된 댓글이에요' 표시
        end
    end
```

## 구현 시 공통 원칙

- 잔액은 `point_ledger` 합계만을 기준으로 계산한다.
- 베팅·정산·교환은 잔액 확인과 원장 기록을 하나의 트랜잭션으로 묶는다.
- 정산은 방 상태를 잠그고 재확인하여 중복 실행을 방지한다.
- 공개 조회는 인증 없이 허용하고 생성·참여·댓글 작성·충전·교환에서 인증을 요구한다.
- 정산값은 TradingView가 아니라 FinanceDataReader를 기준으로 하며, 실제 사용 종가를 `settle_close_price`에 남긴다.