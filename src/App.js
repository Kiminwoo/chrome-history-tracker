import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Row, Col, Divider, Tag, Space } from 'antd';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
const { Title, Text } = Typography;
const Container = styled.div `
  width: 340px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(24, 144, 255, 0.13);
  padding: 24px 16px 16px 16px;
  font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
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
function formatTime(date) {
    if (!date)
        return '--:-- --';
    return date.toLocaleTimeString('en-ko', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function getRemainingTime(checkOutTime) {
    if (!checkOutTime)
        return '--:--:--';
    const now = new Date();
    const diff = Math.max(0, checkOutTime.getTime() - now.getTime());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
function getDiceBearAvatarUrl(seed, style = 'avataaars') {
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}
export default function App() {
    const [firstHistory, setFirstHistory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(undefined);
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        // 사용자 정보 가져오기
        chrome.identity?.getProfileUserInfo?.((userInfo) => {
            if (userInfo?.email) {
                const name = userInfo.email.split('@')[0];
                setUserName(name);
                setAvatarUrl(getDiceBearAvatarUrl(name));
            }
        });
        // 오늘의 첫 방문 기록 가져오기
        const fetchFirstHistory = async () => {
            try {
                // 1. 오늘 자정 (로컬 타임존 기준) 계산
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const results = await new Promise((resolve) => {
                    chrome.history.search({ text: '', startTime: todayStart.getTime(),
                        maxResults: 2500, // 최대값으로 설정
                    }, (items) => resolve(items));
                });
                const sorted = results
                    .filter((item) => item.lastVisitTime)
                    .sort((a, b) => (a.lastVisitTime - b.lastVisitTime));
                setFirstHistory(sorted[0] ?? null);
            }
            catch (error) {
                console.error('Error fetching history:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchFirstHistory();
    }, []);
    // 출근/퇴근 시간 계산
    const checkInTime = firstHistory?.lastVisitTime ? new Date(firstHistory.lastVisitTime) : null;
    const checkOutTime = checkInTime ? new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000) : null;
    // 타이머 실시간 갱신
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        // ...
        if (firstHistory?.lastVisitTime) {
            console.log('출근 기록 원본:', firstHistory);
            console.log('lastVisitTime (ms):', firstHistory.lastVisitTime);
            console.log('Date:', new Date(firstHistory.lastVisitTime));
            console.log('Locale:', new Date(firstHistory.lastVisitTime).toLocaleString());
            console.log('UTC:', new Date(firstHistory.lastVisitTime).toUTCString());
        }
    }, [firstHistory]);
    return (_jsxs(Container, { children: [_jsxs(Row, { align: "middle", gutter: 12, children: [_jsx(Col, { children: _jsx(Avatar, { size: 48, src: avatarUrl, icon: !avatarUrl && _jsx(UserOutlined, {}) }) }), _jsxs(Col, { flex: "auto", children: [_jsx(Title, { level: 5, style: { margin: 0, color: '#222' }, children: userName }), _jsx(Text, { type: "secondary", style: { fontSize: 13 }, children: "\uB9E4\uB2C8\uC800" })] })] }), _jsx(Divider, { style: { margin: '16px 0' } }), _jsx(Text, { strong: true, style: { fontSize: 15 }, children: "\uC624\uB298\uC758 \uCD9C\uADFC/\uD1F4\uADFC \uC2DC\uAC04 ( chrome history \uAE30\uC900 ) " }), _jsxs(Row, { gutter: 8, style: { margin: '12px 0 0 0' }, children: [_jsx(Col, { span: 12, children: _jsxs(TimeCard, { children: [_jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: "\uCD9C\uADFC \uC2DC\uAC04" }), _jsx("div", { style: { fontWeight: 700, fontSize: 18, color: '#1890ff' }, children: formatTime(checkInTime) })] }) }), _jsx(Col, { span: 12, children: _jsxs(TimeCard, { children: [_jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: "\uD1F4\uADFC \uC2DC\uAC04" }), _jsx("div", { style: { fontWeight: 700, fontSize: 18, color: '#1890ff' }, children: formatTime(checkOutTime) })] }) })] }), _jsx(Divider, { style: { margin: '20px 0 12px 0' } }), _jsx(Text, { strong: true, style: { fontSize: 15 }, children: "\uB0A8\uC740 \uC2DC\uAC04  " }), _jsx(Tag, { color: "blue", style: { marginTop: 8, marginBottom: 8 }, children: "\uC2E4\uC2DC\uAC04" }), _jsxs(TimerBox, { children: [_jsx(ClockCircleOutlined, { style: { fontSize: 32, color: '#1890ff', marginBottom: 8 } }), _jsx(TimerText, { children: getRemainingTime(checkOutTime) })] })] }));
}
