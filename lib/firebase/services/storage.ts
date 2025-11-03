import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "@/lib/firebase/config";
import { getAuth } from "firebase/auth";

const storage = getStorage(app);

export const storageService = {
  async uploadFile(file: File, path: string): Promise<string> {
    console.log("Uploading to:", path, "User:", getAuth().currentUser?.uid);
    const storageRef = ref(storage, path);
    try {
      await uploadBytes(storageRef, file);
      const signedUrl = await getDownloadURL(storageRef);
      console.log("Uploaded, signed URL:", signedUrl);
      return signedUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },

  async getFileUrl(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const signedUrl = await getDownloadURL(storageRef);
    return signedUrl;
  },

  async getSignedUrl(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  }
};
