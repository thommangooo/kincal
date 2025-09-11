'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  className?: string
}

export default function ImageUpload({ value, onChange, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)

      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      const imageUrl = data.publicUrl
      setPreview(imageUrl)
      onChange(imageUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* URL Input Fallback */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or enter image URL
        </label>
        <div className="relative">
          <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="url"
            value={value || ''}
            onChange={(e) => {
              onChange(e.target.value || null)
              setPreview(e.target.value || null)
            }}
            placeholder="https://example.com/image.jpg"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}


