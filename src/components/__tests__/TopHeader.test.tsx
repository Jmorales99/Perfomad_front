import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ logout: vi.fn() }),
}))

vi.mock("@/infrastructure/api/profileRepository", () => ({
  getProfile: vi.fn().mockResolvedValue({ name: "José Test" }),
}))

// Mock useClient with a configurable implementation
const mockUseClient = vi.fn()
vi.mock("@/app/providers/ClientProvider", () => ({
  useClient: () => mockUseClient(),
}))

// Minimal shadcn stubs to avoid Radix DOM issues
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <span>{children}</span>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({ children, onSelect }: any) => (
    <button onClick={onSelect}>{children}</button>
  ),
}))

function makeClientContext(overrides: Partial<ReturnType<typeof baseContext>> = {}) {
  return { ...baseContext(), ...overrides }
}

function baseContext() {
  return {
    clients: [] as any[],
    selectedClient: null,
    selectedClientId: null,
    setSelectedClientId: vi.fn(),
    loadingClients: false,
    loadClients: vi.fn(),
    createAndSelectClient: vi.fn(),
    removeClient: vi.fn(),
    metaStatus: {},
    setMetaStatus: vi.fn(),
    googleAdsStatus: {},
    setGoogleAdsStatus: vi.fn(),
    tiktokStatus: {},
    setTikTokStatus: vi.fn(),
  }
}

import { TopHeader } from "../TopHeader"

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TopHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders 'Sin marca' button when client list is empty", () => {
    mockUseClient.mockReturnValue(makeClientContext({ clients: [] }))
    render(<TopHeader />)
    expect(screen.getByText("Sin marca")).toBeInTheDocument()
  })

  it("renders single client name when there is exactly one client", () => {
    const client = { id: "c1", name: "Mi Marca", user_id: "u1", created_at: "" }
    mockUseClient.mockReturnValue(
      makeClientContext({
        clients: [client],
        selectedClient: client,
        selectedClientId: "c1",
      })
    )
    render(<TopHeader />)
    expect(screen.getByText("Mi Marca")).toBeInTheDocument()
  })

  it("renders selected client name in dropdown trigger when multiple clients", () => {
    const selected = { id: "c1", name: "Marca A", user_id: "u1", created_at: "" }
    const other = { id: "c2", name: "Marca B", user_id: "u1", created_at: "" }
    mockUseClient.mockReturnValue(
      makeClientContext({
        clients: [selected, other],
        selectedClient: selected,
        selectedClientId: "c1",
      })
    )
    render(<TopHeader />)
    // Name appears in trigger + dropdown list item
    const matches = screen.getAllByText("Marca A")
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it("shows all client names in dropdown when multiple clients", () => {
    const clients = [
      { id: "c1", name: "Marca Alpha", user_id: "u1", created_at: "" },
      { id: "c2", name: "Marca Beta", user_id: "u1", created_at: "" },
    ]
    mockUseClient.mockReturnValue(
      makeClientContext({
        clients,
        selectedClient: clients[0],
        selectedClientId: "c1",
      })
    )
    render(<TopHeader />)
    // Marca Alpha appears in trigger + list; Marca Beta in list only
    expect(screen.getAllByText("Marca Alpha").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Marca Beta")).toBeInTheDocument()
  })
})
