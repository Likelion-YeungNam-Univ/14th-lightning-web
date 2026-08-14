# Assist

투자 종목들을 출처별로 정리해 보여주는 웹사이트
팀 번개조

## Team

|                              P&D / Leader                               |                                  BE                                  |                                BE                                |                                   FE                                    |                                FE                               |                                 FE                                  |
| :---------------------------------------------------------------------: | :------------------------------------------------------------------: | :--------------------------------------------------------------: | :---------------------------------------------------------------------: | :-------------------------------------------------------------: | :-----------------------------------------------------------------: |
| <img src="https://github.com/Duyeon-Kang.png" width="100" height="100" /> | <img src="https://github.com/ryu2293.png" width="100" height="100" /> | <img src="https://github.com/mujang3.png" width="100" height="100" /> | <img src="https://github.com/rlaalstj1012.png" width="100" height="100" /> | <img src="https://github.com/ose0919.png" width="100" height="100" /> | <img src="https://github.com/dlwleasy.png" width="100" height="100" /> |
|                 [강두연](https://github.com/Duyeon-Kang)                  |                  [류승래](https://github.com/ryu2293)                  |              [장문경](https://github.com/mujang3)               |                 [김민서](https://github.com/rlaalstj1012)                 |              [오세은](https://github.com/ose0919)              |               [이지원](https://github.com/dlwleasy)                |

## 프론트 - 깃 규칙

### ① 브랜치 명명 규칙 (Branch Naming)

`작업타입/구현내용` 형태로 통일하면 브랜치 목록만 봐도 무슨 작업 중인지 한눈에 보입니다.

- **`feature/login-page`**: 새로운 기능 개발
- **`fix/header-responsive`**: 버그 수정
- **`refactor/api-hooks`**: 리팩토링 (기능 변경 없이 코드 개선)
- **`style/theme-color`**: CSS/디자인 단독 수정
- **`chore/package-update`**: 패키지 설치, 빌드 설정 등

---

### ② 커밋 메시지 컨벤션 (Conventional Commits)

프론트엔드는 UI 수정과 로직 수정을 구분하는 것이 코드 리뷰할 때 정말 큰 도움이 됩니다.

| Prefix          | 설명                         | 예시                                           |
| --------------- | ---------------------------- | ---------------------------------------------- |
| **`feat:`**     | 새로운 기능 추가             | `feat: 로그인 폼 유효성 검사 로직 추가`        |
| **`fix:`**      | 버그 수정                    | `fix: 모바일 화면에서 드롭다운 깨짐 현상 수정` |
| **`style:`**    | UI/스타일 수정 (기능 변화 X) | `style: 메인 페이지 버튼 색상 변경`            |
| **`refactor:`** | 코드 리팩토링                | `refactor: Custom Hook 분리로 컴포넌트 단순화` |
| **`chore:`**    | 설정 파일, 패키지 관리 등    | `chore: tailwind.config.js 스페이싱 속성 추가` |

> 💡 **하나의 의미 있는 단위**로 올리기.
