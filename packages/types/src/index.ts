export type FieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "number"
  | "single_select"
  | "multi_select"
  | "checkbox"
  | "rating"
  | "date"
  | "dropdown";

export type FormVisibility = "public" | "unlisted";

export type ButtonStyle = "filled" | "outline" | "ghost";

export type BackgroundPattern = "none" | "dots" | "grid" | "waves";

export type ThemeCategory =
  | "anime"
  | "movies"
  | "games"
  | "tech"
  | "os"
  | "startups"
  | "events"
  | "default";

export interface ThemeConfig {
  primaryColor: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: number;
  buttonStyle: ButtonStyle;
  backgroundPattern?: BackgroundPattern;
}

export interface FormSettings {
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  expiresAt?: string;
  maxResponses?: number;
  requirePassword?: boolean;
  passwordHash?: string;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldValidations {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

export interface ConditionalLogic {
  dependsOn: string;
  operator: "eq" | "neq" | "contains";
  value: unknown;
  action: "show" | "hide";
}
