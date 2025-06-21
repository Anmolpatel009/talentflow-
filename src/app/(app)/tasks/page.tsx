import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const tasks = [
  { id: 1, title: 'Design a new logo for my coffee shop', category: 'Design', budget: 300, distance: '1.2 km', postedBy: 'Cafe Aroma' },
  { id: 2, title: 'Build a simple landing page with React', category: 'Web Development', budget: 800, distance: '3.5 km', postedBy: 'Tech Startup' },
  { id: 3, title: 'Write 3 blog posts about sustainable living', category: 'Writing', budget: 150, distance: '0.8 km', postedBy: 'Green Earth Co.' },
  { id: 4, title: 'Photoshoot for a new clothing line', category: 'Photography', budget: 500, distance: '5.1 km', postedBy: 'Urban Style' },
  { id: 5, title: 'Manage social media for a local restaurant', category: 'Marketing', budget: 450, distance: '2.4 km', postedBy: 'Gourmet Place' },
];

export default function TasksPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Local Tasks</h1>
          <p className="text-muted-foreground">Browse and apply for tasks available near you.</p>
        </div>
      </div>

      <Card>
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
              {tasks.map((task) => (
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
