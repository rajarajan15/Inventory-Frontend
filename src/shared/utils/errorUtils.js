import { ApiError } from '../api/api';

export function errorText(error) {
  return error instanceof ApiError ? error.message : 'Unexpected error. Please try again.';
}
