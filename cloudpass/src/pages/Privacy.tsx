import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'

export function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy | CloudCertPrep"
    return () => {
      document.title = "CloudCertPrep | Free AWS CLF-C02 Practice Exams"
    }
  }, [])

  return (
    <div className="bg-bg-dark flex flex-col">
      <Header showNav={true} />
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
          <p className="text-text-muted text-sm mb-8">Last updated: February 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Who we are</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                CloudCertPrep is a free AWS Cloud Practitioner (CLF-C02) exam preparation tool built and maintained by <a href="https://santonastaso.codes" target="_blank" rel="noopener noreferrer" className="text-aws-orange hover:text-aws-orange/80 transition-colors">Alex Santonastaso</a>. You can reach us at <a href="mailto:alex@santonastaso.codes" className="text-aws-orange hover:text-aws-orange/80 transition-colors">alex@santonastaso.codes</a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">What data we collect</h2>
              <p className="text-text-muted text-sm leading-relaxed mb-3">
                We only collect data when you create an account. Guest users generate no data on our servers.
              </p>
              <ul className="space-y-2 text-text-muted text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-aws-orange mt-0.5">-</span>
                  <span><strong className="text-text-primary">Email address</strong> — used to identify your account and send password reset emails. Nothing else.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aws-orange mt-0.5">-</span>
                  <span><strong className="text-text-primary">Practice history</strong> — the questions you answered, whether you got them right, and when. Used to power spaced repetition and track your domain mastery over time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aws-orange mt-0.5">-</span>
                  <span><strong className="text-text-primary">Exam attempts</strong> — your scores, timing, and domain breakdowns from mock exams. Used to show your History page.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">How we use your data</h2>
              <p className="text-text-muted text-sm leading-relaxed mb-3">
                Your data is used entirely to improve your study experience:
              </p>
              <ul className="space-y-2 text-text-muted text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-aws-orange mt-0.5">-</span>
                  <span>Personalising which questions appear in Domain Practice sessions (spaced repetition — questions you struggle with appear more often)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aws-orange mt-0.5">-</span>
                  <span>Showing your domain mastery progress on the Dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aws-orange mt-0.5">-</span>
                  <span>Displaying your exam attempt history</span>
                </li>
              </ul>
              <p className="text-text-muted text-sm leading-relaxed mt-3">
                We do not use your data for advertising, profiling, or any purpose beyond running the app.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">We will never sell your data</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Your data is never sold, shared with third parties for marketing, or used for any commercial purpose. This is a free tool built for learners, not a data business.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Where data is stored</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Authentication and database are handled by <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-aws-orange hover:text-aws-orange/80 transition-colors">Supabase</a>, hosted on AWS infrastructure in the EU West region (Ireland). All data is encrypted at rest and in transit.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Your rights and data deletion</h2>
              <p className="text-text-muted text-sm leading-relaxed mb-3">
                You can request deletion of your account and all associated data at any time by emailing <a href="mailto:alex@santonastaso.codes" className="text-aws-orange hover:text-aws-orange/80 transition-colors">alex@santonastaso.codes</a>. We will delete your data within 30 days.
              </p>
              <p className="text-text-muted text-sm leading-relaxed">
                If you are in the EU/EEA, you also have the right to access, correct, and port your data under GDPR. Contact us at the same address.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Local storage</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                We use browser local storage to keep your authentication session active. We do not use cookies, tracking pixels, or any third-party analytics.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Changes to this policy</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                If we make material changes, we will update the "last updated" date at the top of this page. Continued use of the app after changes constitutes acceptance.
              </p>
            </section>

            <div className="pt-4 border-t border-text-muted/20">
              <p className="text-text-muted text-sm">
                Questions? Email <a href="mailto:alex@santonastaso.codes" className="text-aws-orange hover:text-aws-orange/80 transition-colors">alex@santonastaso.codes</a> or read our <Link to="/terms" className="text-aws-orange hover:text-aws-orange/80 transition-colors">Terms of Service</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
