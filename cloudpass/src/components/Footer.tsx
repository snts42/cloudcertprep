export function Footer() {
  return (
    <footer className="bg-bg-card border-t border-text-muted/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 text-text-muted text-xs leading-relaxed text-center md:text-left">
          {/* Left Column: Copyright */}
          <div>
            <p>
              © {new Date().getFullYear()} <a href="https://santonastaso.codes" target="_blank" rel="noopener noreferrer" className="text-aws-orange hover:text-aws-orange/80 transition-colors">Alex Santonastaso</a>. All rights reserved.
            </p>
          </div>

          {/* Right Column: Disclaimers */}
          <div>
            <p>
              Not affiliated with AWS or Amazon.com, Inc. AWS and related trademarks belong to Amazon. This independent study tool does not guarantee success on the official AWS Cloud Practitioner exam.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
