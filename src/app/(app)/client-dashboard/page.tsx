import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostTaskDialog } from "@/components/pages/PostTaskDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, Users, Star, MessageSquare } from "lucide-react";

export default function ClientDashboardPage() {
  const stats = [
    {
      title: "Posted Tasks",
      value: "3",
      icon: <Briefcase className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Available Freelancers",
      value: "87",
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Proposals Received",
      value: "15",
      icon: <Star className="h-6 w-6 text-muted-foreground" />,
    },
     {
      title: "New Messages",
      value: "3",
      icon: <MessageSquare className="h-6 w-6 text-muted-foreground" />,
    },
  ];

  const postedTasks = [
    { id: 1, title: 'Design a new logo for my coffee shop', category: 'Design', budget: 300, proposals: 5 },
    { id: 2, title: 'Build a simple landing page with React', category: 'Web Development', budget: 800, proposals: 2 },
    { id: 4, title: 'Photoshoot for a new clothing line', category: 'Photography', budget: 500, proposals: 8 },
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
              {postedTasks.map((task) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}