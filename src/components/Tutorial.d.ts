import React from "react";
interface TutorialProps {
    onClose: () => void;
    currentStep: number;
    onStepChange: (step: number) => void;
}
declare const Tutorial: React.FC<TutorialProps>;
export default Tutorial;
