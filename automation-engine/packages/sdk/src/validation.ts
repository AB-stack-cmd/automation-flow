/**
 * Sanitizes input data.
 */
export function sanitizeValue(val: any, type: string): any {
  if (typeof val !== 'string') {
    return val;
  }

  let cleaned = val.trim();

  // Basic whitespace normalization
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Normalizations based on input type
  if (type === 'email') {
    cleaned = cleaned.toLowerCase();
  } else if (type === 'phone') {
    // Keep digits and '+'
    cleaned = cleaned.replace(/[^\d+]/g, '');
  }

  // HTML and Script Injection escaping / XSS Removal
  cleaned = cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags entirely
    .replace(/javascript:/gi, '') // Strip javascript: links
    .replace(/on\w+\s*=/gi, '') // Strip event handlers like onclick=
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return cleaned;
}

/**
 * Validates form submission inputs against the form fields schema.
 * Returns an object with success boolean and error record.
 */
export function validateForm(fieldsJson: any[], inputData: Record<string, any>): {
  success: boolean;
  errors: Record<string, string>;
  data: Record<string, any>;
} {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};

  for (const field of fieldsJson) {
    const name = field.name || field.id;
    if (!name) continue;

    let val = inputData[name];

    // Handle checkboxes / default boolean state
    if (field.type === 'checkbox') {
      sanitizedData[name] = Boolean(val);
      continue;
    }

    // Required check
    if (field.required && (val === undefined || val === null || val === '')) {
      errors[name] = `${field.label || name} is required.`;
      continue;
    }

    if (val === undefined || val === null || val === '') {
      // Fallback to default value if provided
      if (field.defaultValue !== undefined && field.defaultValue !== '') {
        sanitizedData[name] = sanitizeValue(field.defaultValue, field.type);
      } else {
        sanitizedData[name] = val;
      }
      continue;
    }

    // Sanitize string fields
    let sanitized = val;
    if (typeof val === 'string') {
      sanitized = sanitizeValue(val, field.type);
    }
    sanitizedData[name] = sanitized;

    const validation = field.validation || {};

    // Max / Min Length
    if (typeof sanitized === 'string') {
      if (validation.minLength !== undefined && sanitized.length < Number(validation.minLength)) {
        errors[name] = `${field.label || name} must be at least ${validation.minLength} characters.`;
        continue;
      }
      if (validation.maxLength !== undefined && sanitized.length > Number(validation.maxLength)) {
        errors[name] = `${field.label || name} cannot exceed ${validation.maxLength} characters.`;
        continue;
      }
    }

    // Numerical checks
    if (field.type === 'number' || field.type === 'rating' || field.type === 'slider') {
      const num = Number(sanitized);
      if (isNaN(num)) {
        errors[name] = `${field.label || name} must be a valid number.`;
        continue;
      }
      sanitizedData[name] = num;
      
      if (validation.minNumber !== undefined && num < Number(validation.minNumber)) {
        errors[name] = `${field.label || name} must be at least ${validation.minNumber}.`;
        continue;
      }
      if (validation.maxNumber !== undefined && num > Number(validation.maxNumber)) {
        errors[name] = `${field.label || name} cannot exceed ${validation.maxNumber}.`;
        continue;
      }
    }

    // Email format check
    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitized)) {
        errors[name] = 'Please enter a valid email address.';
        continue;
      }
    }

    // URL format check
    if (field.type === 'url') {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
      if (!urlRegex.test(sanitized)) {
        errors[name] = 'Please enter a valid URL.';
        continue;
      }
    }

    // Phone format check
    if (field.type === 'phone') {
      // Basic phone format (must have digits)
      const digits = sanitized.replace(/\D/g, '');
      if (digits.length < 5) {
        errors[name] = 'Please enter a valid phone number.';
        continue;
      }
    }

    // Custom Regex validation
    if (validation.regex) {
      try {
        const regex = new RegExp(validation.regex);
        if (!regex.test(String(sanitized))) {
          errors[name] = validation.regexMessage || `${field.label || name} format is invalid.`;
          continue;
        }
      } catch (e) {
        console.error(`Invalid regex rule for field ${name}:`, validation.regex);
      }
    }
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
    data: sanitizedData
  };
}
