import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import styled from "@emotion/styled";
import { Button, Card, Typography } from "antd";
import React from "react";
import { createPortal } from "react-dom"; // Portal import 추가

const { Text } = Typography;

// 튜토리얼 단계 타입 정의
export type TutorialStep = {
  id: string;
  title: string;
  description: string;
};

// 프롭스 타입
interface TutorialProps {
  steps: readonly TutorialStep[]; // readonly 추가
  currentStep: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
}

// 컨테이너 스타일
const TutorialContainer = styled.div`
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
const GuideCard = styled(Card)`
  width: 400px;
  max-width: 90vw;
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
`;

// 진행 상태 표시
const ProgressDots = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 12px 0;
`;

const Dot = styled.div<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ active }) => (active ? "#1890ff" : "#d9d9d9")};
  transition: all 0.3s ease;
`;

const Tutorial: React.FC<TutorialProps> = ({
  steps,
  currentStep,
  onStepChange,
  onClose,
}) => {
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  // Portal을 사용해 body에 직접 렌더링
  return createPortal(
    <TutorialContainer>
      <GuideCard>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: 600 }}>
            {steps[currentStep].title}
          </Text>
          <Button
            type="text"
            icon={<CloseOutlined />}
            size="small"
            onClick={onClose}
          />
        </div>

        <Text style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
          {steps[currentStep].description}
        </Text>

        <ProgressDots>
          {steps.map((_, index) => (
            <Dot key={index} active={index === currentStep} />
          ))}
        </ProgressDots>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            type="text"
            icon={<LeftOutlined />}
            disabled={currentStep === 0}
            onClick={handlePrev}
          >
            이전
          </Button>

          <Text style={{ fontSize: 12, color: "#888" }}>
            {currentStep + 1} / {steps.length}
          </Text>

          <Button
            type="primary"
            icon={currentStep === steps.length - 1 ? undefined : <RightOutlined />}
            onClick={handleNext}
          >
            {currentStep === steps.length - 1 ? "완료" : "다음"}
          </Button>
        </div>
      </GuideCard>
    </TutorialContainer>,
    document.body // body에 직접 렌더링
  );
};

export default Tutorial;