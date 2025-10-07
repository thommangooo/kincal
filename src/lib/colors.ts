// Club color generation utilities
// This provides consistent, distinct colors for clubs based on their IDs

export interface ClubColor {
  bg: string
  text: string
  border: string
  // Inline styles as fallback for Tailwind v4 compatibility
  bgStyle?: string
  textStyle?: string
  borderStyle?: string
}

// Distinct, high-contrast palette (no gray) for up to 12+ entities
// Using stronger 200 backgrounds for better month-view contrast
const CLUB_COLORS: ClubColor[] = [
  { bg: 'bg-red-200', text: 'text-red-900', border: 'bg-red-600', bgStyle: 'background-color: #fecaca', textStyle: 'color: #7f1d1d', borderStyle: 'background-color: #dc2626' },
  { bg: 'bg-blue-200', text: 'text-blue-900', border: 'bg-blue-600', bgStyle: 'background-color: #bfdbfe', textStyle: 'color: #1e3a8a', borderStyle: 'background-color: #2563eb' },
  { bg: 'bg-green-200', text: 'text-green-900', border: 'bg-green-600', bgStyle: 'background-color: #bbf7d0', textStyle: 'color: #14532d', borderStyle: 'background-color: #16a34a' },
  { bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'bg-yellow-600', bgStyle: 'background-color: #fde68a', textStyle: 'color: #78350f', borderStyle: 'background-color: #ca8a04' },
  { bg: 'bg-purple-200', text: 'text-purple-900', border: 'bg-purple-600', bgStyle: 'background-color: #e9d5ff', textStyle: 'color: #581c87', borderStyle: 'background-color: #9333ea' },
  { bg: 'bg-pink-200', text: 'text-pink-900', border: 'bg-pink-600', bgStyle: 'background-color: #fbcfe8', textStyle: 'color: #831843', borderStyle: 'background-color: #db2777' },
  { bg: 'bg-indigo-200', text: 'text-indigo-900', border: 'bg-indigo-600', bgStyle: 'background-color: #c7d2fe', textStyle: 'color: #312e81', borderStyle: 'background-color: #4f46e5' },
  { bg: 'bg-orange-200', text: 'text-orange-900', border: 'bg-orange-600', bgStyle: 'background-color: #fed7aa', textStyle: 'color: #7c2d12', borderStyle: 'background-color: #ea580c' },
  { bg: 'bg-teal-200', text: 'text-teal-900', border: 'bg-teal-600', bgStyle: 'background-color: #99f6e4', textStyle: 'color: #134e4a', borderStyle: 'background-color: #0d9488' },
  { bg: 'bg-cyan-200', text: 'text-cyan-900', border: 'bg-cyan-600', bgStyle: 'background-color: #a5f3fc', textStyle: 'color: #164e63', borderStyle: 'background-color: #0891b2' },
  { bg: 'bg-lime-200', text: 'text-lime-900', border: 'bg-lime-600', bgStyle: 'background-color: #d9f99d', textStyle: 'color: #3f6212', borderStyle: 'background-color: #65a30d' },
  { bg: 'bg-rose-200', text: 'text-rose-900', border: 'bg-rose-600', bgStyle: 'background-color: #fecdd3', textStyle: 'color: #7f1d1d', borderStyle: 'background-color: #e11d48' }
]

/**
 * Generate a consistent color for an entity (club, zone, or district) based on its ID
 * Uses a more sophisticated hashing approach to ensure better distribution
 */
export function generateClubColor(entityId: string): ClubColor {
  if (!entityId) {
    return { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      border: 'bg-gray-500',
      bgStyle: 'background-color: #f3f4f6',
      textStyle: 'color: #1f2937',
      borderStyle: 'background-color: #6b7280'
    }
  }

  // Create a more robust hash using multiple techniques
  let hash = 0
  
  // First pass: character-based hash with position weighting
  for (let i = 0; i < entityId.length; i++) {
    const char = entityId.charCodeAt(i)
    // Weight characters differently based on position
    const weight = (i % 8) + 1
    hash = hash + (char * weight * (i + 1))
    hash = hash & hash // Keep as 32-bit integer
  }
  
  // Second pass: bit manipulation for better distribution
  hash = hash ^ (hash >>> 16)
  hash = hash * 0x85ebca6b
  hash = hash ^ (hash >>> 13)
  hash = hash * 0xc2b2ae35
  hash = hash ^ (hash >>> 16)
  
  // Third pass: use the entity ID as a seed for additional mixing
  let seed = 0
  for (let i = 0; i < Math.min(entityId.length, 8); i++) {
    seed = seed * 31 + entityId.charCodeAt(i)
  }
  hash = hash ^ seed
  
  const colorIndex = Math.abs(hash) % CLUB_COLORS.length
  
  return CLUB_COLORS[colorIndex]
}

/**
 * Get a fallback color for clubs without IDs
 */
export function getDefaultClubColor(): ClubColor {
  return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500' }
}

/**
 * Test function to verify color distribution (for development)
 */
export function testColorDistribution(clubIds: string[]): void {
  console.log('Club Color Distribution Test:')
  const colorCounts = new Array(CLUB_COLORS.length).fill(0)
  
  clubIds.forEach(id => {
    const color = generateClubColor(id)
    const index = CLUB_COLORS.findIndex(c => c.bg === color.bg)
    if (index !== -1) {
      colorCounts[index]++
    }
  })
  
  console.log('Color usage counts:', colorCounts)
  console.log('Total colors used:', colorCounts.filter(count => count > 0).length)
}
