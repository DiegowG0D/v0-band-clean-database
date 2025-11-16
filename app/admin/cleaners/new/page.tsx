import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCleanerForm } from "@/components/admin/create-cleaner-form";

export default function NewCleanerPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Cleaner</h1>
        <p className="text-muted-foreground">
          Create a new cleaner account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cleaner Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCleanerForm />
        </CardContent>
      </Card>
    </div>
  );
}
