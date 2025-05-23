import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "@emotion/styled";
import { Button, Card, Typography } from "antd";
import React, { useCallback, useEffect, useState } from "react";
const { Title, Text } = Typography;
// 튜토리얼 단계 정의
const tutorialSteps = [
    {
        id: "user-info",
        title: "사용자 정보",
        description: "현재 로그인된 사용자 정보와 아바타가 표시됩니다.",
        targetSelector: '[data-tutorial="user-info"]',
        position: "bottom",
    },
    {
        id: "work-time",
        title: "출근/퇴근 시간",
        description: "Chrome 브라우저 히스토리를 기반으로 자동 계산된 출근/퇴근 시간입니다.",
        targetSelector: '[data-tutorial="work-time"]',
        position: "bottom",
    },
    {
        id: "browser-history",
        title: "브라우저 접속기록",
        description: "오늘 첫 번째 접속과 마지막 접속 시간을 보여줍니다.",
        targetSelector: '[data-tutorial="browser-history"]',
        position: "top",
    },
    {
        id: "remaining-time",
        title: "남은 시간",
        description: "퇴근까지 남은 시간이 실시간으로 표시됩니다.",
        targetSelector: '[data-tutorial="remaining-time"]',
        position: "top",
    },
];
const TutorialOverlay = styled.div `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9999;
`;
// 개선된 Spotlight - 타겟 영역만 투명하게 뚫기
const Spotlight = styled.div `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;

  ${({ rect }) => rect &&
    `
    /* CSS mask를 사용해 타겟 영역만 투명하게 */
    background: rgba(0, 0, 0, 0.7);
    -webkit-mask: 
      radial-gradient(ellipse at center, transparent 0, transparent 50%, black 51%),
      radial-gradient(ellipse at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, 
        transparent ${Math.max(rect.width, rect.height) / 2 + 20}px, 
        black ${Math.max(rect.width, rect.height) / 2 + 25}px);
    -webkit-mask-composite: subtract;
    mask: 
      radial-gradient(ellipse at center, transparent 0, transparent 50%, black 51%),
      radial-gradient(ellipse at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, 
        transparent ${Math.max(rect.width, rect.height) / 2 + 20}px, 
        black ${Math.max(rect.width, rect.height) / 2 + 25}px);
    mask-composite: subtract;
  `}
`;
// 타겟 영역 강조 효과
const HighlightOverlay = styled.div `
  position: fixed;
  pointer-events: none;
  z-index: 10001;
  transition: all 0.3s ease;

  ${({ rect }) => rect &&
    `
    top: ${rect.top - 8}px;
    left: ${rect.left - 8}px;
    width: ${rect.width + 16}px;
    height: ${rect.height + 16}px;
    border: 3px solid #1890ff;
    border-radius: 12px;
    box-shadow: 
      0 0 20px 4px rgba(24, 144, 255, 0.3),
      inset 0 0 20px 4px rgba(24, 144, 255, 0.1);
    background: rgba(24, 144, 255, 0.05);
  `}
`;
const GuideCard = styled(Card) `
  position: fixed;
  width: 300px;
  max-width: 90vw;
  z-index: 10002;
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;

  ${({ position, rect }) => {
    if (!rect)
        return "";
    const screenWidth = window.innerWidth;
    const cardWidth = 300;
    let left = rect.left + rect.width / 2 - cardWidth / 2;
    // 화면 밖으로 나가지 않도록 조정
    if (left < 8)
        left = 8;
    if (left + cardWidth > screenWidth - 8)
        left = screenWidth - cardWidth - 8;
    if (position === "bottom") {
        return `
          top: ${rect.bottom + 20}px;
          left: ${left}px;
        `;
    }
    else {
        return `
          top: ${Math.max(rect.top - 140, 8)}px;
          left: ${left}px;
        `;
    }
}}

  .ant-card-body {
    padding: 16px !important;
  }
`;
const ProgressDots = styled.div `
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 12px 0;
`;
const Dot = styled.div `
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ active }) => (active ? "#1890ff" : "#d9d9d9")};
  transition: all 0.3s ease;
`;
const Tutorial = ({ onClose, currentStep, onStepChange, }) => {
    const [targetRect, setTargetRect] = useState(null);
    const updateTargetRect = useCallback(() => {
        const step = tutorialSteps[currentStep];
        const element = document.querySelector(step.targetSelector);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
            // 타겟 요소에 강조 스타일 적용
            applyHighlightToTarget(element);
        }
    }, [currentStep]);
    const applyHighlightToTarget = (element) => {
        // 이전에 강조된 요소들의 스타일 제거
        document
            .querySelectorAll('[data-tutorial-highlighted="true"]')
            .forEach((el) => {
            el.style.position = "";
            el.style.zIndex = "";
            el.style.boxShadow = "";
            el.style.borderRadius = "";
            el.style.background = "";
            el.removeAttribute("data-tutorial-highlighted");
        });
        // 현재 타겟 요소에 강조 스타일 적용
        element.style.position = "relative";
        element.style.zIndex = "10001";
        element.style.boxShadow = "0 0 30px 8px rgba(24, 144, 255, 0.2)";
        element.style.borderRadius = "12px";
        element.style.background = "rgba(255, 255, 255, 0.02)";
        element.style.transition = "all 0.3s ease";
        element.setAttribute("data-tutorial-highlighted", "true");
    };
    useEffect(() => {
        updateTargetRect();
        // 리사이즈 이벤트 핸들러
        const handleResize = () => {
            setTimeout(updateTargetRect, 100);
        };
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            // 컴포넌트 언마운트 시 모든 강조 효과 제거
            document
                .querySelectorAll('[data-tutorial-highlighted="true"]')
                .forEach((el) => {
                el.style.position = "";
                el.style.zIndex = "";
                el.style.boxShadow = "";
                el.style.borderRadius = "";
                el.style.background = "";
                el.removeAttribute("data-tutorial-highlighted");
            });
        };
    }, [currentStep, updateTargetRect]);
    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            onStepChange(currentStep + 1);
        }
        else {
            onClose();
        }
    };
    const handlePrev = () => {
        if (currentStep > 0) {
            onStepChange(currentStep - 1);
        }
    };
    const handleSkip = () => {
        onClose();
    };
    const currentStepData = tutorialSteps[currentStep];
    return (_jsxs(TutorialOverlay, { children: [_jsx(Spotlight, { rect: targetRect }), _jsx(HighlightOverlay, { rect: targetRect }), _jsxs(GuideCard, { position: currentStepData.position, rect: targetRect, children: [_jsxs("div", { style: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                        }, children: [_jsx(Text, { style: { fontSize: 16, fontWeight: 600 }, children: currentStepData.title }), _jsx(Button, { type: "text", icon: _jsx(CloseOutlined, {}), size: "small", onClick: handleSkip })] }), _jsx(Text, { style: { fontSize: 14, lineHeight: 1.5, marginBottom: 16 }, children: currentStepData.description }), _jsx(ProgressDots, { children: tutorialSteps.map((_, index) => (_jsx(Dot, { active: index === currentStep }, index))) }), _jsxs("div", { style: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }, children: [_jsx(Button, { type: "text", icon: _jsx(LeftOutlined, {}), disabled: currentStep === 0, onClick: handlePrev, children: "\uC774\uC804" }), _jsxs(Text, { style: { fontSize: 12, color: "#888" }, children: [currentStep + 1, " / ", tutorialSteps.length] }), _jsx(Button, { type: "primary", icon: currentStep === tutorialSteps.length - 1 ? undefined : (_jsx(RightOutlined, {})), onClick: handleNext, children: currentStep === tutorialSteps.length - 1 ? "완료" : "다음" })] })] })] }));
};
export default Tutorial;
