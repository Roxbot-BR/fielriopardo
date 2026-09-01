import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent } from '@/components/ui/Card';
import { SocialCards } from '@/components/SocialCards';
import { MapPin, Users, Calendar, Heart } from 'lucide-react';

export default function SobrePage() {
  return (
    <>
      <Header />
      <PageWrapper glass>
        {/* Hero */}
        <div className="text-center py-12 border-b border-[#2d2d2d] mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.jpeg"
              alt="Fiel Rio Pardo"
              width={120}
              height={120}
              className="rounded-full border-2 border-[#C8A951]"
              unoptimized
            />
          </div>
          <h1 className="text-4xl font-black text-white mb-4">
            Fiel <span className="text-[#C8A951]">Rio Pardo</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Torcida Organizada do Sport Club Corinthians Paulista em São José do Rio Pardo, interior de São Paulo.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Users, value: '100+', label: 'Membros', link: undefined },
            { icon: Calendar, value: '2020', label: 'Fundada em', link: undefined },
            { icon: MapPin, value: 'SJRP', label: 'São José do Rio Pardo', link: 'https://maps.google.com/?q=S%C3%A3o+Jos%C3%A9+do+Rio+Pardo,+SP,+Brasil' },
            { icon: Heart, value: '🤍', label: 'Paixão pelo Timão', link: undefined },
          ].map(({ icon: Icon, value, label, link }) => (
            <Card key={label} variant="default">
              <CardContent className="p-4 text-center">
                <Icon className="mx-auto mb-2 text-[#C8A951]" size={24} />
                <p className="text-2xl font-black text-white">{value}</p>
                {link ? (
                  <Link href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C8A951] hover:underline mt-1 inline-block">
                    📍 {label}
                  </Link>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* História */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-black text-[#C8A951] mb-4">Nossa História</h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                A Fiel Rio Pardo nasceu da paixão de corinthianos de São José do Rio Pardo 
                que queriam mais do que torcer sozinhos — queriam criar uma comunidade, um 
                espaço de união para todos que amam o Timão.
              </p>
              <p>
                Hoje somos uma torcida organizada ativa, presente nos jogos do Corinthians 
                e sempre levando a cultura corintiana para os quatro cantos de Rio Pardo.
              </p>
              <p>
                Nossa missão é simples: celebrar o Corinthians, fortalecer a comunidade e 
                nunca parar de acreditar no nosso time! 🖤🤍
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#C8A951] mb-4">Nossa Cidade</h2>
            <Card variant="default">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="text-[#C8A951] shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-bold text-white text-lg">São José do Rio Pardo</p>
                    <p className="text-gray-400 text-sm">Estado de São Paulo — Brasil</p>
                    <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                      Cidade do interior paulista, com aproximadamente 53 mil habitantes, 
                      conhecida por sua história e pela paixão pelo futebol. Aqui o Corinthians 
                      tem uma das mais apaixonadas torcidas do interior!
                    </p>
                    <Link
                      href="https://maps.google.com/?q=S%C3%A3o+Jos%C3%A9+do+Rio+Pardo,+SP,+Brasil"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-4 text-xs text-[#C8A951] hover:underline font-semibold"
                    >
                      <MapPin size={12} /> Ver no Google Maps
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Redes Sociais */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-white mb-6">Siga a Fiel Rio Pardo</h2>
          <SocialCards />
        </div>
      </PageWrapper>
      <Footer />
    </>
  );
}
