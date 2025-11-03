"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Copy, Upload, CheckCircle2Icon } from "lucide-react";
import { Store, User } from "@/lib/firebase/types";
import { toast } from "react-hot-toast";

interface StoreDetailsModalProps {
  store: Store | null;
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onToggleSetup: (storeId: string) => Promise<void>;
  onSetupConfirmation: (storeId: string) => Promise<void>;
  updateCredentials: (storeId: string, credentials: Store['credentials']) => Promise<void>;
  mode: "share" | "confirmSetup";
}

export function StoreDetailModal({
  store,
  isOpen,
  onClose,
  currentUser,
  onSetupConfirmation,
  updateCredentials,
  mode,
}: StoreDetailsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    orderusername: "",
    orderpassword: "",
    bagusername: "",
    bagpassword: "",
  });
  const isSuperadmin = currentUser?.role === "superadmin";
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    console.log("Store creds:", store?.credentials);
    if (isSuperadmin && store?.credentials?.[0]) {
      const cred = store.credentials[0];
      setCredentials({
        username: cred.username || "",
        password: cred.password || "",
        bagusername: cred.bagusername || "",
        bagpassword: cred.bagpassword || "",
        orderusername: cred.orderusername || "",
        orderpassword: cred.orderpassword || "",
      });
    }
  }, [isSuperadmin, store]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const validateCredentials = () => {
    return (
      credentials.bagusername &&
      credentials.bagpassword &&
      credentials.orderusername &&
      credentials.orderpassword
    );
  };

  const handleUploadCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !isSuperadmin) return;

    if (!validateCredentials()) {
      toast.error("All credential fields are required", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
      return;
    }

    try {
      setIsUploading(true);
      const newCredentials = [
        ...(store.credentials?.slice(1) || []), // Keep all but the first entry
        {
          ...credentials,
          createdAt: new Date(),
        },
      ];
      await updateCredentials(store.id, newCredentials);
      toast.success("Credentials updated successfully", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
      if (mode === "confirmSetup" && !store.setupConfirmed) {
        await onSetupConfirmation(store.id);
        toast.success("Setup confirmed", {
          style: {
            background: "#fff",
            color: "#111827",
            border: "1px solid #f97316",
          },
        });
      }
      onClose();
    } catch (error) {
      toast.error("Failed to update credentials", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmSetup = async () => {
    if (!store) return;
    try {
      await onSetupConfirmation(store.id);
      toast.success("Setup confirmed", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
      onClose();
    } catch (error) {
      toast.error("Failed to confirm setup", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
    }
  };

  const handleCopyCredentials = () => {
    if (!store || !store.credentials?.[0]) return;
    const cred = store.credentials[0];
    const credentialsMessage =
      `Login to admin.stillgood.co.za\n\n
    Load Bags\n
    BagAdminUsername: ${cred.bagusername}\nBagAdminPassword: ${cred.bagpassword}\n
    Check Orders\n
    OrderUsername: ${cred.orderusername}\nOrderPassword: ${cred.orderpassword}`;
    navigator.clipboard.writeText(credentialsMessage);
    toast.success("Credentials copied to clipboard", {
      style: {
        background: "#fff",
        color: "#111827",
        border: "1px solid #f97316",
      },
    });
  };

  if (!isOpen || !store) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            {mode === "share" ? `${store.tradingName} Credentials` : `Confirm ${store.tradingName} Setup`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          
            <>
              {isSuperadmin && !store.credentials?.[0] && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Upload Credentials</h3>
                  <form onSubmit={handleUploadCredentials} className="space-y-4">
                    <Input
                      type="text"
                      name="username"
                      placeholder="Superadmin Username"
                      value={credentials.username}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                    <Input
                      type="text"
                      name="password"
                      placeholder="Superadmin Password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                    <Input
                      type="text"
                      name="bagusername"
                      placeholder="Bag Admin Username"
                      value={credentials.bagusername}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                    <Input
                      type="text"
                      name="bagpassword"
                      placeholder="Bag Admin Password"
                      value={credentials.bagpassword}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                    <Input
                      type="text"
                      name="orderusername"
                      placeholder="Order Username"
                      value={credentials.orderusername}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                    <Input
                      type="text"
                      name="orderpassword"
                      placeholder="Order Password"
                      value={credentials.orderpassword}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                    <Button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2"
                      disabled={isUploading}
                    >
                      <Upload size={16} />
                      {mode === "confirmSetup" && !store.setupConfirmed
                        ? "Upload Credentials & Confirm Setup"
                        : "Upload Credentials"}
                    </Button>
                  </form>
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium mb-2">Store Credentials</h3>
                {!store.credentials?.[0] ? (
                  <p className="text-red-500 text-sm">
                    No credentials available for this store.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <pre className="bg-gray-100 p-4 rounded-md text-sm whitespace-pre-wrap">
                      {`Login to admin.stillgood.co.za\n

*** For Owner/Manager ONLY***
AdminUsername: ${store.credentials[0].username ?? "UNDEFINED"}
AdminPassword: ${store.credentials[0].password ?? "UNDEFINED"}
*** *** *** *** *** \n

Load Bags\n
BagAdminUsername: ${store.credentials[0].bagusername ?? "UNDEFINED"}
BagAdminPassword: ${store.credentials[0].bagpassword ?? "UNDEFINED"}

Check Orders\n
OrderUsername: ${store.credentials[0].orderusername ?? "UNDEFINED"}
OrderPassword: ${store.credentials[0].orderpassword ?? "UNDEFINED"}`}
                    </pre>
                    <Button
                      onClick={handleCopyCredentials}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Copy size={16} />
                      Copy Credentials
                    </Button>
                    {mode === "confirmSetup" && isSuperadmin && !store.setupConfirmed && (
                      <Button
                        onClick={handleConfirmSetup}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <CheckCircle2Icon size={16} />
                        Confirm Setup
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
