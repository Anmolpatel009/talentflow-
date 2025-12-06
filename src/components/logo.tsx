
import { Code } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Code className="h-7 w-7 text-primary" />
      <span className="font-headline text-2xl font-bold">Your Name</span>
    </Link>
  );
}

    