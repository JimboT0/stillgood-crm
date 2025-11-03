import type React from "react"
import { TableCell } from "@/components/ui/table"
import { Phone, Mail, User } from "lucide-react"

interface ContactPerson {
  name?: string
  phone?: string
  email?: string
  designation?: string
  isPrimary?: boolean
}

interface ContactsCellProps {
  contactPersons: ContactPerson[]
  className?: string
}

export const ContactsCell: React.FC<ContactsCellProps> = ({ contactPersons, className = "" }) => {
  const primaryContact = contactPersons?.find((contact) => contact.isPrimary) || contactPersons?.[0]

  if (!primaryContact) {
    return (
      <TableCell className={className}>
        <div className="text-xs text-muted-foreground">No contact</div>
      </TableCell>
    )
  }

  const truncateText = (text: string, maxLength: number) =>
    text.length > maxLength ? `${text.slice(0, maxLength)}…` : text

  return (
    <TableCell className={className}>
      <div className="space-y-1">
        {primaryContact.name && (
          <div className="flex items-center gap-1 text-xs">
            <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span title={primaryContact.name}>{truncateText(primaryContact.name, 15)}</span>
          </div>
        )}
        {primaryContact.phone && (
          <div className="flex items-center gap-1 text-xs">
            <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span title={primaryContact.phone}>{truncateText(primaryContact.phone, 15)}</span>
          </div>
        )}
        {primaryContact.email && (
          <div className="flex items-center gap-1 text-xs">
            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span title={primaryContact.email}>{truncateText(primaryContact.email, 20)}</span>
          </div>
        )}
      </div>
    </TableCell>
  )
}
