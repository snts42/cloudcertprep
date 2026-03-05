# CloudCertPrep

Free AWS certification practice exams at [cloudcertprep.io](https://www.cloudcertprep.io).

## Supported Certifications

- **CLF-C02** (Cloud Practitioner) - 1,054 practice questions across 4 domains
- **SAA-C03** (Solutions Architect Associate) - coming soon

## Features

- Timed mock exams matching real exam format (question count, time limit, passing score)
- Domain-specific practice with instant feedback
- Spaced repetition for logged-in users
- Progress tracking and exam history
- Community statistics
- Dark/light theme

## Tech Stack

- React 19, TypeScript, Vite 7
- Tailwind CSS 3.4
- Supabase (auth, PostgreSQL, row-level security)
- Deployed on Netlify

## Project Structure

```
src/
  data/           # Certification configs and question JSON files
  pages/          # Route-level page components
  components/     # Shared UI components
  hooks/          # Custom React hooks (auth, theme, timer, cert, spaced repetition)
  lib/            # Utilities (scoring, analytics, Supabase client)
  types/          # TypeScript type definitions
```

## Adding a New Certification

1. Add a config entry in `src/data/certifications.ts`
2. Create question files in `src/data/<cert-code>/domain1.json`, etc.
3. Register domain loaders in `src/data/questions.ts`

Questions use this format:

```json
{
  "id": "clf-d1-001",
  "domainId": 1,
  "question": "...",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "answer": "B",
  "explanation": "...",
  "source": "community",
  "isMultiAnswer": false
}
```

## Development

```bash
npm install
npm run dev
```

Requires a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Contributing

Open an issue or pull request on [GitHub](https://github.com/snts42/cloudcertprep).

Question contributions are welcome. Follow the JSON format above and place files in the appropriate `src/data/<cert-code>/` directory.

## License

MIT
