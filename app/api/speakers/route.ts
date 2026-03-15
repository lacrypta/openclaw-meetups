import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: speakers, error } = await supabase
      .from('users')
      .select(`
        id, name, email, speaker_bio, speaker_tagline, speaker_photo,
        speaker_twitter, speaker_github, speaker_website, speaker_company
      `)
      .eq('is_speaker', true)
      .order('name');

    if (error) throw error;

    // Get talk counts per speaker
    const speakerIds = (speakers || []).map((s: { id: string }) => s.id);
    let talkCounts: Record<string, number> = {};

    if (speakerIds.length > 0) {
      const { data: talks } = await supabase
        .from('talks')
        .select('speaker_id')
        .in('speaker_id', speakerIds)
        .eq('status', 'approved');

      (talks || []).forEach((t: { speaker_id: string }) => {
        talkCounts[t.speaker_id] = (talkCounts[t.speaker_id] || 0) + 1;
      });
    }

    const result = (speakers || []).map((s: Record<string, unknown>) => ({
      ...s,
      talk_count: talkCounts[s.id as string] || 0,
    }));

    return NextResponse.json({ speakers: result });
  } catch (error) {
    console.error('Speakers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
