export interface Product {
  id: string;
  brandId: string;
  name: string;
  description: string | null;
  valueProps: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  valueProps?: string[];
  images?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  valueProps?: string[];
  images?: string[];
}
