export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json({
    aws: {
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      accessKeyPrefix: process.env.AWS_ACCESS_KEY_ID?.slice(0, 8),
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
    },
    stripe: {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    resend: {
      hasApiKey: !!process.env.RESEND_API_KEY,
    },
    admin: {
      hasPassword: !!process.env.ADMIN_PASSWORD,
    }
  })
}
