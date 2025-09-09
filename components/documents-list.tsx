"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, Mail, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { UploadDropzone } from "@uploadthing/react";
// import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface Credential {
  orderusername: string;
  orderpassword: string;
  bagusername: string;
  bagpassword: string;
  createdAt: Date;
}

interface TrainingItem {
  name: string;
  size: number;
}

interface Document {
  name: string;
  size: number;
  type: "sla" | "training";
  credentials?: Credential[];
  items?: TrainingItem[]; // Only for training packages
}

interface DocumentsListProps {
  documents: Document[];
  isAdmin?: boolean;
}

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
  // Simulated API call to send document or item
  try {
    // In a real app, this would call your backend API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Success",
      description: `Document ${item ? item.name : document.name} sent via ${method} to ${recipient}`,
    });
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to send document",
      variant: "destructive",
    });
  }
}

export default function DocumentsList({ documents, isAdmin = false }: DocumentsListProps) {
  const [recipient, setRecipient] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sendMethod, setSendMethod] = useState<"email" | "whatsapp" | null>(null);
  const [sendingDoc, setSendingDoc] = useState<Document | null>(null);
  const [sendingItem, setSendingItem] = useState<TrainingItem | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Document | null>(null);

  const handleSend = async () => {
    if (!sendingDoc || !recipient || !sendMethod) return;

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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>

      {isAdmin && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Document</h2>
          {/* <UploadDropzone<OurFileRouter>
            endpoint="documentUploader"
            onClientUploadComplete={(res) => {
              console.log("Files uploaded: ", res);
              toast({
                title: "Upload Complete",
                description: "Document(s) uploaded successfully. Refresh to see changes.",
              });
            }}
            onUploadError={(error: Error) => {
              toast({
                title: "Upload Error",
                description: `ERROR! ${error.message}`,
                variant: "destructive",
              });
            }}
            onUploadBegin={(name) => {
              console.log("Uploading: ", name);
            }}
          /> */}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => {
          const isTraining = doc.type === "training";

          return (
            <Card key={doc.name}>
              <CardHeader>
                <CardTitle className="truncate">{doc.name}</CardTitle>
                <CardDescription>
                  {Math.round(doc.size / 1024)} KB | {doc.type === "sla" ? "SLA" : "Training Package"}
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
                        : window.open(`/documents/${doc.name}`, "_blank")
                    }
                  >
                    <Eye className="w-3 h-3 mr-1" /> {isTraining ? "View Items" : "View"}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/documents/${doc.name}`} download>
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
                    onClick={() => {
                      setSendingDoc(doc);
                      setSendingItem(null);
                      setSendMethod("whatsapp");
                      setSendOpen(true);
                    }}
                  >
                    <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
            {sendingDoc?.type === "training" && sendingDoc.credentials && (
              <div className="grid gap-2">
                <Label>Credentials</Label>
                <div className="text-sm text-gray-600">
                  {sendingDoc.credentials.map((cred, index) => (
                    <div key={index} className="mb-2">
                      <p>Order Username: {cred.orderusername}</p>
                      <p>Order Password: {cred.orderpassword}</p>
                      <p>Bag Username: {cred.bagusername}</p>
                      <p>Bag Password: {cred.bagpassword}</p>
                      <p>Created: {new Date(cred.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button onClick={handleSend}>Send {sendMethod === "email" ? "Email" : "WhatsApp"}</Button>
        </DialogContent>
      </Dialog>

      {/* Training Package Items Dialog (Intermediate View) */}
      <Dialog open={!!selectedPackage} onOpenChange={(open) => !open && setSelectedPackage(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPackage?.name} - Training Package Items</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
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
                      onClick={() =>
                        window.open(
                          `/documents/${selectedPackage.name}/${item.name}`,
                          "_blank",
                        )
                      }
                    >
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/documents/${selectedPackage.name}/${item.name}`} download>
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
                      onClick={() => {
                        setSendingDoc(selectedPackage);
                        setSendingItem(item);
                        setSendMethod("whatsapp");
                        setSendOpen(true);
                      }}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}