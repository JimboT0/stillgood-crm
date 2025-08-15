"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"

export default function DocumentsList({ documents }: { documents: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <Card key={doc.name}>
          <CardHeader>
            <CardTitle className="truncate">{doc.name}</CardTitle>
            <CardDescription>{Math.round(doc.size / 1024)} KB</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
