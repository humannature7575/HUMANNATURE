import { getStoreSettings } from "@/lib/store-settings-server"

export const revalidate = 60;

export default async function PrivacyPolicyPage() {
  const storeData = await getStoreSettings();

  return (
    <div className="w-full min-h-screen bg-black pt-10 pb-24">
      <div className="container max-w-screen-md mx-auto px-4 md:px-8 text-white">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-light uppercase tracking-[0.08em] sm:tracking-[0.14em]">
          Gizlilik Politikası
        </h1>
        <p className="text-white/40 text-xs sm:text-sm mt-3 tracking-wide">
          Son güncelleme: {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="h-px w-full bg-white/10 mt-6 mb-8" />

        <div className="space-y-8 text-sm sm:text-base text-white/75 leading-7">
          <section>
            <h2 className="text-lg font-medium text-white mb-3">1. Giriş</h2>
            <p>
              {storeData.brandName} (&quot;biz&quot;, &quot;şirketimiz&quot; veya &quot;mağazamız&quot;) olarak, gizliliğinize saygı duyuyor ve kişisel verilerinizi korumayı taahhüt ediyoruz. Bu Gizlilik Politikası, web sitemizi ({storeData.brandName.toLowerCase()}.tr) ziyaret ettiğinizde ve hizmetlerimizi kullandığınızda hangi verileri topladığımızı, nasıl kullandığımızı ve haklarınızı açıklamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">2. Topladığımız Veriler</h2>
            <p className="mb-3">
              Mağazamız <strong>yalnızca</strong> hizmet sunumu için gerekli olan minimum düzeyde veri toplamaktadır:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>E-posta adresi:</strong> Hesap oluşturma, giriş yapma ve sipariş bildirimleri için kullanılır.</li>
              <li><strong>Ad ve soyad (Profil bilgisi):</strong> Siparişlerinizi kişiselleştirmek ve teslimat sürecini yönetmek için kullanılır.</li>
              <li><strong>Teslimat adresi:</strong> Yalnızca sipariş vermeniz durumunda, ürünlerinizi ulaştırabilmemiz için toplanır.</li>
            </ul>
            <div className="mt-4 p-4 border border-white/10 bg-white/5 rounded-sm">
              <p className="text-white/60 text-sm">
                <strong className="text-white">Önemli:</strong> Mağazamız kredi kartı bilgisi, konum verisi, tarayıcı parmak izi veya herhangi bir hassas kişisel veri toplamaz. E-posta doğrulaması yalnızca hesap güvenliğini sağlamak amacıyla yapılmaktadır.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">3. Google ile Giriş Yapma</h2>
            <p>
              Web sitemizde Google hesabınızla giriş yapma seçeneği sunulmaktadır. Google ile giriş yaptığınızda, yalnızca Google tarafından paylaşılan <strong>e-posta adresiniz</strong> ve <strong>profil adınız</strong> alınır. Google hesabınızdaki diğer bilgilere (kişileriniz, takvim, dosyalar vb.) hiçbir şekilde erişim sağlanmaz ve erişim talep edilmez.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">4. Verilerin Kullanım Amacı</h2>
            <p className="mb-3">Topladığımız veriler <strong>yalnızca</strong> aşağıdaki amaçlar için kullanılır:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Hesap oluşturma ve kimlik doğrulama</li>
              <li>Sipariş işleme ve takibi</li>
              <li>Sipariş durumu hakkında bilgilendirme</li>
              <li>Müşteri hizmetleri ve destek sağlama</li>
            </ul>
            <div className="mt-4 p-4 border border-white/10 bg-white/5 rounded-sm">
              <p className="text-white/60 text-sm">
                <strong className="text-white">Taahhüdümüz:</strong> Verileriniz hiçbir koşulda üçüncü taraflarla paylaşılmaz, satılmaz, kiralanmaz veya reklam/pazarlama amacıyla kullanılmaz. Verileriniz yalnızca mağazamızın hizmet sunumu için kullanılır.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">5. Verilerin Saklanması</h2>
            <p>
              Kişisel verileriniz, hesabınız aktif olduğu sürece güvenli bir şekilde saklanır. Verileriniz, Google Firebase altyapısı üzerinde endüstri standardı güvenlik önlemleriyle korunmaktadır. Hesabınızı silmeniz durumunda verileriniz kalıcı olarak kaldırılır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">6. Çerezler (Cookies)</h2>
            <p>
              Web sitemiz yalnızca oturum yönetimi ve tercih kaydetme amacıyla temel çerezler kullanmaktadır. Reklam veya izleme amaçlı üçüncü taraf çerezleri kullanılmamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">7. Haklarınız</h2>
            <p className="mb-3">6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>Verilerin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
              <li><strong>Kişisel verilerinizin silinmesini veya yok edilmesini isteme</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">8. Veri Silme Talebi</h2>
            <p>
              Hesabınıza ait tüm kişisel verilerin silinmesini istiyorsanız, <strong>{storeData.email}</strong> adresine e-posta göndererek veya <strong>{storeData.phone}</strong> numarasından bize ulaşarak talebinizi iletebilirsiniz. Talebiniz en geç <strong>30 gün</strong> içinde işleme alınacak ve tüm verileriniz sistemlerimizden kalıcı olarak kaldırılacaktır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">9. Politika Değişiklikleri</h2>
            <p>
              Bu gizlilik politikası zaman zaman güncellenebilir. Herhangi bir değişiklik yapıldığında, güncellenmiş politika bu sayfada yayınlanacaktır. Önemli değişiklikler yapılması halinde sizi e-posta yoluyla bilgilendireceğiz.
            </p>
          </section>

          <div className="mt-10 p-6 border border-white/10 bg-white/5 rounded-sm">
            <h3 className="text-white font-medium mb-2">İletişim</h3>
            <p className="text-sm">
              Bu gizlilik politikası hakkında sorularınız veya veri silme talepleriniz için bizimle <a href={`mailto:${storeData.email}`} className="text-white hover:underline">{storeData.email}</a> adresinden veya <strong>{storeData.phone}</strong> numarasından iletişime geçebilirsiniz.
            </p>
            <p className="text-sm mt-2 text-white/50">
              {storeData.legalName} — {storeData.address}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
