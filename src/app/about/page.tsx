'use client'

import Header from '@/components/Header'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">About KinCal</h1>
            
            <div className="prose prose-lg max-w-none space-y-8">
              {/* Beta Version */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Beta Version</h2>
                <p className="text-gray-700 leading-relaxed">
                  KinCal provides a demonstration of how Kin clubs can have a common calendar and announcement platform. 
                  The system is currently intended as a demonstration. The project was developed independently and without 
                  any input or sanctioning from Kin Canada.
                </p>
              </section>

              {/* Info is Public */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information is Public</h2>
                <p className="text-gray-700 leading-relaxed">
                  Although events and announcements can be categorized as public or internal, these designations are 
                  strictly for categorization. All information posted in KinCal is publicly available regardless of 
                  how it is categorized.
                </p>
              </section>

              {/* Obtaining Access */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Obtaining Access</h2>
                <p className="text-gray-700 leading-relaxed">
                  Each Kin club is invited to have a few members who have rights to create and edit club postings. 
                  To get access, send an email to Thom Hounsell at{' '}
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    thom.hounsell<span className="hidden">[at]</span>@<span className="hidden">[dot]</span>gmail.com
                  </span>{' '}
                  indicating your club. Thom will add your email address to the system.
                </p>
              </section>

              {/* Embedding on Websites */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Embedding on Your Website</h2>
                <div className="text-gray-700 leading-relaxed space-y-4">
                  <p>
                    Kin clubs can easily embed their own calendar and announcements (or their zone&apos;s) directly 
                    on their club website. This allows visitors to see your events and updates without leaving your site.
                  </p>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Available Embed Options</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Calendar Widget:</strong> Display your club&apos;s or zone&apos;s upcoming events</li>
                      <li><strong>Announcements Widget:</strong> Show recent announcements and updates</li>
                      <li><strong>Combined Widget:</strong> Both calendar and announcements in one embed</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">How to Get Your Embed Code</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Visit the <a href="/widgets" className="text-blue-600 hover:text-blue-800 underline">Widgets page</a> on KinCal</li>
                      <li>Select your club or zone from the dropdown</li>
                      <li>Choose the type of widget you want (calendar, announcements, or combined)</li>
                      <li>Copy the provided embed code</li>
                      <li>Paste the code into your website&apos;s HTML where you want the widget to appear</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Customization Options</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Choose the number of events/announcements to display</li>
                      <li>Select different color themes to match your website</li>
                      <li>Set the widget size to fit your layout</li>
                      <li>Filter by event type or announcement category</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-md font-medium text-blue-900 mb-2">💡 Pro Tip</h4>
                    <p className="text-blue-800 text-sm">
                      The embedded widgets automatically update when you add new events or announcements to KinCal, 
                      so your website will always show the latest information without any manual updates needed.
                    </p>
                  </div>
                </div>
              </section>

              {/* Privacy Policy */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy Policy</h2>
                <div className="text-gray-700 leading-relaxed space-y-4">
                  <p>
                    KinCal is committed to protecting your privacy. This privacy policy explains how we collect, 
                    use, and safeguard your information when you use our service.
                  </p>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Information We Collect</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Email addresses for authentication and access control</li>
                      <li>Event and announcement content that you voluntarily post</li>
                      <li>Basic usage information to improve our service</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">How We Use Your Information</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>To provide access to the KinCal platform</li>
                      <li>To display events and announcements as intended</li>
                      <li>To communicate with you about your account or the service</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Information Sharing</h3>
                    <p>
                      All events and announcements posted on KinCal are publicly visible. We do not sell, trade, 
                      or otherwise transfer your personal information to third parties without your consent, except 
                      as required by law.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Data Security</h3>
                    <p>
                      We implement appropriate security measures to protect your personal information. However, 
                      please be aware that no method of transmission over the internet is 100% secure.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Us</h3>
                    <p>
                      If you have any questions about this privacy policy, please contact us at{' '}
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        thom.hounsell<span className="hidden">[at]</span>@<span className="hidden">[dot]</span>gmail.com
                      </span>.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
