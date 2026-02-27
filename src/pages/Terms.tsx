import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'

export function Terms() {
  useEffect(() => {
    document.title = "Terms of Service | CloudCertPrep"
    return () => {
      document.title = "CloudCertPrep | Free AWS CLF-C02 Practice Exams"
    }
  }, [])

  return (
    <div className="bg-bg-dark flex flex-col">
      <Header showNav={true} />
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Terms of Service</h1>
          <p className="text-text-muted text-sm mb-8">Last updated: February 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">The short version</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                CloudCertPrep is a free study tool. Use it to prepare for your AWS Cloud Practitioner exam. It is provided as-is with no guarantees. Be respectful, don't abuse the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Free to use</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                CloudCertPrep is completely free. There are no paid tiers, no premium features, and no paywalls. We may accept voluntary donations via Ko-fi to cover hosting costs, but payment is never required to access any feature.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">No warranty</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                CloudCertPrep is provided "as is" without warranty of any kind. We make no guarantees about uptime, accuracy of questions, or fitness for any particular purpose. The service may be interrupted, changed, or discontinued at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">No exam guarantee</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Using CloudCertPrep does not guarantee you will pass the AWS Cloud Practitioner exam. You are responsible for your own study outcomes. Results vary depending on your prior knowledge, study habits, and effort.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Question content</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Practice questions are sourced from MIT-licensed open source material and AI-generated content. Questions are clearly labelled where AI-generated. While we aim for accuracy, questions may contain errors or become outdated as AWS updates its services. Always cross-reference with official AWS documentation and training materials.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Acceptable use</h2>
              <p className="text-text-muted text-sm leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="space-y-2 text-text-muted text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-aws-orange mt-0.5">-</span>
                  <span>Attempt to scrape, reverse engineer, or systematically extract question content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aws-orange mt-0.5">-</span>
                  <span>Use the service in a way that places unreasonable load on our infrastructure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aws-orange mt-0.5">-</span>
                  <span>Create multiple accounts to circumvent any limitations</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">AWS trademark notice</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                AWS, Amazon Web Services, and related trademarks are the property of Amazon.com, Inc. or its affiliates. CloudCertPrep is an independent study tool and is not affiliated with, endorsed by, or sponsored by Amazon or AWS.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Limitation of liability</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                To the maximum extent permitted by law, CloudCertPrep and its creator shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">Changes to these terms</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                We may update these terms from time to time. The "last updated" date at the top of this page will reflect any changes. Continued use of the service after changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <div className="pt-4 border-t border-text-muted/20">
              <p className="text-text-muted text-sm">
                Questions? Email <a href="mailto:alex@santonastaso.codes" className="text-aws-orange hover:text-aws-orange/80 transition-colors">alex@santonastaso.codes</a> or read our <Link to="/privacy" className="text-aws-orange hover:text-aws-orange/80 transition-colors">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
