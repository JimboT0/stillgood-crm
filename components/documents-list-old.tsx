"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, Upload, Trash2, Plus, File, Loader2, Pencil, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import Select from "react-select";
import { documentService } from "@/lib/firebase/services/document";
import type { Document, User } from "@/lib/firebase/types";
import { useDashboardData } from "./dashboard/dashboard-provider";

interface DocumentsListProps {
  documents: Document[];
  isSuperadmin?: boolean;
  currentUser: User | null;
  refreshData: () => Promise<void>;
}

const PACKAGE_TYPES = [
  { value: "pnp_franchise", label: "PnP Franchise", description: "Documents for Pick n Pay franchise stores" },
  { value: "pnp_corporate", label: "PnP Corporate", description: "Documents for Pick n Pay corporate stores" },
  { value: "spar_franchise", label: "Spar Franchise", description: "Documents for Spar franchise stores" },
  { value: "spar_corporate", label: "Spar Corporate", description: "Documents for Spar corporate stores" },
  { value: "independent", label: "Independent", description: "Documents for independent stores" },
  { value: "internal", label: "Internal & Operational", description: "Documents for internal use" },
  { value: "training", label: "Training", description: "Documents for training purposes" },
  { value: "other", label: "Other", description: "Miscellaneous documents" },
] as const;

async function createDocument(
  url: string,
  types: Document["type"][],
  name: string,
  description: string | null,
  userId: string
): Promise<Document[]> {
  try {
    console.log("createDocument - Validating inputs:", { url, types, name, userId });
    if (!url.trim()) throw new Error("Document URL is required");
    if (!name.trim()) throw new Error("Document name is required");
    if (types.length === 0) throw new Error("At least one package type is required");
    if (!userId) throw new Error("User ID is missing");
    
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }
    
    console.log("createDocument - Validation passed");
    const createdDocs: Document[] = [];
    for (const type of types) {
      const subs = subcategories.length > 0 ? subcategories : [null];
      for (const subcategory of subs) {
        const document: Omit<Document, "id"> = {
          name,
          description,
          size: 0, // Unknown size for external URLs
          type,
          storeId: "", 
          subcategory,
          url: url,
          uploadedAt: new Date(),
          uploadedBy: userId,
        };
        console.log("uploadDocument - Creating Firestore document:", { type, subcategory, document });
        const docId = await documentService.create(document);
        console.log("uploadDocument - Firestore document created:", docId);
        createdDocs.push({ id: docId, ...document });
      }
    }
    console.log("uploadDocument - Success, IDs:", createdDocs.map((doc) => doc.id));
    toast({ title: "Success", description: `Uploaded ${name} to ${types.join(", ")}` });
    return createdDocs;
  } catch (error: any) {
    console.error("uploadDocument - Error:", { message: error.message, code: error.code });
    if (error.code === "auth/quota-exceeded") {
      toast({ title: "Error", description: "Authentication quota exceeded. Please try again later.", variant: "destructive" });
    } else {
      toast({ title: "Error", description: error.message || "Failed to upload document", variant: "destructive" });
    }
    throw error;
  }
}

async function deleteDocuments(documents: Document[], allDocuments: Document[], user: User | null) {
  try {
    if (!user) {
      throw new Error("Must be authenticated to delete documents");
    }
    console.log("deleteDocuments - Starting:", { docIds: documents.map((doc) => doc.id), userEmail: user.email });
    const deletedDocIds: string[] = [];
    for (const doc of documents) {
      const otherDocsWithSameUrl = allDocuments.filter(
        (d) => d.url === doc.url && d.id !== doc.id
      );
      if (otherDocsWithSameUrl.length === 0) {
        const path = decodeURIComponent(doc.url.split('/o/')[1]?.split('?')[0] || doc.url);
        await documentService.deleteFile(path).catch((error) => {
          console.warn("deleteDocuments - Failed to delete from Storage:", path, error);
        });
        console.log("deleteDocuments - Deleted from Storage:", path);
      } else {
        console.log("deleteDocuments - Skipped Storage deletion, URL used by other documents:", doc.url);
      }
      await documentService.delete(doc.id);
      console.log("deleteDocuments - Deleted from Firestore:", doc.id);
      deletedDocIds.push(doc.id);
    }
    console.log("deleteDocuments - Success, deleted IDs:", deletedDocIds);
    toast({ title: "Success", description: `Deleted ${deletedDocIds.length} document(s)` });
    return deletedDocIds;
  } catch (error: any) {
    console.error("deleteDocuments - Error:", { message: error.message, code: error.code });
    if (error.code === "auth/quota-exceeded") {
      toast({ title: "Error", description: "Authentication quota exceeded. Please try again later.", variant: "destructive" });
    } else {
      toast({ title: "Error", description: error.message || "Failed to delete documents", variant: "destructive" });
    }
    throw error;
  }
}

export default function DocumentsList({ documents, refreshData }: DocumentsListProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [selectedPackageTypes, setSelectedPackageTypes] = useState<{ value: Document["type"]; label: string; description: string }[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
  const [editingCategory, setEditingCategory] = useState<Document["type"] | null>(null);
  const { currentUser } = useDashboardData();
  const isSuperadmin = currentUser?.role === "superadmin";

  // Validate form for enabling/disabling the Add button
  const isAddDisabled = !currentUser || !docUrl.trim() || !docName.trim() || selectedPackageTypes.length === 0;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    console.log("DocumentsList - State updated:", {
      currentUser: currentUser ? { id: currentUser.id, email: currentUser.email, role: currentUser.role } : null,
      documents: documents.length,
      isAddDisabled,
      docUrl: docUrl || null,
      docName,
      selectedPackageTypes: selectedPackageTypes.map((t) => t.value),
    });
  }, [currentUser, documents, isAddDisabled, docUrl, docName, selectedPackageTypes]);

  const handleAddDocument = async () => {
    console.log("handleAddDocument - Button clicked");
    if (isAddDisabled) {
      console.log("handleAddDocument - Failed: Button is disabled", {
        hasCurrentUser: !!currentUser,
        hasUrl: !!docUrl.trim(),
        hasDocName: !!docName.trim(),
        hasPackageTypes: selectedPackageTypes.length > 0,
      });
      toast({ title: "Error", description: "Please fill all required fields: URL, name, and package type.", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      console.log("handleAddDocument - Failed: No current user");
      toast({ title: "Error", description: "Please log in to add documents.", variant: "destructive" });
      return;
    }
    if (!docUrl.trim()) {
      console.log("handleAddDocument - Failed: No URL provided");
      toast({ title: "Error", description: "Please enter a document URL.", variant: "destructive" });
      return;
    }
    if (!docName.trim()) {
      console.log("handleAddDocument - Failed: Document name is empty");
      toast({ title: "Error", description: "Please enter a document name.", variant: "destructive" });
      return;
    }
    if (selectedPackageTypes.length === 0) {
      console.log("handleAddDocument - Failed: No package types selected");
      toast({ title: "Error", description: "Please select at least one package type.", variant: "destructive" });
      return;
    }
    if (!currentUser.id) {
      console.log("handleAddDocument - Failed: Missing user ID");
      toast({ title: "Error", description: "User authentication error: Missing user ID.", variant: "destructive" });
      return;
    }
    if (typeof currentUser.id !== "string") {
      console.log("handleAddDocument - Failed: User ID is not a string", { id: currentUser.id });
      toast({ title: "Error", description: "User authentication error: Invalid user ID.", variant: "destructive" });
      return;
    }
    console.log("handleAddDocument - Starting:", {
      url: docUrl,
      docName,
      docDescription,
      packageTypes: selectedPackageTypes.map((t) => t.value),
      userEmail: currentUser.email,
      userId: currentUser.id,
    });
    try {
      await createDocument(
        docUrl,
        selectedPackageTypes.map((t) => t.value),
        docName,
        docDescription || null,
        currentUser.id
      );
      console.log("handleAddDocument - Document added successfully");
      setUploadOpen(false);
      setDocUrl("");
      setDocName("");
      setDocDescription("");
      setSelectedPackageTypes([]);
      await refreshData();
    } catch (error: any) {
      console.error("handleAddDocument - Error:", { message: error.message, code: error.code });
      toast({ title: "Error", description: `Failed to add document: ${error.message || "Unknown error"}`, variant: "destructive" });
    }
  };

  const handleDeleteSelected = async (docs?: Document[]) => {
    if (!currentUser) {
      console.log("handleDeleteSelected - Failed: No current user");
      toast({ title: "Error", description: "Please log in to delete.", variant: "destructive" });
      return;
    }
    if (!currentUser.id || typeof currentUser.id !== "string") {
      console.log("handleDeleteSelected - Failed: Invalid user ID", { id: currentUser.id });
      toast({ title: "Error", description: "User authentication error: Invalid user ID.", variant: "destructive" });
      return;
    }
    const docsToDelete = docs || documents.filter((doc) => selectedDocIds.includes(doc.id));
    if (docsToDelete.length === 0) {
      console.log("handleDeleteSelected - Failed: No documents selected");
      toast({ title: "Error", description: "No documents selected for deletion.", variant: "destructive" });
      return;
    }
    console.log("handleDeleteSelected - Starting:", { selectedDocIds: docsToDelete.map((doc) => doc.id), userEmail: currentUser.email });
    try {
      await deleteDocuments(docsToDelete, documents, currentUser);
      console.log("handleDeleteSelected - Deletion completed successfully");
      setSelectedDocIds([]);
      await refreshData();
    } catch (error: any) {
      console.error("handleDeleteSelected - Error:", { message: error.message, code: error.code });
      toast({ title: "Error", description: `Delete failed: ${error.message || "Unknown error"}`, variant: "destructive" });
    }
  };

  const handleView = async (url: string, name: string) => {
    if (!currentUser) {
      console.log("handleView - Failed: No current user");
      toast({ title: "Error", description: "Please log in to view.", variant: "destructive" });
      return;
    }
    try {
      console.log("handleView - Opening URL:", url);
      window.open(url, "_blank");
    } catch (error: any) {
      console.error("handleView - Error:", { message: error.message });
      toast({ title: "Error", description: `Cannot open ${name}: Invalid URL`, variant: "destructive" });
    }
  };

  const handleCheckboxChange = (docId: string) => {
    console.log("handleCheckboxChange - Toggled document ID:", docId);
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Document Links</h1>
      </div>
      {!currentUser && <p className="text-red-500 mb-4">Please log in to access documents.</p>}

      <div className="space-y-6">
        {PACKAGE_TYPES.map((pkg) => {
          const packageDocs = documents.filter((doc) => doc.type === pkg.value);
          const isEditing = editingCategory === pkg.value;
          
          return (
            <div key={pkg.value} className="border rounded-lg">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div>
                  <h2 className="text-lg font-semibold">{pkg.label}</h2>
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                </div>
                {currentUser && isSuperadmin && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setUploadOpen(true);
                        setSelectedPackageTypes([pkg]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Link
                    </Button>
                    <Button
                      size="sm"
                      variant={isEditing ? "default" : "outline"}
                      onClick={() => {
                        setEditingCategory(isEditing ? null : pkg.value);
                        if (!isEditing) {
                          setSelectedDocIds([]);
                        }
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      {isEditing ? "Done" : "Edit"}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                {isEditing && selectedDocIds.length > 0 && (
                  <div className="mb-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const docsToDelete = documents.filter((doc) => selectedDocIds.includes(doc.id));
                        handleDeleteSelected(docsToDelete);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedDocIds.length})
                    </Button>
                  </div>
                )}
                
                {packageDocs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No links added yet</p>
                ) : (
                  <div className="grid gap-3">
                    {packageDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50">
                        {isEditing && (
                          <input
                            type="checkbox"
                            checked={selectedDocIds.includes(doc.id)}
                            onChange={() => handleCheckboxChange(doc.id)}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{doc.name}</h4>
                          {doc.description && (
                            <p className="text-sm text-gray-600 truncate">{doc.description}</p>
                          )}
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                          >
                            {doc.url}
                          </a>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(doc.url, doc.name)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={uploadOpen} onOpenChange={(open) => {
        console.log("Upload dialog open changed:", open);
        setUploadOpen(open);
        if (!open) {
          setDocUrl("");
          setDocName("");
          setDocDescription("");
          setSelectedPackageTypes([]);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
            <DialogDescription>Add a new document by providing the URL and details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="doc-url" id="doc-url-label">Document URL</Label>
              <Input
                id="doc-url"
                value={docUrl}
                onChange={(e) => {
                  setDocUrl(e.target.value);
                  console.log("Document URL updated:", e.target.value);
                }}
                placeholder="Paste document URL here..."
                type="url"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc-name" id="doc-name-label">Document Name</Label>
              <Input
                id="doc-name"
                value={docName}
                onChange={(e) => {
                  setDocName(e.target.value);
                  console.log("Document name updated:", e.target.value);
                }}
                placeholder="Enter document name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc-description" id="doc-description-label">Description (Optional)</Label>
              <Textarea
                id="doc-description"
                value={docDescription}
                onChange={(e) => {
                  setDocDescription(e.target.value);
                  console.log("Document description updated:", e.target.value);
                }}
                placeholder="Enter document description"
                maxLength={500}
              />
            </div>
            <div className="grid gap-2">
              <Label id="doc-type-label">Package Types</Label>
              <Select
                isMulti
                options={PACKAGE_TYPES}
                value={selectedPackageTypes}
                onChange={(options) => {
                  setSelectedPackageTypes(options as { value: Document["type"]; label: string; description: string }[]);
                  console.log("Package types updated:", options);
                }}
                placeholder="Select package types..."
                inputId="doc-type"
                aria-labelledby="doc-type-label"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                console.log("Add document button clicked");
                toast({ title: "Adding document", description: "Processing your request...", variant: "default" });
                handleAddDocument();
              }}
              disabled={isAddDisabled}
            >
              Add Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
