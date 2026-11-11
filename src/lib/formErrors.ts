import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "./api";

export function applyApiFormErrors<T extends FieldValues>(
  error: unknown,
  allowedFields: ReadonlyArray<Path<T>>,
  setError: UseFormSetError<T>,
) {
  if (error instanceof ApiError && error.details.length > 0) {
    let mappedCount = 0;

    for (const detail of error.details) {
      const matchedField = allowedFields.find(
        (field) => field === detail.field,
      );

      if (matchedField) {
        setError(matchedField, {
          type: "server",
          message: detail.message,
        });
        mappedCount += 1;
      }
    }

    if (mappedCount === error.details.length) {
      return;
    }
  }

  setError("root", {
    type: "server",
    message: error instanceof Error ? error.message : "Request failed.",
  });
}
