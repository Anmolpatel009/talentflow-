import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Star, DollarSign, MessageSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FreelancerDashboardPage() {
  const stats = [
    {
      title: "Active Projects",
      value: "0",
      icon: <Briefcase className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Proposals Sent",
      value: "0",
      icon: <Star className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Total Earnings",
      value: "$0",
      icon: <DollarSign className="h-6 w-6 text-muted-foreground" />,
    },
     {
      title: "New Messages",
      value: "0",
      icon: <MessageSquare className="h-6 w-6 text-muted-foreground" />,
    },
  ];

  // The recommended tasks list shows available jobs on the platform.
  // In a real app, this would be dynamically fetched and personalized.
  const recentTasks = [
    { id: 1, title: 'Design a new logo for my coffee shop', category: 'Design', budget: 300, distance: '1.2 km' },
    { id: 2, title: 'Build a simple landing page with React', category: 'Web Development', budget: 800, distance: '3.5 km' },
    { id: 3, title: 'Write 3 blog posts about sustainable living', category: 'Writing', budget: 150, distance: '0.8 km' },
  ];

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
                <TableHead>Distance</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{task.category}</Badge>
                  </TableCell>
                  <TableCell>{task.budget.toFixed(2)}</TableCell>
                  <TableCell>{task.distance}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View & Apply</Button>
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
