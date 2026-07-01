import { MEMBER_MONTHLY_FEE } from '../config.js'

export const createMembersSlice = (set, get) => ({
  totalMembers: 0,
  pendingMembers: 0,

  // Queue a new member (applied at end of day via commitPendingMembers).
  registerMember: () => set((s) => ({ pendingMembers: s.pendingMembers + 1 })),

  commitPendingMembers: () =>
    set((s) => ({ totalMembers: s.totalMembers + s.pendingMembers, pendingMembers: 0 })),

  collectMonthlyFees: () => {
    const { totalMembers, addMoney } = get()
    const fees = totalMembers * MEMBER_MONTHLY_FEE
    addMoney(fees)
    return fees
  },
})
