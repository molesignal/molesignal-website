import { z } from "zod";

export const cloudWaitlistSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Looks like a typo — please use a real email"),
  // Honeypot — bots will fill this; humans see display:none
  website: z.string().max(0).optional(),
});

export type CloudWaitlistInput = z.infer<typeof cloudWaitlistSchema>;
