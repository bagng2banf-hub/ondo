# ONDO Server Integration Notes

This prototype runs fully in the browser. Future production integrations should keep secrets on the server only.

- OpenAI calls should be proxied through server routes that read `OPENAI_API_KEY` from environment variables.
- Supabase authentication should use configured project URLs and public anon keys from environment variables.
- Session secrets should never be committed.
- User-generated text should be validated and sanitized before model or database calls.
