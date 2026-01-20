import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    CheckCircle,
    Church,
    Sparkles,
    Users,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Church className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Apostolic Path</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-8 py-24 text-center">
        <div className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Built for Apostolic Churches</span>
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Disciple. Track. <span className="text-primary">Transform.</span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
          The complete discipleship platform for UPCI churches. Guide new students through the New
          Birth experience, track First Steps progress, and empower your teachers.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything You Need for Discipleship
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built tools to help your church guide souls from first contact to faithful
            members.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature Card: New Birth Tracking */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">New Birth Journey</h3>
            <p className="text-muted-foreground">
              Track each student&apos;s progress through Repentance, Water Baptism in Jesus&apos;
              Name, and receiving the Holy Ghost.
            </p>
          </div>

          {/* Feature Card: Bible Studies */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Bible Study Management</h3>
            <p className="text-muted-foreground">
              Manage Search for Truth, Exploring God&apos;s Word, or custom curriculum. Track
              lessons completed and upcoming sessions.
            </p>
          </div>

          {/* Feature Card: First Steps */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">First Steps Program</h3>
            <p className="text-muted-foreground">
              Guide new believers through foundational teachings: prayer, Word of God, church life,
              holiness, and evangelism.
            </p>
          </div>

          {/* Feature Card: Teacher Dashboard */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Teacher Dashboard</h3>
            <p className="text-muted-foreground">
              Give teachers their own view of assigned studies, upcoming lessons, and student
              progress all in one place.
            </p>
          </div>

          {/* Feature Card: Pastor Reports */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Pastor Reports</h3>
            <p className="text-muted-foreground">
              Real-time visibility into church-wide discipleship health. See baptisms, Holy Ghost
              experiences, and overall progress.
            </p>
          </div>

          {/* Feature Card: Multi-Church */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Church className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Multi-Church Ready</h3>
            <p className="text-muted-foreground">
              Perfect for districts and sections. Each church has isolated data with optional
              aggregate reporting.
            </p>
          </div>
        </div>
      </section>

      {/* New Birth Section */}
      <section className="bg-muted/50 py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                Track the New Birth Experience
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                The New Birth is the foundation of Apostolic faith. Our platform helps you celebrate
                and track each step of this transformative journey.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <strong>Repentance</strong>
                    <p className="text-muted-foreground">
                      Record when students turn from sin to God
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <strong>Water Baptism</strong>
                    <p className="text-muted-foreground">
                      Track baptisms in Jesus&apos; Name with dates and photos
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <strong>Holy Ghost</strong>
                    <p className="text-muted-foreground">
                      Celebrate when students receive the gift with evidence of speaking in tongues
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="rounded-lg border bg-card p-8">
              <div className="text-center text-muted-foreground">
                [New Birth Progress Visualization]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Ready to Transform Your Discipleship?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Join churches across the fellowship using Apostolic Path to guide souls to the New Birth
          and beyond.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Start Your Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">
              Contact Sales
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Church className="h-6 w-6 text-primary" />
              <span className="font-semibold">Apostolic Path</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Apostolic Path. Built with ❤️ for the Apostolic church.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="/support" className="hover:text-foreground">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
