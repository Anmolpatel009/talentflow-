import { getTaskById, getProposalsForTask } from "@/lib/tasks";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function TaskProposalsPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    const task = await getTaskById(params.id);
    if (!task) {
        notFound();
    }

    // Security check: only the task owner can see this page
    if (task.clientUid !== session.uid) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold">Permission Denied</h1>
                <p className="text-muted-foreground">You are not authorized to view this page.</p>
                <Button asChild className="mt-4">
                    <Link href="/client-dashboard">Return to Dashboard</Link>
                </Button>
            </div>
        );
    }
    
    const applicants = await getProposalsForTask(params.id);

    return (
        <div className="space-y-8">
            <div>
                <p className="text-sm text-muted-foreground">Proposals for</p>
                <h1 className="text-3xl font-headline font-bold">{task.title}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Applicants ({applicants.length})</CardTitle>
                    <CardDescription>
                        Review the freelancers who have applied for this task.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {applicants.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {applicants.map((freelancer) => (
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
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No proposals have been received for this task yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
