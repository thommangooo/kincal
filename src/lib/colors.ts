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

// Enhanced color palette with more visually distinct colors
// Using both Tailwind classes and inline styles for maximum compatibility
const CLUB_COLORS: ClubColor[] = [
  { 
    bg: 'bg-red-100', text: 'text-red-800', border: 'bg-red-500',
    bgStyle: 'background-color: #fee2e2', textStyle: 'color: #991b1b', borderStyle: 'background-color: #ef4444'
  },
  { 
    bg: 'bg-blue-100', text: 'text-blue-800', border: 'bg-blue-500',
    bgStyle: 'background-color: #dbeafe', textStyle: 'color: #1e40af', borderStyle: 'background-color: #3b82f6'
  },
  { 
    bg: 'bg-green-100', text: 'text-green-800', border: 'bg-green-500',
    bgStyle: 'background-color: #dcfce7', textStyle: 'color: #166534', borderStyle: 'background-color: #22c55e'
  },
  { 
    bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'bg-yellow-500',
    bgStyle: 'background-color: #fef3c7', textStyle: 'color: #92400e', borderStyle: 'background-color: #eab308'
  },
  { 
    bg: 'bg-purple-100', text: 'text-purple-800', border: 'bg-purple-500',
    bgStyle: 'background-color: #f3e8ff', textStyle: 'color: #6b21a8', borderStyle: 'background-color: #a855f7'
  },
  { 
    bg: 'bg-pink-100', text: 'text-pink-800', border: 'bg-pink-500',
    bgStyle: 'background-color: #fce7f3', textStyle: 'color: #be185d', borderStyle: 'background-color: #ec4899'
  },
  { 
    bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'bg-indigo-500',
    bgStyle: 'background-color: #e0e7ff', textStyle: 'color: #3730a3', borderStyle: 'background-color: #6366f1'
  },
  { 
    bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500',
    bgStyle: 'background-color: #f3f4f6', textStyle: 'color: #1f2937', borderStyle: 'background-color: #6b7280'
  },
  { 
    bg: 'bg-red-200', text: 'text-red-900', border: 'bg-red-600',
    bgStyle: 'background-color: #fecaca', textStyle: 'color: #7f1d1d', borderStyle: 'background-color: #dc2626'
  },
  { 
    bg: 'bg-blue-200', text: 'text-blue-900', border: 'bg-blue-600',
    bgStyle: 'background-color: #bfdbfe', textStyle: 'color: #1e3a8a', borderStyle: 'background-color: #2563eb'
  },
  { 
    bg: 'bg-green-200', text: 'text-green-900', border: 'bg-green-600',
    bgStyle: 'background-color: #bbf7d0', textStyle: 'color: #14532d', borderStyle: 'background-color: #16a34a'
  },
  { 
    bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'bg-yellow-600',
    bgStyle: 'background-color: #fde68a', textStyle: 'color: #78350f', borderStyle: 'background-color: #ca8a04'
  },
  { 
    bg: 'bg-purple-200', text: 'text-purple-900', border: 'bg-purple-600',
    bgStyle: 'background-color: #e9d5ff', textStyle: 'color: #581c87', borderStyle: 'background-color: #9333ea'
  },
  { 
    bg: 'bg-pink-200', text: 'text-pink-900', border: 'bg-pink-600',
    bgStyle: 'background-color: #fbcfe8', textStyle: 'color: #831843', borderStyle: 'background-color: #db2777'
  },
  { 
    bg: 'bg-indigo-200', text: 'text-indigo-900', border: 'bg-indigo-600',
    bgStyle: 'background-color: #c7d2fe', textStyle: 'color: #312e81', borderStyle: 'background-color: #4f46e5'
  },
  { 
    bg: 'bg-gray-200', text: 'text-gray-900', border: 'bg-gray-600',
    bgStyle: 'background-color: #e5e7eb', textStyle: 'color: #111827', borderStyle: 'background-color: #4b5563'
  }
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
