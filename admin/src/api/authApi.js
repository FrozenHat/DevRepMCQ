/**
 * authApi.js
 * Authentication endpoints.
 */

/** POST /api/auth/login → { accessToken, role } */
export async function login(email, password) {
    const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Login failed');
    }

    return res.json(); // { accessToken, role }
}
