"use client";

import { useState, useEffect } from "react";
import { messageData } from "@/lib/data/message-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import type { User, StoreOpsView, CollectionTimes, Product } from "@/lib/firebase/types";
import TrainingVideos from "./trainingvideos";

interface Message {
  id: string | number;
  title: string;
  description: string;
  content: string;
  subcategory?: "Collection" | "Packing";
}

interface TrainingProps {
  stores?: StoreOpsView[];
  currentUser: User | null;
  selectedStore: StoreOpsView | null;
  setSelectedStore: (store: StoreOpsView | null) => void;
}

export default function VideoMessagesPage({ stores, currentUser, selectedStore, setSelectedStore }: TrainingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Log initial state
  useEffect(() => {
    console.log("=== VideoMessagesPage Initial State ===");
    console.log("Current User:", currentUser ? { id: currentUser.id, email: currentUser.email, role: currentUser.role, assignedStores: currentUser.assignedStores } : null);
    console.log("Stores Prop:", stores);
    console.log("Stores Prop Type:", Array.isArray(stores) ? "Array" : typeof stores);
    console.log("Stores Prop Count:", stores?.length || 0);
    console.log(
      "Stores Prop Details:",
      stores && Array.isArray(stores)
        ? stores.map((s) => ({
          id: s.id,
          tradingName: s.tradingName || "Missing tradingName",
          products: s.products || "No products",
          collectionTimes: s.collectionTimes || "No collection times",
          credentials: s.credentials || "No credentials",
          missingFields: getMissingFields(s),
        }))
        : "No stores available"
    );
    console.log("Selected Store:", selectedStore);

    if (!currentUser) {
      console.error("No authenticated user. Stores may not load.");
      toast.error("Please log in to view store data.", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
    }

    if (!stores || !Array.isArray(stores) || stores.length === 0) {
      console.error("Stores prop is undefined, not an array, or empty.");
      toast.error("No store data available. Please ensure stores are populated in Firestore.", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
    } else {
      console.log("Stores successfully received in VideoMessagesPage:", stores.length);
    }

    // Initialize messages with static data
    console.log("Initializing messages with static data:", messageData);
    setMessages([...messageData]);
  }, [currentUser, stores]);

  // Update messages based on selected store
  useEffect(() => {
    console.log("=== Updating Messages ===");
    console.log("Search Query:", searchQuery);
    console.log("Selected Store:", selectedStore ? {
      id: selectedStore.id,
      tradingName: selectedStore.tradingName,
      products: selectedStore.products,
      collectionTimes: selectedStore.collectionTimes,
      credentials: selectedStore.credentials,
      missingFields: selectedStore ? getMissingFields(selectedStore) : [],
    } : null);
    console.log("Stores Prop in Update Effect:", stores);

    const updatedMessages = messageData.map((msg) => {
      if (msg.id === 1) {
        return generateDynamicIntroMessage(selectedStore || null);
      }
      if (msg.id === 2 && selectedStore) {
        return generateDynamicStoreMessage(selectedStore);
      }
      return msg;
    });
    console.log("Updated Messages:", updatedMessages);
    setMessages(updatedMessages);
  }, [selectedStore, stores]);

  // Check for missing fields in a store
  const getMissingFields = (store: StoreOpsView): string[] => {
    const missing: string[] = [];
    if (!store.products || store.products.length === 0) missing.push("Products");
    if (!store.collectionTimes || !store.collectionTimes.mondayFriday) missing.push("Collection Times");
    if (!store.credentials || store.credentials.length === 0) missing.push("Credentials");
    return missing;
  };

  const generateDynamicStoreMessage = (store: StoreOpsView): Message => {
    console.log("Generating dynamic store message for:", store.id, store.tradingName);
    const missingFields = getMissingFields(store);
    console.log("Missing Fields for Store:", missingFields);

    if (missingFields.length > 0) {
      console.warn(`Store ${store.tradingName} is missing fields: ${missingFields.join(", ")}`);
      return {
        id: 2,
        title: `Instructions for ${store.tradingName}`,
        description: `Dynamic instructions for ${store.tradingName}`,
        content: `Hi Team,

The store ${store.tradingName} is missing the following required information: ${missingFields.join(", ")}.
Please contact an admin to update the store's details before proceeding.

✅ Important Reminders
• Always check each item for quality before packing – quality control is key!
• Focus on variety – no one wants a bag full of the same thing.
We’re excited to launch with you!

Let me know if you have any questions.`,
        subcategory: "Packing",
      };
    }

    const today = new Date();
    const dayOfWeek = today.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

    let collectionTime = store.collectionTimes?.mondayFriday;
    if (dayOfWeek === "saturday") {
      collectionTime = store.collectionTimes?.saturday;
    } else if (dayOfWeek === "sunday") {
      collectionTime = store.collectionTimes?.sunday;
    } else if (store.collectionTimes?.publicHoliday && isPublicHoliday(today)) {
      collectionTime = store.collectionTimes.publicHoliday;
    }

    const collectionTimeFrom = collectionTime?.from || "Unspecified";
    const collectionTimeTo = collectionTime?.to || "Unspecified";
    console.log("Collection Times:", { from: collectionTimeFrom, to: collectionTimeTo });

    const bagTypeMetadata: { [key: string]: { emoji: string; description: string } } = {
      vegetable: { emoji: "🥦", description: "A mix of fruit and vegetables\n• Aim for maximum variety and avoid duplication" },
      bakery: { emoji: "🥐", description: "A selection of bakery and confectionery items" },
      convenience: { emoji: "🍕", description: "Includes hot foods, sandwiches, pizzas, etc." },
      mystery: { emoji: "🎁", description: "A mixed selection from the categories above\n• Aim for an exciting mix!" },
      mixedgrocery: { emoji: "🛒", description: "Items such as cereals, canned goods, sweets, rice, sugar, household detergents, etc.\n• These are products that won’t look good on shelf but are still perfectly good" },
    };

    const availableBags = store.products
      ?.map((product) => {
        const bagName = product.name.toLowerCase();
        const metadata = bagTypeMetadata[bagName] || { emoji: "🛍️", description: `A selection of ${bagName} items` };
        return {
          name: bagName,
          emoji: metadata.emoji,
          description: product.description || metadata.description,
          estimatedValue: product.estimatedValue ? `R${product.estimatedValue}` : "_",
        };
      }) || [];
    console.log("Available Bags:", availableBags);

    const bagSection = availableBags.length > 0
      ? availableBags
        .map((bag) => `${bag.emoji} ${bag.name.charAt(0).toUpperCase() + bag.name.slice(1)} Bag\n• ${bag.description}\n• Packing value: ${bag.estimatedValue}`)
        .join("\n\n")
      : "No specific bags configured for this store.";

    const credentials = store.credentials?.[0];
    const credentialsSection = credentials
      ? `You’ll be able to check any customers orders and load new bags (from tomorrow) with the credentials below.\nAll you need to do is visit https://admin.stillgood.co.za and use the credentials below.\n\nLoad Bags\nBagAdminUsername: ${credentials.bagusername ?? "UNDEFINED"}\nBagAdminPassword: ${credentials.bagpassword ?? "UNDEFINED"}\n\nCheck Orders\nOrderUsername: ${credentials.orderusername ?? "UNDEFINED"}\nOrderPassword: ${credentials.orderpassword ?? "UNDEFINED"}`
      : "No credentials available for this store.";
    console.log("Credentials Section:", credentialsSection);

    const messageContent = `Hi Team,
${credentialsSection}

Here’s a quick breakdown of what should go into each of the bags to help guide your packing tomorrow and in future.

${bagSection}

✅ Important Reminders
• Always check each item for quality before packing – quality control is key!
• Focus on variety – no one wants a bag full of the same thing.
We’re excited to launch with you!

Your collection time starts at ${collectionTimeFrom} and ends at ${collectionTimeTo}.
Please be sure to have bags ready and loaded at least 30 mins before.
Let me know if you have any questions.`;

    return {
      id: 2,
      title: `Credentials and Packing Instructions for ${store.tradingName}`,
      description: `Dynamic credentials and packing instructions for ${store.tradingName}`,
      content: messageContent,
      subcategory: "Packing",
    };
  };

  const generateDynamicIntroMessage = (store: StoreOpsView | null): Message => {
    const baseMessage = messageData.find((msg) => msg.id === 1)!;
    const storeName = store ? store.tradingName : "{__STORE NAME__}";
    console.log("Generating intro message for store:", storeName);
    return {
      ...baseMessage,
      content: baseMessage.content.replace("{__STORE NAME__}", storeName),
    };
  };

  const isPublicHoliday = (date: Date): boolean => {
    console.log("Checking public holiday for date:", date);
    return false; // Placeholder
  };

  const handleCopyMessage = (message: string, id: string | number) => {
    console.log("Copying message ID:", id);
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-4">Training Dashboard</h1>
      <p className="text-foreground mb-6">
      Access training messages and videos for setup and operations.
      </p>
      <div className="bg-background shadow-md rounded-lg mb-6 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <MessageSquare size={20} />
        Messages
        </h2>
        {/* Notification for missing fields */}
        {selectedStore && (
        <div className={`mb-4 p-4 border-l-4 rounded-md ${getMissingFields(selectedStore).length > 0 ? "bg-yellow-50 border-yellow-400" : "bg-green-50 border-green-400"}`}>
          <div className="flex items-center gap-2">
          <p className="text-sm text-gray-800">
            {getMissingFields(selectedStore).length > 0 ? (
            <>
              <AlertTriangle size={20} className="text-yellow-600" />
              <strong>{selectedStore.tradingName}</strong> is missing the following:{" "}
              {getMissingFields(selectedStore).map((field, idx) => (
              <span key={field} className="text-yellow-700 font-semibold">
                {field}
                {idx < getMissingFields(selectedStore).length - 1 ? ", " : ""}
              </span>
              ))}
              .
            </>
            ) : (
            <>
              <span className="text-green-700 font-semibold">
              <strong>{selectedStore.tradingName}</strong> has all required fields (Products, Collection Times, Credentials).
              </span>
            </>
            )}
          </p>
          </div>
        </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
        <div className="flex-1 flex flex-col gap-2">
          <Input
          type="text"
          placeholder="Search stores..."
          value={searchQuery}
          onChange={(e) => {
            console.log("Search Query Changed:", e.target.value);
            setSearchQuery(e.target.value);
          }}
          className="w-full sm:w-[250px]"
          />
          {stores && stores.length > 0 ? (
          <Select
            value={selectedStore?.id || ""}
            onValueChange={(value) => {
            console.log("Selected Store Value Changed:", value);
            const store = stores?.find((s) => s.id === value) || null;
            setSelectedStore(store);
            }}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Select store for message" />
            </SelectTrigger>
            <SelectContent>
            {stores
              .filter((store) => (store.tradingName ?? "").toLowerCase().includes(searchQuery.toLowerCase()))
              .filter((store) => store.id && store.id.trim() !== "") // Ensure id is non-empty
              .map((store) => (
              <SelectItem key={store.id} value={store.id}>
                <div className="flex items-center gap-2">
                {store.tradingName || store.id}
                {getMissingFields(store).length > 0 && (
                  <span title={`Missing: ${getMissingFields(store).join(", ")}`}>
                  <AlertTriangle size={16} className="text-yellow-600" />
                  </span>
                )}
                </div>
              </SelectItem>
              ))}
            </SelectContent>
          </Select>
          ) : (
          <p className="text-sm text-gray-500">No stores available. Please contact an admin.</p>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Search and select a store to view its credentials and packing instructions
        </p>
        </div>
      </div>
      {messages.length === 0 ? (
        <p className="p-4 text-gray-500">No messages available.</p>
      ) : (
        <div className="p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
            <h4 className="text-lg font-medium text-foreground">{message.title}</h4>
            <p className="text-sm text-gray-500 mt-1">{message.description}</p>
            </div>
            <Button
            onClick={() => handleCopyMessage(message.content, message.id)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap self-start"
            >
            {copiedMessageId === message.id ? "Copied!" : "Copy Message"}
            </Button>
          </div>
          </div>
        ))}
        </div>
      )}
      </div>
      <TrainingVideos />
    </div>
  );
}
