"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Eye, Mail, MessageCircle, X, Upload, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { documentService } from "@/lib/firebase/services/document";
import { storageService } from "@/lib/firebase/services/storage";
import messages from "@/lib/messages.json";
import Select from "react-select";
import type { Document, TrainingItem, Store, User } from "@/lib/firebase/types";

interface DocumentsListProps {
  documents: Document[];
  stores: Store[];
  isAdmin?: boolean;
  currentUser: User | null;
  refreshData: () => Promise<void>;
}

const PACKAGE_TYPES = [
  { value: "pnp_franchise", label: "PnP Franchise" },
  { value: "pnp_corporate", label: "PnP Corporate" },
  { value: "spar_franchise", label: "Spar Franchise" },
  { value: "spar_corporate", label: "Spar Corporate" },
  { value: "other", label: "Other" },
] as const;

async function sendDocument({
  document,
  item,
  recipient,
  method,
}: {
  document: Document;
  item?: TrainingItem;
  recipient: string;
  method: "email" | "whatsapp";
}) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Success",
      description: `Document ${item ? item.name : document.name} sent via ${method} to ${recipient}`,
    });
  } catch (error) {
    console.error("DocumentsList - sendDocument error:", error);
    toast({
      title: "Error",
      description: "Failed to send document",
      variant: "destructive",
    });
  }
}

async function sendWhatsAppGroupMessage({
  document,
  phoneNumbers,
  message,
}: {
  document: Document;
  phoneNumbers: string[];
  message: string;
}) {
  try {
    if (phoneNumbers.length === 0) {
      throw new Error("No phone numbers available");
    }
    const encodedMessage = encodeURIComponent(message);
    const phoneList = phoneNumbers.join(",");
    const whatsappUrl = `https://wa.me/?phone=${phoneList}&text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    toast({
      title: "Success",
      description: `Opened WhatsApp group message for ${document.name}`,
    });
  } catch (error) {
    console.error("DocumentsList - sendWhatsAppGroupMessage error:", error);
    toast({
      title: "Error",
      description: "Failed to open WhatsApp group message",
      variant: "destructive",
    });
  }
}

async function downloadAllItems(packageName: string, items: TrainingItem[]) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast({
      title: "Success",
      description: `Downloaded all items in ${packageName} as zip`,
    });
    return `/documents/${packageName}/all.zip`;
  } catch (error) {
    console.error("DocumentsList - downloadAllItems error:", error);
    toast({
      title: "Error",
      description: "Failed to download package",
      variant: "destructive",
    });
  }
}

async function uploadDocument(file: File, type: Document["type"], name: string, userId: string, storeIds: string[]) {
  try {
    console.log("DocumentsList - Uploading document:", { name, type, file: file.name, userId, storeIds });
    const path = `documents/${type}/${Date.now()}_${file.name}`;
    const url = await storageService.uploadFile(file, path);
    const document: Omit<Document, "id"> = {
      name,
      size: file.size,
      type,
      storeIds,
      url,
      createdAt: new Date(),
    };
    const docId = await documentService.create(document);
    console.log("DocumentsList - Document uploaded:", { docId, url, storeIds });
    toast({
      title: "Success",
      description: "Document uploaded successfully",
    });
    return { id: docId, ...document };
  } catch (error) {
    console.error("DocumentsList - uploadDocument error:", error);
    toast({
      title: "Error",
      description: "Failed to upload document",
      variant: "destructive",
    });
    throw error;
  }
}

export default function DocumentsList({ documents, stores, isAdmin = false, currentUser, refreshData }: DocumentsListProps) {
  const [recipient, setRecipient] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sendMethod, setSendMethod] = useState<"email" | "whatsapp" | null>(null);
  const [sendingDoc, setSendingDoc] = useState<Document | null>(null);
  const [sendingItem, setSendingItem] = useState<TrainingItem | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Document | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPackageType, setUploadPackageType] = useState<Document["type"]>("pnp_franchise");
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [selectedStoreIds, setSelectedStoreIds] = useState<{ value: string; label: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log("DocumentsList - Props:", { documents, stores, currentUser, isAdmin });

  const handleSend = async () => {
    if (!sendingDoc || !recipient || !sendMethod) {
      toast({
        title: "Error",
        description: "Missing required fields for sending document",
        variant: "destructive",
      });
      return;
    }
    await sendDocument({
      document: sendingDoc,
      item: sendingItem ?? undefined,
      recipient,
      method: sendMethod,
    });
    setSendOpen(false);
    setRecipient("");
    setSendingDoc(null);
    setSendingItem(null);
    setSendMethod(null);
  };

  const handleUpload = async () => {
    if (!file || !docName || !uploadPackageType || !currentUser?.id) {
      toast({
        title: "Error",
        description: "Please provide a file, name, type, and ensure you are logged in",
        variant: "destructive",
      });
      return;
    }
    if (currentUser?.role !== "superadmin") {
      toast({
        title: "Error",
        description: "Only superadmins can upload documents",
        variant: "destructive",
      });
      return;
    }
    await uploadDocument(file, uploadPackageType, docName, currentUser.id, selectedStoreIds.map((s) => s.value));
    setUploadOpen(false);
    setFile(null);
    setDocName("");
    setUploadPackageType("pnp_franchise");
    setSelectedStoreIds([]);
    await refreshData();
  };

  const handleWhatsAppGroupMessage = (doc: Document) => {
    const packageType = doc.type as keyof typeof messages;
    const messageConfig = messages[packageType];
    if (!messageConfig) {
      toast({
        title: "Error",
        description: "No WhatsApp message configuration for this document type",
        variant: "destructive",
      });
      return;
    }

    const phoneNumbers = messageConfig.phones || [];
    const message = messageConfig.message
      .replace("{username}", "_____")
      .replace("{password}", "_____")
      .replace("{orderusername}", "_____")
      .replace("{orderpassword}", "_____");

    if (phoneNumbers.length === 0) {
      toast({
        title: "Error",
        description: "No phone numbers available for WhatsApp messaging",
        variant: "destructive",
      });
      return;
    }
    sendWhatsAppGroupMessage({ document: doc, phoneNumbers, message });
  };

  const getWhatsAppMessage = (doc: Document) => {
    const packageType = doc.type as keyof typeof messages;
    const messageConfig = messages[packageType];
    if (!messageConfig) {
      return "No message configuration available.";
    }
    return messageConfig.message
      .replace("{username}", "_____")
      .replace("{password}", "_____")
      .replace("{orderusername}", "_____")
      .replace("{orderpassword}", "_____");
  };

  const handleCopyMessage = (doc: Document) => {
    const message = getWhatsAppMessage(doc);
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: "Success",
        description: "Message copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    });
  };

  // Map document type to store type
  const getMatchingStoreType = (docType: Document["type"]): string => {
    switch (docType) {
      case "pnp_franchise":
        return "picknpay_franchise";
      case "pnp_corporate":
        return "picknpay_corporate";
      case "spar_franchise":
        return "spar_franchise";
      case "spar_corporate":
        return "spar_corporate";
      case "other":
        return "independent";
      default:
        return "";
    }
  };

  // Filter stores by document type
  const filteredStores = selectedPackage
    ? stores.filter((store) => {
        const matchingStoreType = getMatchingStoreType(selectedPackage.type);
        return !matchingStoreType || store.storeType === matchingStoreType;
      })
    : [];

  // Filter documents by selected package type
  const filteredDocuments = documents.filter((doc) =>
    PACKAGE_TYPES.some((pkg) => pkg.value === doc.type)
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Documents Packages</h1>

      <Tabs defaultValue="pnp_franchise" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {PACKAGE_TYPES.map((pkg) => (
            <TabsTrigger key={pkg.value} value={pkg.value}>
              {pkg.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {PACKAGE_TYPES.map((pkg) => (
          <TabsContent key={pkg.value} value={pkg.value} className="mt-6">
            {currentUser?.role === "superadmin" && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Upload to {pkg.label} (Superadmin Only)</h2>
                <Button
                  onClick={() => {
                    setUploadPackageType(pkg.value);
                    setUploadOpen(true);
                  }}
                  className="mb-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments
                .filter((doc) => doc.type === pkg.value)
                .map((doc) => {
                  const isTraining = doc.type === "training";
                  return (
                    <Card key={doc.id}>
                      <CardHeader>
                        <CardTitle className="truncate">{doc.name}</CardTitle>
                        <CardDescription>
                          {Math.round(doc.size / 1024)} KB | {pkg.label}
                          <br />
                          Associated Stores: {doc.storeIds.length > 0 ? doc.storeIds.map((id) => stores.find((s) => s.id === id)?.tradingName || id).join(", ") : "None"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              isTraining
                                ? setSelectedPackage(doc)
                                : window.open(doc.url, "_blank")
                            }
                          >
                            <Eye className="w-3 h-3 mr-1" /> {isTraining ? "View Items" : "View"}
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <a href={doc.url} download>
                              <Download className="w-3 h-3 mr-1" /> Download
                            </a>
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSendingDoc(doc);
                              setSendingItem(null);
                              setSendMethod("email");
                              setSendOpen(true);
                            }}
                          >
                            <Mail className="w-3 h-3 mr-1" /> Email
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsAppGroupMessage(doc)}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp Group
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              {filteredDocuments.filter((doc) => doc.type === pkg.value).length === 0 && (
                <div className="text-center py-8 col-span-full">
                  <p className="text-gray-600">
                    No documents in this package. {currentUser?.role === "superadmin" ? "Upload one above." : ""}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Unified Send Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send {sendingItem ? `${sendingDoc?.name}/${sendingItem.name}` : sendingDoc?.name} via{" "}
              {sendMethod === "email" ? "Email" : "WhatsApp"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipient">
                Recipient {sendMethod === "email" ? "Email" : "Phone Number"}
              </Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={`Enter ${sendMethod === "email" ? "email address" : "phone number"}`}
              />
            </div>
          </div>
          <Button onClick={handleSend}>Send {sendMethod === "email" ? "Email" : "WhatsApp"}</Button>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog (Superadmin Only) */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Document (Superadmin Only)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="docName">Document Name</Label>
              <Input
                id="docName"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Enter document name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="docType">Package Type</Label>
              <Input
                id="docType"
                value={uploadPackageType}
                readOnly
                className="bg-gray-100"
              />
            </div>
            {/* <div className="grid gap-2">
              <Label htmlFor="storeSelect">Select Stores</Label>
              <Select
                isMulti
                options={stores.map((store) => ({
                  value: store.id,
                  label: `${store.tradingName} (${store.storeType || "Unknown"})`,
                }))}
                value={selectedStoreIds}
                onChange={(selected) => setSelectedStoreIds(selected as { value: string; label: string }[])}
                placeholder="Select one or more stores..."
                className="w-full"
              />
            </div> */}
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <Button
            onClick={handleUpload}
            disabled={currentUser?.role !== "superadmin"}
          >
            Upload
          </Button>
        </DialogContent>
      </Dialog>

      {/* Training Package Items Page */}
      <Dialog open={!!selectedPackage} onOpenChange={(open) => !open && setSelectedPackage(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 py-4 border-b">
            <div className="flex justify-between items-center">
              <DialogTitle>{selectedPackage?.name} - Training Package</DialogTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleWhatsAppGroupMessage(selectedPackage!)}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  WhatsApp Group
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyMessage(selectedPackage!)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  onClick={() =>
                    selectedPackage?.items &&
                    downloadAllItems(selectedPackage.name, selectedPackage.items)
                  }
                >
                  <a href={selectedPackage ? `/documents/${selectedPackage.name}/all.zip` : "#"} download>
                    <Download className="w-3 h-3 mr-1" /> Download All
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedPackage(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 p-4">
            {selectedPackage?.items?.map((item) => (
              <Card key={item.name}>
                <CardHeader>
                  <CardTitle className="truncate">{item.name}</CardTitle>
                  <CardDescription>{Math.round(item.size / 1024)} KB</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(item.url, "_blank")}
                    >
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={item.url} download>
                        <Download className="w-3 h-3 mr-1" /> Download
                      </a>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSendingDoc(selectedPackage);
                        setSendingItem(item);
                        setSendMethod("email");
                        setSendOpen(true);
                      }}
                    >
                      <Mail className="w-3 h-3 mr-1" /> Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWhatsAppGroupMessage(selectedPackage)}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp Group
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!selectedPackage?.items?.length && (
              <p className="text-gray-600">No items found in this training package.</p>
            )}
          </div>
          <div className="mt-6 p-4 border-t">
            <h3 className="text-lg font-semibold mb-4">WhatsApp Message</h3>
            <div className="p-4 bg-gray-50 rounded-md">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {selectedPackage ? getWhatsAppMessage(selectedPackage) : "Select a package to view the message."}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}