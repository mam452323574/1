import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DeleteResponse {
  success: boolean;
  message: string;
  deletedCounts?: {
    authUsers: number;
    userProfiles: number;
    healthScores: number;
    scans: number;
    purchases: number;
    oauthConnections: number;
    notifications: number;
    avatarFiles: number;
    scanFiles: number;
  };
  error?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const deletedCounts = {
      authUsers: 0,
      userProfiles: 0,
      healthScores: 0,
      scans: 0,
      purchases: 0,
      oauthConnections: 0,
      notifications: 0,
      avatarFiles: 0,
      scanFiles: 0,
    };

    const { count: healthScoresCount } = await supabaseAdmin
      .from("health_scores")
      .select("*", { count: "exact", head: true });
    deletedCounts.healthScores = healthScoresCount || 0;

    const { count: scansCount } = await supabaseAdmin
      .from("scans")
      .select("*", { count: "exact", head: true });
    deletedCounts.scans = scansCount || 0;

    const { count: purchasesCount } = await supabaseAdmin
      .from("purchases")
      .select("*", { count: "exact", head: true });
    deletedCounts.purchases = purchasesCount || 0;

    const { count: oauthCount } = await supabaseAdmin
      .from("oauth_connections")
      .select("*", { count: "exact", head: true });
    deletedCounts.oauthConnections = oauthCount || 0;

    const { count: notificationsCount } = await supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact", head: true });
    deletedCounts.notifications = notificationsCount || 0;

    const { data: avatarsList } = await supabaseAdmin.storage
      .from("avatars")
      .list();

    if (avatarsList && avatarsList.length > 0) {
      for (const folder of avatarsList) {
        const { data: files } = await supabaseAdmin.storage
          .from("avatars")
          .list(folder.name);

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${folder.name}/${file.name}`);
          await supabaseAdmin.storage.from("avatars").remove(filePaths);
          deletedCounts.avatarFiles += files.length;
        }
      }
    }

    const { data: scansList } = await supabaseAdmin.storage
      .from("scan-images")
      .list();

    if (scansList && scansList.length > 0) {
      for (const folder of scansList) {
        const { data: files } = await supabaseAdmin.storage
          .from("scan-images")
          .list(folder.name);

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${folder.name}/${file.name}`);
          await supabaseAdmin.storage.from("scan-images").remove(filePaths);
          deletedCounts.scanFiles += files.length;
        }
      }
    }

    const { data: profiles } = await supabaseAdmin
      .from("user_profiles")
      .select("id");

    if (profiles) {
      deletedCounts.userProfiles = profiles.length;

      await supabaseAdmin.from("user_profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();

    if (authUsers && authUsers.users) {
      deletedCounts.authUsers = authUsers.users.length;

      for (const user of authUsers.users) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }
    }

    const response: DeleteResponse = {
      success: true,
      message: "All users and related data have been successfully deleted",
      deletedCounts,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting users:", error);

    const errorResponse: DeleteResponse = {
      success: false,
      message: "Failed to delete users",
      error: error instanceof Error ? error.message : String(error),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
