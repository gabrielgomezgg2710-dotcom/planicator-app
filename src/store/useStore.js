import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CONFIG } from '../config.js';

const useStore = create(
  persist(
    (set, get) => ({
      // Settings
      claudeApiKey: CONFIG.CLAUDE_API_KEY,
      trelloApiKey: CONFIG.TRELLO_API_KEY,
      trelloToken: CONFIG.TRELLO_TOKEN,
      setClaudeApiKey: (key) => set({ claudeApiKey: key }),
      setTrelloApiKey: (key) => set({ trelloApiKey: key }),
      setTrelloToken: (token) => set({ trelloToken: token }),

      // Clients
      clients: [],
      addClient: (client) =>
        set((s) => ({ clients: [...s.clients, { ...client, id: Date.now().toString() }] })),
      updateClient: (id, updates) =>
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      deleteClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
      getClient: (id) => get().clients.find((c) => c.id === id),

      // Active planning (in-progress, not yet saved)
      activePlanning: null,
      setActivePlanning: (planning) => set({ activePlanning: planning }),
      clearActivePlanning: () => set({ activePlanning: null }),
      updateActivePlanningPost: (postId, updates) =>
        set((s) => {
          if (!s.activePlanning) return {};
          return {
            activePlanning: {
              ...s.activePlanning,
              posts: s.activePlanning.posts.map((p) =>
                p.id === postId ? { ...p, ...updates } : p
              ),
            },
          };
        }),
      setActivePlanningPosts: (posts) =>
        set((s) => ({
          activePlanning: s.activePlanning ? { ...s.activePlanning, posts } : null,
        })),

      // Saved history
      history: [],
      savePlanning: (planning) =>
        set((s) => ({
          history: [
            { ...planning, savedAt: new Date().toISOString(), id: planning.id || Date.now().toString() },
            ...s.history.filter((h) => h.id !== planning.id),
          ],
        })),
      deletePlanningFromHistory: (id) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
      loadPlanningFromHistory: (id) => {
        const planning = get().history.find((h) => h.id === id);
        if (planning) set({ activePlanning: planning });
        return planning;
      },

      // Toast notifications (ephemeral, not persisted)
      toasts: [],
      addToast: (toast) =>
        set((s) => ({
          toasts: [...s.toasts, { id: Date.now().toString(), ...toast }],
        })),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'planicator-store',
      partialize: (state) => ({
        claudeApiKey: state.claudeApiKey,
        trelloApiKey: state.trelloApiKey,
        trelloToken: state.trelloToken,
        clients: state.clients,
        activePlanning: state.activePlanning,
        history: state.history,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        // Only override env-var defaults if user saved a non-empty key manually
        claudeApiKey: persisted.claudeApiKey || current.claudeApiKey,
        trelloApiKey: persisted.trelloApiKey || current.trelloApiKey,
        trelloToken: persisted.trelloToken || current.trelloToken,
      }),
    }
  )
);

export default useStore;
