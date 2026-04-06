export async function POST(request: Request) {
  const { prompt, maxTokens } = await request.json();

  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: maxTokens || 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return Response.json({ error: data.error.message || 'DeepSeek API error' }, { status: 502 });
    }

    return Response.json({
      content: data.choices?.[0]?.message?.content || '',
    });
  } catch (err: any) {
    console.error('[blog-agent] Error:', err);
    return Response.json({ error: err.message || 'Failed to call DeepSeek' }, { status: 500 });
  }
}
