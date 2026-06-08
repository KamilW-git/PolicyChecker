import { z } from 'zod'
import { RequestType, RequestCategory, Department, Urgency, Currency, VendorRisk } from '@prisma/client'

export const createRequestSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki").max(200, "Tytuł nie może przekraczać 200 znaków"),
  description: z.string().min(10, "Uzasadnienie musi mieć co najmniej 10 znaków"),
  type: z.nativeEnum(RequestType),
  category: z.nativeEnum(RequestCategory),
  department: z.nativeEnum(Department),
  urgency: z.nativeEnum(Urgency).optional().default('NORMAL'),
  
  annualCost: z.number().nonnegative("Koszt roczny nie może być ujemny"),
  currency: z.nativeEnum(Currency).optional().default('EUR'),
  
  vendorName: z.string().min(2, "Podaj nazwę dostawcy"),
  vendorCountry: z.string().min(2, "Podaj kod kraju (np. PL, DE)"),
  vendorRisk: z.nativeEnum(VendorRisk).optional().default('UNKNOWN'),
  
  businessOwnerId: z.string().min(1, "Wybierz właściciela biznesowego"),
  budgetOwnerId: z.string().optional().nullable(),
  
  processesPersonalData: z.boolean().optional().default(false),
  hasDpa: z.boolean().optional().default(false),
  transferOutsideEEA: z.boolean().optional().default(false),
  securityQuestionnaire: z.boolean().optional().default(false),
  
  dataCategories: z.array(z.string()).optional().default([]),
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>
