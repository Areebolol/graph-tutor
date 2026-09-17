export const API_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 15000,
  TOKEN_KEYS: ['gt_token', 'token', 'authToken'],
}

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_SKIP: 0,
}

export const INPUT_LIMITS = {
  EMAIL_MAX_LENGTH: 254,
  NAME_MAX_LENGTH: 100,
  PASSWORD_MIN_LENGTH: 6,
}

export const STORAGE_KEYS = {
  QUIZ_SESSION_ID: 'quiz_sid',
  THEME: 'theme',
}
