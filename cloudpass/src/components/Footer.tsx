export function Footer() {
  return (
    <footer className="bg-bg-card border-t border-text-muted/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          {/* Copyright */}
          <div className="text-text-muted text-sm">
            © {new Date().getFullYear()} <a href="https://santonastaso.codes" target="_blank" rel="noopener noreferrer" className="text-aws-orange hover:text-aws-orange/80 transition-colors">Alex Santonastaso</a>. All rights reserved.
          </div>

          {/* Disclaimer */}
          <div className="text-text-muted text-xs max-w-2xl">
            <p>
              This site is not affiliated with, endorsed by, or sponsored by Amazon Web Services (AWS) or Amazon.com, Inc. 
              AWS and the AWS logo are trademarks of Amazon.com, Inc. or its affiliates.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
