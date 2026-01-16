import type {
  User,
  TourPackage,
  Departure,
  DepartureGroup,
  Booking,
  Participant,
  BookingParticipant,
  CustomTourRequest,
  Highlight,
  Itinerary,
  ItineraryActivity,
  IncludedItem,
  ExcludedItem,
  MeetingPoint,
  TripType,
  BookingStatus,
  CustomRequestStatus,
  Gender,
  UserRole,
} from "@prisma/client";

// =============================================================================
// RE-EXPORTS FROM PRISMA
// =============================================================================

export type {
  User,
  TourPackage,
  Departure,
  DepartureGroup,
  Booking,
  Participant,
  BookingParticipant,
  CustomTourRequest,
  Highlight,
  Itinerary,
  ItineraryActivity,
  IncludedItem,
  ExcludedItem,
  MeetingPoint,
  TripType,
  BookingStatus,
  CustomRequestStatus,
  Gender,
  UserRole,
};

// =============================================================================
// EXTENDED TYPES (with relations)
// =============================================================================

export type TourPackageWithRelations = TourPackage & {
  highlights: Highlight[];
  itineraries: (Itinerary & {
    activities: ItineraryActivity[];
  })[];
  includedItems: IncludedItem[];
  excludedItems: ExcludedItem[];
  meetingPoints: MeetingPoint[];
  departures: (Departure & {
    groups: DepartureGroup[];
    _count?: {
      bookings: number;
    };
  })[];
};

export type TourPackageCard = Pick<
  TourPackage,
  "id" | "slug" | "title" | "thumbnail" | "location" | "duration" | "tripType"
> & {
  highlights: Pick<Highlight, "id" | "title">[];
  departures: Pick<Departure, "id" | "departureDate" | "pricePerPerson">[];
  minPrice: number | null;
};

export type DepartureWithGroups = Departure & {
  groups: DepartureGroup[];
  _count?: {
    bookings: number;
  };
};

export type BookingWithRelations = Booking & {
  user: Pick<User, "id" | "name" | "email" | "phone">;
  departure: Departure & {
    tourPackage: Pick<TourPackage, "id" | "title" | "slug" | "thumbnail" | "location">;
  };
  departureGroup: DepartureGroup | null;
  participants: (BookingParticipant & {
    participant: Participant;
  })[];
};

export type ParticipantWithBookings = Participant & {
  bookings: (BookingParticipant & {
    booking: Pick<Booking, "id" | "bookingCode" | "status">;
  })[];
};

export type CustomRequestWithRelations = CustomTourRequest & {
  user: Pick<User, "id" | "name" | "email" | "phone">;
  tourGuide: Pick<User, "id" | "name" | "email" | "phone"> | null;
};

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// =============================================================================
// FORM TYPES
// =============================================================================

export type BookingFormData = {
  departureId: string;
  departureGroupId?: string;
  participants: ParticipantFormData[];
  notes?: string;
};

export type ParticipantFormData = {
  id?: string; // Existing participant ID
  fullName: string;
  idNumber?: string;
  gender: Gender;
  birthPlace?: string;
  birthDate?: string;
  phone?: string;
  domicile?: string;
  email?: string;
  address?: string;
  healthHistory?: string;
  ktpImage?: string;
};

export type TourPackageFormData = {
  title: string;
  tripType: TripType;
  location: string;
  description: string;
  duration: string;
  durationDays: number;
  thumbnail?: string;
  images?: string[];
  highlights: HighlightFormData[];
  itineraries: ItineraryFormData[];
  includedItems: string[];
  excludedItems: string[];
  meetingPoints: MeetingPointFormData[];
  departures: DepartureFormData[];
};

export type HighlightFormData = {
  id?: string;
  title: string;
  description?: string;
  image?: string;
  order: number;
};

export type ItineraryFormData = {
  id?: string;
  day: number;
  title?: string;
  activities: ItineraryActivityFormData[];
};

export type ItineraryActivityFormData = {
  id?: string;
  startTime: string;
  endTime: string;
  activity: string;
  description?: string;
  order: number;
};

export type MeetingPointFormData = {
  id?: string;
  name: string;
  address?: string;
  time?: string;
  order: number;
};

export type DepartureFormData = {
  id?: string;
  departureDate: string;
  pricePerPerson?: number;
  maxParticipants?: number;
  groups?: DepartureGroupFormData[];
};

export type DepartureGroupFormData = {
  id?: string;
  groupNumber: number;
  price: number;
  maxParticipants: number;
};

// =============================================================================
// STATUS FLOW HELPERS
// =============================================================================

export const BOOKING_STATUS_FLOW: BookingStatus[] = [
  "PENDING",
  "PAYMENT_RECEIVED",
  "PROCESSED",
  "ONGOING",
  "COMPLETED",
];

export const CUSTOM_REQUEST_STATUS_FLOW: CustomRequestStatus[] = [
  "PENDING",
  "IN_REVIEW",
  "ACCEPTED",
  "PAID",
  "PROCESSED",
  "ONGOING",
  "COMPLETED",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending Payment",
  PAYMENT_RECEIVED: "Payment Received",
  PROCESSED: "Processed",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export const CUSTOM_REQUEST_STATUS_LABELS: Record<CustomRequestStatus, string> = {
  PENDING: "Pending",
  IN_REVIEW: "In Review",
  ACCEPTED: "Accepted",
  PAID: "Paid",
  PROCESSED: "Processed",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  OPEN_TRIP: "Open Trip",
  PRIVATE_TRIP: "Private Trip",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
};
