import '@testing-library/jest-dom';

// Provider clients are mocked in email tests, but the application now validates
// that the selected transport has credentials before attempting a send.
process.env.EMAIL_TRANSPORT ||= 'resend';
process.env.RESEND_API_KEY ||= 're_test';
