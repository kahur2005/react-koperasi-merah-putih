import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './index.js'

beforeEach(() => {
  useGameStore.setState({ notifications: [], hudVisible: true, currentDay: 5 })
})

describe('ui slice', () => {
  it('pushNotification records message with current day', () => {
    useGameStore.getState().pushNotification('info', 'Halo')
    const notes = useGameStore.getState().notifications
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({ type: 'info', message: 'Halo', day: 5 })
  })
  it('caps notifications at 20', () => {
    for (let i = 0; i < 25; i++) useGameStore.getState().pushNotification('info', `n${i}`)
    expect(useGameStore.getState().notifications).toHaveLength(20)
  })
  it('setHudVisible toggles visibility', () => {
    useGameStore.getState().setHudVisible(false)
    expect(useGameStore.getState().hudVisible).toBe(false)
  })
})
