
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { messageData } from "@/lib/data/message-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy, Video, AlertCircle, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";
import type { Store, User } from "@/lib/firebase/types";

interface Message {
  id: string | number;
  title: string;
  description: string;
  content: string;
  subcategory?: "Collection" | "Packing";
}

export default function VideoMessagesPage() {
  const { stores = [], currentUser } = useDashboardData();
  const [messages] = useState<Message[]>(messageData);
  const [videos, setVideos] = useState<Message[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | number | null>(null);
  const [selectedStoreIdForCredentials, setSelectedStoreIdForCredentials] = useState<string>("");

  // Fetch videos from Firestore
  useEffect(() => {
    async function fetchVideos() {
      try {
        const packingQuery = collection(db, "packing");
        const packingSnapshot = await getDocs(packingQuery);
        const packingMessages: Message[] = packingSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          subcategory: "Packing",
        })) as Message[];

        const collectionQuery = collection(db, "collection");
        const collectionSnapshot = await getDocs(collectionQuery);
        const collectionMessages: Message[] = collectionSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          subcategory: "Collection",
        })) as Message[];

        const videoMessages = [...packingMessages, ...collectionMessages].sort((a, b) =>
          a.subcategory!.localeCompare(b.subcategory!)
        );
        console.log("Video Messages:", videoMessages);
        setVideos(videoMessages);
      } catch (err) {
        console.error("Error loading videos:", err);
        toast.error("Failed to load videos from Firebase.", {
          style: {
            background: "#fff",
            color: "#111827",
            border: "1px solid #f97316",
          },
        });
      }
    }
    fetchVideos();
  }, []);

  // Stores with credentials for dropdown
  const storesWithCredentials = stores
    .filter((store) => store.credentials?.[0])
    .map((store) => ({
      value: store.id,
      label: store.tradingName,
    }));
  console.log("Stores:", stores);
  console.log("Stores with Credentials:", storesWithCredentials);

  // Handler to copy message or video URL
  const handleCopyMessage = (message: string, id: string | number) => {
    navigator.clipboard
      .writeText(message)
      .then(() => {
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
        toast.success("Content copied to clipboard", {
          style: {
            background: "#fff",
            color: "#111827",
            border: "1px solid #f97316",
          },
        });
      })
      .catch((error) => {
        console.error("Error copying content:", error);
        toast.error("Failed to copy content.", {
          style: {
            background: "#fff",
            color: "#111827",
            border: "1px solid #f97316",
          },
        });
      });
  };

  // Handler to copy store credentials
  const handleCopyCredentials = () => {
    if (!selectedStoreIdForCredentials) {
      toast.error("Please select a store", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
      return;
    }
    const store = stores.find((s) => s.id === selectedStoreIdForCredentials);
    console.log("Selected Store:", store);
    const credentials = store?.credentials?.[0];
    console.log("Credentials:", credentials);
    if (!store || !credentials) {
      toast.error("No credentials available for this store", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
      return;
    }
    const credentialsMessage = `Login to admin.stillgood.co.za\n\n
Load Bags\n
BagAdminUsername: ${credentials.bagusername ?? "UNDEFINED"}
BagAdminPassword: ${credentials.bagpassword ?? "UNDEFINED"}\n
Check Orders\n
OrderUsername: ${credentials.orderusername ?? "UNDEFINED"}
OrderPassword: ${credentials.orderpassword ?? "UNDEFINED"}`;
    navigator.clipboard
      .writeText(credentialsMessage)
      .then(() => {
        toast.success("Credentials copied to clipboard", {
          style: {
            background: "#fff",
            color: "#111827",
            border: "1px solid #f97316",
          },
        });
      })
      .catch((error) => {
        console.error("Error copying credentials:", error);
        toast.error("Failed to copy credentials", {
          style: {
            background: "#fff",
            color: "#111827",
            border: "1px solid #f97316",
          },
        });
      });
  };

  // Group videos by subcategory
  const groupedVideos = videos.reduce(
    (acc, message) => {
      if (!acc[message.subcategory!]) acc[message.subcategory!] = [];
      acc[message.subcategory!].push(message);
      return acc;
    },
    {} as Record<string, Message[]>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Training Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Access training messages, store credentials, and videos for setup and operations.
      </p>
      {/* Messages Section */}
      <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            Messages
          </h2>
        </div>
        {messages.length === 0 ? (
          <p className="p-4 text-gray-500">No messages available.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {messages.map((message) => (
              <li key={message.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{message.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{message.description}</p>
                  </div>
                  <Button
                    onClick={() => handleCopyMessage(message.content, message.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap self-start"
                  >
                    {copiedMessageId === message.id ? "Copied!" : "Copy Message"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Store Credentials Section */}
      <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Store Credentials</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <Select
                value={selectedStoreIdForCredentials}
                onValueChange={(value) => setSelectedStoreIdForCredentials(value)}
              >
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Select store with credentials" />
                </SelectTrigger>
                <SelectContent>
                  {storesWithCredentials.map((store) => (
                    <SelectItem key={store.value} value={store.value}>
                      {store.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCopyCredentials}
              disabled={!selectedStoreIdForCredentials}
              className={`flex items-center gap-2 whitespace-nowrap ${
                !selectedStoreIdForCredentials || !stores.find((s) => s.id === selectedStoreIdForCredentials)?.credentials?.[0]
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }`}
            >
              {!selectedStoreIdForCredentials || !stores.find((s) => s.id === selectedStoreIdForCredentials)?.credentials?.[0] ? (
                <AlertCircle size={16} />
              ) : (
                <Copy size={16} />
              )}
              Copy Credentials
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Select a store to copy its login credentials for admin.stillgood.co.za
          </p>
        </div>
      </div>
      {/* Training Videos Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Video size={20} />
            Training Videos
          </h2>
        </div>
        {(!groupedVideos.Packing && !groupedVideos.Collection) ? (
          <p className="p-4 text-gray-500">No videos available.</p>
        ) : (
          Object.entries(groupedVideos).map(([subcategory, subcategoryMessages]) => (
            <div key={subcategory} className="border-b border-gray-200 last:border-b-0">
              <h3 className="text-lg font-semibold text-gray-700 p-4 bg-gray-50">
                {subcategory} ({subcategoryMessages.length})
              </h3>
              <ul className="divide-y divide-gray-200">
                {subcategoryMessages.map((message) => (
                  <li key={message.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{message.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{message.description}</p>
                      </div>
                      <Button
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap self-start"
                      >
                        {copiedMessageId === message.id ? "Copied!" : "Copy URL"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
