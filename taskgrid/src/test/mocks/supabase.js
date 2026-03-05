import { vi } from 'vitest'

// Mock data
export const mockTasks = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Description 1',
    category: 'Arbeit',
    priority: 'Hoch',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Offen',
    completed: false,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Description 2',
    category: 'Privat',
    priority: 'Mittel',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // overdue
    status: 'Offen',
    completed: false,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Test Task 3',
    description: 'Description 3',
    category: 'Schule',
    priority: 'Niedrig',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Erledigt',
    completed: true,
    created_at: new Date().toISOString()
  }
]

// Mock channel
export const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    }
  }

  return mockSupabase
}

// Create a mock supabase instance
export const supabase = createMockSupabaseClient()

// Helper to setup mock responses
export const setupMockResponses = (customResponses = {}) => {
  const responses = {
    fetchTasks: { data: mockTasks, error: null },
    createTask: { data: mockTasks[0], error: null },
    updateTask: { data: { ...mockTasks[0], title: 'Updated' }, error: null },
    deleteTask: { error: null },
    ...customResponses
  }

  // Reset all mocks
  vi.clearAllMocks()

  // Setup fetch tasks response
  supabase.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue(responses.fetchTasks)
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(responses.createTask)
      })
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(responses.updateTask)
        })
      })
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(responses.deleteTask)
    }),
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(responses.updateTask)
      }),
      update: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(responses.updateTask)
        })
      })
    })
  })

  supabase.channel.mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  })

  return responses
}

export default supabase
