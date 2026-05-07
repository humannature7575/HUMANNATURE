import { getStoreSettings } from "@/lib/store-settings-server"

export const revalidate = 60; // Revalidate every 60 seconds

export default async function DistanceSalesPage() {
  const storeData = await getStoreSettings();

  return (
    <div className="w-full min-h-screen bg-black pt-10 pb-24">
      <div className="container max-w-screen-md mx-auto px-4 md:px-8 text-white">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-light uppercase tracking-[0.08em] sm:tracking-[0.14em]">
          Mesafeli Satış Sözleşmesi
        </h1>
        <div className="h-px w-full bg-white/10 mt-6 mb-8" />

        <div className="space-y-8 text-sm sm:text-base text-white/75 leading-7">
          <section>
            <h2 className="text-lg font-medium text-white mb-3">1. Taraflar</h2>
            <div className="space-y-4">
              <div className="p-4 border border-white/10 bg-white/5 rounded-sm">
                <h3 className="font-medium text-white mb-2">1.1. Satıcı Bilgileri</h3>
                <ul className="text-sm space-y-1">
                  <li><strong>Ticari Ünvan:</strong> {storeData.legalName}</li>
                  <li><strong>Adres:</strong> {storeData.address}</li>
                  <li><strong>Telefon:</strong> {storeData.phone}</li>
                  <li><strong>E-Posta:</strong> {storeData.email}</li>
                  <li><strong>Mersis No:</strong> {storeData.mersisNo}</li>
                </ul>
              </div>
              <div className="p-4 border border-white/10 bg-white/5 rounded-sm">
                <h3 className="font-medium text-white mb-2">1.2. Alıcı Bilgileri</h3>
                <p className="text-sm">
                  Alıcı, {storeData.brandName} internet sitesine üye olan veya üye olmadan alışveriş yapan kişidir. Alıcının sipariş verirken kullandığı adres ve iletişim bilgileri esas alınır.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">2. Sözleşmenin Konusu</h2>
            <p>
              İşbu sözleşmenin konusu, Alıcı&apos;nın Satıcı&apos;ya ait {storeData.brandName} internet sitesinden elektronik ortamda siparişini yaptığı, internet sitesinde nitelikleri ve satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">3. Sözleşme Konusu Ürün ve Teslimat</h2>
            <p>
              Ürünlerin cinsi ve türü, miktarı, marka/modeli, rengi ve tüm vergiler dâhil satış bedeli, internet sitesinde yer alan bilgilerde olduğu gibidir. Satıcı, ürünleri eksiksiz, siparişte belirtilen niteliklere uygun ve garanti belgeleri/kullanım kılavuzları ile teslim etmeyi kabul eder. Teslimat, Alıcı&apos;nın belirttiği teslimat adresine yasal 30 günlük süreyi aşmamak koşulu ile en kısa sürede teslim edilir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">4. Cayma Hakkı</h2>
            <p>
              Alıcı, ürünü teslim aldığı tarihten itibaren <strong>{storeData.returnDays} gün</strong> içerisinde hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkına sahiptir. Cayma hakkının kullanımı için bu süre içinde Satıcı&apos;ya e-posta ({storeData.email}) ile bildirimde bulunulması şarttır. Cayma hakkının kullanılması halinde, ürünün faturası ile birlikte <strong>{storeData.returnCargoCompany}</strong> ({storeData.returnCargoCode}) aracılığıyla iadesi gerekmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">5. Uyuşmazlıkların Çözümü</h2>
            <p>
              İşbu sözleşmenin uygulanmasında, Gümrük ve Ticaret Bakanlığı&apos;nca ilan edilen değere kadar Alıcı&apos;nın mal veya hizmeti satın aldığı veya ikametgahının bulunduğu yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
