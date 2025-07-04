import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getFreelancers } from "@/lib/users";
import { MapPin, MessageSquare } from "lucide-react";
import { FreelancerMap } from "@/components/pages/FreelancerMap";

export default async function FindFreelancersPage() {
  const freelancers = await getFreelancers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Find Freelancers Nearby</h1>
        <p className="text-muted-foreground">Discover talented professionals in your local area.</p>
      </div>

      <Card>
        <CardContent className="p-0 h-[400px] md:h-[500px]">
          <FreelancerMap freelancers={freelancers} />
        </CardContent>
      </Card>

      {freelancers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {freelancers.map((freelancer) => (
            <Card key={freelancer.id} className="flex flex-col text-center">
              <CardHeader className="items-center">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage src={freelancer.avatar} data-ai-hint={freelancer.hint} />
                  <AvatarFallback>{freelancer.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline pt-2">{freelancer.name}</CardTitle>
                <CardDescription>{freelancer.skill}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{freelancer.location} ({freelancer.distance} away)</span>
                </div>
                 <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {freelancer.skills.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button className="flex-1">View Profile</Button>
                <Button variant="outline" size="icon" aria-label="Message Freelancer">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No freelancers have registered yet. Be the first!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
