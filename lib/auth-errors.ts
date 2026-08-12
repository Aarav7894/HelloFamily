type AuthLikeError = { message: string; code?: string };

const FRIENDLY_MESSAGES: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed:
    "Please confirm your email before logging in. Check your inbox for the confirmation link.",
  user_already_exists:
    "An account with this email already exists. Try logging in instead.",
  weak_password: "Please choose a stronger password.",
  over_request_rate_limit:
    "Too many attempts. Please wait a moment and try again.",
};

/** Maps a Supabase auth/query error to a short, user-friendly message. */
export function getAuthErrorMessage(error: AuthLikeError): string {
  if (error.code && FRIENDLY_MESSAGES[error.code]) {
    return FRIENDLY_MESSAGES[error.code];
  }

  const message = error.message ?? "";
  if (/invalid login credentials/i.test(message)) {
    return FRIENDLY_MESSAGES.invalid_credentials;
  }
  if (/already registered|already exists/i.test(message)) {
    return FRIENDLY_MESSAGES.user_already_exists;
  }
  if (/email not confirmed/i.test(message)) {
    return FRIENDLY_MESSAGES.email_not_confirmed;
  }

  return message || "Something went wrong. Please try again.";
}
