import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitationId }: InviteRequest = await req.json();
    console.log("Processing invitation:", invitationId);

    if (!invitationId) {
      throw new Error("Invitation ID is required");
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from("leaderboard_invitations")
      .select("*, leaderboards(*)")
      .eq("id", invitationId)
      .single();

    if (inviteError || !invitation) {
      console.error("Invitation not found:", inviteError);
      throw new Error("Invitation not found");
    }

    const leaderboard = invitation.leaderboards as { name: string; ranking_metric: string };

    // Get inviter profile
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", invitation.invited_by)
      .single();

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name || ""} ${inviterProfile.last_name || ""}`.trim() || "A StudyFlow user"
      : "A StudyFlow user";

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email send");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email sending not configured. Use invite link instead.",
          token: invitation.token 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Build invite URL - use the origin from the request or a default
    const origin = req.headers.get("origin") || "https://studyflow.lovable.app";
    const inviteUrl = `${origin}/join-leaderboard?token=${invitation.token}`;

    const metricDescriptions: Record<string, string> = {
      study_time: "weekly study time",
      habit_completion: "weekly habit completion percentage",
      productivity_score: "combined productivity score",
    };

    const sharedDataDescription = metricDescriptions[leaderboard.ranking_metric] || "study data";

    const emailResponse = await resend.emails.send({
      from: "StudyFlow <onboarding@resend.dev>",
      to: [invitation.email],
      subject: `${inviterName} invited you to join "${leaderboard.name}" leaderboard`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🏆 You're Invited!</h1>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">
                  <strong>${inviterName}</strong> invited you to join the <strong>"${leaderboard.name}"</strong> leaderboard on StudyFlow.
                </p>
                <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px;">
                    <strong>What will be shared:</strong>
                  </p>
                  <p style="font-size: 14px; color: #374151; margin: 0;">
                    Only your ${sharedDataDescription} will be visible to other members. Your private data like session times and personal notes are never shared.
                  </p>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">
                  Joining is completely optional. You can leave anytime.
                </p>
                <div style="text-align: center;">
                  <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View Invitation
                  </a>
                </div>
                <p style="font-size: 12px; color: #9ca3af; margin: 24px 0 0; text-align: center;">
                  This invitation expires in 7 days.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-leaderboard-invite function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
