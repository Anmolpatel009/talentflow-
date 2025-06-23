import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Star, DollarSign, MessageSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllTasks, type TaskWithUser } from "@/lib/tasks";
import Link from "next/link";

export default async function FreelancerDashboardPage() {
  // In a real app, these values would be fetched from the database
  // based on the logged-in freelancer's activity.
  const activeProjects = 0;
  const proposalsSent = 0;
  const totalEarnings = 0;
  const newMessages = 0;

  const stats = [
    {
      title: "Active Projects",
      value: activeProjects.toString(),
      icon: <Briefcase className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Proposals Sent",
      value: proposalsSent.toString(),
      icon: <Star className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Total Earnings",
      value: `$${totalEarnings.toFixed(2)}`,
      icon: <DollarSign className="h-6 w-6 text-muted-foreground" />,
    },
     {
      title: "New Messages",
      value: newMessages.toString(),
      icon: <MessageSquare className="h-6 w-6 text-muted-foreground" />,
    },
  ];

  const recentTasks: TaskWithUser[] = await getAllTasks();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Freelancer Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, let's find your next opportunity.</p>
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
          <CardTitle className="font-headline">Recommended Tasks For You</CardTitle>
          <CardDescription>
            Browse tasks that match your skills and location.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Budget ($)</TableHead>
                <TableHead>Posted By</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{task.category}</Badge>
                    </TableCell>
                    <TableCell>{task.budget.toFixed(2)}</TableCell>
                    <TableCell>{task.clientName}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tasks/${task.id}`}>View & Apply</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No tasks have been posted yet. Check back soon!
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
