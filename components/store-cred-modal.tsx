"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Copy, Upload, CheckCircle2Icon } from "lucide-react";
import { Store, User } from "@/lib/firebase/types";
import { toast } from "react-hot-toast";

interface StoreCredModalprops {
  store: Store | null;
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
}

export function StoreCredModal({
  store,
  isOpen,
  onClose,
}: StoreCredModalprops) {


  const handleCopyCredentials = () => {
    if (!store || !store.credentials?.[0]) return;
    const cred = store.credentials[0];
    const credentialsMessage = `Login to admin.stillgood.co.za
***Admin/Management/Owner ONLY***\n
BagAdminUsername: ${store.credentials[0].username ?? "UNDEFINED"}
BagAdminPassword: ${store.credentials[0].password ?? "UNDEFINED"}
\n
Load Bags
BagAdminUsername: ${cred.bagusername}
BagAdminPassword: ${cred.bagpassword}
\n
Check Orders
OrderUsername: ${cred.orderusername}
OrderPassword: ${cred.orderpassword}`;
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
        <DialogTitle>
          {store.tradingName} - Credentials
        </DialogTitle>
        <div className="space-y-6">

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

***Admin/Management/Owner ONLY***\n
BagAdminUsername: ${store.credentials[0].username ?? "UNDEFINED"}
BagAdminPassword: ${store.credentials[0].password ?? "UNDEFINED"}

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


              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
