import fs from "fs"
import path from "path"
import DocumentsList from "@/components/documents-list"

export default async function DocumentsPage() {
  // Read files from /public/documents
  const documentsDir = path.join(process.cwd(), "public", "documents")
  const files = fs.readdirSync(documentsDir)

  const documents = files.map((file) => {
    const stats = fs.statSync(path.join(documentsDir, file))
    return {
      name: file,
      size: stats.size,
    }
  })

  return (
    <div className="space-y-6 w-full">
      <h2 className="text-xl font-semibold text-gray-900">Public Documents</h2>
      <DocumentsList documents={documents} />
    </div>
  )
}
