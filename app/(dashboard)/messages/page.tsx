"use client";

import { useState, useEffect } from "react";
import { messageData } from "@/lib/data/message-data";

// Utility function to parse custom date strings (mimicking original code)
function parseCustomDate(dateInput: string | Date | { seconds: number; nanoseconds?: number } | null): Date | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return dateInput;
  }

  if (typeof dateInput === "object" && "seconds" in dateInput) {
    // Handle Firebase Timestamp-like objects
    return new Date(dateInput.seconds * 1000 + (dateInput.nanoseconds || 0) / 1000000);
  }

  if (typeof dateInput === "string") {
    // Parse string formats like "DDMMYY HH:mm" or ISO (e.g., "2025-10-11T11:11")
    try {
      if (/^\d{6}\s+\d{2}:\d{2}$/.test(dateInput)) {
        // Format: DDMMYY HH:mm
        const [datePart, timePart] = dateInput.split(" ");
        const day = datePart.slice(0, 2);
        const month = datePart.slice(2, 4);
        const year = `20${datePart.slice(4, 6)}`; // Assume 20XX
        return new Date(`${year}-${month}-${day}T${timePart}:00`);
      }
      return new Date(dateInput); // Try parsing ISO or other standard formats
    } catch {
      console.error("Invalid date format:", dateInput);
      return null;
    }
  }

  return null;
}

interface Message {
  id: number;
  title: string;
  description: string;
  content: string;
  createdAt?: string | Date | { seconds: number; nanoseconds?: number } | null;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load messages from JSON file
  useEffect(() => {
    async function fetchMessages() {
      try {
        // messageData is already an array, no need to fetch
        const data: Message[] = messageData;
        // Validate and parse dates if present
        const parsedMessages = data.map((message) => ({
          ...message,
          createdAt: message.createdAt ? parseCustomDate(message.createdAt) : null,
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error("Error loading messages:", error);
        setError("Failed to load messages. Please try again later.");
      }
    }
    fetchMessages();
  }, []);

  // Handle copy to clipboard
  const handleCopyMessage = (message: string, id: number) => {
    navigator.clipboard
      .writeText(message)
      .then(() => {
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
      })
      .catch((error) => {
        console.error("Error copying message:", error);
        setError("Failed to copy message.");
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Messages Dashboard</h1>

      {/* Short Description */}
      <p className="text-gray-600 mb-6">
        View and copy messages securely. Click the copy button to copy the message content to your clipboard.
      </p>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Messages List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {messages.length === 0 && !error ? (
          <p className="p-4 text-gray-500">No messages available.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {messages.map((message) => (
              <li key={message.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{message.title}</h3>
                    <p className="text-sm text-gray-500">{message.description}</p>
                  </div>
                  <button
                    onClick={() => handleCopyMessage(message.content, message.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {copiedMessageId === message.id ? "Copied!" : "Copy Message"}
                  </button>
                </div>
                {/* Content is not viewable, only copyable */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}