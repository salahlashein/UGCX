export interface RequestGenericUploadUrlRequest {
  module: 'portfolio' | 'verification' | 'product' | 'deliverable';
  contentType: string;
  fileSize: number;
}

export interface RequestGenericUploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}
