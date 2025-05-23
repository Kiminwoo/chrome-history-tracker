chrome.history.onVisited.addListener((historyItem) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (
    historyItem.lastVisitTime &&
    historyItem.lastVisitTime >= today.getTime()
  ) {
    const todayKey = new Date().toISOString().slice(0, 10);

    // 기존 마지막 기록과 비교하여 업데이트
    chrome.storage.local.get([`lastVisit_${todayKey}`], (result) => {
      const currentLast = result[`lastVisit_${todayKey}`];

      if (
        !currentLast ||
        historyItem.lastVisitTime > currentLast.lastVisitTime
      ) {
        chrome.storage.local.set({
          [`lastVisit_${todayKey}`]: historyItem,
        });
      }
    });
  }
});
