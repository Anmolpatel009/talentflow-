import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostTaskDialog } from "@/components/pages/PostTaskDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, Users, Star, MessageSquare } from "lucide-react";
import { getSession } from "@/lib/session";
import { getTasksForClient, type Task } from "@/lib/tasks";

export default async function ClientDashboardPage() {
  const user = await getSession();
  const postedTasks: Task[] = user ? await getTasksForClient(user.email) : [];
  
  const proposalsReceived = postedTasks.reduce((acc, task) => acc + task.proposals, 0);

  const stats = [
    {
      title: "Posted Tasks",
      value: postedTasks.length.toString(),
      icon: <Briefcase className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Available Freelancers",
      value: "87", // This is a platform-wide stat
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Proposals Received",
      value: proposalsReceived.toString(),
      icon: <Star className="h-6 w-6 text-muted-foreground" />,
    },
     {
      title: "New Messages",
      value: "0",
      icon: <MessageSquare className="h-6 w-6 text-muted-foreground" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Client Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, here's an overview of your projects.</p>
        </div>
        <PostTaskDialog />
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
          <CardTitle className="font-headline">Your Posted Tasks</CardTitle>
          <CardDescription>
            Manage your active tasks and review proposals.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Budget ($)</TableHead>
                <TableHead className="text-center">Proposals</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postedTasks.length > 0 ? (
                postedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{task.category}</Badge>
                  </TableCell>
                  <TableCell>{task.budget.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{task.proposals}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Manage Task</Button>
                  </TableCell>
                </TableRow>
              ))) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    You haven't posted any tasks yet. Get started by posting a new task.
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
