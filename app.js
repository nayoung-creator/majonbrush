const ADMIN_PASSWORD = "0625";
const SYNC_INTERVAL_MS = 30000;

const cfg = window.APP_CONFIG || {};
const AIRTABLE_TOKEN = (cfg.AIRTABLE_TOKEN || "").trim();
const AIRTABLE_BASE_ID = (cfg.AIRTABLE_BASE_ID || "").trim();
const AIRTABLE_TABLE_NAME = (cfg.AIRTABLE_TABLE_NAME || "ChallengeDB").trim();
const isCloudMode = AIRTABLE_TOKEN && !AIRTABLE_TOKEN.includes("YOUR_AIRTABLE") && !AIRTABLE_TOKEN.includes("XXXXXXXX") && AIRTABLE_BASE_ID.startsWith("app");

function getAirtableFieldKeyName() {
    return (cfg.AIRTABLE_FIELD_KEY || "Key").trim();
}
function getAirtableFieldValueName() {
    return (cfg.AIRTABLE_FIELD_VALUE || "Value").trim();
}
function readAirtableRecordFields(fields) {
    const kName = getAirtableFieldKeyName();
    const vName = getAirtableFieldValueName();
    return {
        key: fields[kName] ?? fields.Key ?? fields.key,
        val: fields[vName] ?? fields.Value ?? fields.value
    };
}
function airtableTableUrl(suffix = "") {
    const base = encodeURIComponent(AIRTABLE_BASE_ID);
    const table = encodeURIComponent(AIRTABLE_TABLE_NAME);
    return `https://api.airtable.com/v0/${base}/${table}${suffix}`;
}
const isFileProtocol = window.location.protocol === "file:";

function getCloudModeIssue() {
    if (window.CONFIG_LOAD_ERROR) {
        return "config.js 파일이 없습니다. config.example.js 를 복사해 config.js 를 만드세요.";
    }
    if (!AIRTABLE_TOKEN || AIRTABLE_TOKEN.includes("YOUR_AIRTABLE") || AIRTABLE_TOKEN.includes("XXXXXXXX")) {
        return "config.js 에 Airtable 토큰을 입력해 주세요.";
    }
    if (!AIRTABLE_BASE_ID) {
        return "config.js 에 AIRTABLE_BASE_ID 가 없습니다.";
    }
    if (!AIRTABLE_BASE_ID.startsWith("app")) {
        return "AIRTABLE_BASE_ID 는 app 으로 시작해야 합니다. Airtable URL 에서 복사하세요.";
    }
    if (isFileProtocol) {
        return "index.html 을 직접 열면 연결되지 않습니다. start.bat 으로 실행하세요.";
    }
    return null;
}

const studentsData = {
    "유치원": ["김민아", "김지오", "오훈", "이주은", "이채은", "장호준"],
    "1학년": ["김율", "김지율", "노유경", "배세언", "신인아", "오현", "유민준", "이설희", "이은솔", "임서린", "장서준", "조한송", "최한별"],
    "2학년": ["노지호", "안이정", "윤설", "이서하", "이은우"],
    "3학년": ["김도훈", "김은찬", "신은하", "장연우", "전이안", "정윤하"],
    "4학년": ["김지연", "노연호", "박서우", "유민호", "장치원", "장호원", "최한결"],
    "5학년": ["강서희", "김지호", "이수연", "장재원", "정윤슬"],
    "6학년": ["김겨울", "김기헌", "김성민", "김윤형", "노건호", "오세준", "장태평", "정민준", "조한결"]
};

const SLOT_KEYS = ["morning", "afternoon", "evening"];
const SLOT_LABELS = { morning: "오전", afternoon: "오후", evening: "저녁" };
const OPEN_INPUT_START = "2026-07-25";
const OPEN_INPUT_END = "2026-08-17";
const SUMMER_RATE_START = "2026-07-25";
const SUMMER_RATE_END = "2026-08-31";

const HISTORICAL_HALL_OF_FAME = {
    5: {
        monthLabel: "2026년 6월",
        ranks: [
            { rank: 1, names: ["안이정", "이은우"], done: 20, total: 21 },
            { rank: 2, names: ["장치원"], done: 19, total: 21 },
            { rank: 3, names: ["노지호", "장호원", "장태평"], done: 18, total: 21 }
        ]
    },
    6: {
        monthLabel: "2026년 7월",
        ranks: [
            { rank: 1, names: ["노지호", "정윤하", "노연호", "장치원"] },
            { rank: 2, names: ["이서하"] },
            { rank: 3, names: ["신은하", "유민호", "최한결", "이수연", "노건호", "장태평"] }
        ]
    }
};

const LOGIN_CHEERS = [
    ["이번 달도 화이팅!", "깨끗한 치아를 위해 화이팅!"],
    ["오늘도 치카치카!", "반짝이는 이빨을 만들어요!"],
    ["양치 습관은 보물!", "우리 함께 100%에 도전해요!"]
];

function isOpenInputDate(dateStr) {
    return dateStr >= OPEN_INPUT_START && dateStr <= OPEN_INPUT_END;
}

function isMultiSlotDate(dateStr) {
    return isOpenInputDate(dateStr);
}

function isSummerRateMonth(monthIndex) {
    return monthIndex === 6 || monthIndex === 7;
}

function emptySlots() {
    return { morning: false, afternoon: false, evening: false };
}

function normalizeSlots(val) {
    if (val === true) return { morning: true, afternoon: true, evening: true };
    if (val && typeof val === "object") {
        return {
            morning: val.morning === true,
            afternoon: val.afternoon === true,
            evening: val.evening === true
        };
    }
    return emptySlots();
}

function mergeDayValue(a, b) {
    const aObj = a && typeof a === "object";
    const bObj = b && typeof b === "object";
    if (a === true && !bObj) return true;
    if (b === true && !aObj) return true;
    if (a === true || b === true || aObj || bObj) {
        const oa = normalizeSlots(a === true ? true : a);
        const ob = normalizeSlots(b === true ? true : b);
        return {
            morning: oa.morning || ob.morning,
            afternoon: oa.afternoon || ob.afternoon,
            evening: oa.evening || ob.evening
        };
    }
    return a === true || b === true;
}

function dayCompletedSlots(val, dateStr) {
    if (isMultiSlotDate(dateStr)) {
        const s = normalizeSlots(val);
        return SLOT_KEYS.filter(k => s[k]).length;
    }
    if (val === true) return 1;
    if (val && typeof val === "object") {
        const s = normalizeSlots(val);
        return SLOT_KEYS.every(k => s[k]) ? 1 : (SLOT_KEYS.some(k => s[k]) ? 1 : 0);
    }
    return 0;
}

function dayMaxSlots(dateStr) {
    return isMultiSlotDate(dateStr) ? 3 : 1;
}

function isDayFullyBrushed(val, dateStr) {
    const max = dayMaxSlots(dateStr);
    return max > 0 && dayCompletedSlots(val, dateStr) === max;
}

function isDayAnyBrushed(val, dateStr) {
    return dayCompletedSlots(val, dateStr) > 0;
}

function getSlotTimeWindow(slot) {
    if (slot === "morning") return { start: 6 * 3600, end: 12 * 3600 };
    if (slot === "afternoon") return { start: 12 * 3600, end: 18 * 3600 };
    return { start: 18 * 3600, end: 24 * 3600 };
}

function isSlotEditableNow(dateStr, slot) {
    const now = new Date();
    const todayStr = formatDate(now);
    if (dateStr !== todayStr) return false;
    if (!isMultiSlotDate(dateStr)) return true;
    const secs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const win = getSlotTimeWindow(slot);
    return secs >= win.start && secs < win.end;
}

function formatDate(d) {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function dateInRange(dateStr, start, end) {
    return dateStr >= start && dateStr <= end;
}

let appState = {
    currentStudent: { grade: '', name: '' },
    activeRecord: {},
    enteredPin: "",
    isNewUser: false,
    selectedMonthIndex: 4,
    detailStudent: { grade: '', name: '' },
    detailMonthIdx: 4,
    syncTimer: null,
    connectionIssue: null,
    db: {
        brushing_records: {},
        brushing_pws: {},
        brushing_praises: {}
    }
};

let el = {};

function loadLocalDatabase() {
    appState.db.brushing_records = JSON.parse(localStorage.getItem('brushing_records')) || {};
    appState.db.brushing_pws = JSON.parse(localStorage.getItem('brushing_pws')) || {};
    appState.db.brushing_praises = JSON.parse(localStorage.getItem('brushing_praises')) || {};
}
loadLocalDatabase();

function deepMergeBrushingRecords(local, remote) {
    const merged = JSON.parse(JSON.stringify(local || {}));
    Object.keys(remote || {}).forEach(studentKey => {
        if (!merged[studentKey]) merged[studentKey] = {};
        Object.keys(remote[studentKey] || {}).forEach(date => {
            merged[studentKey][date] = mergeDayValue(merged[studentKey][date], remote[studentKey][date]);
        });
    });
    return merged;
}

function mergeSimpleObjects(local, remote) {
    return { ...(local || {}), ...(remote || {}) };
}

function mergePraises(local, remote) {
    const merged = JSON.parse(JSON.stringify(local || {}));
    Object.keys(remote || {}).forEach(studentKey => {
        if (!merged[studentKey]) merged[studentKey] = {};
        Object.keys(remote[studentKey] || {}).forEach(month => {
            if (remote[studentKey][month] === true) merged[studentKey][month] = true;
        });
    });
    return merged;
}

function persistLocalDatabase() {
    localStorage.setItem('brushing_records', JSON.stringify(appState.db.brushing_records));
    localStorage.setItem('brushing_pws', JSON.stringify(appState.db.brushing_pws));
    localStorage.setItem('brushing_praises', JSON.stringify(appState.db.brushing_praises));
}

window.addEventListener('DOMContentLoaded', () => {
    el.selectGrade = document.getElementById('select-grade');
    el.selectName = document.getElementById('select-name');
    el.btnLoginNext = document.getElementById('btn-login-next');
    el.screenLogin = document.getElementById('screen-login');
    el.screenPassword = document.getElementById('screen-password');
    el.screenCalendar = document.getElementById('screen-calendar');
    el.screenResults = document.getElementById('screen-results');
    el.screenAdmin = document.getElementById('screen-admin');
    el.pwTitle = document.getElementById('pw-title');
    el.pwDesc = document.getElementById('pw-desc');
    el.pwDots = document.querySelectorAll('.pw-dot');
    el.btnPwClear = document.getElementById('btn-pw-clear');
    el.btnPwBack = document.getElementById('btn-pw-back');
    el.btnPwCancel = document.getElementById('btn-pw-cancel');
    el.calendarGrid = document.getElementById('calendar-grid');
    el.calendarMonthSelect = document.getElementById('calendar-month-select');
    el.userInfoDisplay = document.getElementById('user-info-display');
    el.btnSave = document.getElementById('btn-save');
    el.successOverlay = document.getElementById('success-overlay');
    el.successPopupCard = document.getElementById('success-popup-card');
    el.btnSuccessClose = document.getElementById('btn-success-close');
    el.statStreak = document.getElementById('stat-streak');
    el.statMyRate = document.getElementById('stat-my-rate');
    el.statClassRate = document.getElementById('stat-class-rate');
    el.statSchoolRate = document.getElementById('stat-school-rate');
    el.myRateTitle = document.getElementById('my-rate-title');
    el.barMyRate = document.getElementById('bar-my-rate');
    el.barClassRate = document.getElementById('bar-class-rate');
    el.barSchoolRate = document.getElementById('bar-school-rate');
    el.btnBackToMain = document.getElementById('btn-back-to-main');
    el.btnAdminLogout = document.getElementById('btn-admin-logout');
    el.adminBestStudent = document.getElementById('admin-best-student');
    el.adminBestGrade = document.getElementById('admin-best-grade');
    el.adminFilterGrade = document.getElementById('admin-filter-grade');
    el.adminFilterMonth = document.getElementById('admin-filter-month');
    el.adminStudentListContainer = document.getElementById('admin-student-list-container');
    el.classRateToday = document.getElementById('class-rate-today');
    el.classRateThisMonth = document.getElementById('class-rate-this-month');
    el.classRateLastMonth = document.getElementById('class-rate-last-month');
    el.connectionStatusBadge = document.getElementById('connection-status-badge');
    el.connectionStatusText = document.getElementById('connection-status-text');
    el.connectionHelpBanner = document.getElementById('connection-help-banner');
    el.connectionHelpText = document.getElementById('connection-help-text');
    el.loadingOverlay = document.getElementById('loading-overlay');
    el.hofMonthLabel = document.getElementById('hof-month-label');
    el.hofWinners = document.getElementById('hof-winners');
    el.hofSchoolRate = document.getElementById('hof-school-rate');
    el.loginCheer1 = document.getElementById('login-cheer-1');
    el.loginCheer2 = document.getElementById('login-cheer-2');

    initApp();
});

function initApp() {
    syncDefaultMonth();
    updateConnectionBadge(null);
    setLoginCheers();
    renderHallOfFame();

    syncWithAirtable().then(success => {
        updateConnectionBadge(success);
        refreshActiveStudentView();
        renderHallOfFame();
    });

    el.selectGrade.addEventListener('change', () => {
        const grade = el.selectGrade.value;
        el.selectName.innerHTML = '';

        if (!grade) {
            el.selectName.disabled = true;
            el.selectName.innerHTML = '<option value="">-- 학년을 먼저 골라주세요 --</option>';
            return;
        }

        if (grade === "관리자") {
            el.selectName.disabled = true;
            el.selectName.innerHTML = '<option value="관리자">-- 관리자 모드 (이름 불필요) --</option>';
            return;
        }

        el.selectName.disabled = false;
        el.selectName.innerHTML = '<option value="">-- 이름을 고르세요 --</option>';
        (studentsData[grade] || []).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            el.selectName.appendChild(opt);
        });
    });

    el.btnLoginNext.addEventListener('click', async () => {
        const grade = el.selectGrade.value;
        const name = el.selectName.value;

        if (!grade) { alert('학년을 선택해 주세요.'); return; }
        if (grade !== "관리자" && !name) { alert('이름을 선택해 주세요.'); return; }

        el.loadingOverlay.classList.remove('hidden');
        await syncWithAirtable();
        el.loadingOverlay.classList.add('hidden');

        appState.currentStudent = { grade, name: grade === "관리자" ? "관리자" : name };

        if (grade === "관리자") {
            appState.isNewUser = false;
            el.pwTitle.textContent = "🔓 관리자 로그인";
            el.pwDesc.textContent = "관리자 비밀번호 4자리를 패드에 입력해 주세요.";
        } else {
            const studentKey = `${grade}-${name}`;
            const pws = appState.db.brushing_pws || {};
            if (!pws[studentKey]) {
                appState.isNewUser = true;
                el.pwTitle.textContent = "🔒 첫 접속! 비밀번호 설정";
                el.pwDesc.textContent = "앞으로 로그인할 때 사용할 비밀번호 4자리를 정해 주세요.";
            } else {
                appState.isNewUser = false;
                el.pwTitle.textContent = "🔓 비밀번호 입력";
                el.pwDesc.textContent = "가입할 때 지정한 비밀번호 4자리를 입력해 주세요.";
            }
        }

        appState.enteredPin = "";
        updatePwDots();
        el.screenLogin.classList.add('hidden');
        el.screenPassword.classList.remove('hidden');
    });

    document.querySelectorAll('.btn-num').forEach(btn => {
        btn.addEventListener('click', () => {
            if (appState.enteredPin.length >= 4) return;
            appState.enteredPin += btn.getAttribute('data-num');
            updatePwDots();
            if (appState.enteredPin.length === 4) setTimeout(verifyOrSetPassword, 200);
        });
    });

    el.btnPwClear.addEventListener('click', () => { appState.enteredPin = ""; updatePwDots(); });
    el.btnPwBack.addEventListener('click', () => { appState.enteredPin = appState.enteredPin.slice(0, -1); updatePwDots(); });
    el.btnPwCancel.addEventListener('click', () => {
        el.screenPassword.classList.add('hidden');
        el.screenLogin.classList.remove('hidden');
    });

    el.calendarMonthSelect.addEventListener('change', () => {
        appState.selectedMonthIndex = parseInt(el.calendarMonthSelect.value);
        buildCalendar();
        updateClassStatsWidget();
    });

    el.btnSave.addEventListener('click', async () => {
        el.loadingOverlay.classList.remove('hidden');
        await syncWithAirtable();
        const studentKey = `${appState.currentStudent.grade}-${appState.currentStudent.name}`;
        appState.db.brushing_records[studentKey] = appState.activeRecord;
        await saveToAirtable('brushing_records', appState.db.brushing_records);
        calculateIndividualStats();
        el.loadingOverlay.classList.add('hidden');
        stopPeriodicSync();
        el.screenCalendar.classList.add('hidden');
        el.screenResults.classList.remove('hidden');
    });

    el.btnBackToMain.addEventListener('click', resetToLogin);
    el.btnAdminLogout.addEventListener('click', resetToLogin);

    el.adminFilterGrade.addEventListener('change', renderAdminStudentList);
    el.adminFilterMonth.addEventListener('change', () => {
        updateAdminGlobalStats();
        renderAdminStudentList();
    });

    document.getElementById('detail-month-select').addEventListener('change', (e) => {
        appState.detailMonthIdx = parseInt(e.target.value);
        renderStudentDetailView();
    });

    document.getElementById('btn-send-praise').addEventListener('click', async () => {
        const { grade, name } = appState.detailStudent;
        const monthIdx = appState.detailMonthIdx;
        const studentKey = `${grade}-${name}`;
        el.loadingOverlay.classList.remove('hidden');
        const praises = appState.db.brushing_praises || {};
        if (!praises[studentKey]) praises[studentKey] = {};
        praises[studentKey][monthIdx] = true;
        await saveToAirtable('brushing_praises', praises);
        renderStudentDetailView();
        renderAdminStudentList();
        el.loadingOverlay.classList.add('hidden');
        alert(`${name} 학생에게 성공적으로 축하 인사를 발송했습니다! 해당 학생이 다음 로그인 시 축하 모달을 마주하게 됩니다.`);
    });

    el.btnSuccessClose.addEventListener('click', () => {
        el.successOverlay.classList.add('hidden');
        el.successPopupCard.classList.remove('bounce-twice');
    });

    document.getElementById('btn-praise-close').addEventListener('click', () => {
        document.getElementById('praise-overlay').classList.add('hidden');
    });
}

function resetToLogin() {
    stopPeriodicSync();
    el.selectGrade.value = "";
    el.selectName.innerHTML = '<option value="">-- 학년을 먼저 골라주세요 --</option>';
    el.selectName.disabled = true;
    el.screenResults.classList.add('hidden');
    el.screenAdmin.classList.add('hidden');
    el.screenCalendar.classList.add('hidden');
    el.screenPassword.classList.add('hidden');
    el.screenLogin.classList.remove('hidden');
    setLoginCheers();
    renderHallOfFame();
}

function refreshActiveStudentView() {
    if (!appState.currentStudent.grade || appState.currentStudent.grade === '관리자') return;
    if (el.screenCalendar.classList.contains('hidden')) return;
    const studentKey = `${appState.currentStudent.grade}-${appState.currentStudent.name}`;
    appState.activeRecord = appState.db.brushing_records[studentKey] || {};
    buildCalendar();
    updateClassStatsWidget();
}

function startPeriodicSync() {
    stopPeriodicSync();
    appState.syncTimer = setInterval(async () => {
        if (el.screenCalendar.classList.contains('hidden')) return;
        const success = await syncWithAirtable();
        updateConnectionBadge(success);
        refreshActiveStudentView();
    }, SYNC_INTERVAL_MS);
}

function stopPeriodicSync() {
    if (appState.syncTimer) {
        clearInterval(appState.syncTimer);
        appState.syncTimer = null;
    }
}

async function syncWithAirtable() {
    const issue = getCloudModeIssue();
    if (issue) {
        appState.connectionIssue = issue;
        return false;
    }
    if (!isCloudMode) {
        appState.connectionIssue = "클라우드 설정을 확인해 주세요.";
        return false;
    }

    try {
        const url = airtableTableUrl("?maxRecords=100");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${AIRTABLE_TOKEN}` },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const result = await response.json();
            if (result && result.records) {
                let tempRecords = {}, tempPws = {}, tempPraises = {};
                result.records.forEach(rec => {
                    const { key, val } = readAirtableRecordFields(rec.fields || {});
                    if (key && val) {
                        try {
                            const parsed = JSON.parse(val);
                            if (key === 'brushing_records') tempRecords = parsed;
                            if (key === 'brushing_pws') tempPws = parsed;
                            if (key === 'brushing_praises') tempPraises = parsed;
                        } catch (e) {
                            console.error("JSON 파싱 오류:", e);
                        }
                    }
                });

                appState.db.brushing_records = deepMergeBrushingRecords(appState.db.brushing_records, tempRecords);
                appState.db.brushing_pws = mergeSimpleObjects(appState.db.brushing_pws, tempPws);
                appState.db.brushing_praises = mergePraises(appState.db.brushing_praises, tempPraises);
                persistLocalDatabase();
            }
            appState.connectionIssue = null;
            return true;
        }

        let apiHint = "";
        try {
            const errJson = JSON.parse(await response.text());
            if (errJson.error && errJson.error.message) apiHint = ` (${errJson.error.message})`;
        } catch (_) { /* ignore */ }

        if (response.status === 401) {
            appState.connectionIssue = `토큰이 잘못되었거나 만료되었습니다. 새 pat 토큰을 config.js에 넣으세요.${apiHint}`;
        } else if (response.status === 403) {
            appState.connectionIssue = `토큰에 이 Base 권한이 없습니다. 토큰 Access에서 Base ID ${AIRTABLE_BASE_ID} 와 같은 Base를 추가하세요.${apiHint}`;
        } else if (response.status === 404) {
            appState.connectionIssue = `Base ID 또는 테이블 이름 "${AIRTABLE_TABLE_NAME}" 이 틀렸습니다. Airtable 왼쪽 하단 표 이름과 config.js 를 맞추세요.${apiHint}`;
        } else {
            appState.connectionIssue = `Airtable 연결 실패 (HTTP ${response.status})${apiHint}. airtable-check.html 로 확인하세요.`;
        }
    } catch (e) {
        console.warn("에어테이블 통신 지연. 로컬 보존 모드로 작동합니다.", e);
        if (isFileProtocol) {
            appState.connectionIssue = "index.html 을 직접 열면 연결되지 않습니다. start.bat 으로 실행하세요.";
        } else {
            appState.connectionIssue = "인터넷 연결 또는 Airtable 접속을 확인해 주세요.";
        }
    }
    return false;
}

async function saveToAirtable(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    appState.db[key] = data;
    if (!isCloudMode) return;

    try {
        await syncWithAirtable();
        if (key === 'brushing_records') {
            appState.db.brushing_records = deepMergeBrushingRecords(appState.db.brushing_records, data);
        } else {
            appState.db[key] = mergeSimpleObjects(appState.db[key], data);
        }
        const mergedData = appState.db[key];
        persistLocalDatabase();

        const fieldKey = getAirtableFieldKeyName();
        const fieldValue = getAirtableFieldValueName();
        const escapedKey = key.replace(/'/g, "\\'");
        const selectUrl = `${airtableTableUrl()}?filterByFormula=({${fieldKey}}='${escapedKey}')`;
        const response = await fetch(selectUrl, { headers: { "Authorization": `Bearer ${AIRTABLE_TOKEN}` } });
        if (!response.ok) return;

        const result = await response.json();
        const valueStr = JSON.stringify(mergedData);
        const headers = {
            "Authorization": `Bearer ${AIRTABLE_TOKEN}`,
            "Content-Type": "application/json"
        };
        const recordFields = { [fieldKey]: key, [fieldValue]: valueStr };

        if (result && result.records && result.records.length > 0) {
            await fetch(`${airtableTableUrl()}/${result.records[0].id}`, {
                method: "PATCH", headers, body: JSON.stringify({ fields: { [fieldValue]: valueStr } })
            });
        } else {
            await fetch(airtableTableUrl(), {
                method: "POST", headers,
                body: JSON.stringify({ records: [{ fields: recordFields }] })
            });
        }
    } catch (e) {
        console.error("백그라운드 클라우드 기록 저장 실패:", e);
    }
}

async function verifyOrSetPassword() {
    if (appState.currentStudent.grade === "관리자") {
        if (appState.enteredPin === ADMIN_PASSWORD) {
            enterAdminDashboard();
        } else {
            alert('관리자 비밀번호가 일치하지 않습니다.');
            appState.enteredPin = "";
            updatePwDots();
        }
        return;
    }

    const studentKey = `${appState.currentStudent.grade}-${appState.currentStudent.name}`;
    const pws = appState.db.brushing_pws;

    if (appState.isNewUser) {
        pws[studentKey] = appState.enteredPin;
        await saveToAirtable('brushing_pws', pws);
        await enterCalendarScreen();
    } else if (pws[studentKey] === appState.enteredPin) {
        await enterCalendarScreen();
    } else {
        alert('비밀번호가 맞지 않습니다. 다시 확인해 주세요.');
        appState.enteredPin = "";
        updatePwDots();
    }
}

async function enterCalendarScreen() {
    el.loadingOverlay.classList.remove('hidden');
    await syncWithAirtable();
    el.loadingOverlay.classList.add('hidden');

    el.screenPassword.classList.add('hidden');
    el.screenCalendar.classList.remove('hidden');
    el.userInfoDisplay.textContent = `😊 [${appState.currentStudent.grade}] ${appState.currentStudent.name} 학생`;

    const studentKey = `${appState.currentStudent.grade}-${appState.currentStudent.name}`;
    appState.activeRecord = { ...(appState.db.brushing_records[studentKey] || {}) };

    syncDefaultMonth();
    buildCalendar();
    updateClassStatsWidget();
    checkAndShowPraiseModal();
    startPeriodicSync();
}

function checkAndShowPraiseModal() {
    const studentKey = `${appState.currentStudent.grade}-${appState.currentStudent.name}`;
    const praises = appState.db.brushing_praises;
    if (praises && praises[studentKey]) {
        const pendingMonths = Object.keys(praises[studentKey]).filter(m => praises[studentKey][m] === true);
        if (pendingMonths.length > 0) {
            const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
            const monthStr = pendingMonths.map(m => monthNames[parseInt(m)]).join(', ');
            document.getElementById('praise-text').innerHTML = `
                🏆 <span class="text-amber-600 font-black text-lg">${monthStr}의 양치왕</span> 🏆<br>
                <span class="text-xl font-bold text-slate-800">${appState.currentStudent.name}</span> 학생 축하합니다!<br>
                이번 달도 힘내보아요! 🪥👑
            `;
            document.getElementById('praise-overlay').classList.remove('hidden');
            delete praises[studentKey];
            saveToAirtable('brushing_praises', praises);
        }
    }
}

function buildCalendar() {
    el.calendarGrid.innerHTML = '';
    const year = 2026;
    const month = appState.selectedMonthIndex;
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayIndex = firstDayOfMonth.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayObj = new Date();
    const todayMidnight = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate()).getTime();

    for (let i = 0; i < startingDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = "bg-gray-50/50 rounded-xl";
        el.calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
        const cellDate = new Date(year, month, day);
        const cellTime = cellDate.getTime();
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const cell = document.createElement('div');
        const dayOfWeek = (startingDayIndex + day - 1) % 7;
        let textColor = dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-800';
        const dayVal = appState.activeRecord[dateStr];
        const excludedStatus = isExcludedDate(dateStr);
        const multi = isMultiSlotDate(dateStr);

        if (excludedStatus.excluded) {
            cell.className = getExcludedCellClass(excludedStatus.type);
            cell.innerHTML = getExcludedCellHTML(day, excludedStatus, textColor);
        } else {
            const isToday = cellTime === todayMidnight;
            const isFuture = cellTime > todayMidnight;
            if (multi) {
                cell.className = isToday
                    ? `border-4 border-teal-400 rounded-2xl flex flex-col p-1 bg-white shadow-lg ring-2 ring-teal-100 z-10`
                    : isFuture
                        ? `border border-slate-200 rounded-2xl flex flex-col p-1 bg-slate-50 opacity-50`
                        : `border border-slate-200 rounded-2xl flex flex-col p-1 bg-slate-50/80`;
                cell.innerHTML = getMultiSlotCellHTML(day, textColor, dayVal, dateStr, isToday, isFuture);
                if (isToday) {
                    cell.querySelectorAll('[data-slot]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            toggleSlotStatus(dateStr, btn.getAttribute('data-slot'), cell, dayOfWeek);
                        });
                    });
                }
            } else if (isToday) {
                const isBrushed = dayVal === true || isDayFullyBrushed(dayVal, dateStr);
                cell.className = `border-4 border-teal-400 rounded-2xl flex flex-col justify-between p-2 cursor-pointer transition-all active:scale-95 bg-white shadow-lg ring-4 ring-teal-100 ring-offset-1 z-10`;
                if (isBrushed) cell.classList.add('bg-teal-50');
                cell.innerHTML = getTodayCellHTML(day, textColor, isBrushed);
                cell.addEventListener('click', () => toggleBrushingStatus(dateStr, cell, dayOfWeek));
            } else if (isFuture) {
                cell.className = `border border-slate-200 rounded-2xl flex flex-col justify-between p-2 bg-slate-50 opacity-50 pointer-events-none`;
                cell.innerHTML = `<div class="font-sans font-bold text-base md:text-lg text-slate-400">${day}</div><div class="flex-1 flex flex-col items-center justify-center"><span class="text-xl md:text-2xl text-slate-400 font-sans">❓</span></div>`;
            } else {
                const isBrushed = dayVal === true || isDayAnyBrushed(dayVal, dateStr);
                cell.className = `border border-slate-200 rounded-2xl flex flex-col justify-between p-2 bg-slate-100/50 opacity-60 pointer-events-none`;
                cell.innerHTML = `<div class="font-sans font-bold text-base md:text-lg ${textColor}">${day}</div><div class="flex-1 flex flex-col items-center justify-center">${isBrushed ? '<span class="text-3xl md:text-4xl filter grayscale opacity-45">🪥</span>' : '<span class="text-base text-slate-300 font-sans">❌</span>'}</div>`;
            }
        }
        el.calendarGrid.appendChild(cell);
    }
}

function getMultiSlotCellHTML(day, textColor, dayVal, dateStr, isToday, isFuture) {
    const slots = normalizeSlots(dayVal);
    const badge = isToday ? '<span class="text-[9px] bg-teal-500 text-white px-1 rounded-full font-sans">오늘</span>' : '';
    const buttons = SLOT_KEYS.map(slot => {
        const done = slots[slot];
        const editable = isToday && isSlotEditableNow(dateStr, slot);
        const locked = isToday && !editable;
        let cls = done
            ? 'bg-teal-500 text-white'
            : locked
                ? 'bg-slate-100 text-slate-300'
                : isFuture
                    ? 'bg-slate-50 text-slate-300'
                    : 'bg-white text-teal-700 border border-teal-200';
        const cursor = editable ? 'cursor-pointer active:scale-95' : 'pointer-events-none';
        return `<button type="button" data-slot="${slot}" class="${cls} ${cursor} text-[9px] md:text-[10px] font-bold rounded-lg py-0.5 px-0.5 leading-tight">${SLOT_LABELS[slot]}${done ? '✓' : ''}</button>`;
    }).join('');
    return `<div class="font-sans font-bold text-xs ${textColor} flex justify-between items-center px-0.5">${day}${badge}</div><div class="flex-1 grid grid-cols-1 gap-0.5 mt-0.5">${buttons}</div>`;
}

function getExcludedCellClass(type) {
    const map = {
        vacation: 'border border-amber-200 rounded-2xl flex flex-col justify-between p-1 bg-amber-50/60 pointer-events-none relative overflow-hidden',
        experience: 'border border-indigo-200 rounded-2xl flex flex-col justify-between p-1 bg-indigo-50/70 pointer-events-none',
        festival: 'border border-pink-200 rounded-2xl flex flex-col justify-between p-1 bg-pink-50/70 pointer-events-none',
        holiday: 'border border-red-200 rounded-2xl flex flex-col justify-between p-1 bg-red-50/50 pointer-events-none'
    };
    return map[type] || 'border border-slate-200 rounded-2xl flex flex-col justify-between p-1.5 bg-slate-50 opacity-40 pointer-events-none';
}

function getExcludedCellHTML(day, excludedStatus, textColor) {
    if (excludedStatus.type === 'vacation') {
        return `<div class="font-sans font-bold text-xs text-amber-600">${day}</div><div class="flex-1 flex flex-col items-center justify-center text-center gap-0.5"><span class="text-[9px] bg-amber-200 text-amber-800 px-1 rounded font-sans font-bold leading-tight">여름방학 🏖️</span><span class="text-[8px] text-amber-600 font-sans leading-none scale-90">집에서도 열심히!</span></div>`;
    }
    if (excludedStatus.type === 'experience') {
        return `<div class="font-sans font-bold text-xs text-indigo-600">${day}</div><div class="flex-1 flex flex-col items-center justify-center text-center gap-1"><span class="text-[9px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-sans font-bold">현장체험 🚌</span></div>`;
    }
    if (excludedStatus.type === 'festival') {
        return `<div class="font-sans font-bold text-xs text-pink-600">${day}</div><div class="flex-1 flex flex-col items-center justify-center text-center gap-1"><span class="text-[9px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-sans font-bold">학예회 🎭</span></div>`;
    }
    if (excludedStatus.type === 'holiday') {
        return `<div class="font-sans font-bold text-xs text-red-500">${day}</div><div class="flex-1 flex flex-col items-center justify-center text-center gap-1"><span class="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-sans font-bold scale-90">${excludedStatus.reason}</span></div>`;
    }
    return `<div class="font-sans font-bold text-xs ${textColor}">${day}</div><div class="flex-1 flex flex-col items-center justify-center"><span class="text-[10px] text-slate-400 font-sans">${excludedStatus.reason}</span></div>`;
}

function getTodayCellHTML(day, textColor, isBrushed) {
    return `<div class="font-sans font-black text-base md:text-lg ${textColor} flex justify-between items-center"><span>${day}</span><span class="text-[10px] bg-teal-500 text-white px-1.5 py-0.5 rounded-full font-sans">오늘</span></div><div class="flex-1 flex items-center justify-center">${isBrushed ? '<span class="text-3xl md:text-4xl filter drop-shadow animate-pulse">🪥</span>' : '<span class="text-xl text-gray-300">❌</span>'}</div>`;
}

function toggleBrushingStatus(dateStr, cellElement, dayOfWeek) {
    const newStatus = !(appState.activeRecord[dateStr] === true || isDayFullyBrushed(appState.activeRecord[dateStr], dateStr));
    appState.activeRecord[dateStr] = newStatus;
    const studentKey = `${appState.currentStudent.grade}-${appState.currentStudent.name}`;
    appState.db.brushing_records[studentKey] = { ...appState.activeRecord };
    saveToAirtable('brushing_records', appState.db.brushing_records);

    let textColor = dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-800';
    const dayNum = parseInt(dateStr.split('-')[2]);

    if (newStatus) {
        cellElement.classList.add('bg-teal-50');
        triggerConfetti();
    } else {
        cellElement.classList.remove('bg-teal-50');
    }
    cellElement.innerHTML = getTodayCellHTML(dayNum, textColor, newStatus);
    updateClassStatsWidget();
}

function toggleSlotStatus(dateStr, slot, cellElement, dayOfWeek) {
    if (!isSlotEditableNow(dateStr, slot)) {
        alert(`${SLOT_LABELS[slot]} 칸은 해당 시간대에만 입력할 수 있어요.`);
        return;
    }
    const prev = normalizeSlots(appState.activeRecord[dateStr]);
    const wasComplete = SLOT_KEYS.every(k => prev[k]);
    prev[slot] = !prev[slot];
    appState.activeRecord[dateStr] = { ...prev };
    const studentKey = `${appState.currentStudent.grade}-${appState.currentStudent.name}`;
    appState.db.brushing_records[studentKey] = { ...appState.activeRecord };
    saveToAirtable('brushing_records', appState.db.brushing_records);

    const dayNum = parseInt(dateStr.split('-')[2]);
    let textColor = dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-800';
    cellElement.innerHTML = getMultiSlotCellHTML(dayNum, textColor, appState.activeRecord[dateStr], dateStr, true, false);
    cellElement.querySelectorAll('[data-slot]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSlotStatus(dateStr, btn.getAttribute('data-slot'), cellElement, dayOfWeek);
        });
    });

    const nowComplete = SLOT_KEYS.every(k => prev[k]);
    if (nowComplete && !wasComplete) triggerConfetti();
    updateClassStatsWidget();
}

function triggerConfetti() {
    el.successOverlay.classList.remove('hidden');
    el.successPopupCard.classList.add('bounce-twice');
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];
    for (let i = 0; i < 40; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.animationDuration = (Math.random() * 1.8 + 1.2) + 's';
        conf.style.animationDelay = (Math.random() * 0.3) + 's';
        if (Math.random() > 0.5) conf.style.borderRadius = '0%';
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 3200);
    }
}

function getSummerRateDatesFull() {
    const dates = [];
    let d = new Date(2026, 6, 25);
    const end = new Date(2026, 7, 31);
    while (d <= end) {
        const ds = formatDate(d);
        if (!isExcludedDate(ds).excluded || isOpenInputDate(ds)) dates.push(ds);
        d.setDate(d.getDate() + 1);
    }
    return dates;
}

function getRatePeriodDatesUntilToday(monthIndex) {
    const todayStr = formatDate(new Date());
    if (new Date().getFullYear() !== 2026) return [];

    if (isSummerRateMonth(monthIndex)) {
        return getSummerRateDatesFull().filter(ds => ds <= todayStr);
    }
    return getEligibleDatesUntilToday(monthIndex);
}

function countRecordSlots(record, dates) {
    let done = 0, max = 0;
    dates.forEach(d => {
        max += dayMaxSlots(d);
        done += dayCompletedSlots(record[d], d);
    });
    return { done, max };
}

function updateClassStatsWidget() {
    const grade = appState.currentStudent.grade;
    const classmates = studentsData[grade] || [];
    if (classmates.length === 0) return;

    const todayStr = formatDate(new Date());
    const isTodayEx = isExcludedDate(todayStr).excluded;

    if (isTodayEx) {
        el.classRateToday.textContent = "공휴일/휴무";
        el.classRateToday.className = "text-sm text-gray-400 font-bold font-sans";
    } else {
        let todayDone = 0, todayMax = 0;
        classmates.forEach(name => {
            const val = appState.db.brushing_records[`${grade}-${name}`]?.[todayStr];
            todayDone += dayCompletedSlots(val, todayStr);
            todayMax += dayMaxSlots(todayStr);
        });
        el.classRateToday.textContent = todayMax > 0 ? `${Math.round((todayDone / todayMax) * 100)}%` : "0%";
        el.classRateToday.className = "text-xl font-bold text-teal-600 font-sans";
    }

    const periodDates = getRatePeriodDatesUntilToday(appState.selectedMonthIndex);
    if (periodDates.length > 0) {
        let totalDone = 0, totalMax = 0;
        classmates.forEach(name => {
            const c = countRecordSlots(appState.db.brushing_records[`${grade}-${name}`] || {}, periodDates);
            totalDone += c.done;
            totalMax += c.max;
        });
        el.classRateThisMonth.textContent = totalMax > 0 ? `${Math.round((totalDone / totalMax) * 100)}%` : "0%";
    } else {
        el.classRateThisMonth.textContent = "기록 없음";
    }

    if (appState.selectedMonthIndex > 4) {
        const lastIdx = appState.selectedMonthIndex - 1;
        let lastDates;
        if (isSummerRateMonth(lastIdx)) lastDates = getSummerRateDatesFull();
        else lastDates = getPossibleDatesForMonth(lastIdx);
        if (lastDates.length > 0) {
            let totalDone = 0, totalMax = 0;
            classmates.forEach(name => {
                const c = countRecordSlots(appState.db.brushing_records[`${grade}-${name}`] || {}, lastDates);
                totalDone += c.done;
                totalMax += c.max;
            });
            el.classRateLastMonth.textContent = totalMax > 0 ? `${Math.round((totalDone / totalMax) * 100)}%` : (HISTORICAL_HALL_OF_FAME[lastIdx] ? "기록 보관" : "0%");
        } else {
            el.classRateLastMonth.textContent = "0%";
        }
    } else {
        el.classRateLastMonth.textContent = "시작 전";
    }
}

function calculateIndividualStats() {
    const eligibleDates = getRatePeriodDatesUntilToday(appState.selectedMonthIndex);
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    el.myRateTitle.textContent = isSummerRateMonth(appState.selectedMonthIndex)
        ? "여름방학 기간 나의 실천율"
        : `${monthNames[appState.selectedMonthIndex]} 나의 실천율`;

    let currentStreak = 0;
    if (eligibleDates.length > 0) {
        let checkStartIndex = eligibleDates.length - 1;
        const lastDate = eligibleDates[eligibleDates.length - 1];
        const prevDate = eligibleDates.length > 1 ? eligibleDates[eligibleDates.length - 2] : null;
        const lastChecked = isDayFullyBrushed(appState.activeRecord[lastDate], lastDate);
        const prevChecked = prevDate ? isDayFullyBrushed(appState.activeRecord[prevDate], prevDate) : false;
        if (lastChecked || prevChecked) {
            if (!lastChecked) checkStartIndex = eligibleDates.length - 2;
            for (let i = checkStartIndex; i >= 0; i--) {
                if (isDayFullyBrushed(appState.activeRecord[eligibleDates[i]], eligibleDates[i])) currentStreak++;
                else break;
            }
        }
    }
    el.statStreak.textContent = `${currentStreak}일`;

    const myCount = countRecordSlots(appState.activeRecord, eligibleDates);
    const myRatePercent = myCount.max > 0 ? Math.round((myCount.done / myCount.max) * 100) : 0;
    el.statMyRate.textContent = `${myRatePercent}%`;
    el.barMyRate.style.width = `${myRatePercent}%`;

    const grade = appState.currentStudent.grade;
    const classmates = studentsData[grade] || [];
    let totalClassDone = 0, totalClassMax = 0;
    classmates.forEach(name => {
        const c = countRecordSlots(appState.db.brushing_records[`${grade}-${name}`] || {}, eligibleDates);
        totalClassDone += c.done;
        totalClassMax += c.max;
    });
    const classRatePercent = totalClassMax > 0 ? Math.round((totalClassDone / totalClassMax) * 100) : 0;
    el.statClassRate.textContent = `${classRatePercent}%`;
    el.barClassRate.style.width = `${classRatePercent}%`;

    let totalSchoolDone = 0, totalSchoolMax = 0;
    Object.keys(studentsData).forEach(g => {
        studentsData[g].forEach(n => {
            const c = countRecordSlots(appState.db.brushing_records[`${g}-${n}`] || {}, eligibleDates);
            totalSchoolDone += c.done;
            totalSchoolMax += c.max;
        });
    });
    const schoolRatePercent = totalSchoolMax > 0 ? Math.round((totalSchoolDone / totalSchoolMax) * 100) : 0;
    el.statSchoolRate.textContent = `${schoolRatePercent}%`;
    el.barSchoolRate.style.width = `${schoolRatePercent}%`;
}

async function enterAdminDashboard() {
    el.screenPassword.classList.add('hidden');
    el.screenAdmin.classList.remove('hidden');
    el.loadingOverlay.classList.remove('hidden');
    await syncWithAirtable();
    const today = new Date();
    el.adminFilterMonth.value = (today.getFullYear() === 2026 && today.getMonth() >= 4 && today.getMonth() <= 11) ? today.getMonth() : "4";
    updateAdminGlobalStats();
    renderAdminStudentList();
    el.loadingOverlay.classList.add('hidden');
}

function updateAdminGlobalStats() {
    const selectedMonthIdx = parseInt(el.adminFilterMonth.value);
    const possibleDates = isSummerRateMonth(selectedMonthIdx) ? getSummerRateDatesFull() : getPossibleDatesForMonth(selectedMonthIdx);
    const studentStreakList = [];
    let globalMaxStreak = 0;

    Object.keys(studentsData).forEach(g => {
        studentsData[g].forEach(name => {
            const streak = getMaxStreak(appState.db.brushing_records[`${g}-${name}`] || {}, possibleDates);
            studentStreakList.push({ grade: g, name, streak });
            if (streak > globalMaxStreak) globalMaxStreak = streak;
        });
    });

    el.adminBestStudent.innerHTML = globalMaxStreak > 0
        ? studentStreakList.filter(s => s.streak === globalMaxStreak).map(s => `<span class="text-teal-600">[${s.grade}] ${s.name}</span> (${globalMaxStreak}일)`).join(', ')
        : "기록 없음";

    const gradeRateList = [];
    let globalMaxGradeRate = -1;
    Object.keys(studentsData).forEach(g => {
        let totalBrushed = 0;
        let totalSlots = 0;
        studentsData[g].forEach(name => {
            const sRecord = appState.db.brushing_records[`${g}-${name}`] || {};
            const c = countRecordSlots(sRecord, possibleDates);
            totalBrushed += c.done;
            totalSlots += c.max;
        });
        const rate = totalSlots > 0 ? (totalBrushed / totalSlots) * 100 : 0;
        gradeRateList.push({ grade: g, rate });
        if (rate > globalMaxGradeRate) globalMaxGradeRate = rate;
    });

    el.adminBestGrade.innerHTML = globalMaxGradeRate > 0
        ? gradeRateList.filter(g => Math.round(g.rate) === Math.round(globalMaxGradeRate)).map(g => `<span class="text-blue-600">${g.grade}</span> (${Math.round(g.rate)}%)`).join(', ')
        : "기록 없음";
}

function calculateCrowns(targetGrade, targetName, monthIdx) {
    const possibleDates = isSummerRateMonth(monthIdx) ? getSummerRateDatesFull() : getPossibleDatesForMonth(monthIdx);
    if (possibleDates.length === 0) return 0;

    const getRate = (g, name) => {
        const sRecord = appState.db.brushing_records[`${g}-${name}`] || {};
        const c = countRecordSlots(sRecord, possibleDates);
        return c.max > 0 ? (c.done / c.max) * 100 : 0;
    };

    const targetRate = getRate(targetGrade, targetName);
    if (targetRate === 0) return 0;

    let maxGradeRate = 0;
    (studentsData[targetGrade] || []).forEach(name => {
        const r = getRate(targetGrade, name);
        if (r > maxGradeRate) maxGradeRate = r;
    });

    let maxSchoolRate = 0;
    Object.keys(studentsData).forEach(g => {
        studentsData[g].forEach(name => {
            const r = getRate(g, name);
            if (r > maxSchoolRate) maxSchoolRate = r;
        });
    });

    if (Math.round(targetRate) === Math.round(maxSchoolRate)) return 2;
    if (Math.round(targetRate) === Math.round(maxGradeRate)) return 1;
    return 0;
}

function renderAdminStudentList() {
    el.adminStudentListContainer.innerHTML = '';
    const selectedGrade = el.adminFilterGrade.value;
    const studentsInGrade = studentsData[selectedGrade] || [];
    const selectedMonthIdx = parseInt(el.adminFilterMonth.value);
    const possibleDates = isSummerRateMonth(selectedMonthIdx) ? getSummerRateDatesFull() : getPossibleDatesForMonth(selectedMonthIdx);

    studentsInGrade.forEach(name => {
        const studentKey = `${selectedGrade}-${name}`;
        const sRecord = appState.db.brushing_records[studentKey] || {};
        const sPw = appState.db.brushing_pws[studentKey];
        const slotCount = countRecordSlots(sRecord, possibleDates);
        const brushedDays = slotCount.done;
        const maxStreak = getMaxStreak(sRecord, possibleDates);
        const rate = slotCount.max > 0 ? Math.round((slotCount.done / slotCount.max) * 100) : 0;
        const crowns = calculateCrowns(selectedGrade, name, selectedMonthIdx);
        let crownIcons = crowns === 2 ? ' 👑👑' : crowns === 1 ? ' 👑' : '';

        const row = document.createElement('div');
        row.className = "grid grid-cols-5 gap-1 p-3 items-center hover:bg-slate-100 transition-colors text-center text-sm md:text-base";
        row.innerHTML = `
            <div class="font-bold text-slate-800 cursor-pointer hover:underline hover:text-teal-600 flex items-center justify-center gap-1" onclick="openStudentDetail('${selectedGrade}', '${name}')">
                🔍 <span>${name}${crownIcons}</span>
            </div>
            <div class="font-bold text-blue-500 font-sans">${rate}%</div>
            <div class="text-slate-600 font-sans">${brushedDays} / ${slotCount.max}칸</div>
            <div class="text-amber-600 font-bold font-sans">${maxStreak}일</div>
            <div>${sPw ? `<button onclick="resetStudentPassword('${selectedGrade}', '${name}')" class="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-all">🔑 초기화</button>` : `<span class="text-gray-400 text-xs font-sans">미설정</span>`}</div>
        `;
        el.adminStudentListContainer.appendChild(row);
    });
}

window.openStudentDetail = function(grade, name) {
    appState.detailStudent = { grade, name };
    appState.detailMonthIdx = parseInt(el.adminFilterMonth.value);
    document.getElementById('detail-month-select').value = appState.detailMonthIdx;
    document.getElementById('modal-student-detail').classList.remove('hidden');
    renderStudentDetailView();
};

window.closeStudentDetail = function() {
    document.getElementById('modal-student-detail').classList.add('hidden');
};

window.renderStudentDetailView = function() {
    const { grade, name } = appState.detailStudent;
    const monthIdx = appState.detailMonthIdx;
    const studentKey = `${grade}-${name}`;
    document.getElementById('detail-title').textContent = `🔍 [${grade}] ${name} 학생 상세 기록`;
    const sRecord = appState.db.brushing_records[studentKey] || {};
    const possibleDates = isSummerRateMonth(monthIdx) ? getSummerRateDatesFull() : getPossibleDatesForMonth(monthIdx);
    const slotCount = countRecordSlots(sRecord, possibleDates);
    const brushedDays = slotCount.done;
    const maxStreak = getMaxStreak(sRecord, possibleDates);
    const rate = slotCount.max > 0 ? Math.round((slotCount.done / slotCount.max) * 100) : 0;
    document.getElementById('detail-stat-rate').textContent = `${rate}%`;
    document.getElementById('detail-stat-streak').textContent = `${maxStreak}일`;

    const crowns = calculateCrowns(grade, name, monthIdx);
    const crownsDisplay = document.getElementById('detail-crowns');
    const sendPraiseBtn = document.getElementById('btn-send-praise');
    if (crowns === 2) {
        crownsDisplay.innerHTML = '👑👑 <span class="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold ml-1">전교 1위 양치왕</span>';
        sendPraiseBtn.classList.remove('hidden');
        const isAlreadyPraised = appState.db.brushing_praises[studentKey]?.[monthIdx] === true;
        sendPraiseBtn.textContent = isAlreadyPraised ? '✅ 칭찬 전송 완료!' : '📢 칭찬 보내기';
        sendPraiseBtn.disabled = isAlreadyPraised;
        sendPraiseBtn.className = isAlreadyPraised
            ? "bg-gray-300 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm cursor-not-allowed"
            : "bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95";
    } else if (crowns === 1) {
        crownsDisplay.innerHTML = '👑 <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold ml-1">학년 1위 우수자</span>';
        sendPraiseBtn.classList.add('hidden');
    } else {
        crownsDisplay.innerHTML = '<span class="text-xs text-gray-400 font-normal">획득한 왕관 없음</span>';
        sendPraiseBtn.classList.add('hidden');
    }

    const detailGrid = document.getElementById('detail-calendar-grid');
    detailGrid.innerHTML = '';
    const year = 2026;
    const startingDayIndex = new Date(year, monthIdx, 1).getDay();
    const totalDays = new Date(year, monthIdx + 1, 0).getDate();
    const todayMidnight = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();

    for (let i = 0; i < startingDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = "bg-slate-100/50 rounded-lg h-10";
        detailGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
        const cellTime = new Date(year, monthIdx, day).getTime();
        const dateStr = `${year}-${(monthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const cell = document.createElement('div');
        const dayVal = sRecord[dateStr];
        const excludedStatus = isExcludedDate(dateStr);
        const isFuture = cellTime > todayMidnight;
        cell.className = "border border-slate-200 rounded-lg flex flex-col justify-between p-1 bg-slate-50 text-[10px] h-10 relative overflow-hidden";
        if (excludedStatus.excluded) {
            cell.className += " opacity-40 bg-gray-100";
            cell.innerHTML = `<span class="text-gray-400">${day}</span>`;
        } else {
            let symbol = '❌';
            if (isFuture) symbol = '❓';
            else if (isMultiSlotDate(dateStr)) {
                const done = dayCompletedSlots(dayVal, dateStr);
                symbol = done === 3 ? '🪥' : (done > 0 ? `${done}/3` : '❌');
            } else if (dayVal === true || isDayFullyBrushed(dayVal, dateStr)) symbol = '🪥';
            cell.innerHTML = `<span class="text-gray-500 font-sans font-bold">${day}</span><span class="absolute right-1 bottom-1 text-[11px] font-sans">${symbol}</span>`;
        }
        detailGrid.appendChild(cell);
    }
};

window.resetStudentPassword = async function(grade, name) {
    if (!confirm(`${grade} [${name}] 학생의 비밀번호를 정말 초기화하시겠습니까?`)) return;
    el.loadingOverlay.classList.remove('hidden');
    const pws = appState.db.brushing_pws || {};
    delete pws[`${grade}-${name}`];
    await saveToAirtable('brushing_pws', pws);
    renderAdminStudentList();
    el.loadingOverlay.classList.add('hidden');
    alert(`${name} 학생의 비밀번호가 초기화되었습니다.`);
};

function updateConnectionBadge(status) {
    if (!el.connectionStatusBadge || !el.connectionStatusText) return;

    const issue = appState.connectionIssue || getCloudModeIssue();

    if (status === null) {
        el.connectionStatusBadge.className = "flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border";
        el.connectionStatusText.textContent = "연결 중...";
    } else if (status === true) {
        el.connectionStatusBadge.className = "flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300 animate-pulse";
        el.connectionStatusText.textContent = "● 에어테이블 연결됨";
        if (el.connectionHelpBanner) el.connectionHelpBanner.classList.add('hidden');
    } else {
        el.connectionStatusBadge.className = "flex items-center gap-1.5 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-300";
        el.connectionStatusText.textContent = issue ? "● 연결 안 됨" : "● 로컬 저장 모드";
        if (el.connectionHelpBanner && el.connectionHelpText && issue) {
            el.connectionHelpBanner.classList.remove('hidden');
            el.connectionHelpText.textContent = issue;
        }
    }
}

function syncDefaultMonth() {
    const today = new Date();
    appState.selectedMonthIndex = (today.getFullYear() === 2026 && today.getMonth() >= 4 && today.getMonth() <= 11) ? today.getMonth() : 4;
    el.calendarMonthSelect.value = appState.selectedMonthIndex;
}

function updatePwDots() {
    el.pwDots.forEach((dot, idx) => {
        if (idx < appState.enteredPin.length) {
            dot.classList.add('border-teal-500', 'bg-teal-50');
            dot.classList.remove('bg-white', 'border-teal-400');
            dot.textContent = appState.isNewUser && idx === appState.enteredPin.length - 1 ? appState.enteredPin[idx] : "●";
        } else {
            dot.classList.remove('border-teal-500', 'bg-teal-50');
            dot.classList.add('bg-white', 'border-teal-400');
            dot.textContent = "";
        }
    });
}

function isExcludedDate(dateStr) {
    if (isOpenInputDate(dateStr)) {
        return { excluded: false, reason: '', type: '' };
    }
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { excluded: true, reason: dayOfWeek === 0 ? '일요일' : '토요일', type: 'weekend' };
    }
    const holidays = {
        "2026-05-01": "노동절", "2026-05-05": "어린이날", "2026-05-25": "대체공휴일",
        "2026-06-03": "지방선거일", "2026-07-17": "제헌절", "2026-07-20": "현장체험학습",
        "2026-09-24": "추석 연휴", "2026-09-25": "추석", "2026-09-28": "재량휴업일",
        "2026-10-05": "대체공휴일", "2026-10-09": "한글날", "2026-10-30": "학예회",
        "2026-11-09": "현장체험학습", "2026-12-25": "성탄절"
    };
    if (holidays[dateStr]) {
        let type = 'holiday';
        if (dateStr === "2026-07-20" || dateStr === "2026-11-09") type = 'experience';
        else if (dateStr === "2026-10-30") type = 'festival';
        return { excluded: true, reason: holidays[dateStr], type };
    }
    const currentMs = d.getTime();
    const vacStart = new Date(2026, 6, 27).getTime();
    const vacEnd = new Date(2026, 7, 17).getTime();
    if (currentMs >= vacStart && currentMs <= vacEnd) {
        return { excluded: true, reason: '여름방학', type: 'vacation' };
    }
    return { excluded: false, reason: '', type: '' };
}

function getPossibleDatesForMonth(monthIndex) {
    const dates = [];
    const year = 2026;
    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    for (let day = 1; day <= totalDaysInMonth; day++) {
        const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        if (!isExcludedDate(dateStr).excluded) dates.push(dateStr);
    }
    return dates;
}

function getEligibleDatesUntilToday(monthIndex) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const year = 2026;
    const monthStr = (monthIndex + 1).toString().padStart(2, '0');

    if (today.getFullYear() !== year) return [];
    if (today.getMonth() < monthIndex) return [];
    if (today.getMonth() > monthIndex) return getPossibleDatesForMonth(monthIndex);

    return getPossibleDatesForMonth(monthIndex).filter(dateStr => dateStr <= todayStr);
}

function getMaxStreak(record, activeDates) {
    let maxStreak = 0, tempStreak = 0;
    activeDates.forEach(d => {
        if (isDayFullyBrushed(record[d], d) || record[d] === true) {
            tempStreak++;
            if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    });
    return maxStreak;
}

function setLoginCheers() {
    const pair = LOGIN_CHEERS[Math.floor(Math.random() * LOGIN_CHEERS.length)];
    if (el.loginCheer1) el.loginCheer1.textContent = pair[0];
    if (el.loginCheer2) el.loginCheer2.textContent = pair[1];
}

function getLastCompletedMonthIndex() {
    const today = new Date();
    if (today.getFullYear() !== 2026) return 6;
    const m = today.getMonth();
    if (m <= 4) return 5;
    return m - 1;
}

function computeSchoolRateForMonth(monthIdx) {
    let dates;
    if (isSummerRateMonth(monthIdx)) dates = getSummerRateDatesFull();
    else dates = getPossibleDatesForMonth(monthIdx);
    if (!dates.length) return null;
    let done = 0, max = 0;
    Object.keys(studentsData).forEach(g => {
        studentsData[g].forEach(n => {
            const c = countRecordSlots(appState.db.brushing_records[`${g}-${n}`] || {}, dates);
            done += c.done;
            max += c.max;
        });
    });
    if (max === 0) return null;
    return Math.round((done / max) * 100);
}

function computeTopStudentsForMonth(monthIdx, limit = 5) {
    let dates;
    if (isSummerRateMonth(monthIdx)) dates = getSummerRateDatesFull();
    else dates = getPossibleDatesForMonth(monthIdx);
    const scores = [];
    Object.keys(studentsData).forEach(g => {
        studentsData[g].forEach(name => {
            const record = appState.db.brushing_records[`${g}-${name}`] || {};
            let practiceDays = 0;
            dates.forEach(d => {
                if (isDayFullyBrushed(record[d], d) || (record[d] === true)) practiceDays++;
                else if (isMultiSlotDate(d) && dayCompletedSlots(record[d], d) > 0) {
                    // 부분 실천도 일수로 0. 점수는 칸 기준으로 별도
                }
            });
            const slotScore = countRecordSlots(record, dates).done;
            scores.push({ grade: g, name, practiceDays, slotScore });
        });
    });
    scores.sort((a, b) => b.slotScore - a.slotScore || b.practiceDays - a.practiceDays || a.name.localeCompare(b.name, 'ko'));
    if (!scores.length || scores[0].slotScore === 0) return [];

    const ranks = [];
    let currentRank = 0;
    let lastScore = null;
    let placed = 0;
    for (const s of scores) {
        if (s.slotScore === 0) break;
        if (lastScore === null || s.slotScore !== lastScore) {
            currentRank = placed + 1;
            lastScore = s.slotScore;
            if (currentRank > limit) break;
            let periodMax = 0;
            dates.forEach(d => { periodMax += dayMaxSlots(d); });
            const doneVal = isSummerRateMonth(monthIdx) ? s.slotScore : s.practiceDays;
            const totalVal = isSummerRateMonth(monthIdx) ? periodMax : dates.length;
            ranks.push({ rank: currentRank, names: [s.name], score: s.slotScore, done: doneVal, total: totalVal });
        } else {
            ranks[ranks.length - 1].names.push(s.name);
        }
        placed++;
    }
    return ranks.filter(r => r.rank <= limit);
}

function renderHallOfFame() {
    if (!el.hofWinners) return;
    const monthIdx = getLastCompletedMonthIndex();
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    let ranks = [];
    let label = `지난 달 (${monthNames[monthIdx]}) 우수 실천자`;

    if (HISTORICAL_HALL_OF_FAME[monthIdx]) {
        const hist = HISTORICAL_HALL_OF_FAME[monthIdx];
        label = `${hist.monthLabel} 우수 실천자`;
        ranks = hist.ranks;
    } else {
        ranks = computeTopStudentsForMonth(monthIdx, 5);
        label = `${monthNames[monthIdx]} 우수 실천자 (1~5등)`;
    }

    if (el.hofMonthLabel) el.hofMonthLabel.textContent = label;

    const medals = { 1: "🥇", 2: "🥈", 3: "🥉", 4: "4️⃣", 5: "5️⃣" };
    if (!ranks.length) {
        el.hofWinners.innerHTML = '<p class="text-center text-gray-400 text-sm">아직 지난 달 기록이 없어요.</p>';
    } else {
        el.hofWinners.innerHTML = ranks.map(r => {
            const medal = medals[r.rank] || `${r.rank}등`;
            const namesHtml = r.names.map(name => {
                if (r.done != null && r.total != null) {
                    return `${name} <span class="text-teal-600 font-sans font-bold text-sm">${r.done}/${r.total}</span>`;
                }
                return name;
            }).join(', ');
            return `<div class="bg-white/70 rounded-xl px-3 py-2 border border-amber-200"><span class="font-bold text-amber-800">${medal} ${r.rank}등</span> <span class="text-slate-700">${namesHtml}</span></div>`;
        }).join('');
    }

    const rate = computeSchoolRateForMonth(monthIdx);
    if (el.hofSchoolRate) {
        el.hofSchoolRate.textContent = rate === null ? (HISTORICAL_HALL_OF_FAME[monthIdx] ? "—" : "0%") : `${rate}%`;
    }
}
