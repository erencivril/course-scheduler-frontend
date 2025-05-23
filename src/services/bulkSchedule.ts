import type { BulkSectionDto } from "../types/BulkSectionDto";

/**
 * POST /schedule/bulk
 * @param dto BulkSectionDto
 * @returns Promise<any>
 */
export async function postBulkSchedule(dto: BulkSectionDto): Promise<any> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch("http://localhost:3000/schedule/bulk", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dto)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to generate schedule from Excel");
  }
  return response.json();
}

/**
 * POST /initial-load/sections
 * @param file Excel File (.xlsx)
 * @param termId string
 * @returns Promise<any>
 */
export async function postLoadSections(file: File, termId: string): Promise<any> {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Not authenticated");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("termId", termId);
  const response = await fetch("http://localhost:3000/initial-load/sections", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
      // Do NOT set Content-Type; browser will set it for FormData
    },
    body: formData
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload Excel for section import");
  }
  return response.json();
}
