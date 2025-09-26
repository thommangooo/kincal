
import crypto from 'crypto'

// Encryption key should be set in environment variables
export const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET
  
  if (!key) {
    // For development, we can use a fallback key
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using fallback encryption key for development')
      return crypto.createHash('sha256').update('development-fallback-key-not-secure').digest('hex')
    }
    throw new Error('ENCRYPTION_KEY or NEXTAUTH_SECRET must be set in environment variables')
  }
  
  // Ensure the key is 32 bytes for AES-256
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex')
  console.log('Encryption key source:', process.env.ENCRYPTION_KEY ? 'ENCRYPTION_KEY' : 'NEXTAUTH_SECRET')
  console.log('Encryption key hash (first 16 chars):', hashedKey.substring(0, 16))
  return hashedKey
}

const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypts a string using AES-256-GCM
 * @param text - The text to encrypt
 * @returns The encrypted text with IV and auth tag
 */
export function encrypt(text: string): string {
  if (!text) return ''
  
  const encryptionKey = getEncryptionKey()
  console.log('Encrypting with key hash (first 16 chars):', encryptionKey.substring(0, 16))
  
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(encryptionKey, 'hex'), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag()
  
  // Combine IV, auth tag, and encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

/**
 * Decrypts a string using AES-256-GCM
 * @param encryptedText - The encrypted text to decrypt
 * @returns The decrypted text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(getEncryptionKey(), 'hex'), iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt token')
  }
}

/**
 * Encrypts an object by stringifying it first
 * @param obj - The object to encrypt
 * @returns The encrypted object
 */
export function encryptObject<T>(obj: T): string {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypts an object by parsing the JSON
 * @param encryptedObj - The encrypted object
 * @returns The decrypted object
 */
export function decryptObject<T>(encryptedObj: string): T {
  return JSON.parse(decrypt(encryptedObj))
}
