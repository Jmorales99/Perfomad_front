import { apiClient } from './client'

export interface UploadedImage {
  name: string
  url: string
  path: string
}

export async function getUploadUrl(filename: string) {
  const res = await apiClient.post("/v1/images/upload-url", { filename }) // 👈 /v1
  return res.data
}

export async function getImages() {
  const res = await apiClient.get("/v1/images") // 👈 /v1
  return res.data
}

export async function deleteImage(filename: string) {
  await apiClient.delete(`/v1/images/${filename}`) // 👈 /v1
}
