import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MapPin, Sparkles, Users, Award } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import Image from "next/image";

export default function Home() {
  const features = [
    {
      icon: <MapPin className="w-8 h-8 text-primary" />,
      title: "Location-Based Matching",
      description: "Find tasks and freelancers right in your neighborhood. Get work done faster with local professionals.",
    },
    {
      icon: <Briefcase className="w-8 h-8 text-primary" />,
      title: "Instant Notifications",
      description: "Get real-time alerts for new jobs posted nearby. Be the first to accept and start working.",
    },
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      title: "The 1% Club",
      description: "An exclusive circle of top-tier freelancers, vetted for their exceptional skills and reliability.",
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Build Together",
      description: "Collaborate on exciting startup ideas with other talented freelancers on the platform.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Sign Up</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        <section className="relative text-center py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://placehold.co/1920x1080.png"
              alt="A vibrant and collaborative workspace"
              fill
              className="object-cover"
              data-ai-hint="collaboration business"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <Sparkles className="mx-auto h-12 w-12 text-accent" />
            <h1 className="font-headline text-4xl md:text-6xl font-bold mt-4">
              Your Local Freelance Marketplace
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Connect with skilled freelancers in your area. Post a task and get it done today.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/client-dashboard">Find Talent</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/freelancer-dashboard">Find Work</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 lg:py-24 bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold">Why NearTask?</h2>
              <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
                All the tools you need to hire or get hired, locally.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 font-headline text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="font-headline text-3xl font-bold">Ready to Get Started?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join a growing community of task seekers and talented freelancers. Your next opportunity is just around the corner.
              </p>
              <div className="mt-8">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                  <Link href="/dashboard">Join NearTask Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 bg-card border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NearTask. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
