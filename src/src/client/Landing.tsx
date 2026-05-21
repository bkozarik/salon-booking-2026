import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold">✂️ Salon Élégance</div>
          <button
            onClick={() => navigate('/booking')}
            className="bg-black text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
          >
            Rezervovat
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-white rounded-full px-4 py-1.5 text-sm text-gray-500 border border-gray-200 mb-6">
          Online rezervace 24/7
        </div>
        <h1 className="text-5xl font-semibold tracking-tight mb-6 leading-tight">
          Váš čas je vzácný.<br />
          <span className="text-gray-400">Rezervujte za 60 sekund.</span>
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
          Vyberte službu, mistra a termín — bez čekání na telefonu.
          Potvrzení okamžitě.
        </p>
        <button
          onClick={() => navigate('/booking')}
          className="bg-black text-white px-8 py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 transition"
        >
          Rezervovat termín →
        </button>
      </div>

      {/* Services */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-center mb-10">Naše služby</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[
            { icon: '✂️', name: 'Dámský střih', price: 'od 650 Kč', time: '60 min' },
            { icon: '💈', name: 'Pánský střih', price: 'od 350 Kč', time: '30 min' },
            { icon: '🎨', name: 'Barvení', price: 'od 1200 Kč', time: '90 min' },
            { icon: '✨', name: 'Melír / Balayage', price: 'od 2500 Kč', time: '150 min' },
            { icon: '💨', name: 'Foukaná', price: 'od 350 Kč', time: '30 min' },
            { icon: '👶', name: 'Dětský střih', price: 'od 250 Kč', time: '30 min' },
          ].map(service => (
            <div key={service.name} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="text-3xl mb-3">{service.icon}</div>
              <div className="font-medium mb-1">{service.name}</div>
              <div className="text-sm text-gray-400">{service.time} · {service.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-center mb-10">Náš tým</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { name: 'Markéta Nováková', role: '⭐ Mistrová', years: '15 let praxe' },
            { name: 'Jana Procházková', role: 'Senior', years: 'Specialistka na barvy' },
            { name: 'Petra Horáková', role: 'Senior', years: 'Moderní střihy' },
            { name: 'Tomáš Dvořák', role: 'Junior', years: 'Pánské střihy' },
          ].map(member => (
            <div key={member.name} className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-semibold mx-auto mb-3">
                {member.name.charAt(0)}
              </div>
              <div className="font-medium text-sm">{member.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{member.role}</div>
              <div className="text-xs text-gray-400">{member.years}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why us */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-center mb-10">Proč rezervovat online?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: '⚡', title: 'Okamžité potvrzení', desc: 'Žádné čekání na telefonu. Rezervace potvrzena ihned.' },
            { icon: '🔒', title: 'Bez dvojitých rezervací', desc: 'Systém hlídá termíny automaticky — kolize nejsou možné.' },
            { icon: '📱', title: 'Z mobilu za 60 sekund', desc: 'Jednoduchý výběr služby, mistra a termínu. Bez registrace.' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="font-medium mb-1">{item.title}</div>
              <div className="text-sm text-gray-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="bg-black rounded-3xl p-12">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Připraveni na nový vzhled?
          </h2>
          <p className="text-gray-400 mb-8">Termín volný — rezervujte hned.</p>
          <button
            onClick={() => navigate('/booking')}
            className="bg-white text-black px-8 py-4 rounded-2xl text-lg font-medium hover:bg-gray-100 transition"
          >
            Rezervovat termín →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <div>✂️ Salon Élégance</div>
          <div>Praha · Po–Pá 9:00–20:00</div>
          <button
            onClick={() => navigate('/admin')}
            className="hover:text-black transition"
          >
            Admin
          </button>
        </div>
      </footer>
    </div>
  )
}