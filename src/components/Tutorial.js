import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "@emotion/styled";
import { Button, Card, Typography } from "antd";
import React from "react";
import { createPortal } from "react-dom"; // Portal import 추가
const { Text } = Typography;
// 컨테이너 스타일
const TutorialContainer = styled.div `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  display: flex;
  justify-content: center;
  align-items: center;
`;
// 가이드 카드 스타일
const GuideCard = styled(Card) `
  width: 400px;
  max-width: 90vw;
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
`;
// 진행 상태 표시
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
const Tutorial = ({ steps, currentStep, onStepChange, onClose, }) => {
    const handleNext = () => {
        if (currentStep < steps.length - 1) {
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
    // Portal을 사용해 body에 직접 렌더링
    return createPortal(_jsx(TutorialContainer, { children: _jsxs(GuideCard, { children: [_jsxs("div", { style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                    }, children: [_jsx(Text, { style: { fontSize: 16, fontWeight: 600 }, children: steps[currentStep].title }), _jsx(Button, { type: "text", icon: _jsx(CloseOutlined, {}), size: "small", onClick: onClose })] }), _jsx(Text, { style: { fontSize: 14, lineHeight: 1.5, marginBottom: 16 }, children: steps[currentStep].description }), _jsx(ProgressDots, { children: steps.map((_, index) => (_jsx(Dot, { active: index === currentStep }, index))) }), _jsxs("div", { style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }, children: [_jsx(Button, { type: "text", icon: _jsx(LeftOutlined, {}), disabled: currentStep === 0, onClick: handlePrev, children: "\uC774\uC804" }), _jsxs(Text, { style: { fontSize: 12, color: "#888" }, children: [currentStep + 1, " / ", steps.length] }), _jsx(Button, { type: "primary", icon: currentStep === steps.length - 1 ? undefined : _jsx(RightOutlined, {}), onClick: handleNext, children: currentStep === steps.length - 1 ? "완료" : "다음" })] })] }) }), document.body // body에 직접 렌더링
    );
};
export default Tutorial;
