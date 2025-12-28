/**
 * useFormValidation Hook
 * Manages form validation state and field-level errors
 * Provides real-time validation on blur
 *
 * Note: This is a generic utility hook that works with any form shape.
 * The use of 'any' types is intentional to provide maximum flexibility.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';

export interface FieldValidation {
  value: any;
  error?: string;
  touched: boolean;
}

export interface FormValidationState {
  [fieldName: string]: FieldValidation;
}

export interface ValidationRules {
  [fieldName: string]: (value: any, formData?: any) => string | undefined;
}

export const useFormValidation = <T extends Record<string, any>>(
  initialData: T,
  validationRules: ValidationRules
) => {
  const [formState, setFormState] = useState<FormValidationState>(() => {
    const state: FormValidationState = {};
    Object.keys(initialData).forEach(key => {
      state[key] = {
        value: initialData[key],
        error: undefined,
        touched: false,
      };
    });
    return state;
  });

  const validateField = useCallback(
    (fieldName: string, value: any, allFormData?: any): string | undefined => {
      const validator = validationRules[fieldName];
      if (!validator) return undefined;
      return validator(value, allFormData);
    },
    [validationRules]
  );

  const handleChange = useCallback((fieldName: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        // Clear error on change if field was touched
        error: prev[fieldName].touched ? undefined : prev[fieldName].error,
      },
    }));
  }, []);

  const handleBlur = useCallback(
    (fieldName: string) => {
      const formData = Object.keys(formState).reduce((acc, key) => {
        acc[key] = formState[key].value;
        return acc;
      }, {} as any);

      const error = validateField(fieldName, formState[fieldName].value, formData);

      setFormState(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          error,
          touched: true,
        },
      }));
    },
    [formState, validateField]
  );

  const validateAll = useCallback((): boolean => {
    const formData = Object.keys(formState).reduce((acc, key) => {
      acc[key] = formState[key].value;
      return acc;
    }, {} as any);

    let hasErrors = false;
    const newState = { ...formState };

    Object.keys(formState).forEach(fieldName => {
      const error = validateField(fieldName, formState[fieldName].value, formData);
      newState[fieldName] = {
        ...formState[fieldName],
        error,
        touched: true,
      };
      if (error) hasErrors = true;
    });

    setFormState(newState);
    return !hasErrors;
  }, [formState, validateField]);

  const getFormData = useCallback((): T => {
    const data = {} as T;
    Object.keys(formState).forEach(key => {
      data[key as keyof T] = formState[key].value;
    });
    return data;
  }, [formState]);

  const getErrors = useCallback((): string[] => {
    return Object.values(formState)
      .map(field => field.error)
      .filter((error): error is string => !!error);
  }, [formState]);

  const getFirstErrorField = useCallback((): string | undefined => {
    return Object.keys(formState).find(key => formState[key].error);
  }, [formState]);

  const reset = useCallback((newData?: T) => {
    const dataToUse = newData || initialData;
    const state: FormValidationState = {};
    Object.keys(dataToUse).forEach(key => {
      state[key] = {
        value: dataToUse[key],
        error: undefined,
        touched: false,
      };
    });
    setFormState(state);
  }, [initialData]);

  return {
    formState,
    handleChange,
    handleBlur,
    validateAll,
    getFormData,
    getErrors,
    getFirstErrorField,
    reset,
  };
};
