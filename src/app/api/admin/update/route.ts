import { isAdmin } from "@/lib/admin-auth";
import { APPLICATION_STATUSES, updateApplication, type ApplicationStatus } from "@/lib/store";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Session expired. Log in again." }, { status: 401 });
  }

  let body: { ref?: string; status?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { ref, status, notes } = body;
  if (!ref || !/^TVO-[0-9A-F]{6}$/.test(ref)) {
    return Response.json({ error: "Invalid ref." }, { status: 400 });
  }
  if (status !== undefined && !APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
    return Response.json({ error: "Invalid status." }, { status: 400 });
  }
  if (notes !== undefined && (typeof notes !== "string" || notes.length > 10000)) {
    return Response.json({ error: "Notes are too long." }, { status: 400 });
  }

  try {
    const row = await updateApplication(ref, { status: status as ApplicationStatus | undefined, notes });
    return Response.json({ row });
  } catch (err) {
    console.error("[admin/update]", err);
    return Response.json({ error: "Couldn't save. Try again." }, { status: 500 });
  }
}
