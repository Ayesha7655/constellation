import { z } from 'zod';

/** Formik may pass `undefined` for untouched fields — normalize before Zod string checks. */
const asText = (val: unknown): string => (typeof val === 'string' ? val : '');

export const requiredText = (emptyMessage: string) =>
  z.preprocess(asText, z.string().trim().min(1, emptyMessage));

export const requiredEmail = (emptyMessage: string, invalidMessage: string) =>
  z.preprocess(
    asText,
    z.string().trim().min(1, emptyMessage).email(invalidMessage),
  );

export const requiredPassword = (options?: {
  minLength?: number;
  maxLength?: number;
  emptyMessage?: string;
  minMessage?: string;
  maxMessage?: string;
}) => {
  const minLength = options?.minLength ?? 6;
  const emptyMessage = options?.emptyMessage ?? 'Password required';
  const minMessage = options?.minMessage ?? 'Min 6 characters';
  const maxMessage = options?.maxMessage ?? 'Too long';
  let schema = z.string().min(1, emptyMessage).min(minLength, minMessage);
  if (options?.maxLength !== undefined) {
    schema = schema.max(options.maxLength, maxMessage);
  }
  return z.preprocess(asText, schema);
};
