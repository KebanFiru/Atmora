'use client';

import { X, Info, Code, Satellite, Users } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/20">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md p-6 border-b border-gray-200/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">About Atmora</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Project Description */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Satellite className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-800">Proje Hakkında</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Atmora, NASA için geliştirilen interaktif bir atmosfer analiz aracıdır. Bu uygulama, 
              harita üzerinde çizilen alanların merkez koordinatlarını kullanarak atmosferik veri 
              analizi yapmayı hedeflemektedir.
            </p>
          </section>

          {/* Original Sources */}
          <section>
            <h3 className="text-xl font-semibold text-green-700 mb-4 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Özgün Geliştirmeler
            </h3>
            <div className="bg-green-50/50 rounded-lg p-4 border-l-4 border-green-500">
              <ul className="space-y-2 text-gray-700">
                <li>• Pentagon odaklı polygon çizim algoritması</li>
                <li>• Konveks hull algoritması ile şekil optimizasyonu</li>
                <li>• Dinamik koordinat merkezi hesaplama sistemi</li>
                <li>• Modern glassmorphism tasarım dili</li>
                <li>• Interaktif harita kontrolleri ve zoom limitleri</li>
                <li>• SSR uyumlu Leaflet entegrasyonu</li>
              </ul>
            </div>
          </section>

          {/* Third-party Sources */}
          <section>
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              Kullanılan Açık Kaynak Teknolojiler
            </h3>
            <div className="bg-blue-50/50 rounded-lg p-4 border-l-4 border-blue-500">
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Next.js 15.5.4</strong> - React framework (Vercel)</li>
                <li>• <strong>Leaflet 1.9.4</strong> - Açık kaynak harita kütüphanesi</li>
                <li>• <strong>React-Leaflet 5.0.0</strong> - React bileşenleri</li>
                <li>• <strong>Tailwind CSS</strong> - Utility-first CSS framework</li>
                <li>• <strong>Lucide React</strong> - Açık kaynak ikon seti</li>
                <li>• <strong>TypeScript</strong> - Microsoft'un tip güvenli JavaScript'i</li>
              </ul>
            </div>
          </section>

          {/* AI Usage */}
          <section>
            <h3 className="text-xl font-semibold text-orange-700 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Yapay Zeka Kullanımı
            </h3>
            <div className="bg-orange-50/50 rounded-lg p-4 border-l-4 border-orange-500">
              <p className="text-gray-700 mb-3">
                Bu projede GitHub Copilot yapay zeka asistanı <strong>araç olarak</strong> kullanılmıştır:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Kod optimizasyonu ve hata ayıklama desteği</li>
                <li>• TypeScript tip tanımlamaları yardımı</li>
                <li>• Algoritma geliştirme sürecinde öneriler</li>
                <li>• Dokümantasyon ve yorum yazımı</li>
              </ul>
              <p className="text-sm text-orange-700 mt-3 italic">
                💡 "AI bizi daha iyi yazılımcılar yapmak için bir araçtır, yazılımcının yerini almak için değil."
              </p>
            </div>
          </section>

          {/* Publication Info */}
          <section>
            <h3 className="text-xl font-semibold text-purple-700 mb-4">
              Yayımlama Bilgileri
            </h3>
            <div className="bg-purple-50/50 rounded-lg p-4 border-l-4 border-purple-500">
              <p className="text-gray-700">
                Bu proje NASA için geliştirilmiş ve açık kaynak olarak yayımlanacaktır. 
                Tüm kaynak kodlar ve atıflar şeffaflık ilkesi gereği bu bölümde belirtilmiştir.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200/50">
            <p className="text-sm text-gray-600">
              Geliştirici: <strong>Atmora Team</strong> | Proje: <strong>Atmora</strong> | {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}