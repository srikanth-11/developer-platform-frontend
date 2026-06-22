/** Mirrors the backend Application entity. */
export interface Application {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationPayload {
  name: string;
  description?: string;
}
