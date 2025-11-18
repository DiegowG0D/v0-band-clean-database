import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Band Clean</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-gray-600 hover:text-blue-600 transition-colors">Services</a>
            <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
            <Button asChild variant="outline">
              <Link href="/auth/login">Login</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Professional Cleaning Services in Malta
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience spotless results with Band Clean. Professional, reliable, and affordable cleaning services for your home or business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
              <Link href="/customer/auth/login?booking=true">Book Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
              <a href="#services">View Services</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
          <p className="text-xl text-gray-600">Professional cleaning solutions tailored to your needs</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.title} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-4">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <p className="text-2xl font-bold text-blue-600">{service.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose Band Clean?</h2>
            <p className="text-lg text-gray-600 mb-8">
              With years of experience serving Malta, we deliver exceptional cleaning services with attention to detail and customer satisfaction at the heart of everything we do.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">5 Years</div>
                <div className="text-gray-600">Experience</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-gray-600">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Book your cleaning service today and experience the Band Clean difference.
          </p>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
            <Link href="/customer/auth/login?booking=true">Book Your Service</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-blue-600" />
                <span className="text-xl font-bold">Band Clean</span>
              </div>
              <p className="text-gray-400">Professional cleaning services in Malta</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@bandclean.com</li>
                <li>Phone: +356 1234 5678</li>
                <li>Malta</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Band Clean. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const services = [
  {
    icon: "🏠",
    title: "Home Cleaning",
    description: "Regular or deep cleaning for your home",
    price: "€15-20/hour"
  },
  {
    icon: "🏢",
    title: "Office Cleaning",
    description: "Professional office cleaning services",
    price: "€18-25/hour"
  },
  {
    icon: "🪟",
    title: "Window Cleaning",
    description: "Streak-free window cleaning",
    price: "€20/hour"
  },
  {
    icon: "🧹",
    title: "Deep Cleaning",
    description: "Thorough deep cleaning service",
    price: "€25/hour"
  },
  {
    icon: "🏗️",
    title: "Post-Construction",
    description: "Cleaning after renovations",
    price: "Custom quote"
  },
  {
    icon: "👕",
    title: "Ironing Service",
    description: "Professional ironing service",
    price: "€15/hour"
  }
]
