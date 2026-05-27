export type UserRole = 'manager' | 'head' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Product {
  id: number
  category_id: number
  name: string
  description: string | null
  price: number
  unit: string
  currency: string
  is_active: boolean
}

export interface Category {
  id: number
  name: string
  sort_order: number
  products: Product[]
}

export type ProposalStatus =
  | 'draft'
  | 'signed_manager'
  | 'on_approval'
  | 'signed_head'
  | 'sent_client'
  | 'rejected'

export interface ProposalItem {
  id: number
  product_id: number | null
  product_name: string
  product_description: string | null
  category_name: string | null
  unit: string
  price: number
  quantity: number
  total: number
}

export interface HistoryEntry {
  id: number
  status: ProposalStatus
  comment: string | null
  changed_by: User | null
  created_at: string
}

export interface Proposal {
  id: number
  number: string
  manager: User
  status: ProposalStatus
  client_company: string
  client_contact: string
  client_email: string
  client_phone: string | null
  validity_days: number
  comment: string | null
  subtotal: number
  vat_amount: number
  total: number
  manager_signed_at: string | null
  head_signed_at: string | null
  head_comment: string | null
  sent_at: string | null
  pdf_path: string | null
  created_at: string
  items: ProposalItem[]
  history: HistoryEntry[]
}

export interface ProposalListItem {
  id: number
  number: string
  manager: User
  status: ProposalStatus
  client_company: string
  client_email: string
  total: number
  created_at: string
  sent_at: string | null
}

export interface CartItem {
  product: Product
  quantity: number
}
