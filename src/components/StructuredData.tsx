// ============================================================================
// StructuredData - Reusable JSON-LD component for SEO structured data
// Usage: <StructuredData data={jsonLdObject} />
// ============================================================================

interface StructuredDataProps {
  data: Record<string, unknown>;
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
