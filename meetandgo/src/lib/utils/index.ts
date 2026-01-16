import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in Indonesian Rupiah
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  }
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", options).format(dateObj);
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateInput(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString().split("T")[0];
}

/**
 * Generate a unique booking code
 */
export function generateBookingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MG-${timestamp}-${random}`;
}

/**
 * Generate a unique request code
 */
export function generateRequestCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CR-${timestamp}-${random}`;
}

/**
 * Create a URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Calculate payment deadline (24 hours from now)
 */
export function getPaymentDeadline(): Date {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 24);
  return deadline;
}

/**
 * Check if payment deadline has passed
 */
export function isPaymentExpired(deadline: Date | string): boolean {
  const deadlineDate =
    typeof deadline === "string" ? new Date(deadline) : deadline;
  return new Date() > deadlineDate;
}

/**
 * Get time remaining until deadline
 */
export function getTimeRemaining(deadline: Date | string): string {
  const deadlineDate =
    typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

/**
 * Parse duration string to days
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*[dD]ay/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Wait for a specified duration (useful for loading states)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
