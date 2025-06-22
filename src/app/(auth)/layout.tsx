import { Logo } from "@/components/logo";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="p-8 flex flex-col justify-center">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <Logo />
          </div>
          {children}
        </div>
      </div>
      <div className="hidden lg:block relative">
        <Image
          src="https://placehold.co/1080x1920.png"
          alt="People working on laptops in a modern office"
          fill
          className="object-cover"
          data-ai-hint="collaboration business team"
        />
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
    </div>
  );
}
