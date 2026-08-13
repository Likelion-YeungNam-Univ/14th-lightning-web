## 🔍 Context (배경 및 목적)

> 왜 이 작업을 진행했는지, 어떤 문제나 요구사항을 해결하는지 작성합니다.

## ⚙️ Changes (주요 변경점)

- **Feat**: 신규 컴포넌트 추가 (`Button`, `Modal`)
- **Fix**: 모바일 환경에서 드롭다운 터치 이벤트 미작동 수정
- **Refactor**: API 호출 Custom Hook 분리 (`useUserQuery`)

## 🛠️ Architecture & Decision (기술적 의사결정)

- **왜 이 방식을 택했는가?**:
  - A 방식 대신 B 방식을 채택하여 리렌더링 횟수를 30% 줄였습니다.

## ⚠️ Potential Issues & Edge Cases (주의할 점 & 엣지 케이스)

- [ ] Safari 브라우저 15.4 이하 버전에서 스타일 깨짐 현상이 발생하는지 검증 필요

## 🧪 Test Checklist

- [x] 단위 테스트(Unit Test) 작성 완료
- [x] 모바일 반응형 테스트 완료
