import { z } from "zod";

export const TEAM_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1000+",
] as const;

/**
 * Payload of the floating assistant's commercial-interest form
 * (POST /api/commercial-intent). Stored as a CMS Lead + emailed to founders.
 */
export const commercialIntentSchema = z.object({
  type: z.enum(["commercial", "support"]).default("commercial"),
  name: z
    .string()
    .min(1, "Please tell us your name")
    .max(120, "Name is suspiciously long"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Looks like a typo — please use a real email"),
  company: z.string().max(200, "200 characters max").optional(),
  teamSize: z.enum(TEAM_SIZES).optional(),
  message: z
    .string()
    .min(10, "Give us a sentence or two so we can route you well")
    .max(2000, "2000 characters max"),
  // Submission context (set by the widget, not user-visible)
  locale: z.string().max(10).optional(),
  page: z.string().max(300).optional(),
  // Honeypot — bots will fill this; humans see display:none
  website: z.string().max(0).optional(),
});

export type CommercialIntentInput = z.infer<typeof commercialIntentSchema>;
