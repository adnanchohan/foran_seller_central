PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  auth_provider TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('seller', 'admin')),
  plan TEXT CHECK (plan IN ('BASIC', 'PREMIUM')),
  dashboard_enabled INTEGER NOT NULL DEFAULT 0 CHECK (dashboard_enabled IN (0, 1)),
  last_signed_in_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_users_role ON users(role);

CREATE TABLE document_uploads (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (
    document_type IN ('store-banner', 'store-logo', 'cnic-front', 'cnic-back', 'company-document')
  ),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size >= 0),
  storage_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_document_uploads_owner_type_created
  ON document_uploads(owner_id, document_type, created_at DESC);

CREATE TABLE store_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (
    status IN ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUIRED', 'APPROVED')
  ),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  seller_type TEXT NOT NULL DEFAULT 'individual' CHECK (seller_type IN ('individual', 'company')),
  store_name TEXT NOT NULL DEFAULT '',
  store_slug TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  warehouse_address TEXT NOT NULL DEFAULT '',
  pickup_city TEXT NOT NULL DEFAULT '',
  pickup_area TEXT NOT NULL DEFAULT '',
  pickup_contact_person TEXT NOT NULL DEFAULT '',
  pickup_contact_mobile TEXT NOT NULL DEFAULT '',
  cnic_number TEXT NOT NULL DEFAULT '',
  banner_upload_id TEXT REFERENCES document_uploads(id) ON DELETE SET NULL,
  logo_upload_id TEXT REFERENCES document_uploads(id) ON DELETE SET NULL,
  cnic_front_upload_id TEXT REFERENCES document_uploads(id) ON DELETE SET NULL,
  cnic_back_upload_id TEXT REFERENCES document_uploads(id) ON DELETE SET NULL,
  company_document_upload_id TEXT REFERENCES document_uploads(id) ON DELETE SET NULL,
  submitted_at TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_store_applications_status_submitted
  ON store_applications(status, submitted_at, updated_at DESC);
CREATE INDEX idx_store_applications_slug ON store_applications(store_slug);

CREATE TABLE application_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id TEXT NOT NULL REFERENCES store_applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (
    status IN ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUIRED', 'APPROVED')
  ),
  note TEXT NOT NULL DEFAULT '',
  actor_id TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_application_history_application_created
  ON application_history(application_id, created_at);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('BASIC', 'PREMIUM')),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'PKR',
  status TEXT NOT NULL DEFAULT 'DEMO_COMPLETED' CHECK (status = 'DEMO_COMPLETED'),
  provider TEXT NOT NULL DEFAULT 'NOT_INTEGRATED' CHECK (provider = 'NOT_INTEGRATED'),
  notice TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
