import { getCompanyProfile, getContacts, getProducts } from "@/lib/repository";
import type { CompanyProfileView, ContactSummary, ProductSummary } from "@/lib/types";

export async function getCompanyModuleData(): Promise<CompanyProfileView> {
  return getCompanyProfile();
}

export async function getContactModuleData(): Promise<ContactSummary[]> {
  return getContacts();
}

export async function getProductModuleData(): Promise<ProductSummary[]> {
  return getProducts();
}
