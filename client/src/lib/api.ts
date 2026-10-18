import { firebaseAuth } from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function authorizedHeaders(includeJson: boolean) {
  const token = await firebaseAuth?.currentUser?.getIdToken();
  if (!token) throw new ApiError('You must sign in first.', 401);
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  if (includeJson) headers.set('Content-Type', 'application/json');
  return headers;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: await authorizedHeaders(Boolean(options.body) && !isFormData),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string; details?: unknown } }
    | T
    | null;

  if (!response.ok) {
    const errorPayload = payload as { error?: { message?: string; details?: unknown } } | null;
    throw new ApiError(
      errorPayload?.error?.message || 'The server could not complete the request.',
      response.status,
      errorPayload?.error?.details,
    );
  }
  return payload as T;
}

export async function uploadDocument(file: File, documentType: string) {
  const form = new FormData();
  form.append('file', file);
  form.append('documentType', documentType);
  return apiRequest<{ document: import('../types').UploadedDocument }>('/uploads', {
    method: 'POST',
    body: form,
  });
}

export async function downloadAdminDocument(documentId: string, filename: string) {
  const response = await fetch(`${API_URL}/admin/documents/${documentId}/download`, {
    headers: await authorizedHeaders(false),
  });
  if (!response.ok) throw new ApiError('The document could not be downloaded.', response.status);
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
