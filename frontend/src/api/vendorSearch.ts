import { apiGet } from "./client";
import type { VendorCompareResponse, VendorDetailResponse, VendorSearchResponse } from "@/types/vendorSearch";

export const searchVendors = (query: string) =>
  apiGet<VendorSearchResponse>(`/api/vendors/search?q=${encodeURIComponent(query)}&limit=10`);

export const fetchVendorDetail = (vendor: string, product: string) =>
  apiGet<VendorDetailResponse>(
    `/api/vendors/detail?vendor=${encodeURIComponent(vendor)}&product=${encodeURIComponent(product)}`,
  );

export const compareVendors = (pairs: Array<{ vendor: string; product: string }>) => {
  const params = pairs.map((p) => `pair=${encodeURIComponent(`${p.vendor}|${p.product}`)}`).join("&");
  return apiGet<VendorCompareResponse>(`/api/vendors/compare?${params}`);
};
