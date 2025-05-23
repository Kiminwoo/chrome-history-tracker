import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ClockCircleOutlined, GlobalOutlined, UserOutlined, } from "@ant-design/icons";
import styled from "@emotion/styled";
import { Avatar, Card, Col, Divider, Row, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
const { Title, Text } = Typography;
const Container = styled.div `
  width: 340px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(24, 144, 255, 0.13);
  padding: 24px 16px 16px 16px;
  font-family: "Pretendard", "Noto Sans KR", sans-serif;
`;
const TimeCard = styled(Card) `
  border-radius: 12px !important;
  background: #f6faff !important;
  border: none !important;
  margin-bottom: 0;
  .ant-card-body {
    padding: 12px 16px !important;
  }
`;
const HistoryCard = styled(Card) `
  border-radius: 12px !important;
  background: #f9f9f9 !important;
  border: none !important;
  margin-bottom: 0;
  .ant-card-body {
    padding: 12px 16px !important;
  }
`;
const TimerBox = styled.div `
  background: #f6faff;
  border-radius: 12px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
`;
const TimerText = styled(Text) `
  font-size: 2rem;
  font-weight: 700;
  color: #1890ff;
  letter-spacing: 2px;
`;
function getRemainingTime(checkOutTime) {
    if (!checkOutTime)
        return "--:--:--";
    const now = new Date();
    const diff = Math.max(0, checkOutTime.getTime() - now.getTime());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
}
function formatTime24WithAmPm(date) {
    if (!date)
        return "--:--";
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() < 12 ? "AM" : "PM";
    return `${hour}:${minute} ${ampm}`;
}
function extractDomain(url) {
    if (!url)
        return "알 수 없음";
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace("www.", "");
    }
    catch {
        return "알 수 없음";
    }
}
function generateRandomString(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function getDiceBearAvatarUrl(seed, style = "avataaars") {
    const finalSeed = seed && seed.trim() ? seed : generateRandomString(10);
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(finalSeed)}`;
}
function getTodayKey() {
    const now = new Date();
    return now.toISOString().slice(0, 10);
}
function getOrCreateGuestSeed() {
    const key = "guest_avatar_seed";
    let seed = localStorage.getItem(key);
    if (!seed) {
        seed = generateRandomString(10);
        localStorage.setItem(key, seed);
    }
    return seed;
}
export default function App() {
    const [firstHistory, setFirstHistory] = useState(null);
    const [lastHistory, setLastHistory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(undefined);
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        chrome.identity?.getProfileUserInfo?.((userInfo) => {
            let name;
            let avatarSeed;
            if (userInfo?.email) {
                name = userInfo.email.split("@")[0];
                avatarSeed = name;
            }
            else {
                name = getOrCreateGuestSeed();
                avatarSeed = name;
            }
            setUserName(name);
            setAvatarUrl(getDiceBearAvatarUrl(avatarSeed));
        });
        // 오늘의 첫/마지막 방문 기록 가져오기
        const fetchBrowserHistory = async () => {
            try {
                const todayKey = getTodayKey();
                // Storage에서 기존 기록 확인
                chrome.storage.local.get([`firstVisit_${todayKey}`, `lastVisit_${todayKey}`], async (result) => {
                    if (result[`firstVisit_${todayKey}`] &&
                        result[`lastVisit_${todayKey}`]) {
                        // 캐시된 기록 사용
                        setFirstHistory(result[`firstVisit_${todayKey}`]);
                        setLastHistory(result[`lastVisit_${todayKey}`]);
                        setIsLoading(false);
                    }
                    else {
                        // History에서 새로 검색
                        const todayStart = new Date();
                        todayStart.setHours(0, 0, 0, 0);
                        const results = await new Promise((resolve) => {
                            chrome.history.search({
                                text: "",
                                startTime: todayStart.getTime(),
                                maxResults: 2500,
                            }, (items) => resolve(items));
                        });
                        const sorted = results
                            .filter((item) => item.lastVisitTime)
                            .sort((a, b) => a.lastVisitTime - b.lastVisitTime);
                        const first = sorted[0] ?? null;
                        const last = sorted[sorted.length - 1] ?? null;
                        setFirstHistory(first);
                        setLastHistory(last);
                        // Storage에 저장
                        if (first && last) {
                            chrome.storage.local.set({
                                [`firstVisit_${todayKey}`]: first,
                                [`lastVisit_${todayKey}`]: last,
                            });
                        }
                        setIsLoading(false);
                    }
                });
            }
            catch (error) {
                console.error("Error fetching history:", error);
                setIsLoading(false);
            }
        };
        // 초기 기록 로드
        fetchBrowserHistory();
        // ⭐ Storage 변화 감지 리스너 등록
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const handleStorageChange = (changes, areaName) => {
            if (areaName === "local") {
                const todayKey = getTodayKey();
                const lastVisitKey = `lastVisit_${todayKey}`;
                if (changes[lastVisitKey]) {
                    setLastHistory(changes[lastVisitKey].newValue);
                }
            }
        };
        chrome.storage.onChanged.addListener(handleStorageChange);
        // 정리
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, []);
    // 출근/퇴근 시간 계산
    const checkInTime = firstHistory?.lastVisitTime
        ? new Date(firstHistory.lastVisitTime)
        : null;
    const checkOutTime = checkInTime
        ? new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000)
        : null;
    // 브라우저 접속 시간
    const firstVisitTime = firstHistory?.lastVisitTime
        ? new Date(firstHistory.lastVisitTime)
        : null;
    const lastVisitTime = lastHistory?.lastVisitTime
        ? new Date(lastHistory.lastVisitTime)
        : null;
    // 타이머 실시간 갱신
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        if (firstHistory?.lastVisitTime) {
            console.log("출근 기록 원본:", firstHistory);
            console.log("lastVisitTime (ms):", firstHistory.lastVisitTime);
            console.log("Date:", new Date(firstHistory.lastVisitTime));
        }
    }, [firstHistory]);
    return (_jsxs(Container, { children: [_jsxs(Row, { align: "middle", gutter: 12, children: [_jsx(Col, { children: _jsx(Avatar, { size: 48, src: avatarUrl, icon: !avatarUrl && _jsx(UserOutlined, {}) }) }), _jsxs(Col, { flex: "auto", children: [_jsx(Title, { level: 5, style: { margin: 0, color: "#222" }, children: userName }), _jsx(Text, { type: "secondary", style: { fontSize: 13 }, children: "\uB9E4\uB2C8\uC800" })] })] }), _jsx(Divider, { style: { margin: "16px 0" } }), _jsx(Text, { strong: true, style: { fontSize: 15 }, children: "\uC624\uB298\uC758 \uCD9C\uADFC/\uD1F4\uADFC \uC2DC\uAC04 ( chrome history \uAE30\uC900 )" }), _jsxs(Row, { gutter: 8, style: { margin: "12px 0 0 0" }, children: [_jsx(Col, { span: 12, children: _jsxs(TimeCard, { children: [_jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: "\uCD9C\uADFC \uC2DC\uAC04" }), _jsx("div", { style: { fontWeight: 700, fontSize: 18, color: "#1890ff" }, children: formatTime24WithAmPm(checkInTime) })] }) }), _jsx(Col, { span: 12, children: _jsxs(TimeCard, { children: [_jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: "\uD1F4\uADFC \uC2DC\uAC04" }), _jsx("div", { style: { fontWeight: 700, fontSize: 18, color: "#1890ff" }, children: formatTime24WithAmPm(checkOutTime) })] }) })] }), _jsx(Divider, { style: { margin: "20px 0 12px 0" } }), _jsx(Text, { strong: true, style: { fontSize: 15 }, children: "\uC624\uB298\uC758 \uBE0C\uB77C\uC6B0\uC800 \uC811\uC18D\uAE30\uB85D" }), _jsxs(Row, { gutter: 8, style: { margin: "12px 0 0 0" }, children: [_jsx(Col, { span: 12, children: _jsxs(HistoryCard, { children: [_jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: "\uCCAB \uC811\uC18D" }), _jsx("div", { style: { fontWeight: 700, fontSize: 16, color: "#52c41a" }, children: formatTime24WithAmPm(firstVisitTime) }), _jsxs(Text, { type: "secondary", style: { fontSize: 11 }, title: firstHistory?.url, children: [_jsx(GlobalOutlined, { style: { marginRight: 4 } }), extractDomain(firstHistory?.url)] })] }) }), _jsx(Col, { span: 12, children: _jsxs(HistoryCard, { children: [_jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: "\uB9C8\uC9C0\uB9C9 \uC811\uC18D" }), _jsx("div", { style: { fontWeight: 700, fontSize: 16, color: "#faad14" }, children: formatTime24WithAmPm(lastVisitTime) }), _jsxs(Text, { type: "secondary", style: { fontSize: 11 }, title: lastHistory?.url, children: [_jsx(GlobalOutlined, { style: { marginRight: 4 } }), extractDomain(lastHistory?.url)] })] }) })] }), _jsx(Divider, { style: { margin: "20px 0 12px 0" } }), _jsx(Text, { strong: true, style: { fontSize: 15 }, children: "\uB0A8\uC740 \uC2DC\uAC04\u00A0" }), _jsx(Tag, { color: "blue", style: { marginTop: 8, marginBottom: 8 }, children: "\uC2E4\uC2DC\uAC04" }), _jsxs(TimerBox, { children: [_jsx(ClockCircleOutlined, { style: { fontSize: 32, color: "#1890ff", marginBottom: 8 } }), _jsx(TimerText, { children: getRemainingTime(checkOutTime) })] })] }));
}
