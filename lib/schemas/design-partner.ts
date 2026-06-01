import { z } from "zod";

export const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1000+",
] as const;

export const CURRENT_STACKS = [
  "Datadog",
  "New Relic",
  "Splunk",
  "Loki + Grafana",
  "ELK / OpenSearch",
  "Self-built",
  "None / starting from scratch",
  "Other",
] as const;

export const designPartnerSchema = z.object({
  name: z
    .string()
    .min(1, "Please tell us your name")
    .max(120, "Name is suspiciously long"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Looks like a typo — please use a real email"),
  companySize: z.enum(COMPANY_SIZES, {
    message: "Pick a range that's closest",
  }),
  currentStack: z.enum(CURRENT_STACKS, {
    message: "Pick the closest match",
  }),
  biggestPain: z.string().max(400, "400 characters max").optional(),
  // Honeypot
  website: z.string().max(0).optional(),
});

export type DesignPartnerInput = z.infer<typeof designPartnerSchema>;
