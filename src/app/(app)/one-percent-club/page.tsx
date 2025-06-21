import { OnePercentClubClient } from "@/components/pages/OnePercentClubClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import Image from "next/image";

const topFreelancers = [
  { name: 'Aria Montgomery', skill: 'Lead UI/UX Designer', avatar: 'https://placehold.co/100x100.png', hint: 'woman portrait' },
  { name: 'Ken Adams', skill: 'Senior Go Developer', avatar: 'https://placehold.co/100x100.png', hint: 'man portrait' },
  { name: 'Lia Sharma', skill: 'Cloud Architect (AWS)', avatar: 'https://placehold.co/100x100.png', hint: 'woman smiling' },
  { name: 'David Chen', skill: 'Data Scientist', avatar: 'https://placehold.co/100x100.png', hint: 'man glasses' },
];

export default function OnePercentClubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <Award className="w-8 h-8 text-accent" />
          The 1% Club
        </h1>
        <p className="text-muted-foreground">
          An exclusive hub for the top-tier talent on Localance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
             <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                    <h2 className="font-headline text-3xl font-bold">Join the Elite</h2>
                    <p className="mt-2 text-primary-foreground/80">
                        The 1% Club is reserved for freelancers who demonstrate exceptional skill, professionalism, and reliability. Pass our AI-powered assessment to unlock higher-paying projects, priority support, and a badge that makes you stand out.
                    </p>
                </div>
                 <Award className="w-24 h-24 text-accent drop-shadow-lg shrink-0"/>
             </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="font-headline">Meet the Members</CardTitle>
              <CardDescription>
                A glimpse of the incredible talent within the 1% Club.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topFreelancers.map((freelancer) => (
                <div key={freelancer.name} className="text-center space-y-2">
                  <Avatar className="h-24 w-24 mx-auto border-4 border-accent">
                    <AvatarImage src={freelancer.avatar} data-ai-hint={freelancer.hint}/>
                    <AvatarFallback>{freelancer.name.substring(0,2)}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold">{freelancer.name}</p>
                  <p className="text-xs text-muted-foreground">{freelancer.skill}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
            <OnePercentClubClient />
        </div>
      </div>
    </div>
  );
}
