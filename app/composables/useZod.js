import { ref } from "vue";

/**
 * A composable for Zod-based form validation.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 */
export function useZod(schema) {
  const errors = ref({});

  /**
   * Validates data against the provided schema.
   * @param {Object} data - The form data to validate.
   * @returns {boolean} - True if valid, false otherwise.
   */
  const validate = (data) => {
    errors.value = {};
    const result = schema.safeParse(data);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field) {
          errors.value[field] = issue.message;
        }
      });
      return false;
    }

    return true;
  };

  /**
   * Clears all validation errors.
   */
  const clearErrors = () => {
    errors.value = {};
  };

  /**
   * Clears the error for a specific field.
   * @param {string} field - The field name to clear.
   */
  const clearFieldError = (field) => {
    if (errors.value[field]) {
      delete errors.value[field];
    }
  };

  return {
    errors,
    validate,
    clearErrors,
    clearFieldError,
  };
}
