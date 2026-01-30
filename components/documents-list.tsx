"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import documentsData from "@/lib/data/documents.json";

interface DocumentLink {
  name: string;
  description?: string;
  url: string;
}

interface DocumentCategory {
  label: string;
  description: string;
  links: DocumentLink[];
}

interface DocumentsData {
  [key: string]: DocumentCategory;
}

export default function DocumentsList() {
  const data = documentsData as DocumentsData;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Document Links</h1>
        <p className="text-sm text-gray-500">Edit /lib/data/documents.json to modify links</p>
      </div>

      <div className="space-y-6">
        {Object.entries(data).map(([key, category]) => (
          <div key={key} className="border rounded-lg">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">{category.label}</h2>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
            
            <div className="p-4">
              {category.links.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No links added yet</p>
              ) : (
                <div className="grid gap-3">
                  {category.links.map((link, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{link.name}</h4>
                        {link.description && (
                          <p className="text-sm text-gray-600 truncate">{link.description}</p>
                        )}
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                        >
                          {link.url}
                        </a>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}