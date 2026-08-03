import type { TrainService } from '@/components/railway-data';

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
  window.dispatchEvent(new Event('railvista-auth-change'));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem('railvista.auth');
  window.dispatchEvent(new Event('railvista-auth-change'));
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
  holderKey?: string;
}) {
  const params = new URLSearchParams({
    coachCode: input.coachCode,
    originStation: input.originStation,
    destinationStation: input.destinationStation,
    journeyDate: input.journeyDate,
  });

  if (input.holderKey) {
    params.set('holderKey', input.holderKey);
  }

  return requestJson<{
    coach: { code: string; name: string; description: string };
    journey: { originStation: string; destinationStation: string; journeyDate: string };
    seats: Array<{ seatNumber: string; status: 'available' | 'booked' }>;
  }>(`/seats/availability?${params.toString()}`);
}

export async function holdSeats(input: {
  holderKey: string;
  coachCode: string;
  seatNumbers: string[];
  originStation: string;
  destinationStation: string;
  journeyDate: string;
}) {
  return requestJson<{ success: boolean; message?: string; expiresAt?: string }>(
    '/seats/hold',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function getTrains(input?: { from?: string; to?: string }) {
  const params = new URLSearchParams();

  if (input?.from) {
    params.set('from', input.from);
  }

  if (input?.to) {
    params.set('to', input.to);
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return requestJson<TrainService[]>(`/trains${suffix}`);
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
    holdToken?: string;
  },
  token?: string,
  idempotencyKey?: string,
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
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify(input),
    },
    token,
  );
}

export type { AuthSession };