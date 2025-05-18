import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import ContentApp from '../App';
const APP_ID = 'chrome-extension-root';
// UI 삽입 함수
function injectUI() {
    const existingRoot = document.getElementById(APP_ID);
    if (existingRoot)
        return;
    const root = document.createElement('div');
    root.id = APP_ID;
    document.body.appendChild(root);
    createRoot(root).render(_jsx(ContentApp, {}));
}
// 초기 삽입
injectUI();
