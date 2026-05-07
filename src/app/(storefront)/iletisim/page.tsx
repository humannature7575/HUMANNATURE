import { getStoreSettings } from "@/lib/store-settings-server"

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ContactPage() {
  const storeData = await getStoreSettings();

  return (
    <div className="w-full min-h-screen bg-black pt-10 pb-24">
      <div className="container max-w-screen-md mx-auto px-4 md:px-8 text-white">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-light uppercase tracking-[0.08em] sm:tracking-[0.14em]">
          İletişim
        </h1>
        <div className="h-px w-full bg-white/10 mt-6 mb-8" />

        <div className="space-y-8 text-sm sm:text-base text-white/75 leading-7">
          <p>
            {storeData.brandName} olarak müşteri memnuniyeti bizim için ön plandadır. Herhangi bir sorunuz, öneriniz veya talebiniz için aşağıda yer alan iletişim bilgilerimizden bize ulaşabilirsiniz.
          </p>

          <div className="grid gap-6 sm:gap-8">
            <div className="border border-white/10 bg-white/5 p-6 rounded-sm">
              <h2 className="text-white uppercase text-xs sm:text-sm tracking-wider mb-4 font-medium border-b border-white/10 pb-2">Şirket Bilgileri</h2>
              <div className="space-y-3 text-sm">
                <p><span className="text-white/60 w-32 inline-block">Ticari Ünvan:</span> <span className="text-white">{storeData.legalName}</span></p>
                <p><span className="text-white/60 w-32 inline-block">Adres:</span> <span className="text-white">{storeData.address}</span></p>
                <p><span className="text-white/60 w-32 inline-block">Mersis No:</span> <span className="text-white">{storeData.mersisNo}</span></p>
                <p><span className="text-white/60 w-32 inline-block">Vergi Dairesi/No:</span> <span className="text-white">{storeData.taxOffice} / {storeData.taxNo}</span></p>
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 p-6 rounded-sm">
              <h2 className="text-white uppercase text-xs sm:text-sm tracking-wider mb-4 font-medium border-b border-white/10 pb-2">Müşteri Hizmetleri</h2>
              <div className="space-y-3 text-sm">
                <p><span className="text-white/60 w-32 inline-block">E-Posta:</span> <span className="text-white hover:underline"><a href={`mailto:${storeData.email}`}>{storeData.email}</a></span></p>
                <p><span className="text-white/60 w-32 inline-block">Telefon:</span> <span className="text-white">{storeData.phone}</span></p>
                <p><span className="text-white/60 w-32 inline-block">Çalışma Saatleri:</span> <span className="text-white">{storeData.workingHours}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
