import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import EditCleanerForm from '@/components/admin/edit-cleaner-form';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCleanerPage({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const supabase = await createClient();

    const [usersResult, detailsResult] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .eq("role", "cleaner")
        .limit(1),
      supabase
        .from("cleaner_details")
        .select("*")
        .eq("user_id", id)
        .limit(1)
    ]);

    if (usersResult.error) {
      console.error("[v0] Error loading user:", usersResult.error);
      notFound();
    }

    if (!usersResult.data || usersResult.data.length === 0) {
      console.error("[v0] No user found with id:", id);
      notFound();
    }

    const cleaner = usersResult.data[0];

    if (detailsResult.error) {
      console.error("[v0] Error loading details:", detailsResult.error);
      notFound();
    }

    if (!detailsResult.data || detailsResult.data.length === 0) {
      console.error("[v0] No cleaner details found for user:", id);
      notFound();
    }

    const cleanerDetails = detailsResult.data[0];

    return <EditCleanerForm cleaner={cleaner} cleanerDetails={cleanerDetails} />;
  } catch (error) {
    console.error("[v0] Unexpected error in EditCleanerPage:", error);
    notFound();
  }
}
