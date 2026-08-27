import bcrypt from 'bcryptjs'

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

// Simple token hashing for refresh/activation tokens (not user-facing passwords,
// but still shouldn't be stored in plaintext in case the DB is ever exposed).
export async function hashToken(token: string) {
  return bcrypt.hash(token, 10)
}

export async function verifyTokenHash(token: string, hash: string) {
  return bcrypt.compare(token, hash)
}
