const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

type ApiErrorResponse = {
  message?: string | string[];
};

type AuthSession = {
  accessToken: string;
  tokenType: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'CUSTOMER' | 'ADMIN';
    createdAt: string;
  };
};

async function requestJson<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const error = (await response.json()) as ApiErrorResponse;
      if (Array.isArray(error.message)) {
        message = error.message.join(', ');
      } else if (typeof error.message === 'string') {
        message = error.message;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function getStoredAuthSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem('railvista.auth');
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  return getStoredAuthSession()?.accessToken ?? null;
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('railvista.auth', JSON.stringify(session));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem('railvista.auth');
}

export async function login(input: { email: string; password: string }) {
  return requestJson<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function register(input: { email: string; password: string; fullName: string }) {
  return requestJson<AuthSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getSeatAvailability(input: {
  coachCode: string;
  originStation: string;
  destinationStation: string;
  journeyDate: string;
}) {
  const params = new URLSearchParams({
    coachCode: input.coachCode,
    originStation: input.originStation,
    destinationStation: input.destinationStation,
    journeyDate: input.journeyDate,
  });

  return requestJson<{
    coach: { code: string; name: string; description: string };
    journey: { originStation: string; destinationStation: string; journeyDate: string };
    seats: Array<{ seatNumber: string; status: 'available' | 'booked' }>;
  }>(`/seats/availability?${params.toString()}`);
}

export async function createBooking(
  input: {
    coachCode: string;
    seatNumber: string;
    originStation: string;
    destinationStation: string;
    journeyDate: string;
    passengerName: string;
    passengerNic: string;
    passengerPhone: string;
    travelClass: 'FIRST_CLASS' | 'SECOND_CLASS' | 'THIRD_CLASS';
  },
  token: string,
  idempotencyKey: string,
) {
  return requestJson<{
    bookingCode: string;
    coachCode: string;
    seatNumber: string;
    originStation: string;
    destinationStation: string;
    journeyDate: string;
    passengerName: string;
    travelClass: 'FIRST_CLASS' | 'SECOND_CLASS' | 'THIRD_CLASS';
    fare: number;
    status: string;
  }>(
    '/bookings',
    {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(input),
    },
    token,
  );
}

export type { AuthSession };