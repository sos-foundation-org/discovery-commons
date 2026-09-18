import { TermsBody } from "./terms-body";

export const metadata = {
  title: "Terms of Service — Discovery Commons",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
      <TermsBody />
    </div>
  );
}
