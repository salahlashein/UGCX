import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProductRequest, Product, UpdateProductRequest } from '@ugcx/shared-types';
import { apiGet, apiPaginated, apiPatch, apiPost } from '../../services/apiHelpers';

const PRODUCTS_KEY = ['products'];

export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: () => apiPaginated<Product>('/products', { perPage: 100 }),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => apiGet<Product>(`/products/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProductRequest) => apiPost<Product>('/products', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductRequest }) =>
      apiPatch<Product>(`/products/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
