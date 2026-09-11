export interface Brand {
  id: string;
  userId: string;
  companyName: string | null;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBrandRequest {
  companyName?: string;
  country?: string;
}
