export interface RequestGenericUploadUrlRequest {
  module:
    'portfolio' | 'verification' | 'product' | 'deliverable' | 'brand_logo' | 'brand_document';
  contentType: string;
  fileSize: number;
}

export interface RequestGenericUploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}
