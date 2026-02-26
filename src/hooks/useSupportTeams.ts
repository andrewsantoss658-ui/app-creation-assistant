import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SupportTeam {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export const useSupportTeams = () => {
  const [teams, setTeams] = useState<SupportTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.from("support_teams").select("*").order("name");
      if (error) throw error;
      setTeams(data || []);
    } catch (e) {
      console.error("Erro ao buscar equipes:", e);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (name: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const { error } = await supabase.from("support_teams").insert({ name, description: description || null, created_by: user.id });
    if (error) throw error;
    await fetchTeams();
  };

  const updateTeam = async (id: string, updates: Partial<Pick<SupportTeam, "name" | "description">>) => {
    const { error } = await supabase.from("support_teams").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    await fetchTeams();
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from("support_teams").delete().eq("id", id);
    if (error) throw error;
    await fetchTeams();
  };

  return { teams, loading, createTeam, updateTeam, deleteTeam, refetch: fetchTeams };
};

export const useTeamMembers = (teamId?: string) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) { setMembers([]); setLoading(false); return; }
    fetchMembers();
  }, [teamId]);

  const fetchMembers = async () => {
    if (!teamId) return;
    try {
      const { data, error } = await supabase.from("support_team_members").select("*").eq("team_id", teamId);
      if (error) throw error;
      setMembers(data || []);
    } catch (e) {
      console.error("Erro ao buscar membros:", e);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (userId: string, role: string = "member") => {
    if (!teamId) return;
    const { error } = await supabase.from("support_team_members").insert({ team_id: teamId, user_id: userId, role });
    if (error) throw error;
    await fetchMembers();
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    const { error } = await supabase.from("support_team_members").update({ role }).eq("id", memberId);
    if (error) throw error;
    await fetchMembers();
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from("support_team_members").delete().eq("id", memberId);
    if (error) throw error;
    await fetchMembers();
  };

  return { members, loading, addMember, updateMemberRole, removeMember, refetch: fetchMembers };
};
