import { apiFetch } from './apiClient';

export interface CreateUserDTO {
  email: string;
  password: string;
  displayName: string;
  role: string;
}

export async function createUser(
  dto: CreateUserDTO,
  token?: string
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/api/user', {
    method: 'POST',
    body: JSON.stringify(dto),
  }, token);
}

export async function getUserById(
  id: string,
  token: string
): Promise<any> {
  return apiFetch<any>(`/api/user/${id}`, { method: 'GET' }, token);
}

export async function updateUser(
  id: string,
  update: Partial<Omit<CreateUserDTO, 'password'>>,
  token: string
): Promise<void> {
  await apiFetch<void>(`/api/user/${id}`, {
    method: 'PUT',
    body: JSON.stringify(update),
  }, token);
}

export async function deleteUser(
  id: string,
  token: string
): Promise<void> {
  await apiFetch<void>(`/api/user/${id}`, { method: 'DELETE' }, token);
}