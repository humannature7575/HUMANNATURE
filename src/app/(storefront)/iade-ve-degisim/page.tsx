import { getStoreSettings } from "@/lib/store-settings-server"

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ReturnsExchangePage() {
  const storeData = await getStoreSettings();

  return (
    <div className="w-full min-h-screen bg-black pt-10 pb-24">
      <div className="container max-w-screen-md mx-auto px-4 md:px-8 text-white">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-light uppercase tracking-[0.08em] sm:tracking-[0.14em]">
          İade ve Değişim Koşulları
        </h1>
        <div className="h-px w-full bg-white/10 mt-6 mb-8" />

        <div className="space-y-6 text-sm sm:text-base text-white/75 leading-7">
          <section>
            <h2 className="text-lg font-medium text-white mb-3">1. İade Süresi ve Şartları</h2>
            <p>
              Müşterilerimiz, satın aldıkları ürünleri teslim tarihinden itibaren <strong>{storeData.returnDays} gün</strong> içerisinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin iade etme hakkına sahiptir. 
              İade edilecek ürünlerin kullanılmamış, etiketleri koparılmamış, yıkanmamış ve yeniden satılabilir özelliğini yitirmemiş olması zorunludur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">2. İade ve Değişim Süreci</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>İade talebinizi başlatmak için <strong>{storeData.email}</strong> adresine sipariş numaranız ile birlikte e-posta gönderebilirsiniz.</li>
              <li>İade edilecek ürünleri orijinal ambalajında ve faturası ile birlikte tarafımıza göndermeniz gerekmektedir.</li>
              <li>İadelerinizi <strong>{storeData.returnCargoCompany}</strong> firması aracılığıyla, <strong>{storeData.returnCargoCode}</strong> cari kodunu kullanarak tarafımıza gönderebilirsiniz.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">3. Geri Ödeme</h2>
            <p>
              İade edilen ürünler tarafımıza ulaşıp iade şartlarına uygunluğu onaylandıktan sonra, geri ödeme işleminiz yasal süre olan 14 gün içerisinde ödeme yaptığınız yönteme sadık kalınarak gerçekleştirilecektir. 
              Kredi kartı ile yapılan ödemelerin hesaba yansıma süresi bankanıza bağlı olarak değişiklik gösterebilir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-3">4. İade Edilemeyen Ürünler</h2>
            <p>
              Niteliği itibarıyla iade edilemeyecek ürünler, tek kullanımlık ürünler, hızlı bozulan veya son kullanma tarihi geçme ihtimali olan ürünler, ve hijyenik sebeplerden dolayı iç giyim, mayo ve kozmetik ürünlerinin (ambalajı açılmışsa) iadesi kabul edilmemektedir.
            </p>
          </section>

          <div className="mt-10 p-6 border border-white/10 bg-white/5 rounded-sm">
            <h3 className="text-white font-medium mb-2">Daha Fazla Bilgi İçin</h3>
            <p className="text-sm">
              Sorularınız için bizimle <a href={`mailto:${storeData.email}`} className="text-white hover:underline">{storeData.email}</a> adresinden veya <strong>{storeData.phone}</strong> numarasından iletişime geçebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
