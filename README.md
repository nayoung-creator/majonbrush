# 마전초등학교 양치 챌린지

초등학생을 위한 양치 습관 챌린지 웹 앱입니다.

## 온라인 배포 (추천)

배포하면 학생·선생님이 **인터넷 주소**로 바로 접속할 수 있습니다.  
(`start.bat` / localhost 불필요)

### A. GitHub Pages (이 저장소)

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   - `AIRTABLE_TOKEN` = Airtable Personal Access Token (`pat...`)
   - `AIRTABLE_BASE_ID` = Base ID (`app...`)  ← 선택, 없으면 기본값 사용
   - `AIRTABLE_TABLE_NAME` = 테이블 이름 (예: `ChallengeDB`) ← 선택
2. **Settings** → **Pages** → **Build and deployment**
   - Source: **GitHub Actions**
3. **Actions** 탭에서 `Deploy to GitHub Pages` 워크플로가 성공했는지 확인
4. 배포 주소 예:
   - `https://nayoung-creator.github.io/majonbrush/`

Secrets를 넣은 뒤 다시 배포하려면 Actions에서 **Run workflow** 를 누르거나, 코드를 push 하면 됩니다.

### B. Netlify (드래그앤드롭도 가능)

1. [Netlify Drop](https://app.netlify.com/drop) 접속
2. 로컬에서 배포 폴더 만들기:

```bash
cd majonbrush
git pull
export AIRTABLE_TOKEN='pat여기에토큰'
export AIRTABLE_BASE_ID='app여기에BaseID'
export AIRTABLE_TABLE_NAME='ChallengeDB'
bash scripts/build-config.sh
```

3. 생성된 **`dist` 폴더**를 Netlify Drop에 드래그
4. 발급된 `https://xxxx.netlify.app` 주소를 학생에게 공유

또는 Netlify에 GitHub 저장소를 연결하고 Environment variables에 위 값을 넣으면 자동 배포됩니다.

### C. Vercel

1. [vercel.com](https://vercel.com)에 GitHub 저장소 import
2. Environment Variables에 `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` 등록
3. Deploy → 공개 URL 사용

> **보안 참고:** 이 앱은 브라우저에서 Airtable을 호출하므로, 배포된 `config.js` 안에 토큰이 포함됩니다.  
> Airtable 토큰은 **양치 챌린지 Base만** 권한을 주고, 읽기/쓰기만 허용하세요.

---

## 로컬 실행 (Windows)

`index.html`을 **더블클릭하면 안 됩니다.**

1. `config.example.js` → `config.js` 복사 후 토큰 입력
2. `양치챌린지_실행.bat` 실행
3. `http://localhost:8080` 접속
4. **● 에어테이블 연결됨** 확인

---

## 주요 기능

- 학년/이름 + 4자리 비밀번호 로그인
- 달력 양치 기록 (7/25~8/17은 오전·오후·저녁 3칸)
- Airtable로 여러 기기 동기화
- 명예의 전당 (6·7월 기록 + 이후 월별 1~5등)
- 칸 단위 실천율 (여름방학 기간 7/25~8/31 합산)
- 관리자 비밀번호: `0625`
