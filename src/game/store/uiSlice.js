let notifCounter = 0

export const createUiSlice = (set, get) => ({
  currencyIcon: 'rupiah_coin',
  hudVisible: true,
  notifications: [],

  pushNotification: (type, message) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { id: `n-${++notifCounter}`, type, message, day: get().currentDay },
      ].slice(-20), // keep only the latest 20
    })),

  setHudVisible: (visible) => set({ hudVisible: visible }),
})
