import { ClaBody } from "./cla-body";

export const metadata = {
  title: "Contributor License — Map of the Unknown",
};

export default function ContributorLicensePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
      <ClaBody />
    </div>
  );
}
