// config.example.js 를 config.js 로 복사한 뒤 아래 값을 채우세요.
// ※ GitHub 파일 이름과 Airtable 이름은 서로 달라도 됩니다. 이 파일만 맞으면 됩니다.
window.APP_CONFIG = {
    // airtable.com/create/tokens 에서 발급 (pat 로 시작)
    AIRTABLE_TOKEN: "YOUR_AIRTABLE_TOKEN_HERE",

    // Base 열었을 때 URL: airtable.com/appXXXXXXXX → appXXXXXXXX 부분
    AIRTABLE_BASE_ID: "appXXXXXXXXXXXXXX",

    // Base 안 왼쪽 하단 "표" 이름 (Base 이름과 다를 수 있음)
    AIRTABLE_TABLE_NAME: "ChallengeDB",

    // Airtable 표의 열 이름 (대소문자까지 동일하게)
    AIRTABLE_FIELD_KEY: "Key",
    AIRTABLE_FIELD_VALUE: "Value"
};
