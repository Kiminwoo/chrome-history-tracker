import {
  ClockCircleOutlined,
  GlobalOutlined,
  UserOutlined,
} from "@ant-design/icons";
import styled from "@emotion/styled";
import { Avatar, Card, Col, Divider, Row, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import type { HistoryItem } from "./types/history";

const { Title, Text } = Typography;

const Container = styled.div`
  width: 340px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(24, 144, 255, 0.13);
  padding: 24px 16px 16px 16px;
  font-family: "Pretendard", "Noto Sans KR", sans-serif;
`;

const TimeCard = styled(Card)`
  border-radius: 12px !important;
  background: #f6faff !important;
  border: none !important;
  margin-bottom: 0;
  .ant-card-body {
    padding: 12px 16px !important;
  }
`;

const HistoryCard = styled(Card)`
  border-radius: 12px !important;
  background: #f9f9f9 !important;
  border: none !important;
  margin-bottom: 0;
  .ant-card-body {
    padding: 12px 16px !important;
  }
`;

const TimerBox = styled.div`
  background: #f6faff;
  border-radius: 12px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
`;

const TimerText = styled(Text)`
  font-size: 2rem;
  font-weight: 700;
  color: #1890ff;
  letter-spacing: 2px;
`;

function getRemainingTime(checkOutTime?: Date | null) {
  if (!checkOutTime) return "--:--:--";
  const now = new Date();
  const diff = Math.max(0, checkOutTime.getTime() - now.getTime());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

function formatTime24WithAmPm(date?: Date | null) {
  if (!date) return "--:--";
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  const ampm = date.getHours() < 12 ? "AM" : "PM";
  return `${hour}:${minute} ${ampm}`;
}

function extractDomain(url?: string) {
  if (!url) return "알 수 없음";
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return "알 수 없음";
  }
}

function generateRandomString(length = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getDiceBearAvatarUrl(seed: string, style: string = "avataaars") {
  const finalSeed = seed && seed.trim() ? seed : generateRandomString(10);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(
    finalSeed
  )}`;
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
  const [firstHistory, setFirstHistory] = useState<HistoryItem | null>(null);
  const [lastHistory, setLastHistory] = useState<HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    chrome.identity?.getProfileUserInfo?.((userInfo) => {
      let name;
      let avatarSeed;
      if (userInfo?.email) {
        name = userInfo.email.split("@")[0];
        avatarSeed = name;
      } else {
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
        chrome.storage.local.get(
          [`firstVisit_${todayKey}`, `lastVisit_${todayKey}`],
          async (result) => {
            if (
              result[`firstVisit_${todayKey}`] &&
              result[`lastVisit_${todayKey}`]
            ) {
              // 캐시된 기록 사용
              setFirstHistory(result[`firstVisit_${todayKey}`]);
              setLastHistory(result[`lastVisit_${todayKey}`]);
              setIsLoading(false);
            } else {
              // History에서 새로 검색
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);

              const results = await new Promise<HistoryItem[]>((resolve) => {
                chrome.history.search(
                  {
                    text: "",
                    startTime: todayStart.getTime(),
                    maxResults: 2500,
                  },
                  (items) => resolve(items as HistoryItem[])
                );
              });

              const sorted = results
                .filter((item) => item.lastVisitTime)
                .sort((a, b) => a.lastVisitTime! - b.lastVisitTime!);

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
          }
        );
      } catch (error) {
        setIsLoading(false);
      }
    };

    // 초기 기록 로드
    fetchBrowserHistory();

    // ⭐ Storage 변화 감지 리스너 등록
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const handleStorageChange = (changes: any, areaName: string) => {
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

  return (
    <Container>
      {/* 사용자 정보 */}
      <Row align="middle" gutter={12}>
        <Col>
          <Avatar
            size={48}
            src={avatarUrl}
            icon={!avatarUrl && <UserOutlined />}
          />
        </Col>
        <Col flex="auto">
          <Title level={5} style={{ margin: 0, color: "#222" }}>
            {userName}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            매니저
          </Text>
        </Col>
      </Row>

      <Divider style={{ margin: "16px 0" }} />

      {/* 출근/퇴근 시간 */}
      <Text strong style={{ fontSize: 15 }}>
        오늘의 출근/퇴근 시간 ( chrome history 기준 )
      </Text>
      <Row gutter={8} style={{ margin: "12px 0 0 0" }}>
        <Col span={12}>
          <TimeCard>
            <Text type="secondary" style={{ fontSize: 12 }}>
              출근 시간
            </Text>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#1890ff" }}>
              {formatTime24WithAmPm(checkInTime)}
            </div>
          </TimeCard>
        </Col>
        <Col span={12}>
          <TimeCard>
            <Text type="secondary" style={{ fontSize: 12 }}>
              퇴근 시간
            </Text>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#1890ff" }}>
              {formatTime24WithAmPm(checkOutTime)}
            </div>
          </TimeCard>
        </Col>
      </Row>

      <Divider style={{ margin: "20px 0 12px 0" }} />

      {/* 브라우저 접속 기록 */}
      <Text strong style={{ fontSize: 15 }}>
        오늘의 브라우저 접속기록
      </Text>
      <Row gutter={8} style={{ margin: "12px 0 0 0" }}>
        <Col span={12}>
          <HistoryCard>
            <Text type="secondary" style={{ fontSize: 12 }}>
              첫 접속
            </Text>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#52c41a" }}>
              {formatTime24WithAmPm(firstVisitTime)}
            </div>
            <Text
              type="secondary"
              style={{ fontSize: 11 }}
              title={firstHistory?.url}
            >
              <GlobalOutlined style={{ marginRight: 4 }} />
              {extractDomain(firstHistory?.url)}
            </Text>
          </HistoryCard>
        </Col>
        <Col span={12}>
          <HistoryCard>
            <Text type="secondary" style={{ fontSize: 12 }}>
              마지막 접속
            </Text>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#faad14" }}>
              {formatTime24WithAmPm(lastVisitTime)}
            </div>
            <Text
              type="secondary"
              style={{ fontSize: 11 }}
              title={lastHistory?.url}
            >
              <GlobalOutlined style={{ marginRight: 4 }} />
              {extractDomain(lastHistory?.url)}
            </Text>
          </HistoryCard>
        </Col>
      </Row>

      <Divider style={{ margin: "20px 0 12px 0" }} />

      {/* 남은 시간 */}
      <Text strong style={{ fontSize: 15 }}>
        남은 시간&nbsp;
      </Text>
      <Tag color="blue" style={{ marginTop: 8, marginBottom: 8 }}>
        실시간
      </Tag>
      <TimerBox>
        <ClockCircleOutlined
          style={{ fontSize: 32, color: "#1890ff", marginBottom: 8 }}
        />
        <TimerText>{getRemainingTime(checkOutTime)}</TimerText>
      </TimerBox>
    </Container>
  );
}
