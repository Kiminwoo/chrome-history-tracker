import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Avatar, Card, Col, Divider, Row, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import type { HistoryItem } from './types/history'

const { Title, Text } = Typography

const Container = styled.div`
  width: 340px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(24, 144, 255, 0.13);
  padding: 24px 16px 16px 16px;
  font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
`

const TimeCard = styled(Card)`
  border-radius: 12px !important;
  background: #f6faff !important;
  border: none !important;
  margin-bottom: 0;
  .ant-card-body {
    padding: 12px 16px !important;
  }
`

const TimerBox = styled.div`
  background: #f6faff;
  border-radius: 12px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
`

const TimerText = styled(Text)`
  font-size: 2rem;
  font-weight: 700;
  color: #1890ff;
  letter-spacing: 2px;
`

function formatTime(date?: Date | null) {
  if (!date) return '--:-- --'
  return date.toLocaleTimeString('en-ko', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function getRemainingTime(checkOutTime?: Date | null) {
  if (!checkOutTime) return '--:--:--'
  const now = new Date()
  const diff = Math.max(0, checkOutTime.getTime() - now.getTime())
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getDiceBearAvatarUrl(seed:string, style:string = 'avataaars') {
  // seed가 비어있거나 falsy하면 랜덤 문자열 생성
  const finalSeed = seed && seed.trim() ? seed : generateRandomString(10);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(finalSeed)}`;
}

// 오늘 날짜(YYYY-MM-DD) 문자열 반환
function getTodayKey() {
  const now = new Date()
  return now.toISOString().slice(0, 10)
}

function getOrCreateGuestSeed() {
  const key = 'guest_avatar_seed'
  let seed = localStorage.getItem(key)
  if (!seed) {
    seed = generateRandomString(10)
    localStorage.setItem(key, seed)
  }
  return seed
}

export default function App() {
  const [firstHistory, setFirstHistory] = useState<HistoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [now, setNow] = useState(new Date())

    useEffect(() => {
    chrome.identity?.getProfileUserInfo?.((userInfo) => {
      let name;
      let avatarSeed;
      if (userInfo?.email) {
        name = userInfo.email.split('@')[0];
        avatarSeed = name;
      } else {
        // email이 없을 때, localStorage에서 seed 재사용
        name = getOrCreateGuestSeed();
        avatarSeed = name;
      }
      setUserName(name);
      setAvatarUrl(getDiceBearAvatarUrl(avatarSeed));
    });

    // 오늘의 첫 방문 기록 가져오기 (storage + history 연동)
    const fetchFirstHistory = async () => {
      try {
        const todayKey = getTodayKey()
        // 1. storage에서 오늘의 첫 방문 기록을 먼저 시도
        chrome.storage.local.get([`firstVisit_${todayKey}`], async (result) => {
          if (result && result[`firstVisit_${todayKey}`]) {
            setFirstHistory(result[`firstVisit_${todayKey}`])
            setIsLoading(false)
          } else {
            // 2. 없으면 history에서 찾아서 storage에 저장
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const results = await new Promise<HistoryItem[]>((resolve) => {
              chrome.history.search(
                { text: '', startTime: todayStart.getTime(), maxResults: 2500 },
                (items) => resolve(items as HistoryItem[])
              )
            })
            const sorted = results
              .filter((item) => item.lastVisitTime)
              .sort((a, b) => (a.lastVisitTime! - b.lastVisitTime!))
            const first = sorted[0] ?? null
            setFirstHistory(first)
            // 3. 찾은 기록을 storage에 저장
            if (first) {
              chrome.storage.local.set({ [`firstVisit_${todayKey}`]: first })
            }
            setIsLoading(false)
          }
        })
      } catch (error) {
        console.error('Error fetching history:', error)
        setIsLoading(false)
      }
    }
    fetchFirstHistory()
  }, [])

  // 출근/퇴근 시간 계산
  const checkInTime = firstHistory?.lastVisitTime ? new Date(firstHistory.lastVisitTime) : null
  const checkOutTime = checkInTime ? new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000) : null

  // 타이머 실시간 갱신
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
  // ...
  if (firstHistory?.lastVisitTime) {
    console.log('출근 기록 원본:', firstHistory)
    console.log('lastVisitTime (ms):', firstHistory.lastVisitTime)
    console.log('Date:', new Date(firstHistory.lastVisitTime))
    console.log('Locale:', new Date(firstHistory.lastVisitTime).toLocaleString())
    console.log('UTC:', new Date(firstHistory.lastVisitTime).toUTCString())
  }
}, [firstHistory])

  return (
    <Container>
      {/* 사용자 정보 */}
      <Row align="middle" gutter={12}>
        <Col>
          <Avatar size={48} src={avatarUrl} icon={!avatarUrl && <UserOutlined />} />
        </Col>
        <Col flex="auto">
          <Title level={5} style={{ margin: 0, color: '#222' }}>{userName}</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>매니저</Text>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* 출근/퇴근 시간 */}
      <Text strong style={{ fontSize: 15 }}>오늘의 출근/퇴근 시간 ( chrome history 기준 ) </Text>
      <Row gutter={8} style={{ margin: '12px 0 0 0' }}>
        <Col span={12}>
          <TimeCard>
            <Text type="secondary" style={{ fontSize: 12 }}>출근 시간</Text>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1890ff' }}>
              {formatTime(checkInTime)}
            </div>
          </TimeCard>
        </Col>
        <Col span={12}>
          <TimeCard>
            <Text type="secondary" style={{ fontSize: 12 }}>퇴근 시간</Text>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1890ff' }}>
              {formatTime(checkOutTime)}
            </div>
          </TimeCard>
        </Col>
      </Row>

      <Divider style={{ margin: '20px 0 12px 0' }} />

      {/* 남은 시간 */}
      <Text strong style={{ fontSize: 15 }}>남은 시간  </Text>
      <Tag color="blue" style={{ marginTop: 8, marginBottom: 8 }}>실시간</Tag>
      <TimerBox>
        <ClockCircleOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
        <TimerText>
          {getRemainingTime(checkOutTime)}
        </TimerText>
      </TimerBox>

      {/* <Space direction="horizontal" align="center" style={{ width: '100%', marginTop: 8 }}>
        <Tag icon={<ClockCircleOutlined />} color="warning">
          타이머
        </Tag>
        <Text strong style={{ fontSize: 18 }}>
          {getRemainingTime(checkOutTime)}
        </Text>
      </Space> */}
    </Container>
  )
}