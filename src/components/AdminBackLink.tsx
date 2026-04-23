import Link from "next/link";

/**
 * Persistent "← Admin hub" link that sits at the top of every admin
 * sub-page. Tiny but makes the admin navigable without having to edit
 * the URL bar.
 */
export default function AdminBackLink() {
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-1 text-sm text-brand-gray-500 hover:text-brand-red mb-4"
    >
      ← Admin hub
    </Link>
  );
}
