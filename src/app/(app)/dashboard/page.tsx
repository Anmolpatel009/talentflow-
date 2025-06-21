import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Briefcase, Users, Star } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  const stats = [
    {
      title: "Nearby Tasks",
      value: "12",
      icon: <Briefcase className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Available Freelancers",
      value: "87",
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Active Bids",
      value: "4",
      icon: <Star className="h-6 w-6 text-muted-foreground" />,
    },
     {
      title: "New Messages",
      value: "3",
      icon: <MapPin className="h-6 w-6 text-muted-foreground" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, here's your local activity overview.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Local Area Map</CardTitle>
          <CardDescription>
            See tasks and freelancers available in your vicinity.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
             <Image 
                src="https://placehold.co/1200x600.png"
                alt="Local Area Map"
                width={1200}
                height={600}
                className="w-full h-full object-cover"
                data-ai-hint="world map"
             />
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
