// The students list is a heavy 'use client' page (API fetching, search, pagination).
// Re-exported from a separate client module so the route's loading.js skeleton
// shows during the route transition while the client bundle loads.
export { default } from './StudentsPageClient'
