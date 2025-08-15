'use client'

import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";      
import { Download, FileText, X } from "lucide-react";
import { Store } from "@/lib/firebase/types";
import { createEvent } from "ics";


interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: "training" | "launch";
    store: Store;
  };
}

const addToCalendar = (event: CalendarEvent) => {
  const { store, type } = event.resource;
  const eventDate = type === "training" ? store.trainingDate : store.launchDate;
  if (!eventDate) return;

  const jsDate =
    eventDate instanceof Timestamp ? eventDate.toDate() : new Date(eventDate);
  if (isNaN(jsDate.getTime())) {
    console.error(`Invalid ${type} date for store: ${store.tradingName || store.storeId}`);
    return;
  }

  const startDate = jsDate;
  const endDate = new Date(startDate.getTime() + (type === "training" ? 2 : 4) * 60 * 60 * 1000);

  const icsEvent = {
    start: [
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
    ],
    end: [
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate(),
      endDate.getHours(),
      endDate.getMinutes(),
    ],
    title: `${type === "training" ? "Training" : "Launch"}: ${store.tradingName}`,
    description: `Store: ${store.tradingName}\nAddress: ${store.streetAddress}, ${store.province}\nStore ID: ${store.storeId || "N/A"}\nType: ${store.storeType || "N/A"}\nStatus: ${store.status}`,
    location: `${store.streetAddress}, ${store.province}`,
  };

  createEvent(icsEvent, (error, value) => {
    if (error) {
      console.error("Error creating ICS file:", error);
      return;
    }
    const blob = new Blob([value], { type: "text/calendar" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${store.tradingName}-${type}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  });
};

export const CustomEventModal: React.FC<{
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDocument: (store: Store) => void;
}> = ({ event, isOpen, onClose, onViewDocument }) => {
  if (!isOpen || !event) return null;

  const { store, type } = event.resource;
  const eventDate = type === "training" ? store.trainingDate : store.launchDate;
  const formattedDate = eventDate
    ? format(eventDate instanceof Timestamp ? eventDate.toDate() : new Date(eventDate), "dd/MM/yyyy HH:mm")
    : "N/A";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Event details">
      <div className="bg-white rounded-lg w-[95vw] max-w-lg max-h-[80vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">
          {type === "training" ? "Training" : "Launch"} Details: {store.tradingName}
        </h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Event Information</h4>
            <p className="text-sm text-gray-600">
              <strong>Type:</strong> {type === "training" ? "Training" : "Launch"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Date & Time:</strong> {formattedDate}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Store Details</h4>
            <p className="text-sm text-gray-600">
              <strong>Store Name:</strong> {store.tradingName || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Address:</strong> {store.streetAddress || "N/A"}, {store.province || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Store Type:</strong> {store.storeType || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Store ID:</strong> {store.storeId || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Status:</strong> {store.status || "N/A"}
            </p>
          </div>
          {store.contactPersons?.length > 0 && (
            <div>
              <h4 className="font-medium">Contact Persons</h4>
              {store.contactPersons.map((contact, index) => (
                <div key={index} className="text-sm text-gray-600">
                  <p>
                    <strong>Name:</strong> {contact.name || "N/A"} {contact.isPrimary && <Badge>Primary</Badge>}
                  </p>
                  <p>
                    <strong>Designation:</strong> {contact.designation || "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {contact.phone || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {contact.email || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          )}
          {store.products?.length > 0 && (
            <div>
              <h4 className="font-medium">Products</h4>
              {store.products.map((product, index) => (
                <div key={index} className="text-sm text-gray-600">
                  <p>
                    <strong>Name:</strong> {product.name || "N/A"}
                  </p>
                  <p>
                    <strong>Description:</strong> {product.description || "N/A"}
                  </p>
                  <p>
                    <strong>Retail Price:</strong> R{product.retailPrice || "0.00"}
                  </p>
                  <p>
                    <strong>Estimated Value:</strong> R{product.estimatedValue || "0.00"}
                  </p>
                </div>
              ))}
            </div>
          )}
          {store.collectionTimes && (
            <div>
              <h4 className="font-medium">Collection Times</h4>
              <p className="text-sm text-gray-600">
                <strong>Monday - Friday:</strong> {store.collectionTimes.mondayFriday.from || "N/A"} -{" "}
                {store.collectionTimes.mondayFriday.to || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Saturday:</strong> {store.collectionTimes.saturday.from || "N/A"} -{" "}
                {store.collectionTimes.saturday.to || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Sunday:</strong> {store.collectionTimes.sunday.from || "N/A"} -{" "}
                {store.collectionTimes.sunday.to || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Public Holiday:</strong> {store.collectionTimes.publicHoliday.from || "N/A"} -{" "}
                {store.collectionTimes.publicHoliday.to || "N/A"}
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => addToCalendar(event)}
            aria-label={`Set calendar reminder for ${type} event`}
          >
            <Download className="w-4 h-4 mr-2" />
            Set Reminder
          </Button>
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => onViewDocument(store)}
            disabled={!store.signedSla && !store.bankConfirmation}
            aria-label="View store documents"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Documents
          </Button>
          <Button
            variant="outline"
            className="text-xs"
            onClick={onClose}
            aria-label="Close event details"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
