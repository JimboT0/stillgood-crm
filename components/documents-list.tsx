"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Eye, Upload, Trash2, Plus, File, Loader2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import Select from "react-select";
import { documentService } from "@/lib/firebase/services/document";
import type { Document, User, Subcategory } from "@/lib/firebase/types";
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
  { value: "internal", label: "Internal", description: "Documents for internal use" },
  { value: "other", label: "Other", description: "Miscellaneous documents" },
] as const;

async function uploadDocument(
  file: File,
  types: Document["type"][],
  subcategories: string[],
  name: string,
  description: string | null,
  userId: string
): Promise<Document[]> {
  try {
    console.log("uploadDocument - Validating inputs:", { file: file?.name, types, subcategories, name, userId });
    if (!file) throw new Error("No file selected");
    if (!name.trim()) throw new Error("Document name is required");
    if (types.length === 0) throw new Error("At least one package type is required");
    if (!userId) throw new Error("User ID is missing");
    if (!["image/jpeg", "image/png", "application/pdf", "video/mp4"].includes(file.type)) {
      throw new Error("Only JPG, PNG, PDF, or MP4 files are allowed");
    }
    if (file.size > 100 * 1024 * 1024) {
      throw new Error("File size exceeds 100MB limit");
    }
    console.log("uploadDocument - Validation passed");
    const path = `documents/${types[0]}/${subcategories[0] || "default"}/${Date.now()}_${file.name}`;
    console.log("uploadDocument - Starting upload to Storage:", { path, name, description, types, subcategories, userId });
    const signedUrl = await documentService.uploadFile(file, path);
    console.log("uploadDocument - Storage upload successful:", signedUrl);
    const createdDocs: Document[] = [];
    for (const type of types) {
      const subs = subcategories.length > 0 ? subcategories : [null];
      for (const subcategory of subs) {
        const document: Omit<Document, "id"> = {
          name,
          description,
          size: file.size,
          type,
          storeId: "", 
          subcategory,
          url: signedUrl,
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
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryDescription, setNewSubcategoryDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [selectedPackageTypes, setSelectedPackageTypes] = useState<{ value: Document["type"]; label: string; description: string }[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<{ value: string; label: string }[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTabPackageType, setSelectedTabPackageType] = useState<Document["type"]>("pnp_franchise");
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subcategoriesError, setSubcategoriesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useDashboardData();
  const isSuperadmin = currentUser?.role === "superadmin";

  // Validate form for enabling/disabling the Upload button
  const isUploadDisabled = !currentUser || !file || !docName.trim() || selectedPackageTypes.length === 0;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      console.time("fetchSubcategories");
      if (!currentUser) {
        console.log("DocumentsList - Skipping fetchSubcategories: No authenticated user");
        setSubcategories([]);
        setSubcategoriesError("Please log in to view subcategories");
        setLoading(false);
        console.timeEnd("fetchSubcategories");
        return;
      }
      try {
        setLoading(true);
        const subcategoryPromises = PACKAGE_TYPES.map(async (pkg) => {
          console.log("DocumentsList - Fetching subcategories for:", pkg.value);
          const subs = await documentService.getSubcategories(pkg.value) || [];
          return subs;
        });
        const subcategoriesArrays = await Promise.all(subcategoryPromises);
        const fetchedSubcategories = subcategoriesArrays.flat();
        setSubcategories(fetchedSubcategories);
        setSubcategoriesError(null);
        console.log("DocumentsList - Subcategories:", fetchedSubcategories);
      } catch (error: any) {
        console.error("DocumentsList - Error fetching subcategories:", { message: error.message, code: error.code });
        setSubcategories([]);
        setSubcategoriesError("Failed to load subcategories: " + (error.message || "Permission denied"));
      } finally {
        setLoading(false);
        console.timeEnd("fetchSubcategories");
      }
    };
    fetchSubcategories();
  }, [currentUser]);

  useEffect(() => {
    console.log("DocumentsList - State updated:", {
      currentUser: currentUser ? { id: currentUser.id, email: currentUser.email, role: currentUser.role } : null,
      documents: documents.length,
      isUploadDisabled,
      file: file ? file.name : null,
      docName,
      selectedPackageTypes: selectedPackageTypes.map((t) => t.value),
      selectedSubcategories: selectedSubcategories.map((s) => s.value),
    });
  }, [currentUser, documents, isUploadDisabled, file, docName, selectedPackageTypes, selectedSubcategories]);

  // Cache subcategory options to prevent recalculation
  const subcategoryOptions = useMemo(() => {
    return subcategories
      .filter((sub) => selectedPackageTypes.some((pkg) => pkg.value === sub.packageType))
      .map((sub) => ({
        value: sub.name,
        label: sub.name,
      }));
  }, [subcategories, selectedPackageTypes]);

  const handleUpload = async () => {
    console.log("handleUpload - Button clicked");
    if (isUploadDisabled) {
      console.log("handleUpload - Failed: Button is disabled", {
        hasCurrentUser: !!currentUser,
        hasFile: !!file,
        hasDocName: !!docName.trim(),
        hasPackageTypes: selectedPackageTypes.length > 0,
      });
      toast({ title: "Error", description: "Please fill all required fields: file, name, and package type.", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      console.log("handleUpload - Failed: No current user");
      toast({ title: "Error", description: "Please log in to upload.", variant: "destructive" });
      return;
    }
    if (!file) {
      console.log("handleUpload - Failed: No file selected");
      toast({ title: "Error", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    if (!docName.trim()) {
      console.log("handleUpload - Failed: Document name is empty");
      toast({ title: "Error", description: "Please enter a document name.", variant: "destructive" });
      return;
    }
    if (selectedPackageTypes.length === 0) {
      console.log("handleUpload - Failed: No package types selected");
      toast({ title: "Error", description: "Please select at least one package type.", variant: "destructive" });
      return;
    }
    if (!currentUser.id) {
      console.log("handleUpload - Failed: Missing user ID");
      toast({ title: "Error", description: "User authentication error: Missing user ID.", variant: "destructive" });
      return;
    }
    if (typeof currentUser.id !== "string") {
      console.log("handleUpload - Failed: User ID is not a string", { id: currentUser.id });
      toast({ title: "Error", description: "User authentication error: Invalid user ID.", variant: "destructive" });
      return;
    }
    console.log("handleUpload - Starting:", {
      file: file.name,
      docName,
      docDescription,
      packageTypes: selectedPackageTypes.map((t) => t.value),
      subcategories: selectedSubcategories.map((s) => s.value),
      userEmail: currentUser.email,
      userId: currentUser.id,
    });
    try {
      await uploadDocument(
        file,
        selectedPackageTypes.map((t) => t.value),
        selectedSubcategories.map((s) => s.value),
        docName,
        docDescription || null,
        currentUser.id
      );
      console.log("handleUpload - Upload completed successfully");
      setUploadOpen(false);
      setFile(null);
      setDocName("");
      setDocDescription("");
      setSelectedPackageTypes([]);
      setSelectedSubcategories([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        console.log("handleUpload - File input reset");
      }
      await refreshData();
    } catch (error: any) {
      console.error("handleUpload - Error:", { message: error.message, code: error.code });
      toast({ title: "Error", description: `Upload failed: ${error.message || "Unknown error"}`, variant: "destructive" });
    }
  };

  const handleDebugUpload = async () => {
    console.log("handleDebugUpload - Debug button clicked");
    toast({ title: "Debug Upload", description: "Attempting debug upload (bypassing disabled state)...", variant: "default" });
    if (!currentUser || !currentUser.id || typeof currentUser.id !== "string") {
      console.log("handleDebugUpload - Failed: Invalid user", { currentUser });
      toast({ title: "Error", description: "Debug upload failed: Invalid user.", variant: "destructive" });
      return;
    }
    console.log("handleDebugUpload - Starting:", {
      file: file ? file.name : null,
      docName,
      docDescription,
      packageTypes: selectedPackageTypes.map((t) => t.value),
      subcategories: selectedSubcategories.map((s) => s.value),
      userEmail: currentUser.email,
      userId: currentUser.id,
    });
    try {
      await uploadDocument(
        file || new File([""], "dummy.pdf", { type: "application/pdf" }),
        selectedPackageTypes.map((t) => t.value) || ["other"],
        selectedSubcategories.map((s) => s.value),
        docName || "Debug Document",
        docDescription || null,
        currentUser.id
      );
      console.log("handleDebugUpload - Upload completed successfully");
      toast({ title: "Success", description: "Debug upload completed.", variant: "default" });
    } catch (error: any) {
      console.error("handleDebugUpload - Error:", { message: error.message, code: error.code });
      toast({ title: "Error", description: `Debug upload failed: ${error.message || "Unknown error"}`, variant: "destructive" });
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

  const handleCreateSubcategory = async () => {
    if (!currentUser) {
      console.log("handleCreateSubcategory - Failed: No current user");
      toast({ title: "Error", description: "Please log in to create subcategories.", variant: "destructive" });
      return;
    }
    if (!newSubcategoryName || !selectedTabPackageType) {
      console.log("handleCreateSubcategory - Failed: Missing subcategory name or package type");
      toast({ title: "Error", description: "Missing subcategory name or package type.", variant: "destructive" });
      return;
    }
    if (!currentUser.id || typeof currentUser.id !== "string") {
      console.log("handleCreateSubcategory - Failed: Invalid user ID", { id: currentUser.id });
      toast({ title: "Error", description: "User authentication error: Invalid user ID.", variant: "destructive" });
      return;
    }
    try {
      const subcategory: Omit<Subcategory, "id"> = {
        name: newSubcategoryName,
        description: newSubcategoryDescription || null,
        packageType: selectedTabPackageType,
        createdBy: currentUser.id,
        createdAt: new Date(),
      };
      console.log("handleCreateSubcategory - Creating:", subcategory);
      const subcategoryId = await documentService.createSubcategory(subcategory);
      console.log("handleCreateSubcategory - Subcategory created:", subcategoryId);
      setSubcategories((prev) => [
        ...prev,
        { id: subcategoryId, ...subcategory },
      ]);
      setNewSubcategoryName("");
      setNewSubcategoryDescription("");
      setSubcategoryModalOpen(false);
      toast({ title: "Success", description: `Created subcategory "${newSubcategoryName}"` });
    } catch (error: any) {
      console.error("handleCreateSubcategory - Error:", { message: error.message, code: error.code });
      if (error.code === "auth/quota-exceeded") {
        toast({ title: "Error", description: "Authentication quota exceeded. Please try again later.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || "Failed to create subcategory", variant: "destructive" });
      }
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string, subcategoryName: string) => {
    if (!currentUser) {
      console.log("handleDeleteSubcategory - Failed: No current user");
      toast({ title: "Error", description: "Please log in to delete subcategories.", variant: "destructive" });
      return;
    }
    if (!currentUser.id || typeof currentUser.id !== "string") {
      console.log("handleDeleteSubcategory - Failed: Invalid user ID", { id: currentUser.id });
      toast({ title: "Error", description: "User authentication error: Invalid user ID.", variant: "destructive" });
      return;
    }
    const subDocs = documents.filter((doc) => doc.subcategory === subcategoryName && doc.type === selectedTabPackageType);
    if (subDocs.length > 0) {
      console.log("handleDeleteSubcategory - Failed: Subcategory contains documents", { subcategoryId, subcategoryName, docCount: subDocs.length });
      toast({ title: "Error", description: `Cannot delete "${subcategoryName}" because it contains ${subDocs.length} document(s).`, variant: "destructive" });
      return;
    }
    try {
      console.log("handleDeleteSubcategory - Deleting:", { subcategoryId, subcategoryName });
      await documentService.deleteSubcategory(subcategoryId);
      console.log("handleDeleteSubcategory - Subcategory deleted:", subcategoryId);
      setSubcategories((prev) => prev.filter((sub) => sub.id !== subcategoryId));
      toast({ title: "Success", description: `Deleted subcategory "${subcategoryName}"` });
    } catch (error: any) {
      console.error("handleDeleteSubcategory - Error:", { message: error.message, code: error.code });
      if (error.code === "auth/quota-exceeded") {
        toast({ title: "Error", description: "Authentication quota exceeded. Please try again later.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: `Failed to delete subcategory "${subcategoryName}": ${error.message || "Unknown error"}`, variant: "destructive" });
      }
    }
  };

  const handleView = async (url: string, name: string) => {
    if (!currentUser) {
      console.log("handleView - Failed: No current user");
      toast({ title: "Error", description: "Please log in to view.", variant: "destructive" });
      return;
    }
    if (!currentUser.id || typeof currentUser.id !== "string") {
      console.log("handleView - Failed: Invalid user ID", { id: currentUser.id });
      toast({ title: "Error", description: "User authentication error: Invalid user ID.", variant: "destructive" });
      return;
    }
    try {
      const path = decodeURIComponent(url.split('/o/')[1]?.split('?')[0] || url);
      console.log("handleView - Fetching URL for:", path);
      const signedUrl = await documentService.getSignedUrl(path);
      console.log("handleView - Signed URL fetched:", signedUrl);
      window.open(signedUrl, "_blank");
    } catch (error: any) {
      console.error("handleView - Error:", { message: error.message, code: error.code });
      if (error.code === "auth/quota-exceeded") {
        toast({ title: "Error", description: "Authentication quota exceeded. Please try again later.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: `Cannot view ${name}: ${error.message || "Permission denied"}`, variant: "destructive" });
      }
    }
  };

  const handleDownload = async (url: string, name: string) => {
    if (!currentUser) {
      console.log("handleDownload - Failed: No current user");
      toast({ title: "Error", description: "Please log in to download.", variant: "destructive" });
      return;
    }
    if (!currentUser.id || typeof currentUser.id !== "string") {
      console.log("handleDownload - Failed: Invalid user ID", { id: currentUser.id });
      toast({ title: "Error", description: "User authentication error: Invalid user ID.", variant: "destructive" });
      return;
    }
    try {
      const path = decodeURIComponent(url.split('/o/')[1]?.split('?')[0] || url);
      console.log("handleDownload - Fetching URL for:", path);
      const signedUrl = await documentService.getSignedUrl(path);
      console.log("handleDownload - Signed URL fetched:", signedUrl);
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Access denied");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      URL.revokeObjectURL(link.href);
      console.log("handleDownload - Download completed:", name);
    } catch (error: any) {
      console.error("handleDownload - Error:", { message: error.message, code: error.code });
      if (error.code === "auth/quota-exceeded") {
        toast({ title: "Error", description: "Authentication quota exceeded. Please try again later.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: `Cannot download ${name}: ${error.message || "Permission denied"}`, variant: "destructive" });
      }
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
        <h1 className="text-2xl font-bold">Document Packages</h1>
        {currentUser && isSuperadmin && (
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={() => {
              console.log("Edit mode toggled:", !isEditMode);
              setIsEditMode(!isEditMode);
            }}
          >
            <Pencil className="w-4 h-4 mr-2" />
            {isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
          </Button>
        )}
      </div>
      {!currentUser && <p className="text-red-500 mb-4">Please log in to access documents.</p>}
      {subcategoriesError && <p className="text-red-500 mb-4">{subcategoriesError}</p>}

      {currentUser && isSuperadmin && isEditMode && (
        <div className="mb-6 flex gap-4 flex-wrap">
          <Button
            variant="destructive"
            onClick={() => handleDeleteSelected()}
            disabled={selectedDocIds.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedDocIds.length})
          </Button>
          <Button
            onClick={() => {
              console.log("Opening subcategory modal");
              setSubcategoryModalOpen(true);
            }}
            disabled={!selectedTabPackageType}
          >
            <Plus className="w-4 h-4 mr-2" /> Create Subcategory
          </Button>
        </div>
      )}

      {isMobile ? (
        <div className="mb-6">
          <Select
            options={PACKAGE_TYPES}
            value={PACKAGE_TYPES.find((pkg) => pkg.value === selectedTabPackageType)}
            onChange={(option) => {
              console.log("Mobile package type changed:", option?.value);
              setSelectedTabPackageType(option?.value || "pnp_franchise");
            }}
            placeholder="Select package type..."
            className="w-full"
            inputId="package-type-mobile"
            aria-labelledby="package-type-mobile-label"
          />
          <p className="text-gray-600 mt-2">{PACKAGE_TYPES.find((pkg) => pkg.value === selectedTabPackageType)?.description}</p>
          {currentUser && isSuperadmin && isEditMode && (
            <div className="mt-4 flex gap-4">
              <Button
                onClick={() => {
                  console.log("Opening upload modal with package type:", selectedTabPackageType);
                  setUploadOpen(true);
                  setSelectedPackageTypes([PACKAGE_TYPES.find((pkg) => pkg.value === selectedTabPackageType)!]);
                }}
                disabled={!currentUser}
              >
                <Upload className="w-4 h-4 mr-2" /> Upload Document
              </Button>
              <Button
                onClick={handleDebugUpload}
                variant="outline"
              >
                Debug Upload
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 mt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              </div>
            ) : (
              subcategories
                .filter((sub) => sub.packageType === selectedTabPackageType)
                .map((sub) => {
                  const subDocs = documents.filter(
                    (doc) => doc.type === selectedTabPackageType && doc.subcategory === sub.name
                  );
                  if (subDocs.length === 0) return null; // Return nothing for empty subcategories
                  return (
                    <div key={sub.id}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{sub.name}</h3>
                        {currentUser && isSuperadmin && isEditMode && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                          >
                            <Trash2 className="w-3 h-3 mr-1 text-red-500" /> Delete
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{sub.description || "No description provided"}</p>
                      {subDocs.map((doc) => (
                        <Card key={doc.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="truncate">{doc.name}</CardTitle>
                              {currentUser && isSuperadmin && isEditMode && (
                                <input
                                  type="checkbox"
                                  checked={selectedDocIds.includes(doc.id)}
                                  onChange={() => handleCheckboxChange(doc.id)}
                                  className="ml-2"
                                />
                              )}
                            </div>
                            <CardDescription>
                              <div className="mb-2">
                                <div className="w-full h-32 flex items-center justify-center border rounded bg-gray-100">
                                  <File className="w-12 h-12 text-gray-400" />
                                </div>
                              </div>
                              {Math.round(doc.size / 1024)} KB | {PACKAGE_TYPES.find((pkg) => pkg.value === doc.type)?.label} | {doc.subcategory || "No subcategory"}
                              <br />
                              {doc.description || "No description provided"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-2">
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!currentUser}
                                onClick={() => handleView(doc.url, doc.name)}
                              >
                                <Eye className="w-3 h-3 mr-1" /> View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!currentUser}
                                onClick={() => handleDownload(doc.url, doc.name)}
                              >
                                <Download className="w-3 h-3 mr-1" /> Download
                              </Button>
                              {currentUser && isSuperadmin && isEditMode && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500"
                                  onClick={() => handleDeleteSelected([doc])}
                                >
                                  <Trash2 className="w-3 h-3 mr-1 text-red-500" /> Delete
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                })
            )}
            {!loading && subcategories.length === 0 && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <Tabs
          defaultValue="pnp_franchise"
          className="w-full"
          onValueChange={(value) => {
            console.log("Tab package type changed:", value);
            setSelectedTabPackageType(value as Document["type"]);
          }}
        >
          <TabsList className="grid w-full grid-cols-7">
            {PACKAGE_TYPES.map((pkg) => (
              <TabsTrigger key={pkg.value} value={pkg.value}>
                {pkg.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {PACKAGE_TYPES.map((pkg) => (
            <TabsContent key={pkg.value} value={pkg.value} className="mt-6">
              <p className="text-gray-600 mb-4">{pkg.description}</p>
              {currentUser && isSuperadmin && isEditMode && (
                <div className="mb-8 flex gap-4">
                  <Button
                    onClick={() => {
                      console.log("Opening upload modal with package type:", pkg.value);
                      setUploadOpen(true);
                      setSelectedPackageTypes([pkg]);
                    }}
                    disabled={!currentUser}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Upload Document
                  </Button>
                  <Button
                    onClick={handleDebugUpload}
                    variant="outline"
                  >
                    Debug Upload
                  </Button>
                </div>
              )}
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                </div>
              ) : (
                subcategories
                  .filter((sub) => sub.packageType === pkg.value)
                  .map((sub) => {
                    const subDocs = documents.filter(
                      (doc) => doc.type === pkg.value && doc.subcategory === sub.name
                    );
                    if (subDocs.length === 0) return null; // Return nothing for empty subcategories
                    return (
                      <div key={sub.id}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{sub.name}</h3>
                          {currentUser && isSuperadmin && isEditMode && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500"
                              onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                            >
                              <Trash2 className="w-3 h-3 mr-1 text-red-500" /> Delete
                            </Button>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{sub.description || "No description provided"}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {subDocs.map((doc) => (
                            <Card key={doc.id}>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="truncate">{doc.name}</CardTitle>
                                  {currentUser && isSuperadmin && isEditMode && (
                                    <input
                                      type="checkbox"
                                      checked={selectedDocIds.includes(doc.id)}
                                      onChange={() => handleCheckboxChange(doc.id)}
                                      className="ml-2"
                                    />
                                  )}
                                </div>
                                <CardDescription>
                                  <div className="mb-2">
                                    <div className="w-full h-32 flex items-center justify-center border rounded bg-gray-100">
                                      <File className="w-12 h-12 text-gray-400" />
                                    </div>
                                  </div>
                                  {Math.round(doc.size / 1024)} KB | {pkg.label} | {doc.subcategory || "No subcategory"}
                                  <br />
                                  {doc.description || "No description provided"}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="flex flex-col gap-2">
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!currentUser}
                                    onClick={() => handleView(doc.url, doc.name)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" /> View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!currentUser}
                                    onClick={() => handleDownload(doc.url, doc.name)}
                                  >
                                    <Download className="w-3 h-3 mr-1" /> Download
                                  </Button>
                                  {currentUser && isSuperadmin && isEditMode && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-500"
                                      onClick={() => handleDeleteSelected([doc])}
                                    >
                                      <Trash2 className="w-3 h-3 mr-1 text-red-500" /> Delete
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
              {!loading && subcategories.length === 0 && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Dialog open={uploadOpen} onOpenChange={(open) => {
        console.log("Upload dialog open changed:", open);
        setUploadOpen(open);
        if (!open) {
          setFile(null);
          setDocName("");
          setDocDescription("");
          setSelectedPackageTypes([]);
          setSelectedSubcategories([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
            console.log("File input reset");
          }
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a new document by providing the required details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <div className="grid gap-2">
              <Label id="subcategories-label">Subcategories (Optional)</Label>
              <Select
                isMulti
                options={subcategoryOptions}
                value={selectedSubcategories}
                onChange={(options) => {
                  setSelectedSubcategories(options as { value: string; label: string }[]);
                  console.log("Subcategories updated:", options);
                }}
                placeholder="Select subcategories..."
                inputId="subcategories"
                aria-labelledby="subcategories-label"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc-file" id="doc-file-label">File (JPG, PNG, PDF, MP4)</Label>
              <Input
                id="doc-file"
                type="file"
                accept="image/jpeg,image/png,application/pdf,video/mp4"
                ref={fileInputRef}
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null;
                  console.log("File input changed:", selectedFile ? selectedFile.name : "No file selected");
                  setFile(selectedFile);
                }}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                console.log("Upload button clicked");
                toast({ title: "Attempting upload", description: "Processing your upload request...", variant: "default" });
                handleUpload();
              }}
              disabled={isUploadDisabled}
              className={`px-4 py-2 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed ${isUploadDisabled ? "opacity-50" : ""}`}
            >
              Upload
            </button>
            <button
              onClick={handleDebugUpload}
              className="px-4 py-2 rounded-md font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
            >
              Debug Upload
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={subcategoryModalOpen} onOpenChange={(open) => {
        console.log("Subcategory dialog open changed:", open);
        setSubcategoryModalOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Subcategory</DialogTitle>
            <DialogDescription>Create a new subcategory for organizing documents.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subcategory-name" id="subcategory-name-label">Subcategory Name</Label>
              <Input
                id="subcategory-name"
                value={newSubcategoryName}
                onChange={(e) => {
                  setNewSubcategoryName(e.target.value);
                  console.log("Subcategory name updated:", e.target.value);
                }}
                placeholder="Enter subcategory name (e.g., Videos, Staff Docs)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subcategory-description" id="subcategory-description-label">Description (Optional)</Label>
              <Textarea
                id="subcategory-description"
                value={newSubcategoryDescription}
                onChange={(e) => {
                  setNewSubcategoryDescription(e.target.value);
                  console.log("Subcategory description updated:", e.target.value);
                }}
                placeholder="Enter subcategory description"
                maxLength={500}
              />
            </div>
            <div className="grid gap-2">
              <Label id="package-type-label">Package Type</Label>
              <Select
                options={PACKAGE_TYPES}
                value={PACKAGE_TYPES.find((pkg) => pkg.value === selectedTabPackageType)}
                onChange={(option) => {
                  console.log("Subcategory package type changed:", option?.value);
                  setSelectedTabPackageType(option?.value || "pnp_franchise");
                }}
                placeholder="Select package type..."
                inputId="package-type"
                aria-labelledby="package-type-label"
              />
            </div>
          </div>
          <Button
            onClick={() => {
              console.log("Create subcategory button clicked");
              handleCreateSubcategory();
            }}
            disabled={!newSubcategoryName || !selectedTabPackageType}
          >
            Create
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
