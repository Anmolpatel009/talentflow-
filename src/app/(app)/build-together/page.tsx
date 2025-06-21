import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

const ideas = [
  {
    title: "AI-Powered Recipe Generator",
    description: "An app that creates recipes based on ingredients you have at home. Looking for a React Native dev and a UI/UX designer.",
    skills: ["React Native", "UI/UX", "Firebase", "AI/ML"],
    postedBy: "Elena Voyage"
  },
  {
    title: "Community Garden Exchange Platform",
    description: "A web platform for local gardeners to trade produce and seeds. Need a full-stack dev with Node.js experience.",
    skills: ["Node.js", "React", "PostgreSQL", "Mapping API"],
    postedBy: "Sam Greenfield"
  },
  {
    title: "AR History Tour App",
    description: "An augmented reality mobile app that shows historical photos overlaid on current city locations. Seeking AR experts and 3D modelers.",
    skills: ["ARKit/ARCore", "Unity", "3D Modeling", "History Buff"],
    postedBy: "Marcus Time"
  },
  {
    title: "Sustainable Fashion Marketplace",
    description: "An e-commerce site for upcycled and sustainable clothing. Need help with backend (Django) and marketing.",
    skills: ["Django", "Marketing", "E-commerce", "Stripe"],
    postedBy: "Chloe Verde"
  },
];

export default function BuildTogetherPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Build Together</h1>
          <p className="text-muted-foreground">Find co-founders and collaborators for your next big idea.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Post an Idea
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ideas.map((idea) => (
          <Card key={idea.title} className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline">{idea.title}</CardTitle>
              <CardDescription>{idea.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm font-medium mb-2">Skills Needed:</p>
              <div className="flex flex-wrap gap-2">
                {idea.skills.map(skill => (
                  <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Posted by {idea.postedBy}</p>
              <Button variant="secondary">Join Project</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
