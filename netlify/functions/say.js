// Serverless TTS proxy — keeps the ElevenLabs key private.
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // "Sarah"
  if (!key) return new Response(null, { status: 204 });
  let text = '';
  try { ({ text } = await req.json()); } catch { return new Response('Bad request', { status: 400 }); }
  if (!text || text.length > 300) return new Response('Bad text', { status: 400 });
  let r;
  try {
    r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.5, use_speaker_boost: true }
      })
    });
  } catch (e) {
    return new Response('FETCH_ERR ' + (e && e.message), { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    return new Response('UPSTREAM ' + r.status + ' ' + detail.slice(0, 300), { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  const audio = await r.arrayBuffer();
  return new Response(audio, { status: 200, headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' } });
};
