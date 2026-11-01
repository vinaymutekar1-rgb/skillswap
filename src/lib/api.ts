/**
 * Thin typed wrapper over the SkillSwap API.
 *
 * Every call surfaces the server's own `error` string — never a generic
 * "something went wrong" — so a failed mutation is debuggable from the UI.
 */

import type { BootstrapData } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  const body = await res.json().catch(() => ({} as Record<string, unknown>))

  if (!res.ok) {
    const message =
      typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `HTTP ${res.status}`
    throw new Error(message)
  }

  return body as T
}

export const api = {
  bootstrap: (studentId?: string) =>
    request<BootstrapData>(`/bootstrap${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`),

  seed: () => request<{ ok: boolean; seeded: boolean; students: number }>('/seed', { method: 'POST' }),

  reset: () => request<{ ok: boolean }>('/reset', { method: 'POST' }),

  createRequest: (payload: {
    fromId: string
    toId: string
    teachSkill: string
    learnSkill: string
    message?: string
  }) => request<{ ok: boolean }>('/swap/requests', { method: 'POST', body: JSON.stringify(payload) }),

  updateRequest: (id: string, status: string) =>
    request<{ ok: boolean }>(`/swap/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  sendMessage: (payload: { requestId: string; senderId: string; body: string }) =>
    request<{ ok: boolean }>('/swap/messages', { method: 'POST', body: JSON.stringify(payload) }),

  createSession: (payload: {
    requestId: string
    teacherId: string
    learnerId: string
    skill: string
    scheduledAt: string
    durationMin: number
    mode: string
  }) => request<{ ok: boolean }>('/swap/sessions', { method: 'POST', body: JSON.stringify(payload) }),

  completeSession: (id: string) =>
    request<{ ok: boolean; creditsAwarded: number }>(`/swap/sessions/${id}/complete`, { method: 'PATCH' }),

  cancelSession: (id: string) =>
    request<{ ok: boolean }>(`/swap/sessions/${id}/cancel`, { method: 'PATCH' }),

  createReview: (payload: {
    sessionId: string
    reviewerId: string
    communication: number
    knowledge: number
    reliability: number
    quality: number
    comment?: string
  }) => request<{ ok: boolean }>('/swap/reviews', { method: 'POST', body: JSON.stringify(payload) }),

  updateProfile: (
    id: string,
    payload: { bio?: string; year?: string; availability?: string; preferredMode?: string },
  ) => request<{ ok: boolean }>(`/swap/students/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  addSkill: (payload: {
    studentId: string
    skillName: string
    kind: string
    level?: string
  }) => request<{ ok: boolean }>('/swap/skills', { method: 'POST', body: JSON.stringify(payload) }),

  removeSkill: (id: string) =>
    request<{ ok: boolean }>(`/swap/skills/${id}`, { method: 'DELETE' }),

  markNotificationsRead: (studentId: string) =>
    request<{ ok: boolean }>('/swap/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),
}
