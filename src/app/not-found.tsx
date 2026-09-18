import Link from "next/link";
import { Button } from "@/components/ui/button";
import { T } from "@/components/t";

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-7xl font-bold tracking-tight">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">
        <T k="notFound.title" />
      </h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        <T k="notFound.desc" />
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/">
          <Button>
            <T k="notFound.home" />
          </Button>
        </Link>
        <Link href="/threads">
          <Button variant="outline">
            <T k="home.browseThreads" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
