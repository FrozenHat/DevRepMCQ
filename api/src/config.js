/**
 * Central configuration module.
 * All env vars are read here once. The rest of the app imports from this file,
 * never directly from process.env.
 */
export const config = {
    PORT:               parseInt(process.env.PORT ?? '3000', 10),
    NODE_ENV:           process.env.NODE_ENV ?? 'development',
    DATABASE_URL:       process.env.DATABASE_URL ?? '',
    JWT_SECRET:         process.env.JWT_SECRET ?? '',
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES ?? '7d',
};

if (!config.JWT_SECRET && config.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
}
