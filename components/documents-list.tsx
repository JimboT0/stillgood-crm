"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, Mail, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

interface Credential {
  orderusername: string;
  orderpassword: string;
  bagusername: string;
  bagpassword: string;
  createdAt: Date;
}

interface Document {
  name: string;
  size: number;
  type: "sla" | "training";
  credentials?: Credential[];
}

interface DocumentsListProps {
  documents: Document[];
}

async function sendDocument({
  document,
  recipient,
  method,
}: {
  document: Document;
  recipient: string;
  method: "email" | "whatsapp";
}) {
  // Simulated API call to send document
  try {
    // In a real app, this would call your backend API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Success",
      description: `Document sent via ${method} to ${recipient}`,
    });
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to send document",
      variant: "destructive",
    });
  }
}

export default function DocumentsList({ documents }: DocumentsListProps) {
  const [recipient, setRecipient] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [sendMethod, setSendMethod] = useState<"email" | "whatsapp" | null>(null);

  const handleSend = async () => {
    if (!selectedDoc || !recipient || !sendMethod) return;

    await sendDocument({
      document: selectedDoc,
      recipient,
      method: sendMethod,
    });

    setRecipient("");
    setSelectedDoc(null);
    setSendMethod(null);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
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
                  onClick={() => window.open(`/documents/${doc.name}`, "_blank")}
                >
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`/documents/${doc.name}`} download>
                    <Download className="w-3 h-3 mr-1" /> Download
                  </a>
                </Button>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setSendMethod("email");
                      }}
                    >
                      <Mail className="w-3 h-3 mr-1" /> Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send {doc.name} via Email</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="recipient">Recipient Email</Label>
                        <Input
                          id="recipient"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>
                      {doc.type === "training" && doc.credentials && (
                        <div className="grid gap-2">
                          <Label>Credentials</Label>
                          <div className="text-sm text-gray-600">
                            {doc.credentials.map((cred, index) => (
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
                    <Button onClick={handleSend}>Send Email</Button>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setSendMethod("whatsapp");
                      }}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send {doc.name} via WhatsApp</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="recipient">Recipient Phone Number</Label>
                        <Input
                          id="recipient"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                      {doc.type === "training" && doc.credentials && (
                        <div className="grid gap-2">
                          <Label>Credentials</Label>
                          <div className="text-sm text-gray-600">
                            {doc.credentials.map((cred, index) => (
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
                    <Button onClick={handleSend}>Send WhatsApp</Button>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}