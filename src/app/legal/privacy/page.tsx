import { PrivacyBody } from "./privacy-body";

export const metadata = {
  title: "Privacy Policy — Discovery Commons",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
      <PrivacyBody />
    </div>
  );
}
