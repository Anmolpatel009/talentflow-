import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, UserCheck, Search } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold">Welcome to NearTask</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Please choose your path to get started.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="transform hover:scale-105 transition-transform duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline text-2xl">
              <Search className="w-8 h-8 text-primary" />
              I'm looking for talent
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <p className="text-muted-foreground mb-6 flex-grow">
              Post projects, browse portfolios, and hire the best local freelancers for your needs.
            </p>
            <Button asChild className="w-full">
              <Link href="/client-dashboard">
                Go to Client Dashboard <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="transform hover:scale-105 transition-transform duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline text-2xl">
              <UserCheck className="w-8 h-8 text-primary" />
              I'm looking for work
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <p className="text-muted-foreground mb-6 flex-grow">
              Find local jobs, showcase your skills, and connect with clients in your community.
            </p>
            <Button asChild className="w-full">
              <Link href="/freelancer-dashboard">
                Go to Freelancer Dashboard <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
