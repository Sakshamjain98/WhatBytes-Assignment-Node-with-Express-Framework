export interface ErrorResponseDto {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const TooManyRequestsBody: ErrorResponseDto = {
  error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later' },
};
