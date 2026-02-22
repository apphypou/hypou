import { SlidersHorizontal, Search, MessageSquare } from "lucide-react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/GlassCard";
import IconButton from "@/components/IconButton";

const matches = [
  {
    id: 1,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNVSJJfdsh8NiTLzC4soLSzgifD4xPqfBbQfKEBKoIxv0Gc89uw4Cesq9HmjZZl6G6DDBYhaAFypLPTeR8TgvPLVviyTjRi6ZECMsI7dbh6X2IkZjhpeLpYrZJ1Yngcnanfg93394LRB_gg_DsAoisPkcqeKP6In3zvMN5dyQIPSUy9P6ImltAd2Q4uDCudCxrjZmKXqdXnRuVTHUSh425JUqxjpPaCvz75kMxwN6WI7BN6t2THsHqnwz_QwukRB48WoD_V-0l5ms",
    name: "iPhone 15 Pro Max",
    location: "São Paulo, SP",
    value: "R$ 6.500",
    badge: "Nova Proposta",
    owner: "Ricardo M.",
    ownerImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0UDLCNNTjyjYYInyIWsu3AjX5ZXYjYuAgZJ0e1WeSltkFEKRmBlLd3XAAxypkaWgRkAEuGk5Uh2Kq3vMKdrolxpVEVrQ7nQj9wWWoFx3lwo9hkeru1cGKTGzaqYEtXOpsg5vIQEjDgmARqINtp3C9FXTQPQM1G14ZoYvPsHrJk43Q9wIBC3jE5brDLl4rMYGb4XZazM4MT5Xwa8WFv92J_cELt1JHkulF5HwqxxJXE_tjrl8OkjjGTy56Ze_IJND6f1hpP2JKuX0",
    online: true,
  },
  {
    id: 2,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvhpLHhMMShAeHRke6C3N3AjdeNVDSVQ6wyiypkjpzXK0KRWa31mSMj-sXk0FRtD1qomRYVJACGb8LYbB0794s0-svBfmbwkOSdTO_35gueaBBiJplXTjpg2l_iigdB02uiAd-fWxTXfDiE-z1Q_Ag0ZIeK5Ba-5p3lzoIGeav5tDVtdQKi4SwwLWOcWJzWubhDuL9_Thxvz-HAZHgclFCC2eOSe0MvMif27_Abh12Bn44Q0Nf6Y3BreSHv8ebT4lZUiSMl7OTm0c",
    name: "PlayStation 5 + Jogos",
    location: "2023 • Seminovo",
    value: "R$ 3.200",
    owner: "Ana Clara",
    ownerImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzsLqPt5zUiuk0KgLRtpqxTO2Vo328Tm2UuDbmLrMSq_PF8lvzSneUpEPUbfiKxq5SPGKYbY5Hx9LP6zAqrcVrtbNy0_2RDRROXjXnXk0QhCf3S0ExLAGVmUz3YIRy6IZtOoYPzcr3RMzuc78JKd8qw1MyzTQqP9yw2D0ht2wHEMmbGzs6i7-g05zdM8Pgs5S9o2LL4FYe9FMW8NbcquXrI75sKvg7n_efCcJNWRyvs0UKekxU8ITK6_ptCeBtCc_UbkLFSLSQEGQ",
    online: false,
  },
  {
    id: 3,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUB0Jl6aRip-3OzVNw56_cxmeRGZ2LJM5JrLuFSDFFk_2vpHcguSt_hRZil2GSUnHBHFJwdhVfmzzeh0FpYTaPd55pvoZvm_0Di4PPaOppEk_MOMoN5zqGMuza8sToOf8R7rHZB3ZGSD2vjkxpXdyRVgj4pKaSQRRYBqFol4SS6lAtWUA3Qw9ka_WdY_SUoPZsNfDOXGW27YPPpJX7TJOyHgAGl5Ht8IabrzyisnkW1HIPUNRoRWHXH6ym1n_NecjyKZH3j0nwxGs",
    name: "Honda CB 500F",
    location: "Campinas, SP",
    value: "R$ 28.000",
    badge: "Popular",
    owner: "Roberto V.",
    ownerImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcgArrzwaqnoFr6X3CDSiz4iArertCoXMXCRrRAh5l_Eo5PFqDOHTMGYuIi4Sy_OLt5CkDNuiHRoCzCfbgiF7f8--26NHkZAZy0_uyuNSz1MCWt7TT-uayHBTt97tUfZvWdKTztTfvKXCKFymZL9SNbmc7KM0v1Nu4mKidSFwriLPeg6XtsRzb0JKvtNMadqdI4pzKVA9CPtJCBIoGne3fxYQDep2bFWgAeV5hLSyIfK-teY6Gg3-wDutZAzMN-5OybrBIKkD7unQ",
    online: true,
  },
  {
    id: 4,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjQ6kt5Hj2OkdSxZ_2z6zm7qSL1tjxBGnMhkwfHwwu5Z74iseSV3EbH1me7aTPpzDXCAm11V-qvAXy0oBzCLcnMcSByhBSQahzjP42te7OJR9JQtyJaOhzOd24r-Ul1mgLsefNCNkhOvl6RYIV14eXn23ZB9qbIvUlwemYsXdPwJrufP2jLk6hNl2lMNpu5EQms__G1e1eu_Y0LAzM1DPvx32qzVKpz3q2Dxmbu8jTcccRo3iNW-uSC0l0mb7YXV2KZkRtg0Js1Oc",
    name: "MacBook Air M2",
    location: "Usado • Excelente estado",
    value: "R$ 5.800",
    owner: "Mariana S.",
    ownerImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCLjXXcLFLx-t1xTJHl5jBTHRX2nFfnwM1kb1M83a-VBKv0VVcXclHaAUYLZu_DrVVmRpd7psl1G24JIJWjOetwfTuCy19AKWbQVvRB6l_4k3uLL_BhnlQvfIT142I3omRe3D1BtrE2Z7c303GxPAnsctDVyB8eLd8_mrtrd4PF5FYPZHpvpnqnRPuG6v7RKa2hZMJ2xVQngqV1Cbit5wYM8ZHWevq5onvxqa-3-yz-Snojk0iMLT--DDjS8LaWfc9NB0TxZMwkBQU",
    online: false,
  },
  {
    id: 5,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7nXX040qNUSxz-1mhzNCAotQVfhd_kS30ax1k56SvOYr8of5UXoHHRh096VvbrZ5Sl8ivzOmdwtyZflcIvpVw_N1dIXI0sJOKkn_6FRNs7_6QyZBdo_gRnukBwABLcmnpKzrX7ocKz4d3BLxZ2SLXGfHxlyM8Mc_cz_Fk-aqzJJDKECqml0cYDGavOAZBy_naffck-yeWAb2fBHJlAMRa0kbiDYZmQkMT20XLrcge66XThZ052ownU0csYRV4aYfhQ9uf5tKCRsU",
    name: "Sofá Retrátil 3 Lugares",
    location: "Belo Horizonte, MG",
    value: "R$ 2.400",
    owner: "Felipe G.",
    ownerImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3ooAlSU2vd7HlzSSDEvEBinDrAwKujp1seUyhJuaA5-sPQRyJZqWNKPOJC0FiVjqqwwVEw886v2W2K3jPtgvwY2A_lcCgxHlNWjinrJfcf0J5PLSzuVG_SatX0jTn7TxwASloMYg9TuLEkx0IVRWhEHwG7W2X73nyZur62AscUPx0kpTUWIUAdlzJ1FvB7sjrOj2VsCOZiZlLIKVB_rN1VCHoilz6oJXNdr7HuAXzM9xqUijiAeih5TIKdstTDNmk3ZRQTM9msOE",
    online: false,
  },
];

const Matches = () => {
  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-4 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Suas Trocas
          </span>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            Propostas de Troca
          </h1>
        </div>
        <div className="flex gap-3">
          <IconButton icon={SlidersHorizontal} />
          <IconButton icon={Search} />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 w-full px-5 overflow-y-auto no-scrollbar z-10 pb-28">
        <div className="flex items-center justify-between mb-6 mt-2">
          <h2 className="text-sm font-bold text-foreground/90 uppercase tracking-widest">Interesses Recebidos</h2>
          <div className="flex items-center gap-1">
            <span className="text-primary text-xs font-semibold">5 Ativos</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary neon-glow" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 pb-6">
          {matches.map((match) => (
            <GlassCard
              key={match.id}
              hoverable
              className="shadow-[0_4px_20px_hsl(184_100%_50%/0.15)]"
            >
              {/* Image */}
              <div className="relative h-48 w-full cursor-pointer">
                <img alt={match.name} className="h-full w-full object-cover" src={match.image} />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                {match.badge && (
                  <div className="absolute top-4 right-4 bg-background/60 backdrop-blur-md px-3 py-1 rounded-full border border-primary/30">
                    <span className="text-[10px] font-bold text-primary tracking-wider uppercase">{match.badge}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5 relative">
                <div className="flex justify-between items-start mb-2 cursor-pointer">
                  <div>
                    <h3 className="text-foreground font-bold text-xl leading-tight mb-1">{match.name}</h3>
                    <p className="text-foreground/50 text-xs">{match.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-bold text-lg text-glow">{match.value}</p>
                    <p className="text-foreground/40 text-[10px]">Valor de mercado</p>
                  </div>
                </div>

                {/* Owner */}
                <div className="mt-4 pt-4 border-t border-foreground/5 flex items-center justify-between">
                  <button className="flex items-center gap-2 group/profile cursor-pointer hover:bg-foreground/5 p-1 pr-3 rounded-full transition-colors">
                    <div className="relative">
                      <img
                        alt={match.owner}
                        className="h-8 w-8 rounded-full object-cover border border-foreground/20 group-hover/profile:border-primary/50 transition-colors"
                        src={match.ownerImage}
                      />
                      {match.online && (
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-muted" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-foreground/80 group-hover/profile:text-primary transition-colors">
                      {match.owner}
                    </span>
                  </button>
                  <button className={`h-8 w-8 flex items-center justify-center rounded-full transition-all ${match.online ? "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground" : "bg-foreground/5 text-foreground/60 hover:bg-primary hover:text-primary-foreground"}`}>
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </main>

      <BottomNav activeTab="trocas" />
    </ScreenLayout>
  );
};

export default Matches;
