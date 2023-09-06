export interface ProductDataTypes {
  name: string;
  shortDescription: string;
  longDescription: string;
  actualPrice: number;
  discount: number;
  quantity?: number;
  category: string;
  promoted?: boolean;
  featured?: boolean;
}

export interface UpdateProductDataTypes {
  name?: string;
  shortDescription?: string;
  longDescription?: string;
  actualPrice?: number;
  discount?: number;
  quantity?: number;
  category?: string;
  promoted?: boolean;
  featured?: boolean;
}

export interface ProductImageTypes {}
export interface ProductReviewTypes {
  review: string;
  rate?: number;
}

export interface UProductsType {
  productId: string;
}
