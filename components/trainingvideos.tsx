"use client";

import { useState, useEffect } from "react";
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Video, Download, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

interface Message {
  id: string;
  title: string;
  description: string;
  content: string;
  subcategory: "Collection" | "Packing";
}

export default function TrainingVideos() {
  const [videos, setVideos] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      try {
        console.log("=== TrainingVideos: Fetching videos from Firebase Storage ===");
        const videoMessages: Message[] = [];

        // Fetch Packing videos
        const packingRef = ref(storage, "documents/videos/packing");
        const packingList = await listAll(packingRef);
        console.log("Packing Storage List:", {
          items: packingList.items.map((item) => item.fullPath),
          prefixes: packingList.prefixes.map((prefix) => prefix.fullPath),
        });

        const packingMessages = await Promise.all(
          packingList.items
            .filter((item) => item.name.toLowerCase().endsWith(".mp4"))
            .map(async (item) => {
              const url = await getDownloadURL(item);
              const metadata = await getMetadata(item);
              console.log(`Metadata for ${item.fullPath}:`, metadata);
              return {
                id: item.name,
                title: metadata.customMetadata?.title || item.name.replace(/\.mp4$/, "").replace(/_/g, " ") || "Unnamed Video",
                description: metadata.customMetadata?.description || "Video guide for packing procedures",
                content: url,
                subcategory: "Packing" as const,
              };
            })
        );
        console.log("Packing Video Messages:", packingMessages);
        videoMessages.push(...packingMessages);

        // Fetch Collection videos
        const collectionRef = ref(storage, "documents/videos/collection");
        const collectionList = await listAll(collectionRef);
        console.log("Collection Storage List:", {
          items: collectionList.items.map((item) => item.fullPath),
          prefixes: collectionList.prefixes.map((prefix) => prefix.fullPath),
        });

        const collectionMessages = await Promise.all(
          collectionList.items
            .filter((item) => item.name.toLowerCase().endsWith(".mp4"))
            .map(async (item) => {
              const url = await getDownloadURL(item);
              const metadata = await getMetadata(item);
              console.log(`Metadata for ${item.fullPath}:`, metadata);
              return {
                id: item.name,
                title: metadata.customMetadata?.title || item.name.replace(/\.mp4$/, "").replace(/_/g, " ") || "Unnamed Video",
                description: metadata.customMetadata?.description || "Video guide for collection procedures",
                content: url,
                subcategory: "Collection" as const,
              };
            })
        );
        console.log("Collection Video Messages:", collectionMessages);
        videoMessages.push(...collectionMessages);

        console.log("Fetched Video Messages:", videoMessages);
        setVideos(videoMessages);

        if (videoMessages.length === 0) {
          console.warn("No training videos found in Firebase Storage at documents/videos/collection or documents/videos/packing.");
          toast.error("No training videos found in Storage. Please check documents/videos/collection and documents/videos/packing.", {
            style: {
              background: "#fff",
              color: "#111827",
              border: "1px solid #f97316",
            },
          });
        }
      } catch (err: any) {
        console.error("Error fetching videos from Storage:", err, { code: err.code, message: err.message });
        toast.error(`Failed to load videos: ${err.message}`, {
          style: {
            background: "#fff",
            color: "#111827",
            border: "1px solid #f97316",
          },
        });
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  // Check for missing video metadata
  const getMissingVideoMetadata = (video: Message): string[] => {
    const missing: string[] = [];
    if (!video.title || video.title === video.id.replace(/\.mp4$/, "") || video.title === "Unnamed Video") missing.push("Title");
    if (!video.description || video.description.includes("Video guide for")) missing.push("Description");
    return missing;
  };

  const handleDownloadVideo = async (url: string, fileName: string) => {
    console.log("Initiating video download:", { url, fileName });
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          // Add any necessary headers, e.g., for authentication if required
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Video download started", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
    } catch (error) {
      console.error("Error initiating download:", error);
      toast.error("Failed to start video download", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
    }
  };

  const groupedVideos = videos.reduce(
    (acc, message) => {
      if (!acc[message.subcategory]) acc[message.subcategory] = [];
      acc[message.subcategory].push(message);
      return acc;
    },
    {} as Record<string, Message[]>
  );
  console.log("Grouped Videos:", groupedVideos);

  if (loading) {
    return (
      <div className="bg-background shadow-md rounded-lg overflow-hidden p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
              <div className="w-4 h-4 bg-white rounded" />
            </div>
            <p className="text-gray-600">Loading videos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Video size={20} />
          Training Videos
        </h2>
      </div>
      {(!groupedVideos.Packing && !groupedVideos.Collection) ? (
        <p className="p-6 text-foreground text-center">No videos available.</p>
      ) : (
        Object.entries(groupedVideos).map(([subcategory, subcategoryMessages]) => (
          <div key={subcategory} className="border-b border-gray-200 last:border-b-0">
            <h3 className="text-lg font-semibold text-foreground p-6 bg-background">
              {subcategory} ({subcategoryMessages.length})
            </h3>
            <div className="grid grid-cols-3 gap-6 p-6">
              {subcategoryMessages.map((message) => (
                <div
                  key={message.id}
                  className="bg-background rounded-lg shadow-sm p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-medium text-foreground">{message.title}</h4>
                    {getMissingVideoMetadata(message).length > 0 && (
                      <AlertTriangle
                        size={16}
                        className="text-yellow-600"
                        title={`Missing metadata: ${getMissingVideoMetadata(message).join(", ")}`}
                      />
                    )}
                  </div>
                  <p className="text-sm text-foreground">{message.description}</p>
                  <video
                    controls
                    src={message.content}
                    className="w-full rounded-md"
                    style={{ maxHeight: "300px" }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <Button
                    onClick={() => handleDownloadVideo(message.content, message.title.toLowerCase().replace(/\s/g, "-") + ".mp4")}
                    className="self-start px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
