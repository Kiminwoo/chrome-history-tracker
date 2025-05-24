import React from "react";
export type TutorialStep = {
    id: string;
    title: string;
    description: string;
};
interface TutorialProps {
    steps: readonly TutorialStep[];
    currentStep: number;
    onStepChange: (step: number) => void;
    onClose: () => void;
}
declare const Tutorial: React.FC<TutorialProps>;
export default Tutorial;
