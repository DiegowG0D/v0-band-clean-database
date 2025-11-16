"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface EditCleanerFormProps {
  cleaner: any;
  cleanerDetails: any;
}

export default function EditCleanerForm({ cleaner, cleanerDetails }: EditCleanerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [paymentType, setPaymentType] = useState<'percentage' | 'fixed_hourly'>(
    cleanerDetails?.payment_type || 'percentage'
  );
  const [commissionRate, setCommissionRate] = useState(
    cleanerDetails?.commission_rate || 0.5333
  );
  const [fixedHourlyRate, setFixedHourlyRate] = useState(
    cleanerDetails?.fixed_hourly_rate || 8.00
  );

  const servicePrice = 15; // Example service price
  const cleanerEarnings = paymentType === 'fixed_hourly' 
    ? fixedHourlyRate
    : (servicePrice * commissionRate);
  const companyEarnings = servicePrice - cleanerEarnings;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const updateData: any = {
      hourly_rate: parseFloat(formData.get("hourly_rate") as string),
      status: formData.get("status") as string,
      hire_date: formData.get("hire_date") as string,
    };

    // Add termination_date if provided
    const terminationDate = formData.get("termination_date") as string;
    if (terminationDate) {
      updateData.termination_date = terminationDate;
    }

    updateData.payment_type = paymentType;
    
    if (paymentType === 'percentage') {
      updateData.commission_rate = commissionRate;
      updateData.fixed_hourly_rate = null;
    } else {
      updateData.commission_rate = 0; // Set to 0 instead of null
      updateData.fixed_hourly_rate = fixedHourlyRate;
    }

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("cleaner_details")
      .update(updateData)
      .eq("user_id", cleaner.id);

    if (updateError) {
      console.error("[v0] Error updating cleaner:", updateError);
      setError(updateError.message || "Failed to update cleaner. Make sure to run script 019 first.");
      setLoading(false);
      return;
    }

    router.push("/admin/cleaners");
    router.refresh();
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Edit Cleaner</h1>
        <p className="text-muted-foreground">
          Update cleaner information and payment settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{cleaner.full_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={cleaner.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={cleaner.phone || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Service Hourly Rate (€)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={cleanerDetails?.hourly_rate || "15.00"}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Price charged to customers per hour
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={cleanerDetails?.status || "active"}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  name="hire_date"
                  type="date"
                  defaultValue={cleanerDetails?.hire_date || ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termination_date">
                  Termination Date
                  <span className="text-xs text-muted-foreground ml-2">
                    (Optional - for terminated employees)
                  </span>
                </Label>
                <Input
                  id="termination_date"
                  name="termination_date"
                  type="date"
                  defaultValue={cleanerDetails?.termination_date || ""}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank if employee is still active
                </p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Payment Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Define how the cleaner gets paid
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_type">Payment Type</Label>
                <Select 
                  value={paymentType} 
                  onValueChange={(value) => setPaymentType(value as 'percentage' | 'fixed_hourly')}
                >
                  <SelectTrigger id="payment_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage of Service Price</SelectItem>
                    <SelectItem value="fixed_hourly">Fixed Amount Per Hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how to calculate cleaner earnings
                </p>
              </div>

              {paymentType === 'percentage' ? (
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">
                    Cleaner Commission Rate (decimal)
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="commission_rate"
                      name="commission_rate"
                      type="number"
                      step="0.0001"
                      min="0"
                      max="1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                      required
                      className="max-w-[200px]"
                    />
                    <span className="text-sm text-muted-foreground">
                      ({(commissionRate * 100).toFixed(2)}%)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter as decimal: 0.5333 = 53.33% for cleaner, 46.67% for company
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="fixed_hourly_rate">
                    Fixed Hourly Rate for Cleaner (€)
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="fixed_hourly_rate"
                      name="fixed_hourly_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={fixedHourlyRate}
                      onChange={(e) => setFixedHourlyRate(parseFloat(e.target.value) || 0)}
                      required
                      className="max-w-[200px]"
                    />
                    <span className="text-sm text-muted-foreground">per hour</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cleaner receives this fixed amount per hour worked (e.g., €8.00)
                  </p>
                </div>
              )}

              <div className="p-3 bg-background rounded border">
                <p className="text-sm font-medium mb-2">
                  Example Payment Split (€{servicePrice} service / 1 hour):
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cleaner Receives:</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      €{cleanerEarnings.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Company Receives:</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      €{companyEarnings.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {paymentType === 'fixed_hourly' 
                    ? `For a 3-hour job (€45 charged): Cleaner gets €${(fixedHourlyRate * 3).toFixed(2)}, Company gets €${(45 - fixedHourlyRate * 3).toFixed(2)}`
                    : `For a 3-hour job (€45 charged): Cleaner gets €${(cleanerEarnings * 3).toFixed(2)}, Company gets €${(companyEarnings * 3).toFixed(2)}`
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
