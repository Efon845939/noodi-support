import Link from "next/link";
import { Siren } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
            <Link href="/" className="flex items-center space-x-2 text-foreground">
                <Siren className="h-8 w-8 text-primary" />
                <span className="font-bold font-headline text-2xl">
                Noodi Support
                </span>
            </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
