import { getStoreSettings } from "@/lib/store-settings-server"

export const revalidate = 60;

export default async function TermsOfServicePage() {
  const storeData = await getStoreSettings();

  return (
    <div className="w-full min-h-screen bg-black pt-10 pb-24">
      <div className="container max-w-screen-md mx-auto px-4 md:px-8 text-white">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-light uppercase tracking-[0.08em] sm:tracking-[0.14em]">
          Kullanım Koşulları
        </h1>
        <p className="text-white/40 text-xs sm:text-sm mt-3 tracking-wide">
          Son güncelleme: {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="h-px w-full bg-white/10 mt-6 mb-8" />

        <div className="space-y-8 text-sm sm:text-base text-white/75 leading-7">
          <section>
            <h2 className="text-lg font-medium text-white mb-3">1. Genel Bilgiler</h2>
            <p>
              Bu web sitesi ({storeData.brandName.toLowerCase()}.tr), {storeData.legalName} tarafından işletilmektedir. Web sitemizi kullanarak veya bir hesap oluşturarak, aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız. Lütfen bu koşulları dikkatlice okuyunuz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">2. Hizmet Tanımı</h2>
            <p>
              {storeData.brandName}, online giyim ve aksesuar satışı yapan bir e-ticaret platformudur. Sitemiz üzerinden ürün görüntüleyebilir, hesap oluşturabilir, sipariş verebilir ve sipariş takibi yapabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">3. Hesap Oluşturma</h2>
            <p className="mb-3">Sitemizde alışveriş yapabilmek için bir hesap oluşturmanız gerekmektedir. Hesap oluşturma sürecinde:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Geçerli bir e-posta adresi ve profil bilgisi (ad, soyad) sağlamanız gerekmektedir.</li>
              <li>E-posta adresiniz doğrulama bağlantısı ile onaylanmalıdır. Bu, hesap güvenliğinizi sağlamak içindir.</li>
              <li>Alternatif olarak Google hesabınız ile hızlı giriş yapabilirsiniz.</li>
              <li>Hesap bilgilerinizi güncel ve doğru tutmak sizin sorumluluğunuzdadır.</li>
              <li>Hesap güvenliğiniz sizin sorumluluğunuzdadır. Şifrenizi üçüncü kişilerle paylaşmayınız.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">4. Sipariş ve Ödeme</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Sitemizdeki ürün fiyatları Türk Lirası (₺) cinsindendir ve KDV dahildir.</li>
              <li>Fiyatlar önceden bildirimde bulunulmaksızın değiştirilebilir, ancak siparişiniz sırasındaki fiyatlar geçerlidir.</li>
              <li>Ödeme yöntemleri olarak banka havalesi ve kapıda ödeme kabul edilmektedir.</li>
              <li>Siparişinizin onaylanması, ödemenin tarafımıza ulaşması ile gerçekleşir.</li>
              <li>Stok durumuna bağlı olarak siparişiniz iptal edilebilir; bu durumda ödemeniz iade edilir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">5. Ürün Bilgileri</h2>
            <p>
              Ürün görsellerinin gerçeğe en uygun şekilde gösterilmesi için azami özen gösterilmektedir. Ancak ekran ayarlarına bağlı olarak renk farklılıkları oluşabilir. Ürün ölçü ve detay bilgileri her ürün sayfasında açıkça belirtilmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">6. Kargo ve Teslimat</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Siparişler, ödeme onayından sonra en geç 3 iş günü içerisinde kargoya verilir.</li>
              <li>Kargo süresi bölgenize göre değişiklik gösterebilir.</li>
              <li>Kargoya verilen siparişler için takip numarası tarafınıza bildirilecektir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">7. İade ve Değişim</h2>
            <p>
              İade ve değişim koşullarımız hakkında detaylı bilgi için <a href="/iade-ve-degisim" className="text-white hover:underline">İade ve Değişim</a> sayfamızı ziyaret edebilirsiniz. Genel olarak, ürünler teslim tarihinden itibaren <strong>{storeData.returnDays} gün</strong> içerisinde iade edilebilir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">8. Fikri Mülkiyet</h2>
            <p>
              Web sitemizdeki tüm içerikler (tasarımlar, logolar, görseller, metinler, ürün fotoğrafları vb.) {storeData.brandName}&apos;a aittir ve telif hakkı ile korunmaktadır. İzinsiz kopyalanması, çoğaltılması veya dağıtılması yasaktır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">9. Kişisel Verilerin Korunması</h2>
            <p>
              Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında detaylı bilgi için <a href="/gizlilik-politikasi" className="text-white hover:underline">Gizlilik Politikası</a> sayfamızı inceleyiniz. Mağazamız yalnızca e-posta ve profil bilginizi toplar; verileriniz üçüncü taraflarla paylaşılmaz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">10. Sorumluluk Sınırlaması</h2>
            <p>
              {storeData.brandName}, web sitesinin kesintisiz ve hatasız çalışacağını garanti etmez. Teknik aksaklıklardan, internet bağlantı sorunlarından veya mücbir sebeplerden kaynaklanan gecikmeler ve zararlardan sorumlu tutulamaz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">11. Uygulanacak Hukuk</h2>
            <p>
              Bu kullanım koşulları Türkiye Cumhuriyeti kanunlarına tabidir. Herhangi bir uyuşmazlık durumunda İstanbul mahkemeleri ve icra daireleri yetkilidir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">12. Koşullarda Değişiklik</h2>
            <p>
              {storeData.brandName}, bu kullanım koşullarını önceden bildirimde bulunmaksızın güncelleme hakkını saklı tutar. Güncellenmiş koşullar bu sayfada yayınlandığı anda yürürlüğe girer. Siteyi kullanmaya devam etmeniz, güncellenmiş koşulları kabul ettiğiniz anlamına gelir.
            </p>
          </section>

          <div className="mt-10 p-6 border border-white/10 bg-white/5 rounded-sm">
            <h3 className="text-white font-medium mb-2">İletişim</h3>
            <p className="text-sm">
              Bu kullanım koşulları hakkında sorularınız için bizimle <a href={`mailto:${storeData.email}`} className="text-white hover:underline">{storeData.email}</a> adresinden veya <strong>{storeData.phone}</strong> numarasından iletişime geçebilirsiniz.
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
