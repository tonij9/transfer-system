export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_active: boolean;
  role: string;
  created_at: string;
}

export interface Transfer {
  id: number;
  reference_number: string;
  customer_name: string;
  customer_email: string | null;
  from_institution: string;
  to_institution: string;
  account_number: string;
  account_type: string;
  transfer_type: string;
  transfer_amount: number;
  status: string;
  initiated_date: string | null;
  expected_completion: string | null;
  issues: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface T2220Form {
  id: number;
  form_number: string;
  transfer_id: number;
  account_holder_name: string;
  account_number_on_form: string;
  account_type_on_form: string;
  transfer_amount_on_form: number;
  transfer_type_on_form: string;
  signature_date: string | null;
  form_pdf_url: string | null;
  verified: boolean;
  verification_notes: string | null;
  verified_by_id: number | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ZendeskTicket {
  id: number;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  transfer_reference: string | null;
  transfer_id: number | null;
  assigned_agent_id: number | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface JiraTicket {
  id: number;
  ticket_key: string;
  zendesk_ticket_id: number;
  transfer_id: number;
  summary: string;
  description: string;
  priority: string;
  status: string;
  assignee: string | null;
  created_by_id: number;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TransferComparison {
  transfer: {
    id: number;
    reference_number: string;
    customer_name: string;
    account_number: string;
    account_type: string;
    transfer_amount: number | null;
    transfer_type: string;
    from_institution: string;
    to_institution: string;
    status: string;
  };
  t2220_form: {
    id: number;
    form_number: string;
    account_holder_name: string;
    account_number_on_form: string;
    account_type_on_form: string;
    transfer_amount_on_form: number | null;
    transfer_type_on_form: string;
    verified: boolean;
  } | null;
  mismatches: {
    field: string;
    atlas_value: string | number;
    form_value: string | number;
  }[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
