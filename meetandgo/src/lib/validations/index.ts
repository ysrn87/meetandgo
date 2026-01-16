import { z } from "zod";

// =============================================================================
// PHONE NUMBER VALIDATION (International format with country code)
// =============================================================================

// Supported country codes
export const COUNTRY_CODES = [
  { code: "+62", country: "Indonesia", minLength: 9, maxLength: 12 },
  { code: "+60", country: "Malaysia", minLength: 9, maxLength: 10 },
  { code: "+65", country: "Singapore", minLength: 8, maxLength: 8 },
  { code: "+66", country: "Thailand", minLength: 9, maxLength: 9 },
  { code: "+63", country: "Philippines", minLength: 10, maxLength: 10 },
] as const;

export const DEFAULT_COUNTRY_CODE = "+62";

// Phone regex: must start with supported country code, followed by 7-15 digits
const phoneRegex = /^\+(?:62|60|65|66|63)[0-9]{7,15}$/;

const phoneValidation = z
  .string()
  .regex(phoneRegex, "Phone must start with country code (e.g., +62) followed by 7-15 digits")
  .refine(
    (val) => {
      const countryCode = COUNTRY_CODES.find(cc => val.startsWith(cc.code));
      if (!countryCode) return false;
      const numberPart = val.slice(countryCode.code.length);
      return numberPart.length >= 7 && numberPart.length <= 15;
    },
    { message: "Invalid phone number length for the country code" }
  );

// =============================================================================
// KTP VALIDATION (Indonesian ID - exactly 16 digits, never starts with 0)
// =============================================================================

const ktpValidation = z
  .string()
  .length(16, "KTP must be exactly 16 digits")
  .regex(/^[1-9][0-9]{15}$/, "KTP must be 16 digits and cannot start with 0");

// =============================================================================
// AUTH VALIDATIONS
// =============================================================================

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or phone is required")
    .refine(
      (val) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(val) || phoneRegex.test(val);
      },
      { message: "Please enter a valid email or phone number (phone must include country code, e.g., +62)" }
    ),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: phoneValidation.optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
}).refine(
  (data) => data.email || data.phone,
  { message: "Either email or phone is required", path: ["email"] }
);

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: phoneValidation.optional().or(z.literal("")),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// =============================================================================
// PARTICIPANT VALIDATIONS
// =============================================================================

export const participantSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  idNumber: ktpValidation.optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE"], { required_error: "Please select gender" }),
  birthPlace: z.string().max(100, "Birth place must be less than 100 characters").optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  phone: phoneValidation.optional().or(z.literal("")),
  domicile: z.string().max(100, "Domicile must be less than 100 characters").optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  address: z.string().max(500, "Address must be less than 500 characters").optional().or(z.literal("")),
  healthHistory: z.string().max(1000, "Health history must be less than 1000 characters").optional().or(z.literal("")),
});

// =============================================================================
// BOOKING VALIDATIONS
// =============================================================================

export const bookingSchema = z.object({
  departureId: z.string().min(1, "Please select a departure date"),
  departureGroupId: z.string().optional(),
  participantIds: z.array(z.string()).min(1, "At least one participant is required"),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

// =============================================================================
// CUSTOM REQUEST VALIDATIONS
// =============================================================================

export const customRequestSchema = z.object({
  destination: z
    .string()
    .min(2, "Destination must be at least 2 characters")
    .max(200, "Destination must be less than 200 characters"),
  duration: z
    .string()
    .min(1, "Duration is required")
    .max(50, "Duration must be less than 50 characters"),
  departureDate: z.string().min(1, "Departure date is required"),
  meetingPoint: z
    .string()
    .min(2, "Meeting point must be at least 2 characters")
    .max(200, "Meeting point must be less than 200 characters"),
  participantCount: z
    .number()
    .min(1, "At least 1 participant is required")
    .max(100, "Maximum 100 participants"),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional(),
});

// =============================================================================
// TOUR PACKAGE VALIDATIONS
// =============================================================================

export const highlightSchema = z.object({
  title: z.string().min(1, "Highlight title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  image: z.string().optional(),
});

export const itineraryActivitySchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  activity: z.string().min(1, "Activity is required").max(200, "Activity too long"),
  description: z.string().max(500, "Description too long").optional(),
});

export const itinerarySchema = z.object({
  day: z.number().min(1, "Day must be at least 1"),
  title: z.string().max(200, "Title too long").optional(),
  activities: z.array(itineraryActivitySchema).min(1, "At least one activity is required"),
});

export const includedItemSchema = z.string().min(1, "Included item cannot be empty");
export const excludedItemSchema = z.string().min(1, "Excluded item cannot be empty");

export const meetingPointSchema = z.object({
  name: z.string().min(1, "Meeting point name is required").max(200, "Name too long"),
  address: z.string().max(500, "Address too long").optional(),
  time: z.string().optional(),
});

export const departureGroupSchema = z.object({
  groupNumber: z.number().min(1, "Group number must be positive"),
  price: z.number().min(0, "Price must be positive"),
  maxParticipants: z.number().min(1, "At least 1 participant required"),
});

export const departureSchema = z.object({
  departureDate: z.string().min(1, "Departure date is required"),
  pricePerPerson: z.number().min(0, "Price must be positive").optional(),
  maxParticipants: z.number().min(1, "At least 1 participant required").optional(),
  groups: z.array(departureGroupSchema).optional(),
});

export const tourPackageSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  tripType: z.enum(["OPEN_TRIP", "PRIVATE_TRIP"], { required_error: "Please select trip type" }),
  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .max(200, "Location must be less than 200 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be less than 5000 characters"),
  duration: z
    .string()
    .min(1, "Duration is required")
    .max(50, "Duration must be less than 50 characters"),
  durationDays: z.number().min(1, "Duration must be at least 1 day"),
  highlights: z.array(highlightSchema).min(1, "At least one highlight is required"),
  itineraries: z.array(itinerarySchema).min(1, "At least one itinerary day is required"),
  includedItems: z.array(includedItemSchema).min(1, "At least one included item is required"),
  excludedItems: z.array(excludedItemSchema).min(1, "At least one excluded item is required"),
  meetingPoints: z.array(meetingPointSchema).min(1, "At least one meeting point is required"),
  departures: z.array(departureSchema).min(1, "At least one departure is required"),
}).refine(
  (data) => data.itineraries.length <= data.durationDays,
  { 
    message: "Number of itinerary days cannot exceed the trip duration", 
    path: ["itineraries"] 
  }
);

// =============================================================================
// ADMIN VALIDATIONS
// =============================================================================

export const bookingStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAYMENT_RECEIVED",
    "PROCESSED",
    "ONGOING",
    "COMPLETED",
  ]),
});

export const customRequestStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "IN_REVIEW",
    "ACCEPTED",
    "PAID",
    "PROCESSED",
    "ONGOING",
    "COMPLETED",
    "REJECTED",
  ]),
  estimatedPrice: z.number().min(0).optional(),
  finalPrice: z.number().min(0).optional(),
  tourGuideId: z.string().optional(),
  adminNotes: z.string().max(2000).optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type ParticipantInput = z.infer<typeof participantSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type CustomRequestInput = z.infer<typeof customRequestSchema>;
export type TourPackageInput = z.infer<typeof tourPackageSchema>;
export type DepartureInput = z.infer<typeof departureSchema>;
export type DepartureGroupInput = z.infer<typeof departureGroupSchema>;
export type HighlightInput = z.infer<typeof highlightSchema>;
export type ItineraryInput = z.infer<typeof itinerarySchema>;
export type ItineraryActivityInput = z.infer<typeof itineraryActivitySchema>;
export type MeetingPointInput = z.infer<typeof meetingPointSchema>;
export type BookingStatusUpdateInput = z.infer<typeof bookingStatusUpdateSchema>;
export type CustomRequestStatusUpdateInput = z.infer<typeof customRequestStatusUpdateSchema>;
