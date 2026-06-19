import axios from "axios";

/** Extracts a human-readable message from an unknown error (Axios or native). */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "An unexpected error occurred.";
}

/** Parsed API error: top-level message plus any field-level validation errors. */
export interface ParsedApiError {
  message: string;
  errors: string[];
}

/** Parses an unknown error into a message and a list of validation errors. */
export function parseApiError(err: unknown): ParsedApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: string[] }
      | undefined;
    return {
      message: data?.message ?? err.message,
      errors: data?.errors ?? [],
    };
  }
  if (err instanceof Error) {
    return { message: err.message, errors: [] };
  }
  return { message: "An unexpected error occurred.", errors: [] };
}
