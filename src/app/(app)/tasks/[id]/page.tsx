import { getTaskById } from "@/lib/tasks";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Briefcase, Star, FileText } from "lucide-react";
import { getSession } from "@/lib/session";
import { ApplyButton } from "./ApplyButton";

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
    const task = await getTaskById(params.id);
    const session = await getSession();

    if (!task) {
        notFound();
    }

    const isClientOwner = session?.email === task.clientId;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">{task.category}</Badge>
                    <CardTitle className="font-headline text-3xl">{task.title}</CardTitle>
                    <CardDescription>Posted by {task.clientName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                           <DollarSign className="w-5 h-5 text-primary" />
                           <div>
                                <p className="text-muted-foreground">Budget</p>
                                <p className="font-bold text-lg">${task.budget.toFixed(2)}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Briefcase className="w-5 h-5 text-primary" />
                           <div>
                                <p className="text-muted-foreground">Proposals</p>
                                <p className="font-bold text-lg">{task.proposals}</p>
                           </div>
                        </div>
                         <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Star className="w-5 h-5 text-primary" />
                           <div>
                                <p className="text-muted-foreground">Experience</p>
                                <p className="font-bold text-lg">Any</p>
                           </div>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><FileText className="w-5 h-5" /> Task Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    {session?.role === 'freelancer' && !isClientOwner && (
                       <ApplyButton taskId={task.id} />
                    )}
                     {isClientOwner && (
                        <p className="text-sm text-muted-foreground">You are the owner of this task.</p>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
