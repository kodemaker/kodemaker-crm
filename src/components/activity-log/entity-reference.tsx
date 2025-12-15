type EntityReferenceProps = {
  contact?: { id: number; firstName: string | null; lastName: string | null } | null;
  company?: { id: number; name: string } | null;
  contactEndDate?: string | null;
  entityLinks?: boolean;
};

function formatEntityReference(
  contact: EntityReferenceProps["contact"],
  company: EntityReferenceProps["company"]
): string {
  const parts: string[] = [];
  if (contact) {
    const name = `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim();
    parts.push(name || `Contact[${contact.id}]`);
  }
  if (company) {
    parts.push(company.name);
  }
  return parts.join(" / ");
}

export function EntityReference({
  contact,
  company,
  contactEndDate,
  entityLinks = false,
}: EntityReferenceProps) {
  if (!contact && !company) {
    return null;
  }

  // Only show "(sluttet)" when both contact and company exist
  const hasSluttet = contact && company && contactEndDate !== null && contactEndDate !== undefined;

  if (entityLinks) {
    const parts: React.ReactNode[] = [];
    if (contact) {
      parts.push(
        <a
          key="contact"
          className="underline"
          href={`/contacts/${contact.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          {(contact.firstName ?? "") + " " + (contact.lastName ?? "")}
        </a>
      );
    }
    if (contact && company) {
      parts.push(" / ");
    }
    if (company) {
      parts.push(
        <a
          key="company"
          className="underline"
          href={`/customers/${company.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          {company.name}
        </a>
      );
    }
    return (
      <span>
        · Om: {parts}
        {hasSluttet && " (sluttet)"}
      </span>
    );
  }

  const entityRef = formatEntityReference(contact, company);
  if (!entityRef) {
    return null;
  }

  return (
    <>
      · Om: {entityRef}
      {hasSluttet && " (sluttet)"}
    </>
  );
}
