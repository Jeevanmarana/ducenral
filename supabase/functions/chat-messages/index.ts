import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GetMessagesRequest {
  room_id: string;
  limit?: number;
}

interface SendMessageRequest {
  room_id: string;
  message: string;
}

interface MessageResponse {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const roomId = url.searchParams.get("room_id");
      const limit = parseInt(url.searchParams.get("limit") || "100");

      if (!roomId) {
        return new Response(JSON.stringify({ error: "Missing room_id" }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select(
          `
          id,
          room_id,
          user_id,
          message,
          created_at,
          profiles(name)
        `
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) {
        console.error("Error fetching messages:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      const formattedMessages = (messages || []).map((msg: any) => ({
        id: msg.id,
        room_id: msg.room_id,
        user_id: msg.user_id,
        message: msg.message,
        created_at: msg.created_at,
        sender_name: msg.profiles?.name || "Unknown",
      }));

      return new Response(JSON.stringify(formattedMessages), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    if (req.method === "POST") {
      const body = (await req.json()) as SendMessageRequest;
      const { room_id, message } = body;

      if (!room_id || !message) {
        return new Response(
          JSON.stringify({ error: "Missing room_id or message" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const { data: newMessage, error } = await supabase
        .from("chat_messages")
        .insert([
          {
            room_id,
            user_id: user.user.id,
            message: message.trim(),
          },
        ])
        .select(
          `
          id,
          room_id,
          user_id,
          message,
          created_at,
          profiles(name)
        `
        )
        .single();

      if (error) {
        console.error("Error sending message:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      const response: MessageResponse = {
        id: newMessage.id,
        room_id: newMessage.room_id,
        user_id: newMessage.user_id,
        message: newMessage.message,
        created_at: newMessage.created_at,
        sender_name: newMessage.profiles?.name,
      };

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
