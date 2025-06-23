import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAllTasks, type TaskWithUser } from "@/lib/tasks";

export default async function TasksPage() {
  const tasks: TaskWithUser[] = await getAllTasks();

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
                <TableHead>Posted By</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{task.category}</Badge>
                    </TableCell>
                    <TableCell>{task.budget.toFixed(2)}</TableCell>
                    <TableCell>{task.clientName}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">View & Apply</Button>
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
