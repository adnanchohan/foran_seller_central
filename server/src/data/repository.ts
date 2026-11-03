import { randomUUID } from 'node:crypto';
import { getDatabase } from '../config/runtimeBindings.js';
import type {
  AppUser,
  ApplicationDraft,
  ApplicationStatus,
  DemoPayment,
  DocumentType,
  ReviewHistoryItem,
  SellerPlan,
  StoreApplication,
  UploadedDocument,
  UserRole,
} from './types.js';

interface UserRow {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  photo_url: string;
  auth_provider: string;
  role: UserRole;
  plan: SellerPlan | null;
  dashboard_enabled: number;
  last_signed_in_at: string;
  created_at: string;
  updated_at: string;
}

interface DocumentRow {
  id: string;
  owner_id: string;
  document_type: DocumentType;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size: number;
  storage_key: string;
  created_at: string;
  updated_at: string;
}

interface ApplicationRow {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  version: number;
  seller_type: 'individual' | 'company';
  store_name: string;
  store_slug: string;
  category: string;
  description: string;
  warehouse_address: string;
  pickup_city: string;
  pickup_area: string;
  pickup_contact_person: string;
  pickup_contact_mobile: string;
  cnic_number: string;
  banner_upload_id: string | null;
  logo_upload_id: string | null;
  cnic_front_upload_id: string | null;
  cnic_back_upload_id: string | null;
  company_document_upload_id: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string;
  created_at: string;
  updated_at: string;
}

interface HistoryRow {
  status: ApplicationStatus;
  note: string;
  actor_id: string;
  version: number;
  created_at: string;
}

interface PaymentRow {
  id: string;
  user_id: string;
  plan: SellerPlan;
  amount: number;
  currency: string;
  status: 'DEMO_COMPLETED';
  provider: 'NOT_INTEGRATED';
  notice: string;
  created_at: string;
  updated_at: string;
}

const applicationColumns = `
  id, user_id, status, version, seller_type, store_name, store_slug, category,
  description, warehouse_address, pickup_city, pickup_area, pickup_contact_person,
  pickup_contact_mobile, cnic_number, banner_upload_id, logo_upload_id,
  cnic_front_upload_id, cnic_back_upload_id, company_document_upload_id,
  submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at
`;

function mapUser(row: UserRow): AppUser {
  return {
    _id: row.id,
    firebaseUid: row.firebase_uid,
    email: row.email,
    displayName: row.display_name,
    photoUrl: row.photo_url,
    authProvider: row.auth_provider,
    role: row.role,
    plan: row.plan,
    dashboardEnabled: Boolean(row.dashboard_enabled),
    lastSignedInAt: row.last_signed_in_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDocument(row: DocumentRow): UploadedDocument {
  return {
    _id: row.id,
    id: row.id,
    owner: row.owner_id,
    documentType: row.document_type,
    originalName: row.original_name,
    storedName: row.stored_name,
    mimeType: row.mime_type,
    size: row.size,
    storageProvider: 'r2',
    storageKey: row.storage_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPayment(row: PaymentRow): DemoPayment {
  return {
    _id: row.id,
    user: row.user_id,
    plan: row.plan,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    provider: row.provider,
    notice: row.notice,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getUserById(id: string) {
  const row = await getDatabase()
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<UserRow>();
  return row ? mapUser(row) : null;
}

export async function upsertUser(input: {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoUrl: string;
  authProvider: string;
  role: UserRole;
}) {
  const now = new Date().toISOString();
  const row = await getDatabase()
    .prepare(`
      INSERT INTO users (
        id, firebase_uid, email, display_name, photo_url, auth_provider, role,
        last_signed_in_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(firebase_uid) DO UPDATE SET
        email = excluded.email,
        display_name = excluded.display_name,
        photo_url = excluded.photo_url,
        auth_provider = excluded.auth_provider,
        role = excluded.role,
        last_signed_in_at = excluded.last_signed_in_at,
        updated_at = excluded.updated_at
      RETURNING *
    `)
    .bind(
      randomUUID(),
      input.firebaseUid,
      input.email,
      input.displayName,
      input.photoUrl,
      input.authProvider,
      input.role,
      now,
      now,
      now,
    )
    .first<UserRow>();
  if (!row) throw new Error('D1 did not return the authenticated user.');
  return mapUser(row);
}

async function getDocumentMap(ids: Array<string | null>) {
  const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) return new Map<string, UploadedDocument>();
  const placeholders = uniqueIds.map(() => '?').join(', ');
  const { results } = await getDatabase()
    .prepare(`SELECT * FROM document_uploads WHERE id IN (${placeholders})`)
    .bind(...uniqueIds)
    .all<DocumentRow>();
  return new Map(results.map((row) => [row.id, mapDocument(row)]));
}

async function getHistory(applicationId: string): Promise<ReviewHistoryItem[]> {
  const { results } = await getDatabase()
    .prepare(`
      SELECT status, note, actor_id, version, created_at
      FROM application_history
      WHERE application_id = ?
      ORDER BY created_at ASC, id ASC
    `)
    .bind(applicationId)
    .all<HistoryRow>();
  return results.map((row) => ({
    status: row.status,
    note: row.note,
    actor: row.actor_id,
    version: row.version,
    at: row.created_at,
  }));
}

async function hydrateApplication(
  row: ApplicationRow,
  options: { documents?: boolean; user?: boolean; reviewer?: boolean; history?: boolean } = {},
): Promise<StoreApplication> {
  const documentIds = [
    row.banner_upload_id,
    row.logo_upload_id,
    row.cnic_front_upload_id,
    row.cnic_back_upload_id,
    row.company_document_upload_id,
  ];
  const [documents, user, reviewer, history] = await Promise.all([
    options.documents ? getDocumentMap(documentIds) : Promise.resolve(new Map()),
    options.user ? getUserById(row.user_id) : Promise.resolve(null),
    options.reviewer && row.reviewed_by ? getUserById(row.reviewed_by) : Promise.resolve(null),
    options.history ? getHistory(row.id) : Promise.resolve([]),
  ]);
  const uploadValue = (id: string | null) =>
    id ? (options.documents ? documents.get(id) ?? id : id) : null;

  return {
    _id: row.id,
    user: user ?? row.user_id,
    status: row.status,
    version: row.version,
    sellerType: row.seller_type,
    storeName: row.store_name,
    storeSlug: row.store_slug,
    category: row.category,
    description: row.description,
    warehouseAddress: row.warehouse_address,
    pickupCity: row.pickup_city,
    pickupArea: row.pickup_area,
    pickupContactPerson: row.pickup_contact_person,
    pickupContactMobile: row.pickup_contact_mobile,
    cnicNumber: row.cnic_number,
    bannerUpload: uploadValue(row.banner_upload_id),
    logoUpload: uploadValue(row.logo_upload_id),
    cnicFrontUpload: uploadValue(row.cnic_front_upload_id),
    cnicBackUpload: uploadValue(row.cnic_back_upload_id),
    companyDocumentUpload: uploadValue(row.company_document_upload_id),
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: reviewer ?? row.reviewed_by,
    reviewNote: row.review_note,
    history,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getApplicationRowByUserId(userId: string) {
  return getDatabase()
    .prepare(`SELECT ${applicationColumns} FROM store_applications WHERE user_id = ?`)
    .bind(userId)
    .first<ApplicationRow>();
}

async function getApplicationRowById(id: string) {
  return getDatabase()
    .prepare(`SELECT ${applicationColumns} FROM store_applications WHERE id = ?`)
    .bind(id)
    .first<ApplicationRow>();
}

export async function getApplicationByUserId(userId: string, populateDocuments = true) {
  const row = await getApplicationRowByUserId(userId);
  return row
    ? hydrateApplication(row, { documents: populateDocuments, history: true, reviewer: true })
    : null;
}

export async function listApplications(status?: ApplicationStatus) {
  const statement = status
    ? getDatabase()
        .prepare(`
          SELECT ${applicationColumns} FROM store_applications
          WHERE status = ?
          ORDER BY submitted_at ASC, updated_at DESC
        `)
        .bind(status)
    : getDatabase().prepare(`
        SELECT ${applicationColumns} FROM store_applications
        ORDER BY submitted_at ASC, updated_at DESC
      `);
  const { results } = await statement.all<ApplicationRow>();
  return Promise.all(results.map((row) => hydrateApplication(row, { user: true })));
}

export async function getApplicationById(id: string) {
  const row = await getApplicationRowById(id);
  return row
    ? hydrateApplication(row, {
        documents: true,
        user: true,
        reviewer: true,
        history: true,
      })
    : null;
}

export async function saveApplicationDraft(userId: string, data: ApplicationDraft) {
  const existing = await getApplicationRowByUserId(userId);
  const now = new Date().toISOString();
  const merged = {
    sellerType: data.sellerType ?? existing?.seller_type ?? 'individual',
    storeName: data.storeName ?? existing?.store_name ?? '',
    storeSlug: data.storeSlug ?? existing?.store_slug ?? '',
    category: data.category ?? existing?.category ?? '',
    description: data.description ?? existing?.description ?? '',
    warehouseAddress: data.warehouseAddress ?? existing?.warehouse_address ?? '',
    pickupCity: data.pickupCity ?? existing?.pickup_city ?? '',
    pickupArea: data.pickupArea ?? existing?.pickup_area ?? '',
    pickupContactPerson: data.pickupContactPerson ?? existing?.pickup_contact_person ?? '',
    pickupContactMobile: data.pickupContactMobile ?? existing?.pickup_contact_mobile ?? '',
    cnicNumber: data.cnicNumber ?? existing?.cnic_number ?? '',
    bannerUpload: data.bannerUpload === undefined ? existing?.banner_upload_id ?? null : data.bannerUpload,
    logoUpload: data.logoUpload === undefined ? existing?.logo_upload_id ?? null : data.logoUpload,
    cnicFrontUpload:
      data.cnicFrontUpload === undefined ? existing?.cnic_front_upload_id ?? null : data.cnicFrontUpload,
    cnicBackUpload:
      data.cnicBackUpload === undefined ? existing?.cnic_back_upload_id ?? null : data.cnicBackUpload,
    companyDocumentUpload:
      data.companyDocumentUpload === undefined
        ? existing?.company_document_upload_id ?? null
        : data.companyDocumentUpload,
  };

  if (existing) {
    await getDatabase()
      .prepare(`
        UPDATE store_applications SET
          seller_type = ?, store_name = ?, store_slug = ?, category = ?, description = ?,
          warehouse_address = ?, pickup_city = ?, pickup_area = ?, pickup_contact_person = ?,
          pickup_contact_mobile = ?, cnic_number = ?, banner_upload_id = ?, logo_upload_id = ?,
          cnic_front_upload_id = ?, cnic_back_upload_id = ?, company_document_upload_id = ?,
          updated_at = ?
        WHERE id = ?
      `)
      .bind(
        merged.sellerType,
        merged.storeName,
        merged.storeSlug,
        merged.category,
        merged.description,
        merged.warehouseAddress,
        merged.pickupCity,
        merged.pickupArea,
        merged.pickupContactPerson,
        merged.pickupContactMobile,
        merged.cnicNumber,
        merged.bannerUpload,
        merged.logoUpload,
        merged.cnicFrontUpload,
        merged.cnicBackUpload,
        merged.companyDocumentUpload,
        now,
        existing.id,
      )
      .run();
  } else {
    await getDatabase()
      .prepare(`
        INSERT INTO store_applications (
          id, user_id, seller_type, store_name, store_slug, category, description,
          warehouse_address, pickup_city, pickup_area, pickup_contact_person,
          pickup_contact_mobile, cnic_number, banner_upload_id, logo_upload_id,
          cnic_front_upload_id, cnic_back_upload_id, company_document_upload_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        randomUUID(),
        userId,
        merged.sellerType,
        merged.storeName,
        merged.storeSlug,
        merged.category,
        merged.description,
        merged.warehouseAddress,
        merged.pickupCity,
        merged.pickupArea,
        merged.pickupContactPerson,
        merged.pickupContactMobile,
        merged.cnicNumber,
        merged.bannerUpload,
        merged.logoUpload,
        merged.cnicFrontUpload,
        merged.cnicBackUpload,
        merged.companyDocumentUpload,
        now,
        now,
      )
      .run();
  }
  return getApplicationByUserId(userId);
}

export async function countOwnedDocuments(ownerId: string, documentIds: string[]) {
  if (documentIds.length === 0) return 0;
  const placeholders = documentIds.map(() => '?').join(', ');
  const row = await getDatabase()
    .prepare(`
      SELECT COUNT(*) AS count FROM document_uploads
      WHERE owner_id = ? AND id IN (${placeholders})
    `)
    .bind(ownerId, ...documentIds)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function submitApplication(application: StoreApplication, actorId: string) {
  const now = new Date().toISOString();
  const isResubmission = application.status === 'CHANGES_REQUIRED';
  const version = isResubmission ? application.version + 1 : application.version;
  const database = getDatabase();
  await database.batch([
    database
      .prepare(`
        UPDATE store_applications SET
          status = 'PENDING_REVIEW', version = ?, submitted_at = ?, reviewed_at = NULL,
          reviewed_by = NULL, review_note = '', updated_at = ?
        WHERE id = ?
      `)
      .bind(version, now, now, application._id),
    database
      .prepare(`
        INSERT INTO application_history (
          application_id, status, note, actor_id, version, created_at
        ) VALUES (?, 'PENDING_REVIEW', ?, ?, ?, ?)
      `)
      .bind(
        application._id,
        isResubmission
          ? 'Application resubmitted by seller.'
          : 'Application submitted by seller.',
        actorId,
        version,
        now,
      ),
  ]);
  return getApplicationById(application._id);
}

export async function reviewApplication(input: {
  application: StoreApplication;
  status: 'APPROVED' | 'CHANGES_REQUIRED';
  note: string;
  reviewerId: string;
}) {
  const now = new Date().toISOString();
  const database = getDatabase();
  await database.batch([
    database
      .prepare(`
        UPDATE store_applications SET
          status = ?, review_note = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ?
        WHERE id = ? AND status = 'PENDING_REVIEW'
      `)
      .bind(input.status, input.note, now, input.reviewerId, now, input.application._id),
    database
      .prepare(`
        INSERT INTO application_history (
          application_id, status, note, actor_id, version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.application._id,
        input.status,
        input.note,
        input.reviewerId,
        input.application.version,
        now,
      ),
  ]);
  return getApplicationById(input.application._id);
}

export async function updateUserPlan(userId: string, plan: SellerPlan) {
  const row = await getDatabase()
    .prepare('UPDATE users SET plan = ?, updated_at = ? WHERE id = ? RETURNING *')
    .bind(plan, new Date().toISOString(), userId)
    .first<UserRow>();
  if (!row) throw new Error('D1 did not return the updated user.');
  return mapUser(row);
}

export async function createDocument(input: {
  ownerId: string;
  documentType: DocumentType;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storageKey: string;
}) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const row = await getDatabase()
    .prepare(`
      INSERT INTO document_uploads (
        id, owner_id, document_type, original_name, stored_name, mime_type,
        size, storage_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      id,
      input.ownerId,
      input.documentType,
      input.originalName,
      input.storedName,
      input.mimeType,
      input.size,
      input.storageKey,
      now,
      now,
    )
    .first<DocumentRow>();
  if (!row) throw new Error('D1 did not return the uploaded document.');
  return mapDocument(row);
}

export async function getDocumentById(id: string) {
  const row = await getDatabase()
    .prepare('SELECT * FROM document_uploads WHERE id = ?')
    .bind(id)
    .first<DocumentRow>();
  return row ? mapDocument(row) : null;
}

export async function getPaymentByUserId(userId: string) {
  const row = await getDatabase()
    .prepare('SELECT * FROM payments WHERE user_id = ?')
    .bind(userId)
    .first<PaymentRow>();
  return row ? mapPayment(row) : null;
}

export async function completePlaceholderPayment(userId: string, plan: SellerPlan, amount: number) {
  const now = new Date().toISOString();
  const notice = 'Development placeholder only. No money was collected.';
  const database = getDatabase();
  await database.batch([
    database
      .prepare(`
        INSERT INTO payments (
          id, user_id, plan, amount, currency, status, provider, notice, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'PKR', 'DEMO_COMPLETED', 'NOT_INTEGRATED', ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          plan = excluded.plan,
          amount = excluded.amount,
          currency = excluded.currency,
          status = excluded.status,
          provider = excluded.provider,
          notice = excluded.notice,
          updated_at = excluded.updated_at
      `)
      .bind(randomUUID(), userId, plan, amount, notice, now, now),
    database
      .prepare('UPDATE users SET dashboard_enabled = 1, updated_at = ? WHERE id = ?')
      .bind(now, userId),
  ]);
  return getPaymentByUserId(userId);
}
