# 마전초등학교 양치 챌린지

초등학생을 위한 양치 습관 챌린지 웹 앱입니다.

## 실행 방법

브라우저에서 `index.html`을 열면 됩니다. 별도 빌드 과정은 없습니다.

## 설정

1. `config.example.js`를 `config.js`로 복사합니다.
2. `config.js`에 Airtable Personal Access Token을 입력합니다.

```bash
cp config.example.js config.js
```

`config.js`는 Git에 포함되지 않습니다.

- 학년/이름 선택 후 4자리 비밀번호로 로그인
- 달력에서 오늘 양치 여부 기록
- Airtable 연동으로 여러 기기 간 데이터 동기화
- 나의/우리 반/우리 학교 실천율 통계 (오늘까지 실천 가능일 기준)
- 관리자 대시보드 (비밀번호: `0625`)