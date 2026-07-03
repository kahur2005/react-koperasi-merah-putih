let notifCounter = 0

export const createUiSlice = (set, get) => ({
  currencyIcon: 'rupiah_coin',
  hudVisible: true,
  notifications: [],
  activePanel: 'dashboard',
  tutorialStep: 0,
  tutorialDismissed: false,
  showDaySummary: false,

  pushNotification: (type, message) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { id: `n-${++notifCounter}`, type, message, day: get().currentDay },
      ].slice(-20), // keep only the latest 20
    })),

  setHudVisible: (visible) => set({ hudVisible: visible }),
  setActivePanel: (activePanel) => set({ activePanel }),
  nextTutorialStep: () =>
    set((s) => ({
      tutorialStep: s.tutorialStep + 1,
    })),
  dismissTutorial: () => set({ tutorialDismissed: true }),
  setShowDaySummary: (showDaySummary) => set({ showDaySummary }),
})
