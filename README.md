# 마전초등학교 양치 챌린지

초등학생을 위한 양치 습관 챌린지 웹 앱입니다.

## 실행 방법 (Windows)

`index.html`을 **더블클릭하면 안 됩니다.** 브라우저 보안 때문에 Airtable 연결이 차단됩니다.

1. `config.example.js`를 `config.js`로 복사하고 Airtable 토큰 입력
2. Git Bash에서 최신 브랜치 받기:
   ```bash
   git checkout cursor/brushing-challenge-updates-4539
   git pull
   ```
3. **`start.bat` 더블클릭**으로 실행
4. 검은 창에 `서버 실행 중!` 이 보이면 성공
5. 브라우저에서 `http://localhost:8080` 접속
6. 오른쪽 위에 **"● 에어테이블 연결됨"** 이 보이면 완료

### localhost 연결 안 될 때

- `start.bat` 실행 후 **검은 창을 닫지 마세요** (닫으면 서버 종료)
- 검은 창에 `서버 실행 중!` 메시지가 보이는지 확인
- 브라우저 주소창에 직접 입력: `http://localhost:8080`
- 그래도 안 되면 `http://127.0.0.1:8080` 시도

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