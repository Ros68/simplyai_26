import { API_BASE_URL } from "@/config/api";

export const saveImage = async (imageData: FormData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: imageData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json(); // parse JSON { url: "/uploads/xxxx.jpg" }
    return data;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};
